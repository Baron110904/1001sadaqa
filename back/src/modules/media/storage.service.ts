import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaBucket } from '@prisma/client';
import { Client } from 'minio';
import type { AppConfig } from '../../config/configuration';

// Un bucket par usage, comme prévu au cahier des charges (§ 4.5).
const BUCKET_NAMES: Record<MediaBucket, string> = {
  [MediaBucket.BRAND]: 'brand',
  [MediaBucket.PROGRAMS]: 'programs',
  [MediaBucket.PROJECTS]: 'projects',
  [MediaBucket.NEWS]: 'news',
  [MediaBucket.TESTIMONIALS]: 'testimonials',
  [MediaBucket.PARTNERS]: 'partners',
  [MediaBucket.FIELD]: 'field',
  [MediaBucket.DOCUMENTS]: 'documents',
};

/**
 * Lecture des objets ouverte, listing fermé.
 *
 * Un visuel affiché sur le site doit être joignable par le navigateur de
 * n'importe quel visiteur : sans cette règle, le stockage répond « accès
 * refusé » et les images téléversées depuis le back-office n'apparaissent
 * jamais. On n'autorise que `GetObject` : le contenu d'un bucket reste
 * impossible à énumérer.
 */
function readOnlyPolicy(bucket: string): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Client;
  private readonly publicUrl: string;

  constructor(config: ConfigService<AppConfig, true>) {
    const storage = config.get('storage', { infer: true });

    this.client = new Client({
      endPoint: storage.endpoint,
      port: storage.port,
      useSSL: storage.useSSL,
      accessKey: storage.accessKey,
      secretKey: storage.secretKey,
    });
    this.publicUrl = storage.publicUrl.replace(/\/$/, '');
  }

  async onModuleInit(): Promise<void> {
    // Le stockage ne doit pas empêcher l'API de démarrer : le site public
    // n'en dépend pas, seule la Media Library le fait.
    try {
      for (const bucket of Object.values(BUCKET_NAMES)) {
        if (!(await this.client.bucketExists(bucket))) {
          await this.client.makeBucket(bucket);
        }
        await this.client.setBucketPolicy(bucket, readOnlyPolicy(bucket));
      }
    } catch (error) {
      this.logger.warn(
        `Stockage S3/MinIO injoignable — les envois de médias échoueront : ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async put(
    bucket: MediaBucket,
    objectKey: string,
    body: Buffer,
    mimeType: string,
  ): Promise<{ objectKey: string; url: string }> {
    const bucketName = BUCKET_NAMES[bucket];
    await this.client.putObject(bucketName, objectKey, body, body.length, {
      'Content-Type': mimeType,
    });

    return {
      objectKey: `${bucketName}/${objectKey}`,
      url: `${this.publicUrl}/${bucketName}/${objectKey}`,
    };
  }

  async remove(objectKey: string): Promise<void> {
    const [bucketName, ...rest] = objectKey.split('/');
    await this.client.removeObject(bucketName, rest.join('/'));
  }
}
