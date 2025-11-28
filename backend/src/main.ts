import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { bootstrapTimeManagement } from './time-mangement/main';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // If you want to start only the time-management subsystem for local testing,
  // set environment variable `START_SUBSYSTEM=time` (and optionally `TIME_PORT`).
  if (process.env.START_SUBSYSTEM === 'time') {
    const port = process.env.TIME_PORT
      ? parseInt(process.env.TIME_PORT, 10)
      : 3001;
    await bootstrapTimeManagement(port);
    return;
  }

  const app = await NestFactory.create(AppModule);

  // Allow cross-origin requests from the browser (Swagger UI uses fetch())
  // Enabling CORS here ensures the Swagger UI and other browser clients
  // can successfully call endpoints during local testing.
  app.enableCors();

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
  // http://localhost:3000/api/docs
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
