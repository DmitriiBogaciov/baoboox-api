import { DomainError } from './domain.error';

export class BadUserInputAppError extends DomainError {
    constructor(message: 'Bad user input', details?: unknown) {
        super('BAD_USER_INPUT', message, details);
    }
}