import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import { paginate } from '../../common/dto/pagination.dto';
import { CreateEventDto, EventQueryDto, UpdateEventDto } from './dto/event.dto';

const programSelect = { select: { id: true, title: true, slug: true } } as const;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Page de synthèse : tous les événements, tous programmes confondus. */
  async findAllPublic(query: EventQueryDto) {
    const where: Prisma.EventWhereInput = {
      isPublished: true,
      ...(query.program ? { program: { slug: query.program } } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.year
        ? {
            startDate: {
              gte: new Date(Date.UTC(query.year, 0, 1)),
              lt: new Date(Date.UTC(query.year + 1, 0, 1)),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { program: programSelect },
      }),
      this.prisma.event.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  findBySlugPublic(slug: string) {
    return this.prisma.event.findFirstOrThrow({
      where: { slug, isPublished: true },
      include: { program: programSelect },
    });
  }

  findAllAdmin() {
    return this.prisma.event.findMany({
      orderBy: { startDate: 'desc' },
      include: { program: programSelect },
    });
  }

  create(dto: CreateEventDto) {
    const { startDate, endDate, slug, ...rest } = dto;

    return this.prisma.event.create({
      data: {
        ...rest,
        slug: slug ?? toSlug(dto.title),
        startDate: new Date(startDate),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
      },
    });
  }

  update(id: string, dto: UpdateEventDto) {
    const { startDate, endDate, ...rest } = dto;

    return this.prisma.event.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined ? { startDate: new Date(startDate) } : {}),
        ...(endDate !== undefined ? { endDate: new Date(endDate) } : {}),
      },
    });
  }

  remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
}
