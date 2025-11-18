import { NestFactory } from '@nestjs/core';
import { EmployeeSubsystemModule } from './employee-subsystem.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(EmployeeSubsystemModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Employee Subsystem listening on port ${process.env.PORT ?? 3000}`);
}

bootstrap();
