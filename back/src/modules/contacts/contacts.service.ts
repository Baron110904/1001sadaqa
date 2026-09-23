import { Injectable } from '@nestjs/common';
import { ContactStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateContactDto) {
    const contact = await this.prisma.contact.create({ data });
    return { id: contact.id, success: true as const };
  }

  async findAll(query: PaginationDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.contact.count(),
    ]);

    return paginate(items, total, query);
  }

  countPending() {
    return this.prisma.contact.count({ where: { status: ContactStatus.PENDING } });
  }

  update(id: string, data: UpdateContactDto) {
    return this.prisma.contact.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.contact.delete({ where: { id } });
  }
}
