import { Injectable } from '@nestjs/common';
import { ConsentStatus, DonationStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/** Une entrée du journal d'activité. */
export interface JournalEntry {
  at: string;
  kind: 'DON' | 'PARTENARIAT' | 'PROJET' | 'ACTUALITE' | 'MEDIA' | 'BENEVOLE' | 'MEMBRE';
  text: string;
  /** Vrai quand l'entrée appelle encore une action. */
  pending: boolean;
}

/** Nombre de mois affichés par le graphique de collecte. */
const MOIS_AFFICHES = 6;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tout ce que le tableau de bord affiche, en une lecture.
   *
   * Le back-office faisait huit appels en parallèle puis recomposait : chaque
   * écran payait alors huit allers-retours, et une rubrique fermée au rôle
   * faisait échouer un appel qu'il fallait rattraper côté client. Une seule
   * réponse, filtrée ici selon le rôle, supprime les deux problèmes.
   */
  async overview(user: AuthenticatedUser) {
    const estAdmin = user.role === Role.ADMIN;

    const [
      donsEnAttente,
      partenariats,
      messages,
      benevoles,
      adhesions,
      consentements,
      programmes,
      projets,
      actualites,
    ] = await this.prisma.$transaction([
      this.prisma.donation.count({ where: { status: DonationStatus.PENDING } }),
      this.prisma.partnershipRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.contact.count({ where: { status: 'PENDING' } }),
      this.prisma.volunteer.count({ where: { status: 'PENDING' } }),
      this.prisma.member.count({ where: { status: 'EN_ATTENTE' } }),
      this.prisma.mediaAsset.count({ where: { consentStatus: { not: ConsentStatus.GRANTED } } }),
      this.prisma.program.count(),
      this.prisma.project.count(),
      this.prisma.news.count(),
    ]);

    return {
      /**
       * Ce qui attend une action. Les dons n'y figurent que pour un
       * administrateur : les autres rôles n'y ont pas accès, et annoncer un
       * compteur qu'on ne peut pas ouvrir n'aide personne.
       */
      pending: {
        donations: estAdmin ? donsEnAttente : null,
        partnerships: partenariats,
        contacts: messages,
        volunteers: benevoles,
        members: adhesions,
        mediaConsent: consentements,
      },
      counts: {
        programs: programmes,
        projects: projets,
        news: actualites,
        mediaToValidate: consentements,
      },
      donations: estAdmin ? await this.donations() : null,
      journal: await this.journal(estAdmin),
      nextEvent: await this.nextEvent(),
    };
  }

  /** Totaux de collecte et série des six derniers mois. */
  private async donations() {
    const [confirmes, enAttente] = await this.prisma.$transaction([
      this.prisma.donation.aggregate({
        where: { status: DonationStatus.COMPLETED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.donation.count({ where: { status: DonationStatus.PENDING } }),
    ]);

    // Le premier jour du mois, il y a cinq mois : la fenêtre couvre six mois
    // pleins, mois courant compris.
    const maintenant = new Date();
    const debut = new Date(
      Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() - (MOIS_AFFICHES - 1), 1),
    );

    const lignes = await this.prisma.donation.findMany({
      where: { status: DonationStatus.COMPLETED, createdAt: { gte: debut } },
      select: { amount: true, createdAt: true },
    });

    // On construit les six seaux d'abord, puis on y verse : un mois sans don
    // doit apparaître à zéro, pas disparaître du graphique.
    const seaux = Array.from({ length: MOIS_AFFICHES }, (_, index) => {
      const date = new Date(
        Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + index, 1),
      );
      return { month: date.toISOString().slice(0, 7), total: 0 };
    });

    for (const ligne of lignes) {
      const cle = ligne.createdAt.toISOString().slice(0, 7);
      const seau = seaux.find((s) => s.month === cle);
      if (seau) seau.total += ligne.amount;
    }

    return {
      collectedTotal: confirmes._sum.amount ?? 0,
      completedCount: confirmes._count,
      pendingCount: enAttente,
      monthly: seaux,
    };
  }

  /**
   * Journal d'activité, toutes natures confondues.
   *
   * Il n'existe pas de table d'événements : on lit les dernières lignes de
   * chaque table concernée et on les fusionne par date. C'est suffisant à
   * l'échelle de l'association, et cela évite d'entretenir un journal en
   * double de la donnée.
   */
  private async journal(estAdmin: boolean): Promise<JournalEntry[]> {
    const [dons, partenariats, projets, actualites, medias, benevoles] =
      await this.prisma.$transaction([
        this.prisma.donation.findMany({
          take: estAdmin ? 5 : 0,
          orderBy: { createdAt: 'desc' },
          select: {
            amount: true,
            method: true,
            status: true,
            createdAt: true,
            program: { select: { title: true } },
          },
        }),
        this.prisma.partnershipRequest.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { organisation: true, intent: true, createdAt: true, status: true },
        }),
        this.prisma.project.findMany({
          take: 5,
          where: { isPublished: true },
          orderBy: { updatedAt: 'desc' },
          select: { title: true, updatedAt: true },
        }),
        this.prisma.news.findMany({
          take: 5,
          where: { isPublished: true, publishedAt: { not: null } },
          orderBy: { publishedAt: 'desc' },
          select: { title: true, publishedAt: true },
        }),
        this.prisma.mediaAsset.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, consentStatus: true },
        }),
        this.prisma.volunteer.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { name: true, createdAt: true, status: true },
        }),
      ]);

    const METHODES: Record<string, string> = {
      MOBILE_MONEY: 'Mobile Money',
      BANK_TRANSFER: 'virement',
      CARD: 'carte',
    };

    const entrees: JournalEntry[] = [
      ...dons.map((don) => ({
        at: don.createdAt.toISOString(),
        kind: 'DON' as const,
        text: `Don de ${Math.round(don.amount)} F reçu par ${
          METHODES[don.method] ?? don.method
        }${don.program ? `, affecté à « ${don.program.title} »` : ''}.`,
        pending: don.status === DonationStatus.PENDING,
      })),
      ...partenariats.map((demande) => ({
        at: demande.createdAt.toISOString(),
        kind: 'PARTENARIAT' as const,
        text: `${demande.organisation} a déposé une demande de partenariat.`,
        pending: demande.status === 'PENDING',
      })),
      ...projets.map((projet) => ({
        at: projet.updatedAt.toISOString(),
        kind: 'PROJET' as const,
        text: `Projet ${projet.title} publié sur le site.`,
        pending: false,
      })),
      ...actualites.map((article) => ({
        at: (article.publishedAt as Date).toISOString(),
        kind: 'ACTUALITE' as const,
        text: `Actualité ${article.title} publiée.`,
        pending: false,
      })),
      ...benevoles.map((candidature) => ({
        at: candidature.createdAt.toISOString(),
        kind: 'BENEVOLE' as const,
        text: `${candidature.name} a proposé sa candidature de bénévole.`,
        pending: candidature.status === 'PENDING',
      })),
    ];

    // Les médias sont regroupés par jour : quatorze imports consécutifs
    // rempliraient le journal sans rien apprendre.
    const parJour = new Map<string, { total: number; manquants: number; at: string }>();
    for (const media of medias) {
      const jour = media.createdAt.toISOString().slice(0, 10);
      const lot = parJour.get(jour) ?? { total: 0, manquants: 0, at: media.createdAt.toISOString() };
      lot.total += 1;
      if (media.consentStatus !== ConsentStatus.GRANTED) lot.manquants += 1;
      parJour.set(jour, lot);
    }
    for (const lot of parJour.values()) {
      entrees.push({
        at: lot.at,
        kind: 'MEDIA',
        text: `${lot.total} média${lot.total > 1 ? 's' : ''} importé${
          lot.total > 1 ? 's' : ''
        } dans la médiathèque, ${
          lot.manquants === 0
            ? 'consentements complets'
            : `${lot.manquants} sans consentement valide`
        }.`,
        pending: lot.manquants > 0,
      });
    }

    return entrees.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  }

  /**
   * Prochaine échéance : l'événement qui vient.
   *
   * La publication n'entre pas dans le filtre. C'est un rappel interne : un
   * événement encore masqué reste un engagement pris, et c'est souvent celui
   * qu'il reste justement à préparer. L'état de publication est renvoyé pour
   * que l'écran le signale.
   */
  private async nextEvent() {
    const maintenant = new Date();

    return this.prisma.event.findFirst({
      where: { startDate: { gte: maintenant } },
      orderBy: { startDate: 'asc' },
      select: {
        title: true,
        slug: true,
        location: true,
        startDate: true,
        endDate: true,
        isPublished: true,
      },
    });
  }
}
