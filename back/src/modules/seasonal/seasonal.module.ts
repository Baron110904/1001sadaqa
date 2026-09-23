import { Module } from '@nestjs/common';
import { SeasonalController } from './seasonal.controller';
import { SeasonalService } from './seasonal.service';

@Module({
  controllers: [SeasonalController],
  providers: [SeasonalService],
  exports: [SeasonalService],
})
export class SeasonalModule {}
