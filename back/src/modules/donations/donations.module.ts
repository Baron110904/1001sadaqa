import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { FedapayService } from './fedapay.service';

@Module({
  imports: [SettingsModule],
  controllers: [DonationsController],
  providers: [DonationsService, FedapayService],
})
export class DonationsModule {}
