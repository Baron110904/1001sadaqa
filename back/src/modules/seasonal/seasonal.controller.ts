import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SeasonalService } from './seasonal.service';
import { CreateSeasonalDto, UpdateSeasonalDto } from './dto/seasonal.dto';

@ApiTags('seasonal')
@Controller('seasonal-campaigns')
export class SeasonalController {
  constructor(private readonly seasonal: SeasonalService) {}

  /** La campagne en cours, ou `null`. Lue par toutes les pages du site. */
  @Public()
  @Get('current')
  current() {
    return this.seasonal.findCurrent();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get()
  findAll() {
    return this.seasonal.findAllAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateSeasonalDto) {
    return this.seasonal.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSeasonalDto) {
    return this.seasonal.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seasonal.remove(id);
  }
}
