import { PartialType } from '@nestjs/swagger';
import { EventKind, Recurrence } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class EventQueryDto extends PaginationDto {
  /** Slug de programme, pour la page de synthèse des événements. */
  @IsOptional()
  @IsString()
  program?: string;

  @IsOptional()
  @IsEnum(EventKind)
  kind?: EventKind;

  /** Année de l'événement, pour retrouver une édition passée. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;
}

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  programId?: string;

  @IsDateString()
  startDate!: string;

  /** Renseignée lorsque l'événement s'étend sur une période. */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  location!: string;

  @IsOptional()
  @IsEnum(EventKind)
  kind?: EventKind;

  @IsString()
  @MinLength(10)
  description!: string;

  /** Ce que l'événement a produit : bénéficiaires touchés, quantités. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  figures?: string[];

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  /**
   * Relie les éditions successives d'un rendez-vous.
   *
   * 1001 Iftar et Tabaski solidaire reviennent chaque année : c'est ce champ
   * qui permet au visiteur de retrouver l'historique des éditions depuis la
   * page de campagne (§4.5).
   */
  @IsOptional()
  @IsEnum(Recurrence)
  recurrence?: Recurrence;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
