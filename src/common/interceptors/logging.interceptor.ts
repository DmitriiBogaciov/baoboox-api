import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const contextType = context.getType<'http' | 'rpc' | 'ws'>();

    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      const method = request.method;
      const url = request.url;

      return next.handle().pipe(
        tap(() => {
          this.logger.log(`[HTTP] ${method} ${url} ${Date.now() - now}ms`);
        }),
      );
    }

    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      const parentType = info.parentType?.name;
      const fieldName = info.fieldName;

      return next.handle().pipe(
        tap(() => {
          this.logger.log(
            `[GraphQL] ${parentType}.${fieldName} ${Date.now() - now}ms`,
          );
        }),
      );
    }

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`[${contextType}] ${Date.now() - now}ms`);
      }),
    );
  }
}