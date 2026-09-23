import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { DonationsService } from './donations.service';
import { CreateDonationDto, UpdateDonationDto } from './dto/donation.dto';

@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donations: DonationsService) {}

  @Public()
  @Throttle({ default: { limit: 6, ttl: 300_000 } })
  @Post()
  create(@Body() dto: CreateDonationDto) {
    return this.donations.create(dto);
  }

  /**
   * Confirmation d'un don au retour de la page de règlement.
   *
   * Publique, et sans danger : elle ne reçoit aucun état, elle le demande à
   * FedaPay avec la référence que nous avons nous-mêmes enregistrée. Un appel
   * anonyme ne peut donc que déclencher une vérification, jamais décréter
   * qu'un don est encaissé.
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post(':id/confirmer')
  confirmer(@Param('id') id: string) {
    return this.donations.confirmer(id);
  }

  /**
   * Notifications de FedaPay.
   *
   * Publique par nécessité — c'est FedaPay qui appelle — mais protégée par la
   * signature de l'en-tête, vérifiée avant toute lecture du contenu. Sans
   * secret de webhook enregistré, aucune notification n'est acceptée : mieux
   * vaut n'en traiter aucune que d'en traiter une forgée.
   *
   * Le corps brut est requis : la signature porte sur les octets reçus, pas
   * sur l'objet analysé.
   */
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post('webhook/fedapay')
  async webhook(@Req() requete: RawBodyRequest<Request>) {
    await this.donations.traiterNotification(
      requete.rawBody?.toString('utf8') ?? '',
      requete.headers['x-fedapay-signature'] as string | undefined,
    );
    return { recu: true };
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.donations.findAll(query);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('stats')
  stats() {
    return this.donations.stats();
  }

  /**
   * Confirmation ou échec d'un don, depuis le back-office. Il n'existe
   * volontairement pas de route publique de confirmation : tant qu'aucune
   * signature de fournisseur n'est vérifiée, un appel anonyme pourrait
   * marquer n'importe quel don comme encaissé.
   */
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDonationDto) {
    return this.donations.update(id, dto);
  }
}
