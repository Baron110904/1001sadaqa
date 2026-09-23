import { FoodbankRequestKind, FoodbankRequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Dépôt d'une demande depuis le site : apporter une denrée, ou en recevoir.
 *
 * La cohérence entre le sens de la demande et l'article visé n'est pas
 * vérifiable champ par champ — un retrait exige une catégorie, un don peut
 * s'en passer. Le service s'en charge, là où les deux valeurs se voient
 * ensemble.
 */
export class CreateFoodbankRequestDto {
  @IsEnum(FoodbankRequestKind)
  kind!: FoodbankRequestKind;

  @IsString()
  @MinLength(2, { message: 'Indiquez votre nom.' })
  @MaxLength(160)
  name!: string;

  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  /**
   * Anonymat **public**.
   *
   * Le nom disparaît du classement des donateurs, pas des registres de
   * l'association : il lui faut pouvoir recontacter la personne et rendre
   * compte de ce qui est entré et sorti.
   */
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  /** Omis quand le donateur apporte un article hors liste. */
  @IsOptional()
  @IsString()
  categoryId?: string;

  /** Nom de l'article, quand il ne figure pas encore dans les catégories. */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  otherLabel?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1, { message: 'Indiquez une quantité.' })
  quantity!: number;

  /** Unité de l'article hors liste ; sinon celle de la catégorie fait foi. */
  @IsOptional()
  @IsString()
  @MaxLength(12)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

/**
 * Traitement d'une demande au back-office.
 *
 * La catégorie est modifiable : un don hors liste arrive sans catégorie, et
 * il faut lui en donner une avant de pouvoir compter quoi que ce soit.
 */
export class UpdateFoodbankRequestDto {
  @IsOptional()
  @IsEnum(FoodbankRequestStatus)
  status?: FoodbankRequestStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  quantity?: number;
}

export class CreateFoodbankCommentDto {
  @IsString()
  @MinLength(2, { message: 'Indiquez votre nom.' })
  @MaxLength(120)
  authorName!: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsString()
  @MinLength(10, { message: 'Votre mot est un peu court.' })
  @MaxLength(1000)
  message!: string;
}

export class UpdateFoodbankCommentDto {
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
