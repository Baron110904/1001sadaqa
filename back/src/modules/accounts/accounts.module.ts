import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AccountJwtStrategy } from './account-jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AccountsController],
  providers: [AccountsService, AccountJwtStrategy],
})
export class AccountsModule {}
