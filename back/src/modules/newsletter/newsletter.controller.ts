import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/newsletter.dto';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  // Trois par minute : une inscription est un geste unique, pas une rafale.
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(200)
  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletter.subscribe(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('unsubscribe')
  unsubscribe(@Body() body: { email: string }) {
    return this.newsletter.unsubscribe(body?.email ?? '');
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.EDITOR)
  @Get('admin')
  findAllAdmin() {
    return this.newsletter.findAllAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newsletter.remove(id);
  }
}
