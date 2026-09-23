import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConsentScope, ConsentStatus, type MediaAsset, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { toSlug } from '../../common/slug';
import { StorageService } from './storage.service';
import { MediaQueryDto, UpdateMediaDto, UploadMediaDto } from './dto/media.dto';

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'video/mp4',
  'application/pdf',
];

const MAX_BYTES = 25 * 1024 * 1024;

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Galerie publique. Un média n'y apparaît que si son consentement est
   * accordé, couvre l'usage web et n'a pas expiré. Le contrôle est ici, côté
   * serveur : cocher « afficher dans la galerie » dans l'interface ne suffit
   * pas à publier un visuel non couvert.
   */
  findGalleryPublic() {
    return this.prisma.mediaAsset.findMany({
      where: {
        showInGallery: true,
        ...this.publishableWhere(),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        url: true,
        altText: true,
        title: true,
        credit: true,
        width: true,
        height: true,
        capturedPlace: true,
      },
    });
  }

  findAllAdmin(query: MediaQueryDto) {
    return this.prisma.mediaAsset.findMany({
      where: {
        ...(query.bucket ? { bucket: query.bucket } : {}),
        ...(query.consentStatus ? { consentStatus: query.consentStatus } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
  }

  async upload(file: UploadedFile, dto: UploadMediaDto, userId: string): Promise<MediaAsset> {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(`Type de fichier non accepté : ${file.mimetype}.`);
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Fichier trop volumineux (25 Mo maximum).');
    }

    const objectKey = this.buildObjectKey(file.originalname);
    const stored = await this.storage.put(dto.bucket, objectKey, file.buffer, file.mimetype);

    const asset = await this.prisma.mediaAsset.create({
      data: {
        ...this.toData(dto),
        bucket: dto.bucket,
        objectKey: stored.objectKey,
        url: stored.url,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById: userId,
      },
    });

    // Si le média a été demandé en galerie sans consentement valide, on le
    // retire de la galerie plutôt que d'échouer après écriture.
    if (asset.showInGallery && !this.isPublishable(asset)) {
      return this.prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { showInGallery: false },
      });
    }

    return asset;
  }

  async update(id: string, dto: UpdateMediaDto): Promise<MediaAsset> {
    const current = await this.prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
    const next = { ...current, ...this.toData(dto) };

    if (next.showInGallery) this.assertPublishable(next);

    return this.prisma.mediaAsset.update({ where: { id }, data: this.toData(dto) });
  }

  async remove(id: string): Promise<{ success: true }> {
    const asset = await this.prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
    await this.storage.remove(asset.objectKey);
    await this.prisma.mediaAsset.delete({ where: { id } });
    return { success: true };
  }

  /** Compteurs du tableau de bord : ce qui manque en matière de droits. */
  consentReport() {
    return this.prisma.mediaAsset.groupBy({
      by: ['consentStatus'],
      _count: true,
    });
  }

  private assertPublishable(asset: {
    consentStatus: ConsentStatus;
    consentScopes: ConsentScope[];
    consentExpiresAt: Date | null;
  }): void {
    if (asset.consentStatus !== ConsentStatus.GRANTED) {
      throw new UnprocessableEntityException(
        'Publication refusée : le consentement n’est pas accordé pour ce média.',
      );
    }
    if (!asset.consentScopes.includes(ConsentScope.WEB)) {
      throw new UnprocessableEntityException(
        'Publication refusée : le consentement ne couvre pas l’usage web.',
      );
    }
    if (asset.consentExpiresAt && asset.consentExpiresAt.getTime() < Date.now()) {
      throw new UnprocessableEntityException(
        'Publication refusée : l’autorisation d’utilisation a expiré.',
      );
    }
  }

  private isPublishable(asset: {
    consentStatus: ConsentStatus;
    consentScopes: ConsentScope[];
    consentExpiresAt: Date | null;
  }): boolean {
    try {
      this.assertPublishable(asset);
      return true;
    } catch {
      return false;
    }
  }

  private publishableWhere(): Prisma.MediaAssetWhereInput {
    return {
      consentStatus: ConsentStatus.GRANTED,
      consentScopes: { has: ConsentScope.WEB },
      OR: [{ consentExpiresAt: null }, { consentExpiresAt: { gt: new Date() } }],
    };
  }

  private buildObjectKey(originalName: string): string {
    const dot = originalName.lastIndexOf('.');
    const base = dot > 0 ? originalName.slice(0, dot) : originalName;
    const ext = dot > 0 ? originalName.slice(dot).toLowerCase() : '';
    return `${toSlug(base) || 'media'}-${randomUUID().slice(0, 8)}${ext}`;
  }

  /** Convertit les dates ISO reçues en multipart et écarte `bucket`. */
  private toData(dto: UpdateMediaDto) {
    const { bucket: _bucket, capturedAt, consentSignedAt, consentExpiresAt, ...rest } = dto;

    return {
      ...rest,
      ...(capturedAt !== undefined ? { capturedAt: new Date(capturedAt) } : {}),
      ...(consentSignedAt !== undefined ? { consentSignedAt: new Date(consentSignedAt) } : {}),
      ...(consentExpiresAt !== undefined
        ? { consentExpiresAt: new Date(consentExpiresAt) }
        : {}),
    };
  }
}
