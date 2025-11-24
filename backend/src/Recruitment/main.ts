import { NestFactory } from '@nestjs/core';
import { RecruitmentModule } from './recruitment.module';

async function bootstrap() {
  const app = await NestFactory.create(RecruitmentModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
