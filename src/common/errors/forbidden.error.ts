import { DomainError } from './domain.error';

export class ForbiddenAppError extends DomainError {
  constructor(message = 'Forbidden', details?: unknown) {
    super('FORBIDDEN', message, details);
  }
}