import { DonationFrequency, DonationMethod, DonationStatus } from '@prisma/client';
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

export class CreateDonationDto {
  @IsString()
  @MinLength(2, { message: 'Indiquez votre nom.' })
  @MaxLength(160)
  donorName!: string;

  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  donorEmail!: string;

  /**
   * Obligatoire : le règlement passe par Mobile Money.
   *
   * C'est le numéro qui reçoit la demande de paiement, et celui par lequel
   * l'association rappelle si l'encaissement n'aboutit pas. Facultatif, il
   * laissait des dons en attente sans moyen de joindre le donateur.
   *
   * La colonne reste nullable en base : les dons déjà enregistrés n'en ont
   * pas, et les priver d'historique pour une règle nouvelle n'aurait aucun
   * sens. Seules les demandes à venir sont concernées.
   */
  // La longueur maximale est déclarée **en premier** à dessein : les messages
  // reviennent dans l'ordre inverse de leur déclaration, et le site n'affiche
  // que le premier. Déclarée en dernier, elle produisait « Le numéro de
  // téléphone est trop long » pour un champ simplement absent.
  @MaxLength(30, { message: 'Le numéro de téléphone est trop long.' })
  @IsString({ message: 'Indiquez un numéro de téléphone.' })
  @MinLength(6, { message: 'Indiquez un numéro de téléphone.' })
  donorPhone!: string;

  /**
   * Pays et ville, choisis dans deux listes liées côté site.
   *
   * Facultatifs ici alors que le formulaire les exige : les dons déjà
   * enregistrés n'en ont pas, et un appel direct à l'API — une reprise, un
   * import — ne doit pas échouer faute d'une information que l'association
   * peut compléter ensuite.
   */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  donorCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  donorCity?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(500, { message: 'Le montant minimum est de 500 F CFA.' })
  amount!: number;

  @IsEnum(DonationMethod)
  method!: DonationMethod;

  @IsOptional()
  @IsEnum(DonationFrequency)
  frequency?: DonationFrequency;

  /** Affectation : omis = « là où le besoin est le plus urgent ». */
  @IsOptional()
  @IsString()
  programId?: string;

  /**
   * Cause soutenue, quand le don part d'une carte « Soutenir cette cause ».
   *
   * C'est ce lien qui fait monter la jauge de la cause à l'encaissement.
   */
  @IsOptional()
  @IsString()
  campaignId?: string;

  /**
   * Anonymat **public** du don.
   *
   * Le donateur reste connu de l'association : son nom et son adresse sont
   * nécessaires au reçu et au suivi comptable. Ce drapeau ne fait que retirer
   * son nom des affichages publics — mur des donateurs, remerciements.
   */
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class UpdateDonationDto {
  @IsEnum(DonationStatus)
  status!: DonationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  providerRef?: string;
}
