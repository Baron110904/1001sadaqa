import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import { CreateSeasonalDto, UpdateSeasonalDto } from './dto/seasonal.dto';

@Injectable()
export class SeasonalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * La campagne qui habille le site en ce moment, s'il y en a une.
   *
   * Trois conditions cumulées : l'interrupteur est armé, et la date du jour
   * tombe dans la période. La fin de période remet donc le site dans son état
   * normal sans aucune intervention — une campagne oubliée qui resterait
   * affichée en juillet coûterait plus en crédibilité qu'elle n'a rapporté.
   */
  findCurrent() {
    const maintenant = new Date();

    return this.prisma.seasonalCampaign.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: maintenant },
        endsAt: { gte: maintenant },
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  findAllAdmin() {
    return this.prisma.seasonalCampaign.findMany({ orderBy: { startsAt: 'desc' } });
  }

  async create(dto: CreateSeasonalDto) {
    await this.assertNoOverlap(dto.startsAt, dto.endsAt, dto.isActive);

    return this.prisma.seasonalCampaign.create({
      data: {
        ...dto,
        slug: dto.slug ?? toSlug(dto.name),
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  async update(id: string, dto: UpdateSeasonalDto) {
    const actuelle = await this.prisma.seasonalCampaign.findUniqueOrThrow({ where: { id } });
    const debut = dto.startsAt ?? actuelle.startsAt.toISOString();
    const fin = dto.endsAt ?? actuelle.endsAt.toISOString();
    const active = dto.isActive ?? actuelle.isActive;

    await this.assertNoOverlap(debut, fin, active, id);

    return this.prisma.seasonalCampaign.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startsAt ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.endsAt ? { endsAt: new Date(dto.endsAt) } : {}),
      },
    });
  }

  remove(id: string) {
    return this.prisma.seasonalCampaign.delete({ where: { id } });
  }

  /**
   * Deux campagnes ne peuvent pas habiller le site en même temps.
   *
   * Le contrôle est ici, côté serveur, et non dans l'écran d'administration :
   * une règle qui ne vivrait que dans le formulaire serait contournée par le
   * premier appel direct à l'API.
   */
  private async assertNoOverlap(
    debut: string | Date,
    fin: string | Date,
    active: boolean | undefined,
    exclureId?: string,
  ): Promise<void> {
    const depart = new Date(debut);
    const arrivee = new Date(fin);

    if (arrivee <= depart) {
      throw new BadRequestException('La date de fin doit suivre la date de début.');
    }

    if (!active) return;

    const chevauchement: Prisma.SeasonalCampaignWhereInput = {
      isActive: true,
      startsAt: { lte: arrivee },
      endsAt: { gte: depart },
      ...(exclureId ? { id: { not: exclureId } } : {}),
    };

    const conflit = await this.prisma.seasonalCampaign.findFirst({ where: chevauchement });
    if (conflit) {
      throw new BadRequestException(
        `La campagne « ${conflit.name} » couvre déjà cette période. Désactivez-la d'abord.`,
      );
    }
  }
}
