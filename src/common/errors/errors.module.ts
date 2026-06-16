import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { AppGraphqlExceptionFilter } from '../filters/app-graphql-exception.filter';

@Global()
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppGraphqlExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class ErrorsModule {}