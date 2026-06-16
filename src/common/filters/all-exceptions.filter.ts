import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DomainError } from '../errors';
import { APP_ERROR_STATUS_MAP } from '../errors/error-status-map';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const type = host.getType();

    if (type === 'http') {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      const response = ctx.getResponse();

      const errorMessage =
        exception instanceof Error ? exception.message : String(exception);
      const stack =
        exception instanceof Error ? exception.stack : undefined;

      this.logger.error(
        `[HTTP] ${request.method} ${request.url} - ${errorMessage}`,
        stack,
      );

      if (exception instanceof DomainError) {
        const status =
          APP_ERROR_STATUS_MAP[exception.code] ??
          HttpStatus.INTERNAL_SERVER_ERROR;

        response.status(status).json({
          success: false,
          code: exception.code,
          message: exception.message,
          details: exception.details,
          timestamp: new Date().toISOString(),
          path: request.url,
        });

        return;
      }

      if (exception instanceof HttpException) {
        response.status(exception.getStatus()).json({
          success: false,
          message: exception.getResponse(),
          timestamp: new Date().toISOString(),
          path: request.url,
        });

        return;
      }

      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request.url,
      });

      return;
    }

    const errorMessage =
      exception instanceof Error ? exception.message : String(exception);
    const stack =
      exception instanceof Error ? exception.stack : undefined;

    this.logger.error(`[${type}] ${errorMessage}`, stack);

    throw exception;
  }
}