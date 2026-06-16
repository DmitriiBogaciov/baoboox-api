import { Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

import { DomainError } from '../errors/domain.error';

@Catch(DomainError)
export class AppGraphqlExceptionFilter
  implements GqlExceptionFilter<DomainError>
{
  catch(exception: DomainError): GraphQLError {
    return new GraphQLError(exception.message, {
      extensions: {
        code: exception.code,
        details: exception.details,
      },
    });
  }
}