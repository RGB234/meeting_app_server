import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import * as cookieParser from 'cookie-parser';
// import * as dotenv from 'dotenv';

// // .env file load
// dotenv.config();

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(3000);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.
      whitelist: true,
    }),
  );
  // Hot Module Replacement
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
