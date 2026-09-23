import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProgramsService } from './programs.service';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';

@ApiTags('programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Public()
  @Get()
  findAll() {
    return this.programs.findAllPublic();
  }

  // Placé avant :slug pour ne pas être capté par la route dynamique.
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin')
  findAllAdmin() {
    return this.programs.findAllAdmin();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.programs.findBySlugPublic(slug);
  }

  // Contenus institutionnels : validation de niveau 2, réservée à l'administrateur.
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateProgramDto) {
    return this.programs.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.programs.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programs.remove(id);
  }
}
