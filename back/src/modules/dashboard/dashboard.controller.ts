import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /**
   * Vue d'ensemble du back-office.
   *
   * Ouverte aux trois rôles : le contenu de la réponse, lui, est filtré selon
   * le rôle par le service — un contributeur ne reçoit pas les chiffres de
   * collecte.
   */
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONTRIBUTOR)
  @Get()
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboard.overview(user);
  }
}
