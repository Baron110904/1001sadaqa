import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { VideosService } from './videos.service';
import { CreateVideoDto, UpdateVideoDto } from './dto/video.dto';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Public()
  @Get()
  findAll() {
    return this.videos.findAllPublic();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin')
  findAllAdmin() {
    return this.videos.findAllAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Post()
  create(@Body() dto: CreateVideoDto) {
    return this.videos.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.videos.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videos.remove(id);
  }
}
