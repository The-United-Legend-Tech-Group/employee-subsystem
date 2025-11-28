import { NestFactory } from '@nestjs/core';
import { EmployeeSubsystemModule } from './employee-subsystem.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(EmployeeSubsystemModule);
  app.use(cookieParser());

  // Global validation pipe for DTO validation (useful for Swagger testing)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger for the full application — aggregates all modules/controllers
  const config = new DocumentBuilder()
    .setTitle('Employee Subsystem API')
    .setDescription('All Employee Subsystem APIs')
    .setVersion('0.1')
    .addTag('employee-subsystem')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Employee Subsystem listening on port ${process.env.PORT ?? 3000}`,
  );
}

bootstrap();
