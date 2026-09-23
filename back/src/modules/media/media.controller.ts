import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile as UploadedFileParam,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { MediaService, type UploadedFile } from './media.service';
import { MediaQueryDto, UpdateMediaDto, UploadMediaDto } from './dto/media.dto';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Galerie du site : uniquement les médias dont les droits sont en règle. */
  @Public()
  @Get('gallery')
  gallery() {
    return this.media.findGalleryPublic();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONTRIBUTOR)
  @Get()
  findAll(@Query() query: MediaQueryDto) {
    return this.media.findAllAdmin(query);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('consent-report')
  consentReport() {
    return this.media.consentReport();
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONTRIBUTOR)
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  upload(
    @UploadedFileParam() file: UploadedFile,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.media.upload(file, dto, user.id);
  }

  // Les métadonnées de droits sont un contenu sensible : administrateur ou éditeur.
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.media.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.media.remove(id);
  }
}
