import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Global : tous les modules qui reçoivent un formulaire doivent pouvoir
// accuser réception, sans que chacun ait à réimporter le module.
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
