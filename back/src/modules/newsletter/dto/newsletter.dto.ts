import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  /** Page depuis laquelle l'inscription est faite, pour savoir ce qui convertit. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  source?: string;

  /**
   * Consentement explicite, exigé.
   *
   * Une case pré-cochée ou absente ne vaut pas consentement : le RGPD demande
   * un acte positif, et c'est ce booléen qui l'atteste.
   */
  @IsBoolean()
  consent!: boolean;
}
