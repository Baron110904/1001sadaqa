import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PartnersService } from './partners.service';
import {
  CreatePartnerDocumentDto,
  CreatePartnerDto,
  CreatePartnershipRequestDto,
  UpdatePartnerDocumentDto,
  UpdatePartnerDto,
  UpdatePartnershipRequestDto,
} from './dto/partner.dto';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Public()
  @Get()
  findAll() {
    return this.partners.findAllPublic();
  }

  @Public()
  @Get('documents')
  findDocuments() {
    return this.partners.findDocumentsPublic();
  }

  /** Formulaire de mise en relation B2B, limité contre le spam. */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @Post('requests')
  createRequest(@Body() dto: CreatePartnershipRequestDto) {
    return this.partners.createRequest(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin')
  findAllAdmin() {
    return this.partners.findAllAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin/documents')
  findDocumentsAdmin() {
    return this.partners.findDocumentsAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin/requests')
  findRequests() {
    return this.partners.findRequests();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch('admin/requests/:id')
  updateRequest(@Param('id') id: string, @Body() dto: UpdatePartnershipRequestDto) {
    return this.partners.updateRequest(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('documents')
  createDocument(@Body() dto: CreatePartnerDocumentDto) {
    return this.partners.createDocument(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('documents/:id')
  updateDocument(@Param('id') id: string, @Body() dto: UpdatePartnerDocumentDto) {
    return this.partners.updateDocument(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('documents/:id')
  removeDocument(@Param('id') id: string) {
    return this.partners.removeDocument(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreatePartnerDto) {
    return this.partners.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partners.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partners.remove(id);
  }
}
