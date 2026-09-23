import { PartialType } from '@nestjs/swagger';
import { MissionKind, VolunteerStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVolunteerMissionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsEnum(MissionKind)
  kind?: MissionKind;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  commitment!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVolunteerMissionDto extends PartialType(CreateVolunteerMissionDto) {}

/** Candidature déposée depuis /take-action/volunteer. */
export class CreateVolunteerDto {
  @IsString()
  @MinLength(2, { message: 'Indiquez vos prénom et nom.' })
  @MaxLength(160)
  name!: string;

  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Indiquez un numéro de téléphone joignable.' })
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  availability?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  missionId?: string;
}

export class UpdateVolunteerDto {
  @IsEnum(VolunteerStatus)
  status!: VolunteerStatus;
}
