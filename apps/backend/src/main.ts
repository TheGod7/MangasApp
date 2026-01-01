import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ZodValidationPipe());

  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MangasApp API')
    .setDescription('A simple API for a manga app scanlation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('/api', app, cleanupOpenApiDoc(document));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
