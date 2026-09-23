import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic() {
    return this.prisma.program.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        domain: true,
        _count: { select: { projects: { where: { isPublished: true } } } },
      },
    });
  }

  findBySlugPublic(slug: string) {
    return this.prisma.program.findFirstOrThrow({
      where: { slug, isActive: true },
      include: {
        domain: true,
        projects: {
          where: { isPublished: true },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
          include: { impacts: { orderBy: { isPrimary: 'desc' } } },
        },
        events: {
          where: { isPublished: true },
          orderBy: { startDate: 'desc' },
        },
      },
    });
  }

  findAllAdmin() {
    return this.prisma.program.findMany({
      orderBy: { order: 'asc' },
      include: { domain: true, _count: { select: { projects: true, events: true } } },
    });
  }

  create(dto: CreateProgramDto) {
    return this.prisma.program.create({
      data: { ...dto, slug: dto.slug ?? toSlug(dto.title) },
    });
  }

  update(id: string, dto: UpdateProgramDto) {
    return this.prisma.program.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.program.delete({ where: { id } });
  }
}
