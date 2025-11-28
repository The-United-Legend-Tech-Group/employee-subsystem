import { NestFactory } from '@nestjs/core';
import { TimeMangementModule } from './timemangment.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export async function createTimeManagementApp() {
  const app = await NestFactory.create(TimeMangementModule);

  const config = new DocumentBuilder()
    .setTitle('Arcana - Time Management')
    .setDescription('Time Management subsystem (dummy endpoints)')
    .setVersion('0.1')
    .addTag('time')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('time/docs', app, document);

  return app;
}

export async function bootstrapTimeManagement(port = 3001) {
  const app = await createTimeManagementApp();
  await app.listen(port);

  console.log(`Time Management subsystem listening on ${port}`);
}

export default bootstrapTimeManagement;
