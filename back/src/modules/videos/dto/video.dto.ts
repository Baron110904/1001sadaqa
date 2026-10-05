import { PartialType } from '@nestjs/swagger';
import { VideoOrientation } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @MinLength(2, { message: 'Donnez un titre à la vidéo.' })
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  /** Adresse du fichier téléversé dans la médiathèque. */
  @IsString()
  @MinLength(1, { message: 'Téléversez la vidéo.' })
  url!: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsEnum(VideoOrientation)
  orientation?: VideoOrientation;

  /**
   * Durée en secondes.
   *
   * Le navigateur la lit dans le fichier au téléversement : l'association n'a
   * donc rien à compter. Elle reste modifiable, et vide elle n'affiche rien.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  place?: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateVideoDto extends PartialType(CreateVideoDto) {}
