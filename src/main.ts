import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { LoggerInterceptor, ResponseInterceptor } from '@common/interceptors';
import {
  ArgumentsHost,
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { formatValidationErrors } from './common/helpers/formatValidationErrors.helper';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  const PORT = configService.getOrThrow<string>('PORT');

  app.enableCors({
    origin: configService.getOrThrow('CORS_ORIGINS')?.split(','),
    methods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    credentials: true,
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      noSniff: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({ messages: formatValidationErrors(errors) });
      },
      stopAtFirstError: true,
    }),
  );
  app.useGlobalInterceptors(new LoggerInterceptor(), new ResponseInterceptor());

  await app.listen(PORT);
  return PORT
}
bootstrap().then((port) =>
  console.log(`Server is up and running on port ${port}`),
);
