import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';

const programSelect = { select: { id: true, title: true, slug: true, shortLabel: true } } as const;

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic() {
    return this.prisma.campaign.findMany({
      where: { isActive: true },
      orderBy: [{ isUrgent: 'desc' }, { order: 'asc' }],
      include: { program: programSelect },
    });
  }

  findBySlugPublic(slug: string) {
    return this.prisma.campaign.findFirstOrThrow({
      where: { slug, isActive: true },
      include: { program: programSelect },
    });
  }

  findAllAdmin() {
    return this.prisma.campaign.findMany({
      orderBy: { order: 'asc' },
      include: { program: programSelect },
    });
  }

  create(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: { ...dto, slug: dto.slug ?? toSlug(dto.title) },
    });
  }

  update(id: string, dto: UpdateCampaignDto) {
    return this.prisma.campaign.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.campaign.delete({ where: { id } });
  }
}
