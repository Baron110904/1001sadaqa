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

  /** Seau unique, quand le stockage n'en publie qu'une adresse. Sinon vide. */
  private readonly seauUnique: string;
  private readonly peutPoserLaPolice: boolean;

  constructor(config: ConfigService<AppConfig, true>) {
    const storage = config.get('storage', { infer: true });

    this.client = new Client({
      endPoint: storage.endpoint,
      port: storage.port,
      useSSL: storage.useSSL,
      accessKey: storage.accessKey,
      secretKey: storage.secretKey,
      // Omise plutôt que laissée vide : le client refuse une région vide.
      ...(storage.region ? { region: storage.region } : {}),
    });
    this.publicUrl = storage.publicUrl.replace(/\/$/, '');
    this.seauUnique = storage.bucket;
    this.peutPoserLaPolice = storage.canSetPolicy;
  }

  /**
   * Les seaux à créer au démarrage.
   *
   * Un seul en mode seau unique, les huit usages sinon.
   */
  private seauxAPreparer(): string[] {
    return this.seauUnique ? [this.seauUnique] : Object.values(BUCKET_NAMES);
  }

  async onModuleInit(): Promise<void> {
    // Le stockage ne doit pas empêcher l'API de démarrer : le site public
    // n'en dépend pas, seule la Media Library le fait.
    //
    // Chaque seau est traité à part. Un seul `try` autour de la boucle
    // laissait une erreur sur le premier seau empêcher la création des sept
    // suivants, sans que rien ne le dise — exactement ce qui arrive sur R2,
    // qui refuse la police de lecture.
    for (const bucket of this.seauxAPreparer()) {
      try {
        if (!(await this.client.bucketExists(bucket))) {
          await this.client.makeBucket(bucket);
        }
      } catch (error) {
        this.logger.warn(`Seau « ${bucket} » indisponible : ${this.dire(error)}`);
        continue;
      }

      if (!this.peutPoserLaPolice) continue;

      try {
        await this.client.setBucketPolicy(bucket, readOnlyPolicy(bucket));
      } catch (error) {
        // Sur un stockage sans police — R2 — l'accès public se règle hors de
        // l'API. L'échec est donc attendu et ne doit pas inquiéter.
        this.logger.warn(
          `Police de lecture refusée sur « ${bucket} » : ${this.dire(error)}. ` +
            'Ouvrez l’accès public depuis le tableau de bord du stockage.',
        );
      }
    }
  }

  private dire(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  async put(
    bucket: MediaBucket,
    objectKey: string,
    body: Buffer,
    mimeType: string,
  ): Promise<{ objectKey: string; url: string }> {
    const usage = BUCKET_NAMES[bucket];
    // Le chemin rangé en base et l'adresse publique ne changent pas d'un mode
    // à l'autre : « programs/photo.jpg » désigne soit le seau `programs`,
    // soit le préfixe `programs/` du seau unique. Les médias déjà enregistrés
    // restent donc joignables après la bascule, sans reprise de données.
    const { seau, cle } = this.ou(usage, objectKey);

    await this.client.putObject(seau, cle, body, body.length, {
      'Content-Type': mimeType,
    });

    return {
      objectKey: `${usage}/${objectKey}`,
      url: `${this.publicUrl}/${usage}/${objectKey}`,
    };
  }

  async remove(objectKey: string): Promise<void> {
    const [usage, ...reste] = objectKey.split('/');
    const { seau, cle } = this.ou(usage, reste.join('/'));
    await this.client.removeObject(seau, cle);
  }

  /**
   * Adresse d'envoi signée, valable un temps limité.
   *
   * Elle permet au navigateur de déposer le fichier **directement** dans le
   * stockage, sans le faire traverser le site ni l'API. C'est le seul moyen
   * d'envoyer une vidéo depuis un hébergement qui plafonne la taille des
   * requêtes — Vercel s'arrête à 4,5 Mo, et le fichier ne l'atteint jamais.
   *
   * Un quart d'heure de validité : assez pour un envoi lent depuis Cotonou,
   * assez peu pour qu'une adresse échappée ne serve pas longtemps.
   */
  async presignerEnvoi(
    bucket: MediaBucket,
    objectKey: string,
  ): Promise<{ adresseDEnvoi: string; objectKey: string; url: string }> {
    const usage = BUCKET_NAMES[bucket];
    const { seau, cle } = this.ou(usage, objectKey);

    return {
      adresseDEnvoi: await this.client.presignedPutObject(seau, cle, 15 * 60),
      objectKey: `${usage}/${objectKey}`,
      url: `${this.publicUrl}/${usage}/${objectKey}`,
    };
  }

  /**
   * Ce que le stockage dit réellement d'un objet : taille et type.
   *
   * Indispensable après un envoi direct : le fichier n'a pas traversé l'API,
   * qui ne peut donc rien affirmer sur lui. Croire ce que le navigateur
   * déclare permettrait d'enregistrer une vidéo de 300 Mo annoncée à 2 Mo, ou
   * un exécutable annoncé en image.
   */
  async decrire(
    objectKey: string,
  ): Promise<{ sizeBytes: number; mimeType: string } | null> {
    const [usage, ...reste] = objectKey.split('/');
    const { seau, cle } = this.ou(usage, reste.join('/'));

    try {
      const info = await this.client.statObject(seau, cle);
      return {
        sizeBytes: info.size,
        mimeType: String(info.metaData?.['content-type'] ?? 'application/octet-stream'),
      };
    } catch {
      // Objet absent : l'envoi n'a pas abouti, ou la clé est inventée.
      return null;
    }
  }

  /** Où ranger un objet : seau et clé, selon le mode de stockage. */
  private ou(usage: string, objectKey: string): { seau: string; cle: string } {
    return this.seauUnique
      ? { seau: this.seauUnique, cle: `${usage}/${objectKey}` }
      : { seau: usage, cle: objectKey };
  }
}
