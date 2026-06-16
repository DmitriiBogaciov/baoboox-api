import { DomainError } from './domain.error';

export class ServiceUnavailableAppError extends DomainError {
  constructor(message = 'Service unavailable', details?: unknown) {
    super('SERVICE_UNAVAILABLE', message, details);
  }
}