import { DomainError } from './domain.error';

export class ConflictAppError extends DomainError {
    constructor(message = 'Conflict', details?: unknown) {
        super('CONFLICT', message, details);
    }
}