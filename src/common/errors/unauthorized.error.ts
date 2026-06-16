import { DomainError } from './domain.error';

export class UnauthorizedAppError extends DomainError {
    constructor(message = 'Unauthorized', details?: unknown) {
        super('UNAUTHORIZED', message, details);
    }
}