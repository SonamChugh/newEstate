export class BaseError extends Error {

  constructor(message: string) {

    super(message);

    Object.setPrototypeOf(this, BaseError.prototype);

    this.name = this.constructor.name;
    if (typeof (<any>Error).captureStackTrace === 'function') {
      (<any>Error).captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}
