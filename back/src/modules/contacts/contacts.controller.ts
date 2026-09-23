import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  /** Formulaire public : 3 envois par 5 minutes et par IP. */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contacts.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.contacts.findAll(query);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('pending-count')
  countPending() {
    return this.contacts.countPending();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contacts.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contacts.remove(id);
  }
}
