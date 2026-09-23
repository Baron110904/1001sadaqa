import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SettingsService } from './settings.service';

class UpdateSettingDto {
  @IsDefined({ message: 'La valeur est obligatoire.' })
  value!: unknown;
}

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Get('public')
  findPublic() {
    return this.settings.findPublic();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.settings.findAllAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settings.update(key, dto.value as Parameters<SettingsService['update']>[1]);
  }
}
