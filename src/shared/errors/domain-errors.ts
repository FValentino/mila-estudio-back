export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  readonly details: readonly string[];

  protected constructor(message: string, details: readonly string[] = []) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}

export class NotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends DomainError {
  readonly statusCode = 400;

  constructor(message: string, details: readonly string[] = []) {
    super(message, details);
  }
}
