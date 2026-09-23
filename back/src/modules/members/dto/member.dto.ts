import { PartialType } from '@nestjs/swagger';
import { DonationMethod, MemberStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Plancher de cotisation mensuelle, en francs CFA (§7.4.2). */
export const COTISATION_MINIMUM = 1000;

export class CreateMemberDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  profession?: string;

  /** Domaines d'intervention qui motivent l'adhésion. */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  interests!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivation?: string;

  /** Vie associative, terrain, mobilisation de partenaires, appui technique. */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  participation!: string[];

  /**
   * Montant mensuel choisi.
   *
   * Plancher, pas plafond : le membre donne ce qu'il veut à partir de mille
   * francs. La valeur est déclarative et ne déclenche aucun prélèvement.
   */
  @Type(() => Number)
  @IsNumber()
  @Min(COTISATION_MINIMUM)
  pledgedAmount!: number;

  // ── Consentements et traçabilité (§2.5.3, §10.2) ──

  @IsBoolean()
  consentPrivacy!: boolean;

  @IsOptional()
  @IsBoolean()
  consentNews?: boolean;

  @IsOptional()
  @IsString()
  pageOrigin?: string;

  @IsOptional()
  @IsString()
  trafficSource?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  policyVersion?: string;
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {}

/** Décision de l'administration sur une demande d'adhésion. */
export class DecideMemberDto {
  @IsEnum(MemberStatus)
  status!: MemberStatus;

  /** Motif, communiqué au demandeur dans les deux cas. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  decisionNote?: string;
}

export class CreateContributionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(COTISATION_MINIMUM)
  amount!: number;

  /** Mois et année de rattachement du versement. */
  @IsDateString()
  period!: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsEnum(DonationMethod)
  method?: DonationMethod;

  @IsOptional()
  @IsString()
  providerRef?: string;
}
