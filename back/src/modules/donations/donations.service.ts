import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DonationMethod, DonationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { SettingsService } from '../settings/settings.service';
import { FedapayService } from './fedapay.service';
import { CreateDonationDto, UpdateDonationDto } from './dto/donation.dto';

/**
 * Ce que le front reçoit après l'enregistrement d'un don.
 *
 * Deux cas, selon la configuration du back-office :
 *  - passerelle activée  → la transaction est ouverte chez FedaPay et on
 *    renvoie l'adresse de sa page de règlement, où le site redirige ;
 *  - passerelle inactive → on renvoie les instructions de règlement à
 *    afficher, et le don reste en attente jusqu'à confirmation manuelle.
 *
 * La clé publique n'est plus transmise : elle servait à un widget appelé
 * depuis le navigateur, qui n'a jamais été écrit. C'est le serveur qui parle
 * à FedaPay, et le navigateur ne reçoit qu'une adresse.
 */
export interface DonationReceipt {
  id: string;
  amount: number;
  currency: string;
  method: DonationMethod;
  gateway:
    | { mode: 'online'; url: string }
    | { mode: 'manual'; instructions: string };
}

@Injectable()
export class DonationsService {
  private readonly journal = new Logger(DonationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly fedapay: FedapayService,
  ) {}

  async create(dto: CreateDonationDto): Promise<DonationReceipt> {
    const payment = await this.settings.getPaymentConfig();

    if (!payment.methods.includes(dto.method)) {
      throw new BadRequestException("Ce moyen de paiement n'est pas proposé actuellement.");
    }

    if (dto.programId) {
      const program = await this.prisma.program.findUnique({
        where: { id: dto.programId },
        select: { isActive: true },
      });
      if (!program?.isActive) {
        throw new BadRequestException("Le programme d'affectation choisi est indisponible.");
      }
    }

    const donation = await this.prisma.donation.create({ data: dto });

    const recu = {
      id: donation.id,
      amount: donation.amount,
      currency: donation.currency,
      method: donation.method,
    };

    // `payment.enabled` commande seul l'encaissement en ligne : tant qu'il
    // est à faux, le don est enregistré et les instructions de règlement
    // sont renvoyées au donateur.
    if (!payment.enabled) {
      return {
        ...recu,
        gateway: { mode: 'manual', instructions: this.instructionsFor(dto.method, payment) },
      };
    }

    // Le virement bancaire ne passe pas par l'agrégateur : il n'a pas de page
    // de règlement à ouvrir. Renvoyer le donateur vers FedaPay pour un
    // virement l'enverrait dans une impasse.
    if (dto.method === DonationMethod.BANK_TRANSFER) {
      return {
        ...recu,
        gateway: { mode: 'manual', instructions: this.instructionsFor(dto.method, payment) },
      };
    }

    const { url, reference } = await this.fedapay.ouvrirPaiement(
      donation,
      payment,
      `${this.siteUrl()}/communaute/donateur/retour?don=${donation.id}`,
    );

    // La référence du fournisseur est gardée dès l'ouverture : sans elle, on
    // ne saurait pas quoi interroger au retour du donateur.
    await this.prisma.donation.update({
      where: { id: donation.id },
      data: { providerRef: reference },
    });

    return { ...recu, gateway: { mode: 'online', url } };
  }

  /**
   * Confirme un don auprès de FedaPay, au retour du donateur.
   *
   * L'état est demandé à FedaPay, jamais lu dans l'adresse de retour : un
   * paramètre d'URL se falsifie, et marquerait n'importe quel don encaissé.
   */
  async confirmer(id: string): Promise<{ status: DonationStatus; amount: number }> {
    const donation = await this.prisma.donation.findUnique({ where: { id } });
    if (!donation) throw new NotFoundException('Don introuvable.');

    // Déjà tranché : on ne réinterroge pas, et on ne revient pas en arrière.
    if (donation.status !== DonationStatus.PENDING || !donation.providerRef) {
      return { status: donation.status, amount: donation.amount };
    }

    const payment = await this.settings.getPaymentConfig();
    const etat = await this.fedapay.etatDe(payment, donation.providerRef);

    // Seul `approved` vaut encaissement. « declined » et « canceled » ne sont
    // pas définitifs chez FedaPay — le donateur peut retenter — le don reste
    // donc en attente plutôt que d'être clos à tort.
    const statut =
      etat === 'approved'
        ? DonationStatus.COMPLETED
        : etat === 'expired' || etat === 'refunded'
          ? DonationStatus.FAILED
          : DonationStatus.PENDING;

    if (statut !== donation.status) {
      await this.prisma.donation.update({ where: { id }, data: { status: statut } });
    }

    return { status: statut, amount: donation.amount };
  }

