import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service';
import cookieParser from 'cookie-parser';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Increase payload limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const configService = app.get<AppConfigService>(AppConfigService);

  // Global validation pipe for DTO validation

  // Allow cross-origin requests from the browser (Swagger UI uses fetch())
  // Enabling CORS here ensures the Swagger UI and other browser clients
  // can successfully call endpoints during local testing.
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Authorization,Content-Type,Accept,Origin,User-Agent',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe for DTO validation (useful for Swagger testing)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger for the full application — aggregates all modules/controllers
  const config = new DocumentBuilder()
    .setTitle('Arcana API')
    .setDescription(
      'All subsystem APIs (Time, Leaves, Payroll, Recruitment, etc.)',
    )
    .setVersion('0.1')
    .addTag('arcana')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(configService.port);
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
