import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SiteService } from './site.service';

@ApiTags('site')
@Controller()
export class SiteController {
  constructor(private readonly site: SiteService) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Public()
  @Get('stats')
  stats() {
    return this.site.stats();
  }
}
