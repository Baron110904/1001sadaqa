import { PartialType } from '@nestjs/swagger';
import { MovementDirection } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  /** Unité affichée : kg, L, unités… */
  @IsOptional()
  @IsString()
  @MaxLength(12)
  unit?: string;

  /** Exemples de denrées attendues, affichés sous la carte de besoin. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  examples?: string;

  /** Niveau visé, dénominateur de l'affichage « 180 sur 250 ». */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  target?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lowLevel?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  criticalLevel?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CreateMovementDto {
  @IsString()
  categoryId!: string;

  @IsEnum(MovementDirection)
  direction!: MovementDirection;

  /**
   * Toujours positive : c'est `direction` qui porte le sens. Accepter un
   * nombre négatif permettrait d'écrire une entrée qui retire du stock.
   */
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'La quantité doit être supérieure à zéro.' })
  quantity!: number;

  /** Qui donne, pour une entrée ; qui reçoit, pour une sortie. */
  @IsString()
  @MinLength(2, { message: 'Indiquez le donateur ou le bénéficiaire.' })
  @MaxLength(160)
  counterpart!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  detail?: string;

  /** Personnes servies par une sortie. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peopleServed?: number;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

/**
 * Correction d'un mouvement déjà inscrit.
 *
 * Corriger une ligne du registre est de la tenue de comptes ordinaire — un nom
 * mal orthographié, une quantité mal relevée. Ce qui était exclu, et le reste,
 * c'est de stocker le niveau de stock : il demeure la somme des mouvements, et
 * toute correction se répercute donc d'elle-même.
 */
export class UpdateMovementDto extends PartialType(CreateMovementDto) {}
