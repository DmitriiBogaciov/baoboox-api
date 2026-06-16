import { ErrorCode } from './error-code';

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);

    this.name = new.target.name;

    // Для корректной работы instanceof
    Object.setPrototypeOf(this, new.target.prototype);

    // Красивый stack trace
    Error.captureStackTrace?.(this, new.target);
  }
}