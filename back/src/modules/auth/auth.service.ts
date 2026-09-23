import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { AppConfig } from '../../config/configuration';
import { ChangePasswordDto, LoginDto } from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async login(dto: LoginDto): Promise<{ user: AuthenticatedUser } & TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Message volontairement identique dans les deux cas : ne pas révéler
    // quelles adresses existent.
    const invalid = new UnauthorizedException('Identifiants incorrects.');
    if (!user || !user.isActive) throw invalid;
    if (!(await bcrypt.compare(dto.password, user.password))) throw invalid;

    const tokens = await this.issueTokens(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let sub: string;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: string }>(refreshToken, {
        secret: this.config.get('jwt.refreshSecret', { infer: true }),
      }));
    } catch {
      throw new UnauthorizedException('Session expirée, reconnectez-vous.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: sub } });
    if (!user?.isActive || !user.refreshToken) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous.');
    }

    // Le jeton de rafraîchissement est stocké haché : un vidage de base ne
    // suffit pas à rejouer une session.
    if (!(await bcrypt.compare(refreshToken, user.refreshToken))) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous.');
    }

    return this.issueTokens(user.id);
  }

  async logout(userId: string): Promise<{ success: true }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ success: true }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(dto.newPassword, 12), refreshToken: null },
    });

    return { success: true };
  }

  private async issueTokens(userId: string): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.config.get('jwt.accessSecret', { infer: true }),
        expiresIn: this.config.get('jwt.accessTtl', { infer: true }),
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: this.config.get('jwt.refreshSecret', { infer: true }),
        expiresIn: this.config.get('jwt.refreshTtl', { infer: true }),
      },
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: await bcrypt.hash(refreshToken, 12) },
    });

    return { accessToken, refreshToken };
  }
}
