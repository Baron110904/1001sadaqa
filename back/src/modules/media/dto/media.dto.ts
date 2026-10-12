import { PartialType } from '@nestjs/swagger';
import {
  ConsentKind,
  ConsentScope,
  ConsentStatus,
  MediaBucket,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Les champs arrivent en multipart : tout est reçu en chaîne de caractères. */
const asArray = () =>
  Transform(({ value }: { value: unknown }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.length) {
      return value.split(',').map((part) => part.trim());
    }
    return [];
  });

const asBoolean = () =>
  Transform(({ value }: { value: unknown }) => value === true || value === 'true');

export class UploadMediaDto {
  @IsEnum(MediaBucket)
  bucket!: MediaBucket;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  credit?: string;

  @IsOptional()
  @asArray()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  capturedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  capturedPlace?: string;

  // ── Droit à l'image ──
  @IsOptional()
  @IsEnum(ConsentStatus)
  consentStatus?: ConsentStatus;

  @IsOptional()
  @IsEnum(ConsentKind)
  consentKind?: ConsentKind;

  @IsOptional()
  @asArray()
  @IsArray()
  @IsEnum(ConsentScope, { each: true })
  consentScopes?: ConsentScope[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  consentSignedBy?: string;

  @IsOptional()
  @asBoolean()
  @IsBoolean()
  consentIsGuardian?: boolean;

  @IsOptional()
  @IsDateString()
  consentSignedAt?: string;

  @IsOptional()
  @IsDateString()
  consentExpiresAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  consentNotes?: string;

  @IsOptional()
  @IsString()
  consentProofUrl?: string;

  @IsOptional()
  @asBoolean()
  @IsBoolean()
  showInGallery?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateMediaDto extends PartialType(UploadMediaDto) {}

/**
 * Demande d'une adresse d'envoi direct.
 *
 * Le navigateur annonce le nom, le type et la taille du fichier qu'il veut
 * déposer. Rien de tout cela n'est cru sur parole : le nom ne sert qu'à
 * choisir l'extension, et le type comme la taille sont relus auprès du
 * stockage une fois le dépôt terminé.
 */
export class PresignMediaDto {
  @IsEnum(MediaBucket)
  bucket!: MediaBucket;

  @IsString()
  @MaxLength(260)
  fileName!: string;

  @IsString()
  @MaxLength(120)
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  sizeBytes!: number;
}

/**
 * Enregistrement d'un fichier déjà déposé dans le stockage.
 *
 * `objectKey` et `url` sont ceux que l'API a elle-même produits à l'étape
 * précédente — le navigateur les rend tels quels. Les métadonnées de droits
 * sont reprises de `UploadMediaDto`, l'écran de la médiathèque étant le même.
 */
export class ConfirmMediaDto extends UploadMediaDto {
  @IsString()
  @MaxLength(400)
  objectKey!: string;

  @IsString()
  @MaxLength(600)
  url!: string;
}

export class MediaQueryDto {
  @IsOptional()
  @IsEnum(MediaBucket)
  bucket?: MediaBucket;

  @IsOptional()
  @IsEnum(ConsentStatus)
  consentStatus?: ConsentStatus;
}
