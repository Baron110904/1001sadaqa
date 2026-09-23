import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { EventsService } from './events.service';
import { CreateEventDto, EventQueryDto, UpdateEventDto } from './dto/event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Public()
  @Get()
  findAll(@Query() query: EventQueryDto) {
    return this.events.findAllPublic(query);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONTRIBUTOR)
  @Get('admin')
  findAllAdmin() {
    return this.events.findAllAdmin();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.events.findBySlugPublic(slug);
  }

  // Un compte rendu d'événement est un contenu courant : l'éditeur le publie.
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.events.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.events.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.events.remove(id);
  }
}
