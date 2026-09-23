import { PartialType } from '@nestjs/swagger';
import { BudgetVisibility, ProjectStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  Max,
  Min,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ProjectQueryDto extends PaginationDto {
  /** Slug de programme, pour les puces de filtre de la page /projects. */
  @IsOptional()
  @IsString()
  program?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsString()
  content?: string;

  // ── Rubriques de la fiche projet (§5.4) ──

  /** Le besoin auquel le projet répond. */
  @IsOptional()
  @IsString()
  problem?: string;

  /** Ce que le projet vise à produire. */
  @IsOptional()
  @IsString()
  objectives?: string;

  /** Nombre et profil des personnes touchées. */
  @IsOptional()
  @IsString()
  audience?: string;

  /**
   * Visibilité du budget.
   *
   * Le dossier institutionnel écrit « budget disponible » sans publier de
   * montant : certains chiffres sont communicables à tous, d'autres aux seuls
   * partenaires, d'autres pas du tout. Masqué par défaut.
   */
  @IsOptional()
  @IsEnum(BudgetVisibility)
  budgetVisibility?: BudgetVisibility;

  /** Pourcentage de réalisation ou de financement. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsDateString()
  progressAt?: string;

  /** Numéros des ODD auxquels le projet contribue. */
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  sdgs?: number[];

  /** Visible du public. Distinct de l'état d'avancement ci-dessus. */
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsString()
  programId!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  /** Vidéos de terrain : une adresse par ligne. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class CreateImpactDto {
  @IsString()
  @MinLength(2)
  indicator!: string;

  @IsString()
  @MinLength(1)
  value!: string;

  @IsDateString()
  period!: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
