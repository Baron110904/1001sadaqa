import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import { paginate } from '../../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateNewsDto, NewsQueryDto, UpdateNewsDto } from './dto/news.dto';

const publicWhere: Prisma.NewsWhereInput = {
  isPublished: true,
  publishedAt: { not: null },
};

const authorSelect = { select: { id: true, name: true } } as const;
const programSelect = { select: { id: true, title: true, slug: true, shortLabel: true } } as const;

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublic(query: NewsQueryDto) {
    const recherche = query.q?.trim();

    const where: Prisma.NewsWhereInput = {
      ...publicWhere,
      ...(query.category ? { category: query.category } : {}),
      // Le filtre par programme attendait ce lien : il existait dans
      // l'interface, sans rien pour le satisfaire côté données.
      ...(query.program ? { program: { slug: query.program } } : {}),
      // L'année se traduit en intervalle plutôt qu'en extraction de date :
      // c'est ce qui permet à l'index sur `publishedAt` d'être utilisé.
      ...(query.year
        ? {
            publishedAt: {
              gte: new Date(Date.UTC(query.year, 0, 1)),
              lt: new Date(Date.UTC(query.year + 1, 0, 1)),
            },
          }
        : {}),
      ...(recherche
        ? {
            OR: [
              { title: { contains: recherche, mode: 'insensitive' } },
              { excerpt: { contains: recherche, mode: 'insensitive' } },
              { content: { contains: recherche, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.news.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { author: authorSelect, program: programSelect },
      }),
      this.prisma.news.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  /**
   * Années de publication disponibles, pour la barre de filtres.
   *
   * On ne lit qu'une colonne de date et on regroupe en mémoire : c'est
   * négligeable même à plusieurs milliers d'articles, et cela évite une
   * requête SQL brute pour extraire l'année.
   */
  async findYearsPublic(): Promise<number[]> {
    const dates = await this.prisma.news.findMany({
      where: publicWhere,
      select: { publishedAt: true },
    });

    const annees = new Set<number>();
    for (const { publishedAt } of dates) {
      if (publishedAt) annees.add(publishedAt.getUTCFullYear());
    }

    return [...annees].sort((a, b) => b - a);
  }

  /** Article mis en avant du bloc « À la une » de la page /news. */
  async findFeaturedPublic() {
    return (
      (await this.prisma.news.findFirst({
        where: { ...publicWhere, isFeatured: true },
        orderBy: { publishedAt: 'desc' },
        include: { author: authorSelect, program: programSelect },
      })) ??
      this.prisma.news.findFirst({
        where: publicWhere,
        orderBy: { publishedAt: 'desc' },
        include: { author: authorSelect, program: programSelect },
      })
    );
  }

  findBySlugPublic(slug: string) {
    return this.prisma.news.findFirstOrThrow({
      where: { slug, ...publicWhere },
      include: { author: authorSelect, program: programSelect },
    });
  }

  findAllAdmin() {
    return this.prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: authorSelect, program: programSelect },
    });
  }

  create(dto: CreateNewsDto, user: AuthenticatedUser) {
    const isPublished = this.resolvePublication(dto.isPublished, user);

    return this.prisma.news.create({
      data: {
        ...dto,
        slug: dto.slug ?? toSlug(dto.title),
        authorId: user.id,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      include: { author: authorSelect, program: programSelect },
    });
  }

  async update(id: string, dto: UpdateNewsDto, user: AuthenticatedUser) {
    const existing = await this.prisma.news.findUniqueOrThrow({ where: { id } });

    // Un contributeur ne retouche que ses propres brouillons.
    if (user.role === Role.CONTRIBUTOR) {
      if (existing.authorId !== user.id) {
        throw new ForbiddenException('Vous ne pouvez modifier que vos propres contenus.');
      }
      if (existing.isPublished) {
        throw new ForbiddenException('Un contenu publié ne peut être modifié que par un éditeur.');
      }
    }

    const isPublished =
      dto.isPublished === undefined
        ? existing.isPublished
        : this.resolvePublication(dto.isPublished, user);

    return this.prisma.news.update({
      where: { id },
      data: {
        ...dto,
        isPublished,
        // La date de publication est posée une seule fois, au premier passage
        // en ligne, et conservée ensuite.
        publishedAt: isPublished ? (existing.publishedAt ?? new Date()) : null,
      },
      include: { author: authorSelect, program: programSelect },
    });
  }

  remove(id: string) {
    return this.prisma.news.delete({ where: { id } });
  }

  /**
   * Niveau 1 du workflow de validation : le contributeur rédige et soumet,
   * il ne publie pas.
   */
  private resolvePublication(requested: boolean | undefined, user: AuthenticatedUser): boolean {
    if (!requested) return false;

    if (user.role === Role.CONTRIBUTOR) {
      throw new ForbiddenException(
        'Votre rôle permet de soumettre un contenu, pas de le publier.',
      );
    }

    return true;
  }
}
