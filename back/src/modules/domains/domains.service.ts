import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import { CreateDomainDto, UpdateDomainDto } from './dto/domain.dto';

@Injectable()
export class DomainsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Les quatre domaines avec leurs programmes.
   *
   * C'est la lecture qui alimente la page Programmes : le guide demande que
   * tous les domaines soient visibles d'emblée et que rien ne soit masqué au
   * robot d'indexation (§4.2.1), donc on renvoie l'arbre complet en une fois
   * plutôt qu'un chargement par domaine au dépliage.
   */
  findAllPublic() {
    return this.prisma.domain.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        programs: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { projects: { where: { isPublished: true } } } },
          },
        },
      },
    });
  }

  findBySlugPublic(slug: string) {
    return this.prisma.domain.findFirstOrThrow({
      where: { slug, isActive: true },
      include: {
        programs: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { projects: { where: { isPublished: true } } } },
          },
        },
      },
    });
  }

  findAllAdmin() {
    return this.prisma.domain.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { programs: true } } },
    });
  }

  create(dto: CreateDomainDto) {
    return this.prisma.domain.create({
      data: { ...dto, slug: dto.slug ?? toSlug(dto.name) },
    });
  }

  update(id: string, dto: UpdateDomainDto) {
    return this.prisma.domain.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.domain.delete({ where: { id } });
  }
}
