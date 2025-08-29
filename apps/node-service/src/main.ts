import './lark/ws';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { SERVER_PORT } from './constants';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  await app.listen(SERVER_PORT);
};
bootstrap();
