import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  // `rawBody` : la signature des webhooks FedaPay porte sur les octets reçus.
  // Le corps re-sérialisé depuis l'objet analysé ne redonne pas la même
  // chaîne — ordre des clés, espaces — et la vérification échouerait toujours.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService<AppConfig, true>);

  app.setGlobalPrefix('api/v1');

  // Le front appelle l'API depuis ses Server Actions et retransmet l'adresse
  // du visiteur dans x-forwarded-for. Sans cette option, la limitation de
  // débit compterait tous les visiteurs comme un seul client.
  // Ne vaut que si l'API n'est joignable que par le front : autrement,
  // l'en-tête est falsifiable.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(
    helmet({
      // Les médias sont servis depuis MinIO/S3, sur une autre origine.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: config.get('corsOrigins', { infer: true }),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter));

  if (config.get('nodeEnv', { infer: true }) !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle('API 1001 SADAQA')
      .setDescription('Site web institutionnel — Phase I')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));
  }

  const port = config.get('port', { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API 1001 SADAQA → http://localhost:${port}/api/v1`);
}

void bootstrap();
