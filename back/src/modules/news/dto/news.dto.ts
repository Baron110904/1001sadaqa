import { PartialType } from '@nestjs/swagger';
import { NewsCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class NewsQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(NewsCategory)
  category?: NewsCategory;

  /** Slug du programme dont l'article rend compte. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  program?: string;

  /**
   * Recherche par mots-clés dans le titre, le chapô et le corps.
   *
   * Longueur bornée : une recherche n'a pas besoin de plus, et cela évite
   * qu'une chaîne démesurée fasse travailler la base pour rien.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  /** Année de publication. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}

export class CreateNewsDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  @MinLength(20)
  content!: string;

  @IsOptional()
  @IsString()
  image?: string;

  /** Légende de l'image à la une. */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  imageCaption?: string;

  /**
   * Crédit photo.
   *
   * Obligatoire dès qu'une photo n'est pas de l'association : publier sans
   * créditer expose l'association, et prive l'auteur de ce qui lui revient.
   */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  imageCredit?: string;

  /** Programme dont l'article rend compte. Alimente le filtre de la liste. */
  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @IsEnum(NewsCategory)
  category?: NewsCategory;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
