import { ContactStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MinLength(2, { message: 'Indiquez votre nom.' })
  @MaxLength(120)
  name!: string;

  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MinLength(3, { message: 'Précisez l’objet de votre message.' })
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(10, { message: 'Votre message est trop court.' })
  @MaxLength(4000)
  message!: string;
}

export class UpdateContactDto {
  @IsEnum(ContactStatus)
  status!: ContactStatus;
}
