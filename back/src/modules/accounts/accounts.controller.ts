import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccountsService } from './accounts.service';
import { CompteRequis, CurrentAccount } from './account.decorator';
import type { AuthenticatedAccount } from './account-jwt.strategy';
import {
  LoginAccountDto,
  RefreshAccountDto,
  RegisterAccountDto,
  UpdateProfileDto,
} from './dto/account.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  /**
   * Création de compte, limitée à cinq par minute et par adresse IP.
   *
   * Sans cette limite, la table se remplirait en quelques secondes, et chaque
   * création coûte un hachage bcrypt — de quoi saturer le serveur à peu de
   * frais.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(201)
  @Post('register')
  register(@Body() dto: RegisterAccountDto) {
    return this.accounts.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginAccountDto) {
    return this.accounts.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshAccountDto) {
    return this.accounts.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @CompteRequis()
  @HttpCode(200)
  @Post('logout')
  logout(@CurrentAccount() compte: AuthenticatedAccount) {
    return this.accounts.logout(compte.id);
  }

  @ApiBearerAuth()
  @CompteRequis()
  @Get('me')
  me(@CurrentAccount() compte: AuthenticatedAccount) {
    return compte;
  }

  /** Dons, adhésion, cotisations et candidatures de la personne connectée. */
  @ApiBearerAuth()
  @CompteRequis()
  @Get('me/overview')
  overview(@CurrentAccount() compte: AuthenticatedAccount) {
    return this.accounts.overview(compte.id);
  }

  @ApiBearerAuth()
  @CompteRequis()
  @Patch('me')
  updateProfile(@CurrentAccount() compte: AuthenticatedAccount, @Body() dto: UpdateProfileDto) {
    return this.accounts.updateProfile(compte.id, dto);
  }

  // ── Administration ───────────────────────────────────────────────────────
  //
  // Déclarées après les routes `me/…` : Nest retient la première qui
  // correspond, et `:id` capturerait « me » s'il venait avant.

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get()
  findAllAdmin() {
    return this.accounts.findAllAdmin();
  }

  /**
   * Suppression d'un compte, à la demande de son titulaire.
   *
   * Réservée à l'administration, et volontairement pas ouverte en libre
   * service : la personne écrit, l'association vérifie qu'il s'agit bien
   * d'elle, puis supprime. Un bouton « supprimer mon compte » atteignable
   * depuis une session volée effacerait l'accès de quelqu'un à ses propres
   * traces.
   */
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accounts.remove(id);
  }
}
