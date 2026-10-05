import { Module } from '@nestjs/common';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [NewsletterModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
