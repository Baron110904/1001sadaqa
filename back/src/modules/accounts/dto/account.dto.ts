import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterAccountDto {
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

  /**
   * Huit caractères au minimum.
   *
   * Aucune règle de composition imposée : exiger une majuscule et un chiffre
   * pousse surtout à choisir « Motdepasse1 », plus court à deviner qu'une
   * phrase longue. La longueur est ce qui protège réellement.
   */
  @IsString()
  @MinLength(8, { message: 'Huit caractères au minimum.' })
  @MaxLength(200)
  password!: string;
}

export class LoginAccountDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Saisissez votre mot de passe.' })
  password!: string;
}

export class RefreshAccountDto {
  @IsString()
  refreshToken!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Huit caractères au minimum.' })
  @MaxLength(200)
  password?: string;
}
