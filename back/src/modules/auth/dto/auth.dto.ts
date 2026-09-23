import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(10, { message: 'Le nouveau mot de passe doit faire au moins 10 caractères.' })
  newPassword!: string;
}
