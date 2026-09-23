import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AppConfig } from '../../config/configuration';
import { AUDIENCE_COMPTE } from './accounts.service';

/** Ce que porte la requête une fois le compte identifié. */
export interface AuthenticatedAccount {
  id: string;
  email: string;
  name: string;
}

/**
 * Stratégie des comptes publics, distincte de celle de l'administration.
 *
 * Deux garde-fous se cumulent : l'audience du jeton doit être celle des
 * comptes, et le porteur est cherché dans la table `accounts`. Un jeton
 * d'administration ne peut donc pas ouvrir un espace personnel, ni l'inverse.
 */
@Injectable()
export class AccountJwtStrategy extends PassportStrategy(Strategy, 'jwt-account') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt.accessSecret', { infer: true }),
      audience: AUDIENCE_COMPTE,
    });
  }

  async validate(payload: { sub: string }): Promise<AuthenticatedAccount> {
    const account = await this.prisma.account.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!account?.isActive) throw new UnauthorizedException('Session invalide.');

    return { id: account.id, email: account.email, name: account.name };
  }
}
