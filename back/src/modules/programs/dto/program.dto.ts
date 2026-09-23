import { PartialType } from '@nestjs/swagger';
import { ProgramStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  shortLabel!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  domainId?: string;

  // ── Rubriques de la fiche programme (§4.4) ──
  // Des champs distincts plutôt qu'un bloc de texte libre : c'est ce qui
  // garantit que les huit fiches se ressemblent, quel que soit le rédacteur.

  /** Le défi auquel le programme répond. */
  @IsOptional()
  @IsString()
  context?: string;

  /** Ce que le programme vise. */
  @IsOptional()
  @IsString()
  objectives?: string;

  /** Qui est accompagné, selon quels critères. */
  @IsOptional()
  @IsString()
  audience?: string;

  /** Ce qui est concrètement mis en œuvre, une entrée par activité. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];

  /** Ce que le programme doit produire. */
  @IsOptional()
  @IsString()
  outcomes?: string;

  /**
   * Avancement du programme, filtré par la page publique.
   *
   * À ne pas confondre avec `isActive`, qui décide de la publication : un
   * programme en préparation reste visible du public.
   */
  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProgramDto extends PartialType(CreateProgramDto) {}
