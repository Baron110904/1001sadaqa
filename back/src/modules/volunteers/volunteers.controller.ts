import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { VolunteersService } from './volunteers.service';
import {
  CreateVolunteerDto,
  CreateVolunteerMissionDto,
  UpdateVolunteerDto,
  UpdateVolunteerMissionDto,
} from './dto/volunteer.dto';

@ApiTags('volunteers')
@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteers: VolunteersService) {}

  @Public()
  @Get('missions')
  findMissions() {
    return this.volunteers.findMissionsPublic();
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @Post()
  create(@Body() dto: CreateVolunteerDto) {
    return this.volunteers.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin/missions')
  findMissionsAdmin() {
    return this.volunteers.findMissionsAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Post('missions')
  createMission(@Body() dto: CreateVolunteerMissionDto) {
    return this.volunteers.createMission(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch('missions/:id')
  updateMission(@Param('id') id: string, @Body() dto: UpdateVolunteerMissionDto) {
    return this.volunteers.updateMission(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('missions/:id')
  removeMission(@Param('id') id: string) {
    return this.volunteers.removeMission(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.volunteers.findAll(query);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVolunteerDto) {
    return this.volunteers.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.volunteers.remove(id);
  }
}