  /**
   * Traite une notification FedaPay, une fois sa signature vérifiée.
   *
   * Rien du corps n'est cru sur parole hormis la référence : l'état est
   * ensuite redemandé à FedaPay par `confirmer`. Un message forgé — à
   * supposer qu'il passe la signature — ne pourrait donc pas décréter qu'un
   * don est encaissé.
   *
   * Sans webhook, un donateur qui règle puis ferme son onglet laisserait son
   * don en attente : c'est ce trou que cette route comble.
   */
  async traiterNotification(corpsBrut: string, signature: string | undefined): Promise<void> {
    const payment = await this.settings.getPaymentConfig();

    if (!this.fedapay.verifierSignature(corpsBrut, signature, payment.webhookSecret)) {
      // Pas de détail dans la réponse : on ne renseigne pas un émetteur
      // inconnu sur ce qui a échoué.
      throw new UnauthorizedException('Signature invalide.');
    }

    const evenement = JSON.parse(corpsBrut) as {
      entity?: { merchant_reference?: string; id?: number };
    };

    // `merchant_reference` porte notre identifiant de don, posé à l'ouverture
    // de la transaction. À défaut, on retrouve la ligne par la référence du
    // fournisseur.
    const reference = evenement.entity?.merchant_reference;
    const don = reference
      ? await this.prisma.donation.findUnique({ where: { id: reference } })
      : await this.prisma.donation.findFirst({
          where: { providerRef: String(evenement.entity?.id ?? '') },
        });

    if (!don) {
      this.journal.warn(`Notification FedaPay sans don correspondant : ${corpsBrut.slice(0, 200)}`);
      return;
    }

    await this.confirmer(don.id);
  }

  /** Adresse publique du site, pour l'adresse de retour de l'agrégateur. */
  private siteUrl(): string {
    return (process.env.SITE_URL ?? 'http://localhost:3100').replace(/\/+$/, '');
  }

  async findAll(query: PaginationDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { program: { select: { id: true, title: true, slug: true } } },
      }),
      this.prisma.donation.count(),
    ]);

    return paginate(items, total, query);
  }

  /** Indicateurs de la page « dons » du back-office. */
  async stats() {
    const [completed, pending, byProgram] = await this.prisma.$transaction([
      this.prisma.donation.aggregate({
        where: { status: DonationStatus.COMPLETED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.donation.count({ where: { status: DonationStatus.PENDING } }),
      this.prisma.donation.groupBy({
        by: ['programId'],
        where: { status: DonationStatus.COMPLETED },
        _sum: { amount: true },
        orderBy: { programId: 'asc' },
      }),
    ]);

    return {
      collectedTotal: completed._sum.amount ?? 0,
      completedCount: completed._count,
      pendingCount: pending,
      byProgram: byProgram.map((row) => ({
        programId: row.programId,
        total: row._sum?.amount ?? 0,
      })),
    };
  }

  update(id: string, dto: UpdateDonationDto) {
    return this.prisma.donation.update({ where: { id }, data: dto });
  }

  private instructionsFor(
    method: DonationMethod,
    payment: { mobileMoneyInstructions: string; bankDetails: string },
  ): string {
    switch (method) {
      case DonationMethod.MOBILE_MONEY:
        return payment.mobileMoneyInstructions;
      case DonationMethod.BANK_TRANSFER:
        return payment.bankDetails;
      case DonationMethod.CARD:
        return 'Le paiement par carte est momentanément indisponible. Un membre de l’équipe vous recontacte pour finaliser votre don.';
    }
  }
}
