import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import { paginate } from '../../common/dto/pagination.dto';
import {
  CreateImpactDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';

// La visibilité ne se déduit plus de l'état d'avancement : un projet « à
// financer » a vocation à être montré, un projet réalisé aussi. Seul
// `isPublished` décide (§5.2).
const publicWhere: Prisma.ProjectWhereInput = { isPublished: true };

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublic(query: ProjectQueryDto) {
    const where: Prisma.ProjectWhereInput = {
      ...publicWhere,
      ...(query.program ? { program: { slug: query.program } } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip: query.skip,
        take: query.limit,
        include: {
          program: { select: { id: true, title: true, slug: true, shortLabel: true } },
          impacts: { orderBy: [{ isPrimary: 'desc' }, { period: 'desc' }] },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  findBySlugPublic(slug: string) {
    return this.prisma.project.findFirstOrThrow({
      where: { slug, ...publicWhere },
      include: {
        program: { select: { id: true, title: true, slug: true, shortLabel: true } },
        impacts: { orderBy: [{ isPrimary: 'desc' }, { period: 'desc' }] },
        // Seuls les documents publics : un document réservé aux partenaires
        // n'a rien à faire sur une page ouverte à tous.
        documents: {
          where: { isActive: true, visibility: 'PUBLIC' },
          orderBy: { order: 'asc' },
          select: { id: true, title: true, fileUrl: true, fileType: true, fileSize: true },
        },
      },
    });
  }

  findAllAdmin() {
    return this.prisma.project.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        program: { select: { id: true, title: true, slug: true } },
        // Les impacts accompagnent la liste : le back-office les édite depuis
        // la fiche du projet, sans second appel.
        impacts: { orderBy: [{ isPrimary: 'desc' }, { period: 'desc' }] },
      },
    });
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { ...dto, slug: dto.slug ?? toSlug(dto.title) },
    });
  }

  update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  async addImpact(projectId: string, dto: CreateImpactDto) {
    // Un seul indicateur mis en avant par projet : celui affiché sur la carte.
    if (dto.isPrimary) {
      await this.prisma.impact.updateMany({
        where: { projectId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.impact.create({ data: { ...dto, projectId } });
  }

  removeImpact(impactId: string) {
    return this.prisma.impact.delete({ where: { id: impactId } });
  }
}
