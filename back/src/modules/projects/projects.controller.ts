import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import {
  CreateImpactDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ProjectQueryDto) {
    return this.projects.findAllPublic(query);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin')
  findAllAdmin() {
    return this.projects.findAllAdmin();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.projects.findBySlugPublic(slug);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projects.remove(id);
  }

  // Les données d'impact sont des contenus sensibles (niveau 3) : administrateur.
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post(':id/impacts')
  addImpact(@Param('id') id: string, @Body() dto: CreateImpactDto) {
    return this.projects.addImpact(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('impacts/:impactId')
  removeImpact(@Param('impactId') impactId: string) {
    return this.projects.removeImpact(impactId);
  }
}
