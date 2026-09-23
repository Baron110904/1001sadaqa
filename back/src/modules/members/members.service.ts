import { BadRequestException, Injectable } from '@nestjs/common';
import { ContributionStatus, MemberStatus, Prisma, RecordedBy } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  COTISATION_MINIMUM,
  CreateContributionDto,
  CreateMemberDto,
  DecideMemberDto,
  UpdateMemberDto,
} from './dto/member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Demande d'adhésion déposée depuis le site.
   *
   * Le membre n'est pas créé par l'administration : il s'inscrit, et
   * l'administration valide ensuite. La demande part donc en attente, jamais
   * active.
   */
  async request(dto: CreateMemberDto) {
    if (!dto.consentPrivacy) {
      throw new BadRequestException(
        'La politique de confidentialité doit être acceptée pour envoyer la demande.',
      );
    }

    const now = new Date();

    const member = await this.prisma.member.create({
      data: {
        ...dto,
        status: MemberStatus.EN_ATTENTE,
        consentPrivacyAt: now,
        consentNews: dto.consentNews ?? false,
        consentNewsAt: dto.consentNews ? now : null,
      },
    });

    return { id: member.id, status: member.status };
  }

  findAllAdmin(status?: MemberStatus) {
    return this.prisma.member.findMany({
      where: status ? { status } : {},
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { contributions: true } } },
    });
  }

  async findOneAdmin(id: string) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { id },
      include: { contributions: { orderBy: { period: 'desc' } } },
    });

    return { ...member, ...this.standing(member.contributions, member.pledgedAmount) };
  }

  /**
   * Décision sur une demande d'adhésion.
   *
   * La date d'adhésion est posée au passage en actif, une seule fois : une
   * suspension puis une réactivation ne doivent pas réécrire l'ancienneté.
   */
  decide(id: string, dto: DecideMemberDto) {
    return this.prisma.member.update({
      where: { id },
      data: {
        status: dto.status,
        decisionNote: dto.decisionNote ?? null,
        ...(dto.status === MemberStatus.ACTIF ? { joinedAt: new Date() } : {}),
      },
    });
  }

  update(id: string, dto: UpdateMemberDto) {
    return this.prisma.member.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.member.delete({ where: { id } });
  }

  // ── Cotisations ──────────────────────────────────────────────────────────

  /**
   * Enregistre un versement.
   *
   * Une ligne par versement, jamais un abonnement : le montant d'une échéance
   * n'engage pas les suivantes. `recordedBy` distingue un paiement en ligne
   * d'une saisie de la trésorerie — espèces ou virement reçus hors du site.
   */
  async addContribution(memberId: string, dto: CreateContributionDto, byTreasury: boolean) {
    if (dto.amount < COTISATION_MINIMUM) {
      throw new BadRequestException(
        `La cotisation mensuelle est de ${COTISATION_MINIMUM} F CFA au minimum.`,
      );
    }

    await this.prisma.member.findUniqueOrThrow({ where: { id: memberId } });

    return this.prisma.contribution.create({
      data: {
        memberId,
        amount: dto.amount,
        period: new Date(dto.period),
        paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
        method: dto.method,
        providerRef: dto.providerRef,
        status: dto.paidAt ? ContributionStatus.CONFIRME : ContributionStatus.EN_ATTENTE,
        recordedBy: byTreasury ? RecordedBy.TRESORERIE : RecordedBy.SYSTEME,
      },
    });
  }

  confirmContribution(id: string) {
    return this.prisma.contribution.update({
      where: { id },
      data: { status: ContributionStatus.CONFIRME, paidAt: new Date() },
    });
  }

  removeContribution(id: string) {
    return this.prisma.contribution.delete({ where: { id } });
  }

  /** Compteurs du tableau de bord : demandes en attente, cotisations du mois. */
  async summary() {
    const debutDuMois = new Date();
    debutDuMois.setUTCDate(1);
    debutDuMois.setUTCHours(0, 0, 0, 0);

    const [pending, active, collected] = await this.prisma.$transaction([
      this.prisma.member.count({ where: { status: MemberStatus.EN_ATTENTE } }),
      this.prisma.member.count({ where: { status: MemberStatus.ACTIF } }),
      this.prisma.contribution.aggregate({
        where: { status: ContributionStatus.CONFIRME, period: { gte: debutDuMois } },
        _sum: { amount: true },
      }),
    ]);

    return { pending, active, collectedThisMonth: collected._sum.amount ?? 0 };
  }

  /**
   * Situation d'un membre vis-à-vis de sa cotisation.
   *
   * Le retard se **calcule** depuis les versements enregistrés, il ne se saisit
   * pas. Et il ne bloque rien : c'est une information interne, la radiation
   * relève des statuts et d'une décision humaine.
   */
  private standing(
    contributions: { amount: number; period: Date; status: ContributionStatus }[],
    pledged: number,
  ) {
    const confirmed = contributions.filter((c) => c.status === ContributionStatus.CONFIRME);
    const total = confirmed.reduce((somme, c) => somme + c.amount, 0);

    const debutDuMois = new Date();
    debutDuMois.setUTCDate(1);
    debutDuMois.setUTCHours(0, 0, 0, 0);

    const thisMonth = confirmed.some((c) => c.period >= debutDuMois);

    return {
      totalPaid: total,
      upToDate: thisMonth,
      expectedMonthly: pledged,
    };
  }

  /** Filtre réutilisable : les membres à jour du mois en cours. */
  static currentPeriod(): Prisma.ContributionWhereInput {
    const debut = new Date();
    debut.setUTCDate(1);
    debut.setUTCHours(0, 0, 0, 0);
    return { status: ContributionStatus.CONFIRME, period: { gte: debut } };
  }
}
