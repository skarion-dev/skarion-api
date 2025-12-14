import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }));
  console.log('application started on port', process.env.PORT);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
