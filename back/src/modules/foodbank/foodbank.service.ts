import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DonationStatus,
  FoodbankRequestKind,
  FoodbankRequestStatus,
  MovementDirection,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import type {
  CreateCategoryDto,
  CreateMovementDto,
  UpdateCategoryDto,
  UpdateMovementDto,
} from './dto/foodbank.dto';
import type {
  CreateFoodbankCommentDto,
  CreateFoodbankRequestDto,
  UpdateFoodbankCommentDto,
  UpdateFoodbankRequestDto,
} from './dto/request.dto';

/** Niveau d'alerte d'une catégorie, déduit des seuils. */
export type StockLevel = 'CRITIQUE' | 'BAS' | 'OK';

/** Nombre de mois du graphique de flux. */
const MOIS_AFFICHES = 6;

@Injectable()
export class FoodbankService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stock courant de chaque catégorie.
   *
   * La quantité n'est jamais stockée : elle est la somme algébrique des
   * mouvements. Un champ « quantité » modifiable à la main finirait toujours
   * par diverger du registre, et l'écart serait invisible — alors que c'est ce
   * registre qui rend le don traçable pour celui qui l'a fait.
   */
  private async stocks(): Promise<Map<string, number>> {
    const lignes = await this.prisma.stockMovement.groupBy({
      by: ['categoryId', 'direction'],
      _sum: { quantity: true },
    });

    const parCategorie = new Map<string, number>();
    for (const ligne of lignes) {
      const signe = ligne.direction === MovementDirection.ENTREE ? 1 : -1;
      const courant = parCategorie.get(ligne.categoryId) ?? 0;
      parCategorie.set(ligne.categoryId, courant + signe * (ligne._sum.quantity ?? 0));
    }
    return parCategorie;
  }

  /** Niveau d'alerte, selon les seuils de la catégorie. */
  private niveau(quantite: number, critique: number, bas: number): StockLevel {
    if (critique > 0 && quantite <= critique) return 'CRITIQUE';
    if (bas > 0 && quantite <= bas) return 'BAS';
    return 'OK';
  }

  /**
   * Tout ce qu'affiche la page publique, en une lecture.
   *
   * Les besoins ne sont pas une liste à part : ce sont les catégories sous
   * leur seuil, triées par urgence. Les tenir à jour se réduit donc à
   * enregistrer les mouvements — il n'y a rien à republier à la main, et la
   * page ne peut pas annoncer un besoin déjà couvert.
   */
  async overview() {
    const [categories, stocks] = await Promise.all([
      this.prisma.foodCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      this.stocks(),
    ]);

    const etat = categories.map((categorie) => {
      const quantity = Math.max(0, stocks.get(categorie.id) ?? 0);
      return {
        id: categorie.id,
        slug: categorie.slug,
        name: categorie.name,
        unit: categorie.unit,
        examples: categorie.examples,
        quantity,
        target: categorie.target,
        level: this.niveau(quantity, categorie.criticalLevel, categorie.lowLevel),
      };
    });

    const ORDRE: Record<StockLevel, number> = { CRITIQUE: 0, BAS: 1, OK: 2 };

    return {
      categories: etat,
      /** Les catégories à renflouer, la plus urgente d'abord. */
      needs: etat
        .filter((c) => c.level !== 'OK')
        .sort((a, b) => ORDRE[a.level] - ORDRE[b.level] || a.quantity - b.quantity),
      flow: await this.flow(),
      movements: await this.movements(8),
      /** Date du dernier mouvement : c'est elle qui date la page. */
      updatedAt: (
        await this.prisma.stockMovement.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })
      )?.createdAt.toISOString(),
    };
  }

  /** Entrées, sorties et personnes servies sur les six derniers mois. */
  private async flow() {
    const maintenant = new Date();
    const debut = new Date(
      Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() - (MOIS_AFFICHES - 1), 1),
    );

    const lignes = await this.prisma.stockMovement.findMany({
      where: { occurredAt: { gte: debut } },
      select: { direction: true, quantity: true, peopleServed: true, occurredAt: true },
    });

    // Les six seaux d'abord, puis on y verse : un mois sans mouvement doit
    // apparaître à zéro, pas disparaître du graphique.
    const seaux = Array.from({ length: MOIS_AFFICHES }, (_, index) => {
      const date = new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + index, 1));
      return { month: date.toISOString().slice(0, 7), in: 0, out: 0 };
    });

    let entrees = 0;
    let sorties = 0;
    let personnes = 0;

    for (const ligne of lignes) {
      const seau = seaux.find((s) => s.month === ligne.occurredAt.toISOString().slice(0, 7));
      if (ligne.direction === MovementDirection.ENTREE) {
        entrees += ligne.quantity;
        if (seau) seau.in += ligne.quantity;
      } else {
        sorties += ligne.quantity;
        personnes += ligne.peopleServed ?? 0;
        if (seau) seau.out += ligne.quantity;
      }
    }

    return { monthly: seaux, totalIn: entrees, totalOut: sorties, peopleServed: personnes };
  }

  /** Derniers mouvements, tous sens confondus. */
  async movements(limit = 30) {
    const lignes = await this.prisma.stockMovement.findMany({
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: { category: { select: { name: true, unit: true, slug: true } } },
    });

    return lignes.map((ligne) => ({
      id: ligne.id,
      // Renvoyé pour que le formulaire de correction présélectionne la
      // catégorie : sans lui, rouvrir un mouvement vidait le champ.
      categoryId: ligne.categoryId,
      direction: ligne.direction,
      quantity: ligne.quantity,
      counterpart: ligne.counterpart,
      detail: ligne.detail,
      peopleServed: ligne.peopleServed,
      occurredAt: ligne.occurredAt.toISOString(),
      category: ligne.category,
    }));
  }

  // ── Administration ───────────────────────────────────────────────────────

  /** Catégories avec leur stock, pour le back-office. */
  async findAllAdmin() {
    const [categories, stocks] = await Promise.all([
      this.prisma.foodCategory.findMany({ orderBy: { order: 'asc' } }),
      this.stocks(),
    ]);

    return categories.map((categorie) => {
      const quantity = Math.max(0, stocks.get(categorie.id) ?? 0);
      return {
        ...categorie,
        quantity,
        level: this.niveau(quantity, categorie.criticalLevel, categorie.lowLevel),
      };
    });
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.foodCategory.create({
      data: { ...dto, slug: dto.slug ?? toSlug(dto.name) },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.foodCategory.update({ where: { id }, data: dto });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2025') {
        throw new NotFoundException('Catégorie introuvable.');
      }
      throw cause;
    }
  }

  async removeCategory(id: string) {
    await this.updateCategory(id, {});
    await this.prisma.foodCategory.delete({ where: { id } });
  }

  // ── Classement public des donateurs ───────────────────────────────────────

  /**
   * Donateurs, en nature et en argent, réunis en un classement.
   *
   * Les dons anonymes sont écartés à la source, pas masqués à l'affichage :
   * une donnée qu'on ne veut pas montrer ne doit pas quitter le serveur.
   *
   * Sur quoi classer ? Les quantités ne se comparent pas entre articles — 40
   * litres d'huile ne valent pas 40 kg de riz, et les additionner produirait
   * un nombre qui ne veut rien dire. Le classement se fait donc par **nombre
   * de dons**, sauf quand un article est choisi : là, les quantités portent
   * toutes la même unité et se comparent. Les dons financiers se classent par
   * montant.
   */
  async donors(filtres: { product?: string; type?: 'nature' | 'financier' } = {}) {
    const veutNature = filtres.type !== 'financier';
    // Un filtre par article ne concerne que les dons en nature : l'argent
    // n'est pas affecté à une denrée.
    const veutFinancier = filtres.type !== 'nature' && !filtres.product;

    const [enNature, financiers, categories] = await Promise.all([
      veutNature
        ? this.prisma.foodbankRequest.findMany({
            where: {
              kind: FoodbankRequestKind.DON,
              status: FoodbankRequestStatus.APPROVED,
              isAnonymous: false,
              ...(filtres.product ? { category: { slug: filtres.product } } : {}),
            },
            include: { category: { select: { name: true, slug: true, unit: true } } },
            orderBy: { handledAt: 'desc' },
          })
        : Promise.resolve([]),
      veutFinancier
        ? this.prisma.donation.findMany({
            where: { status: DonationStatus.COMPLETED, isAnonymous: false },
            select: { donorName: true, donorEmail: true, amount: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      this.prisma.foodCategory.findMany({
        where: { isActive: true },
        select: { name: true, slug: true, unit: true },
        orderBy: { order: 'asc' },
      }),
    ]);

    /** Un donateur est identifié par son adresse, pas par son nom. */
    type Ligne = {
      nom: string;
      dons: number;
      quantite: number;
      unite: string | null;
      montant: number;
      articles: string[];
      dernier: string;
    };
    const parPersonne = new Map<string, Ligne>();

    const inscrire = (email: string, nom: string, date: Date) => {
      const cle = email.trim().toLowerCase();
      const existant = parPersonne.get(cle);
      if (existant) {
        existant.dons += 1;
        if (date.toISOString() > existant.dernier) existant.dernier = date.toISOString();
        return existant;
      }
      const ligne: Ligne = {
        nom,
        dons: 1,
        quantite: 0,
        unite: null,
        montant: 0,
        articles: [],
        dernier: date.toISOString(),
      };
      parPersonne.set(cle, ligne);
      return ligne;
    };

    for (const don of enNature) {
      const ligne = inscrire(don.email, don.name, don.handledAt ?? don.createdAt);
      ligne.quantite += don.quantity;
      ligne.unite = don.unit;
      const article = don.category?.name ?? don.otherLabel;
      if (article && !ligne.articles.includes(article)) ligne.articles.push(article);
    }

    for (const don of financiers) {
      const ligne = inscrire(don.donorEmail, don.donorName, don.createdAt);
      ligne.montant += don.amount;
    }

    const lignes = [...parPersonne.values()];

    // L'ordre dépend de ce qui est comparable, voir l'en-tête de la méthode.
    lignes.sort((a, b) => {
      if (filtres.product) return b.quantite - a.quantite || b.dons - a.dons;
      if (filtres.type === 'financier') return b.montant - a.montant || b.dons - a.dons;
      return b.dons - a.dons || b.montant - a.montant || b.dernier.localeCompare(a.dernier);
    });

    return {
      // De quoi remplir la barre de filtres sans seconde requête.
      articles: categories,
      critere: filtres.product ? 'quantite' : filtres.type === 'financier' ? 'montant' : 'dons',
      donateurs: lignes.map((ligne, rang) => ({ rang: rang + 1, ...ligne })),
    };
  }

  // ── Mots des bénéficiaires ────────────────────────────────────────────────

  /** Les mots publiés, pour le site. */
  async comments() {
    const lignes = await this.prisma.foodbankComment.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });

    return lignes.map((ligne) => ({
      id: ligne.id,
      // Le nom ne sort pas quand la personne a demandé l'anonymat.
      authorName: ligne.isAnonymous ? 'Une personne accompagnée' : ligne.authorName,
      message: ligne.message,
      createdAt: ligne.createdAt.toISOString(),
    }));
  }

  async createComment(dto: CreateFoodbankCommentDto) {
    // Déposé non publié : voir le commentaire du modèle. Le back-office
    // décide, et la réponse le dit à la personne pour qu'elle ne cherche pas
    // son mot en vain sur la page.
    await this.prisma.foodbankComment.create({ data: dto });
    return { ok: true };
  }

  async findCommentsAdmin() {
    const lignes = await this.prisma.foodbankComment.findMany({
      orderBy: [{ isPublished: 'asc' }, { createdAt: 'desc' }],
    });
    return lignes.map((ligne) => ({ ...ligne, createdAt: ligne.createdAt.toISOString() }));
  }

  async updateComment(id: string, dto: UpdateFoodbankCommentDto) {
    try {
      return await this.prisma.foodbankComment.update({ where: { id }, data: dto });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2025') {
        throw new NotFoundException('Commentaire introuvable.');
      }
      throw cause;
    }
  }

  async removeComment(id: string) {
    try {
      await this.prisma.foodbankComment.delete({ where: { id } });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2025') {
        throw new NotFoundException('Commentaire introuvable.');
      }
      throw cause;
    }
  }

  // ── Demandes déposées depuis le site ──────────────────────────────────────

  /**
   * Enregistre une demande. Le stock ne bouge pas encore.
   *
   * L'unité est figée ici, à partir de la catégorie visée : la catégorie peut
   * changer d'unité plus tard, et la demande doit rester lisible telle qu'elle
   * a été déposée.
   */
  async createRequest(dto: CreateFoodbankRequestDto) {
    const retrait = dto.kind === FoodbankRequestKind.RETRAIT;

    // On ne réclame que ce que la banque gère : une demande de retrait sans
    // catégorie n'aurait rien à retirer.
    if (retrait && !dto.categoryId) {
      throw new BadRequestException('Choisissez un article parmi ceux de la banque.');
    }
    if (!dto.categoryId && !dto.otherLabel) {
      throw new BadRequestException("Indiquez l'article que vous souhaitez apporter.");
    }

    let unit = dto.unit?.trim() || 'unités';

    if (dto.categoryId) {
      const categorie = await this.prisma.foodCategory.findUnique({
        where: { id: dto.categoryId },
        select: { id: true, unit: true, isActive: true },
      });
      if (!categorie?.isActive) throw new NotFoundException('Article introuvable.');
      unit = categorie.unit;
    }

    return this.prisma.foodbankRequest.create({
      data: {
        kind: dto.kind,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        isAnonymous: dto.isAnonymous ?? false,
        categoryId: dto.categoryId ?? null,
        // Le libellé libre ne sert qu'aux articles hors liste : le garder à
        // côté d'une catégorie ferait deux noms pour une même chose.
        otherLabel: dto.categoryId ? null : (dto.otherLabel ?? null),
        quantity: dto.quantity,
        unit,
        message: dto.message,
      },
    });
  }

  /** Les demandes, pour le back-office. */
  async findRequests(kind?: FoodbankRequestKind) {
    const lignes = await this.prisma.foodbankRequest.findMany({
      where: kind ? { kind } : undefined,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { category: { select: { id: true, name: true, unit: true } } },
    });

    return lignes.map((ligne) => ({
      ...ligne,
      createdAt: ligne.createdAt.toISOString(),
      handledAt: ligne.handledAt?.toISOString() ?? null,
      updatedAt: ligne.updatedAt.toISOString(),
    }));
  }

  /**
   * Traite une demande. La validation, et elle seule, fait bouger le stock.
   *
   * Le mouvement engendré est rattaché à la demande : on peut donc toujours
   * remonter d'une ligne du registre à la personne qui l'a déclenchée, et
   * s'assurer qu'une demande n'a pas été comptée deux fois.
   */
  async updateRequest(id: string, dto: UpdateFoodbankRequestDto) {
    const demande = await this.prisma.foodbankRequest.findUnique({ where: { id } });
    if (!demande) throw new NotFoundException('Demande introuvable.');

    // Une demande déjà comptée ne se remanie pas : le registre ferait foi
    // d'un stock qui n'existe plus. La correction passe par le mouvement.
    if (demande.movementId && dto.status && dto.status !== demande.status) {
      throw new BadRequestException(
        'Cette demande a déjà été comptée dans le stock. Corrigez le mouvement dans le registre.',
      );
    }

    const categoryId = dto.categoryId ?? demande.categoryId;
    const quantity = dto.quantity ?? demande.quantity;

    if (dto.status !== FoodbankRequestStatus.APPROVED) {
      return this.prisma.foodbankRequest.update({
        where: { id },
        data: {
          status: dto.status ?? demande.status,
          categoryId,
          quantity,
          handledAt: dto.status ? new Date() : demande.handledAt,
        },
      });
    }

    // ── Validation : on compte ──
    if (!categoryId) {
      throw new BadRequestException(
        'Rattachez d’abord cette demande à un article de la banque : sans catégorie, rien ne peut être compté.',
      );
    }

    const categorie = await this.prisma.foodCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, unit: true },
    });
    if (!categorie) throw new NotFoundException('Article introuvable.');

    const entree = demande.kind === FoodbankRequestKind.DON;

    // Une sortie ne peut pas dépasser ce qu'il y a en réserve : le stock est
    // une somme de mouvements, et un stock négatif ne veut rien dire.
    if (!entree) {
      const disponible = (await this.stocks()).get(categoryId) ?? 0;
      if (quantity > disponible) {
        throw new BadRequestException(
          `Il ne reste que ${disponible} ${categorie.unit} de ${categorie.name} : la sortie demandée dépasse le stock.`,
        );
      }
    }

    const qui = demande.isAnonymous
      ? entree
        ? 'Donateur anonyme'
        : 'Bénéficiaire anonyme'
      : demande.name;

    // Les deux écritures vont ensemble : un mouvement sans demande rattachée
    // se recompterait à la validation suivante.
    const [mouvement] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: {
          categoryId,
          direction: entree ? MovementDirection.ENTREE : MovementDirection.SORTIE,
          quantity,
          counterpart: qui,
          detail: demande.otherLabel ?? demande.message ?? null,
        },
      }),
    ]);

    return this.prisma.foodbankRequest.update({
      where: { id },
      data: {
        status: FoodbankRequestStatus.APPROVED,
        categoryId,
        quantity,
        movementId: mouvement.id,
        handledAt: new Date(),
      },
    });
  }

  async removeRequest(id: string) {
    try {
      await this.prisma.foodbankRequest.delete({ where: { id } });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2025') {
        throw new NotFoundException('Demande introuvable.');
      }
      throw cause;
    }
  }

  async createMovement(dto: CreateMovementDto) {
    const categorie = await this.prisma.foodCategory.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!categorie) throw new NotFoundException('Catégorie introuvable.');

    return this.prisma.stockMovement.create({
      data: {
        ...dto,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
    });
  }

  async updateMovement(id: string, dto: UpdateMovementDto) {
    try {
      return await this.prisma.stockMovement.update({
        where: { id },
        data: {
          ...dto,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        },
      });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2025') {
        throw new NotFoundException('Mouvement introuvable.');
      }
      throw cause;
    }
  }

  async removeMovement(id: string) {
    try {
      await this.prisma.stockMovement.delete({ where: { id } });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2025') {
        throw new NotFoundException('Mouvement introuvable.');
      }
      throw cause;
    }
  }
}
