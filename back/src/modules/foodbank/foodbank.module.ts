import { Module } from '@nestjs/common';
import { FoodbankController } from './foodbank.controller';
import { FoodbankService } from './foodbank.service';

@Module({
  controllers: [FoodbankController],
  providers: [FoodbankService],
})
export class FoodbankModule {}
