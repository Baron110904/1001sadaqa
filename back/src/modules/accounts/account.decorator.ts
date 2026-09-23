import { createParamDecorator, ExecutionContext, UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedAccount } from './account-jwt.strategy';

/**
 * Protège une route par un compte public.
 *
 * `@Public()` est appliqué en premier pour écarter la garde globale du
 * back-office : sans lui, la route exigerait *aussi* un jeton
 * d'administration, et aucun visiteur ne pourrait jamais l'atteindre.
 */
export const CompteRequis = () =>
  applyDecorators(Public(), UseGuards(AuthGuard('jwt-account')));

export const CurrentAccount = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedAccount =>
    ctx.switchToHttp().getRequest<{ user: AuthenticatedAccount }>().user,
);
