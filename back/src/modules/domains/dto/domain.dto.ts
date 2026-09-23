import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDomainDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  /**
   * Numéros des Objectifs de développement durable auxquels le domaine
   * contribue. Lus par les bailleurs institutionnels, ils doivent figurer même
   * s'ils intéressent peu le grand public (§5.7).
   */
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(17, { each: true })
  sdgs?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDomainDto extends PartialType(CreateDomainDto) {}
