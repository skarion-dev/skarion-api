import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import { patchNestjsSwagger } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // patchNestjsSwagger();

  const config = new DocumentBuilder()
    .setTitle('Skarion API')
    .setDescription('The Skarion API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*',
    credentials: true,
    methods: '*',
    preflightContinue: false,
  });

  app.use('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }));
  console.log('application started on port', process.env.PORT);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
