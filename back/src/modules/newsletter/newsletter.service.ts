import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { SubscribeDto } from './dto/newsletter.dto';

/** Version de la politique de confidentialité acceptée à l'inscription. */
const VERSION_POLITIQUE = '2026-09';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inscription à la lettre d'information.
   *
   * Réinscrire une adresse déjà présente ne crée pas de doublon et ne dit pas
   * qu'elle est déjà là : répondre « cette adresse est déjà inscrite »
   * révélerait à un tiers qui figure sur la liste. On réactive en silence et
   * on renvoie le même message dans les deux cas.
   */
  async subscribe(dto: SubscribeDto): Promise<{ success: true }> {
    if (!dto.consent) {
      throw new BadRequestException('Votre accord est nécessaire pour vous inscrire.');
    }

    const email = dto.email.trim().toLowerCase();

    await this.prisma.newsletterSubscription.upsert({
      where: { email },
      create: {
        email,
        name: dto.name?.trim() || null,
        source: dto.source?.trim() || null,
        policyVersion: VERSION_POLITIQUE,
      },
      update: {
        isActive: true,
        unsubscribedAt: null,
        consentAt: new Date(),
        policyVersion: VERSION_POLITIQUE,
        ...(dto.name?.trim() ? { name: dto.name.trim() } : {}),
      },
    });

    return { success: true };
  }

  /**
   * Désabonnement.
   *
   * La ligne est désactivée, jamais supprimée : réinscrire quelqu'un qui
   * s'était désabonné est une faute, et une ligne effacée ne garde aucune
   * trace de son refus.
   */
  async unsubscribe(email: string): Promise<{ success: true }> {
    await this.prisma.newsletterSubscription.updateMany({
      where: { email: email.trim().toLowerCase() },
      data: { isActive: false, unsubscribedAt: new Date() },
    });

    // Même réponse que l'adresse ait existé ou non, pour la même raison.
    return { success: true };
  }

  findAllAdmin() {
    return this.prisma.newsletterSubscription.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.newsletterSubscription.delete({ where: { id } });
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === 'P2025') {
        throw new NotFoundException('Inscription introuvable.');
      }
      throw cause;
    }
  }
}
