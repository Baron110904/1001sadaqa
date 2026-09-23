import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic() {
    return this.prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  findAllAdmin() {
    return this.prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
  }

  create(data: CreateTeamMemberDto) {
    return this.prisma.teamMember.create({ data });
  }

  update(id: string, data: UpdateTeamMemberDto) {
    return this.prisma.teamMember.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.teamMember.delete({ where: { id } });
  }
}
