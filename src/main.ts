import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Skarion API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      queryConfigEnabled: true,
      docExpansion: 'none',
    },
  });

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
