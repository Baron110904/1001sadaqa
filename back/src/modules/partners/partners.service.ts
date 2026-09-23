import { DocumentVisibility } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePartnerDocumentDto,
  CreatePartnerDto,
  CreatePartnershipRequestDto,
  UpdatePartnerDocumentDto,
  UpdatePartnerDto,
  UpdatePartnershipRequestDto,
} from './dto/partner.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Partenaires ──────────────────────────────────────────────────────────
  findAllPublic() {
    return this.prisma.partner.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  findAllAdmin() {
    return this.prisma.partner.findMany({ orderBy: { order: 'asc' } });
  }

  create(data: CreatePartnerDto) {
    return this.prisma.partner.create({ data });
  }

  update(id: string, data: UpdatePartnerDto) {
    return this.prisma.partner.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.partner.delete({ where: { id } });
  }

  // ── Documents téléchargeables ────────────────────────────────────────────
  /**
   * Documents téléchargeables par tout le monde.
   *
   * Les documents réservés aux partenaires et les documents privés sont exclus
   * ici, à la source : un filtrage fait plus loin, à l'affichage, finirait par
   * être contourné par un export ou une autre lecture.
   */
  findDocumentsPublic() {
    return this.prisma.document.findMany({
      where: { isActive: true, visibility: DocumentVisibility.PUBLIC },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findDocumentsAdmin() {
    return this.prisma.document.findMany({ orderBy: { order: 'asc' } });
  }

  createDocument(data: CreatePartnerDocumentDto) {
    return this.prisma.document.create({ data });
  }

  updateDocument(id: string, data: UpdatePartnerDocumentDto) {
    return this.prisma.document.update({ where: { id }, data });
  }

  removeDocument(id: string) {
    return this.prisma.document.delete({ where: { id } });
  }

  // ── Demandes de partenariat (entrant B2B) ────────────────────────────────
  async createRequest(data: CreatePartnershipRequestDto) {
    const request = await this.prisma.partnershipRequest.create({ data });
    // On ne renvoie pas l'enregistrement complet à un appelant anonyme.
    return { id: request.id, success: true as const };
  }

  findRequests() {
    return this.prisma.partnershipRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  updateRequest(id: string, data: UpdatePartnershipRequestDto) {
    return this.prisma.partnershipRequest.update({ where: { id }, data });
  }
}
