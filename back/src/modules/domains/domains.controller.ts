import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DomainsService } from './domains.service';
import { CreateDomainDto, UpdateDomainDto } from './dto/domain.dto';

@ApiTags('domains')
@Controller('domains')
export class DomainsController {
  constructor(private readonly domains: DomainsService) {}

  @Public()
  @Get()
  findAll() {
    return this.domains.findAllPublic();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin')
  findAllAdmin() {
    return this.domains.findAllAdmin();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.domains.findBySlugPublic(slug);
  }

  // Les domaines structurent toute l'offre de l'organisation : leur édition
  // relève de l'administration, comme les programmes (§5.1.2 du cahier).
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateDomainDto) {
    return this.domains.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDomainDto) {
    return this.domains.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.domains.remove(id);
  }
}
