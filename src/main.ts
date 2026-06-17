import { ValidationPipe} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppGraphqlExceptionFilter } from './common/filters/app-graphql-exception.filter';
import cookieParser from 'cookie-parser';
import { BadUserInputAppError } from './common/errors/bad-user-input.error';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      return new BadUserInputAppError(
        'Bad user input',
        errors.map((error) => ({
          field: error.property,
          constraints: error.constraints,
        })),
      );
    },
  }),
);

  app.enableShutdownHooks();

  app.useGlobalFilters(
  new AllExceptionsFilter(),
  new AppGraphqlExceptionFilter(),
);
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();