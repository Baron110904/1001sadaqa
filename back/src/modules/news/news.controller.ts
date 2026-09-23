import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { NewsService } from './news.service';
import { CreateNewsDto, NewsQueryDto, UpdateNewsDto } from './dto/news.dto';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Public()
  @Get()
  findAll(@Query() query: NewsQueryDto) {
    return this.news.findAllPublic(query);
  }

  @Public()
  @Get('featured')
  findFeatured() {
    return this.news.findFeaturedPublic();
  }

  @Public()
  @Get('years')
  findYears() {
    return this.news.findYearsPublic();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONTRIBUTOR)
  @Get('admin')
  findAllAdmin() {
    return this.news.findAllAdmin();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.news.findBySlugPublic(slug);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONTRIBUTOR)
  @Post()
  create(@Body() dto: CreateNewsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.news.create(dto, user);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONTRIBUTOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.news.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.news.remove(id);
  }
}
