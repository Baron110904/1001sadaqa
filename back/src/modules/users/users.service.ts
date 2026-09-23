import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const publicFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: publicFields,
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select: publicFields });
  }

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: { ...dto, password: await bcrypt.hash(dto.password, 12) },
      select: publicFields,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const { password, ...rest } = dto;
    return this.prisma.user.update({
      where: { id },
      data: password ? { ...rest, password: await bcrypt.hash(password, 12) } : rest,
      select: publicFields,
    });
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
    }

    // Un utilisateur qui a signé des actualités ne peut pas être supprimé sans
    // casser la relation d'auteur : on le désactive.
    const authored = await this.prisma.news.count({ where: { authorId: id } });
    if (authored > 0) {
      return this.prisma.user.update({
        where: { id },
        data: { isActive: false, refreshToken: null },
        select: publicFields,
      });
    }

    return this.prisma.user.delete({ where: { id }, select: publicFields });
  }
}
