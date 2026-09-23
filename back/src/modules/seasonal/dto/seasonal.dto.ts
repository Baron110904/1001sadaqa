import { PartialType } from '@nestjs/swagger';
import { CampaignTheme } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSeasonalDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(CampaignTheme)
  theme?: CampaignTheme;

  /**
   * Période d'habillage.
   *
   * Le calendrier hégirien se décale d'environ onze jours chaque année : les
   * dates sont saisies à chaque édition, jamais calculées.
   */
  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(240)
  bannerText!: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  goal?: number;

  // ── Habillage festif de la page d'accueil ──

  /** Salutation en arabe, au-dessus du titre. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  greeting?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  greetingLatin?: string;

  /** Libellé de la pastille affichée dans l'en-tête du site. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  pillLabel?: string;

  /** Titre du héros. Le caractère « | » marque un saut de ligne. */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  heroTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  heroLead?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  secondaryLabel?: string;

  @IsOptional()
  @IsString()
  secondaryUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  progressUnit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  progressCurrent?: number;

  /** Chiffres libres, au format « valeur|libellé ». */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  figures?: string[];

  /** Offres de contribution, au format « libellé|montant|description ». */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(400, { each: true })
  offers?: string[];

  /** Mentions du bandeau défilant. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  marquee?: string[];

  // ── Bande basse du jour ──

  @IsOptional()
  @IsBoolean()
  dailyEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  dailyTitle?: string;

  /** Heure de rupture du jeûne, au format « 18:52 ». */
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'L’heure doit s’écrire au format 18:52.' })
  dailyTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dailyCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  dailyCtaLabel?: string;

  @IsOptional()
  @IsString()
  dailyCtaUrl?: string;

  /** Interrupteur d'urgence : coupe l'habillage sans toucher aux dates. */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Événement récurrent dont cette campagne est l'édition de l'année. */
  @IsOptional()
  @IsString()
  eventId?: string;
}

export class UpdateSeasonalDto extends PartialType(CreateSeasonalDto) {}
