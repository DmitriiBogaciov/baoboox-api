import { DomainError } from './domain.error';

export class NotFoundAppError extends DomainError {
    constructor(message = 'Resource not found', details?: unknown) {
        super('NOT_FOUND', message, details);
    }
}