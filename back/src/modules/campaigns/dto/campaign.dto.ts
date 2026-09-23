import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(400)
  claim!: string;

  @IsOptional()
  @IsString()
  image?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: 'L’objectif de collecte doit être supérieur à zéro.' })
  goal!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  raised?: number;

  @IsOptional()
  @IsString()
  programId?: string;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}
