import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import {
  CreateVolunteerDto,
  CreateVolunteerMissionDto,
  UpdateVolunteerDto,
  UpdateVolunteerMissionDto,
} from './dto/volunteer.dto';

@Injectable()
export class VolunteersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Missions ouvertes ────────────────────────────────────────────────────
  findMissionsPublic() {
    return this.prisma.volunteerMission.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findMissionsAdmin() {
    return this.prisma.volunteerMission.findMany({ orderBy: { order: 'asc' } });
  }

  createMission(dto: CreateVolunteerMissionDto) {
    return this.prisma.volunteerMission.create({
      data: { ...dto, slug: dto.slug ?? toSlug(dto.title) },
    });
  }

  updateMission(id: string, dto: UpdateVolunteerMissionDto) {
    return this.prisma.volunteerMission.update({ where: { id }, data: dto });
  }

  removeMission(id: string) {
    return this.prisma.volunteerMission.delete({ where: { id } });
  }

  // ── Candidatures ─────────────────────────────────────────────────────────
  async create(dto: CreateVolunteerDto) {
    if (dto.missionId) {
      const mission = await this.prisma.volunteerMission.findUnique({
        where: { id: dto.missionId },
        select: { isActive: true },
      });
      if (!mission?.isActive) {
        throw new BadRequestException("Cette mission n'est plus ouverte.");
      }
    }

    const volunteer = await this.prisma.volunteer.create({
      data: { ...dto, skills: dto.skills ?? [] },
    });

    return { id: volunteer.id, success: true as const };
  }

  async findAll(query: PaginationDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.volunteer.findMany({
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { mission: { select: { id: true, title: true, slug: true } } },
      }),
      this.prisma.volunteer.count(),
    ]);

    return paginate(items, total, query);
  }

  update(id: string, dto: UpdateVolunteerDto) {
    return this.prisma.volunteer.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.volunteer.delete({ where: { id } });
  }
}
