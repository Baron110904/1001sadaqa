import { PartialType } from '@nestjs/swagger';
import { ContactStatus, PartnerType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePartnerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  logo!: string;

  @IsOptional()
  @IsUrl({}, { message: 'Le site web doit être une URL valide.' })
  website?: string;

  @IsOptional()
  @IsEnum(PartnerType)
  type?: PartnerType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePartnerDto extends PartialType(CreatePartnerDto) {}

export class CreatePartnerDocumentDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  fileType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  fileSize?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePartnerDocumentDto extends PartialType(CreatePartnerDocumentDto) {}

/** Formulaire de mise en relation de l'espace partenaires (parcours B2B). */
export class CreatePartnershipRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  organisation!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  contactName!: string;

  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MinLength(10, { message: 'Décrivez en quelques mots le partenariat envisagé.' })
  @MaxLength(2000)
  intent!: string;
}

export class UpdatePartnershipRequestDto {
  @IsEnum(ContactStatus)
  status!: ContactStatus;
}
