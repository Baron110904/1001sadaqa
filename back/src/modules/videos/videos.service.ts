import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVideoDto, UpdateVideoDto } from './dto/video.dto';

/**
 * Le titre du projet accompagne chaque vidéo côté public : la galerie annonce
 * « Projet lié : 1001 Iftar » sous le film. Sans cette jointure il faudrait
 * une seconde requête par vidéo, ou afficher un identifiant.
 */
const AVEC_PROJET = {
  project: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.VideoInclude;

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic() {
    return this.prisma.video.findMany({
      where: { isPublished: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: AVEC_PROJET,
    });
  }

  findAllAdmin() {
    return this.prisma.video.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: AVEC_PROJET,
    });
  }

  create(data: CreateVideoDto) {
    return this.prisma.video.create({ data: this.normaliser(data) });
  }

  update(id: string, data: UpdateVideoDto) {
    return this.prisma.video.update({ where: { id }, data: this.normaliser(data) });
  }

  remove(id: string) {
    return this.prisma.video.delete({ where: { id } });
  }

  /**
   * Un formulaire vide n'envoie pas « rien », il envoie une chaîne vide.
   *
   * Laissée telle quelle, elle devient un identifiant de projet introuvable et
   * l'enregistrement échoue sur une erreur de clé étrangère que l'association
   * ne peut pas interpréter. On la rend donc à ce qu'elle veut dire : aucun
   * projet rattaché.
   */
  private normaliser<T extends CreateVideoDto | UpdateVideoDto>(data: T): T {
    return { ...data, projectId: data.projectId || null } as T;
  }
}
