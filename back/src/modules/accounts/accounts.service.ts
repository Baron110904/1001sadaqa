import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import type { AppConfig } from '../../config/configuration';
import type { LoginAccountDto, RegisterAccountDto, UpdateProfileDto } from './dto/account.dto';

/**
 * Audience des jetons de compte public.
 *
 * Elle sépare formellement ces jetons de ceux de l'administration. La
 * séparation existe déjà de fait — chaque stratégie cherche son porteur dans
 * sa propre table — mais elle reposerait alors sur l'absence de collision
 * entre deux identifiants. L'audience la rend explicite et vérifiable.
 */
export const AUDIENCE_COMPTE = 'sadaqa:account';

export interface AccountTokens {
  accessToken: string;
  refreshToken: string;
}

/** Profil renvoyé à la personne connectée, sans rien de secret. */
export interface AccountProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
}

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Création d'un compte public.
   *
   * Aucune validation par courriel : le service d'envoi n'est pas branché, et
   * bloquer l'accès derrière un lien jamais reçu serait pire que pas de
   * vérification du tout. Le compte ne donne accès qu'à ses propres données —
   * il n'ouvre aucun droit sur le site.
   */
  async register(dto: RegisterAccountDto): Promise<{ account: AccountProfile } & AccountTokens> {
    const email = dto.email.trim().toLowerCase();

    const existe = await this.prisma.account.findUnique({ where: { email } });
    if (existe) {
      throw new ConflictException('Un compte existe déjà avec cette adresse.');
    }

    const account = await this.prisma.account.create({
      data: {
        email,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        password: await bcrypt.hash(dto.password, 12),
      },
    });

    // Les envois déjà faits sous cette adresse rejoignent le compte : la
    // personne retrouve sa candidature ou son adhésion en se connectant, sans
    // avoir à la ressaisir.
    await this.rattacher(account.id, email);

    return { account: this.profil(account), ...(await this.issueTokens(account.id)) };
  }

  async login(dto: LoginAccountDto): Promise<{ account: AccountProfile } & AccountTokens> {
    const email = dto.email.trim().toLowerCase();
    const account = await this.prisma.account.findUnique({ where: { email } });

    // Message identique dans les deux cas : ne pas révéler quelles adresses
    // sont inscrites.
    const refus = new UnauthorizedException('Identifiants incorrects.');
    if (!account?.isActive) throw refus;
    if (!(await bcrypt.compare(dto.password, account.password))) throw refus;

    await this.prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    await this.rattacher(account.id, email);

    return { account: this.profil(account), ...(await this.issueTokens(account.id)) };
  }

  async refresh(refreshToken: string): Promise<AccountTokens> {
    let sub: string;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.config.get('jwt.refreshSecret', { infer: true }),
        audience: AUDIENCE_COMPTE,
      }));
    } catch {
      throw new UnauthorizedException('Session expirée, reconnectez-vous.');
    }

    const account = await this.prisma.account.findUnique({ where: { id: sub } });
    if (!account?.isActive || !account.refreshToken) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous.');
    }
    if (!(await bcrypt.compare(refreshToken, account.refreshToken))) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous.');
    }

    return this.issueTokens(account.id);
  }

  async logout(accountId: string): Promise<{ success: true }> {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { refreshToken: null },
    });
    return { success: true };
  }

  async updateProfile(accountId: string, dto: UpdateProfileDto): Promise<AccountProfile> {
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        name: dto.name?.trim(),
        phone: dto.phone?.trim() || null,
        ...(dto.password ? { password: await bcrypt.hash(dto.password, 12) } : {}),
      },
    });
    return this.profil(account);
  }

  /**
   * Tout ce que la personne connectée voit dans son espace.
   *
   * Dons, adhésion, cotisations et candidatures de bénévolat : les quatre
   * traces qu'elle peut avoir laissées. Chacune est filtrée sur son compte ou
   * son adresse — jamais sur un identifiant fourni par le navigateur.
   */
  async overview(accountId: string) {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: {
        member: { include: { contributions: { orderBy: { period: 'desc' } } } },
        partnerSeats: { include: { partner: { select: { id: true, name: true, logo: true } } } },
      },
    });

    const [donations, volunteer] = await Promise.all([
      this.prisma.donation.findMany({
        where: { OR: [{ accountId }, { donorEmail: account.email }] },
        orderBy: { createdAt: 'desc' },
        include: { program: { select: { title: true, slug: true } } },
      }),
      this.prisma.volunteer.findMany({
        where: { OR: [{ accountId }, { email: account.email }] },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true, preference: true, mission: { select: { title: true } } },
      }),
    ]);

    return {
      account: this.profil(account),
      member: account.member && {
        id: account.member.id,
        status: account.member.status,
        pledgedAmount: account.member.pledgedAmount,
        joinedAt: account.member.joinedAt?.toISOString() ?? null,
        contributions: account.member.contributions.map((versement) => ({
          id: versement.id,
          amount: versement.amount,
          period: versement.period.toISOString(),
          status: versement.status,
          paidAt: versement.paidAt?.toISOString() ?? null,
        })),
      },
      donations: donations.map((don) => ({
        id: don.id,
        amount: don.amount,
        currency: don.currency,
        method: don.method,
        status: don.status,
        isAnonymous: don.isAnonymous,
        createdAt: don.createdAt.toISOString(),
        program: don.program,
      })),
      volunteering: volunteer.map((candidature) => ({
        id: candidature.id,
        status: candidature.status,
        preference: candidature.preference,
        mission: candidature.mission?.title ?? null,
        createdAt: candidature.createdAt.toISOString(),
      })),
      partners: account.partnerSeats.map((siege) => siege.partner),
    };
  }

  // ── Administration ───────────────────────────────────────────────────────

  /** Comptes ouverts, pour l'administration. Jamais le mot de passe. */
  findAllAdmin() {
    return this.prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { donations: true, volunteer: true, partnerSeats: true } },
      },
    });
  }

  /**
   * Suppression d'un compte, à la demande de son titulaire.
   *
   * Le compte disparaît, mais pas ce qu'il rattachait : un don reste inscrit
   * à la comptabilité de l'association, une adhésion reste une adhésion. Les
   * liens sont donc détachés, pas les enregistrements supprimés — ce serait
   * effacer des écritures comptables sous couvert de droit à l'effacement.
   */
  async remove(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.donation.updateMany({ where: { accountId: id }, data: { accountId: null } }),
      this.prisma.volunteer.updateMany({ where: { accountId: id }, data: { accountId: null } }),
      this.prisma.member.updateMany({ where: { accountId: id }, data: { accountId: null } }),
      this.prisma.account.delete({ where: { id } }),
    ]);
  }

  // ── Interne ──────────────────────────────────────────────────────────────

  private profil(account: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
  }): AccountProfile {
    return { id: account.id, email: account.email, name: account.name, phone: account.phone };
  }

  /**
   * Relie au compte les envois faits sous la même adresse.
   *
   * Sans cela, une personne qui a postulé comme bénévole puis créé son compte
   * trouverait un espace vide et croirait sa candidature perdue. Le
   * rattachement se fait sur l'adresse, la seule donnée commune aux deux
   * moments — et uniquement vers un enregistrement encore libre.
   */
  private async rattacher(accountId: string, email: string): Promise<void> {
    await Promise.all([
      this.prisma.member.updateMany({
        where: { email, accountId: null },
        data: { accountId },
      }),
      this.prisma.volunteer.updateMany({
        where: { email, accountId: null },
        data: { accountId },
      }),
      this.prisma.donation.updateMany({
        where: { donorEmail: email, accountId: null },
        data: { accountId },
      }),
    ]);
  }

  private async issueTokens(accountId: string): Promise<AccountTokens> {
    const signer = (secret: 'jwt.accessSecret' | 'jwt.refreshSecret', ttl: 'jwt.accessTtl' | 'jwt.refreshTtl') =>
      this.jwt.signAsync(
        { sub: accountId },
        {
          secret: this.config.get(secret, { infer: true }),
          expiresIn: this.config.get(ttl, { infer: true }),
          audience: AUDIENCE_COMPTE,
        },
      );

    const [accessToken, refreshToken] = await Promise.all([
      signer('jwt.accessSecret', 'jwt.accessTtl'),
      signer('jwt.refreshSecret', 'jwt.refreshTtl'),
    ]);

    await this.prisma.account.update({
      where: { id: accountId },
      data: { refreshToken: await bcrypt.hash(refreshToken, 12) },
    });

    return { accessToken, refreshToken };
  }
}
