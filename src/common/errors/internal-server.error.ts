import { DomainError } from './domain.error';

export class InternalServerAppError extends DomainError {
  constructor(message = 'Internal server error', details?: unknown) {
    super('INTERNAL_SERVER_ERROR', message, details);
  }
}