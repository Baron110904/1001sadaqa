import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DomainsModule } from './modules/domains/domains.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { FoodbankModule } from './modules/foodbank/foodbank.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { EventsModule } from './modules/events/events.module';
import { MailModule } from './modules/mail/mail.module';
import { MembersModule } from './modules/members/members.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { SeasonalModule } from './modules/seasonal/seasonal.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { NewsModule } from './modules/news/news.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { PartnersModule } from './modules/partners/partners.module';
import { TeamModule } from './modules/team/team.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DonationsModule } from './modules/donations/donations.module';
import { VolunteersModule } from './modules/volunteers/volunteers.module';
import { MediaModule } from './modules/media/media.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SiteModule } from './modules/site/site.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], cache: true }),
    // Logs structurés (JSON en production, lisibles en développement). Les
    // en-têtes d'authentification et de cookies sont retirés des traces.
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, translateTime: 'HH:MM:ss' } },
      },
    }),
    // Plafond général ; les routes sensibles (connexion, formulaires) posent
    // leur propre limite via @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,

    AuthModule,
    UsersModule,
    DashboardModule,
    DomainsModule,
    AccountsModule,
    FoodbankModule,
    NewsletterModule,
    EventsModule,
    MailModule,
    MembersModule,
    ProgramsModule,
    SeasonalModule,
    ProjectsModule,
    NewsModule,
    TestimonialsModule,
    PartnersModule,
    TeamModule,
    CampaignsModule,
    ContactsModule,
    DonationsModule,
    VolunteersModule,
    MediaModule,
    SettingsModule,
    SiteModule,
  ],
  providers: [
    // Ordre volontaire : le débit d'abord, puis l'authentification, puis les
    // rôles. Toute route non marquée @Public() exige un jeton valide.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
