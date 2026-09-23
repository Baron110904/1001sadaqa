import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TeamService } from './team.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto';

// Gouvernance : contenu institutionnel, donc validation administrateur.
@ApiTags('team')
@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Public()
  @Get()
  findAll() {
    return this.team.findAllPublic();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin() {
    return this.team.findAllAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateTeamMemberDto) {
    return this.team.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.team.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.team.remove(id);
  }
}
