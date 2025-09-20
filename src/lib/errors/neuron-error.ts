export class NeuronError extends Error {
  /**
   * Creates an error that will be handled by the Error Boundary.
   * If crash is true, the error will be thrown and the application will crash.
   *
   * @param message - the error message
   * @param crash - if true, the error will be thrown and the application will crash.
   */
  constructor(
    message: string,
    public crash: boolean,
  ) {
    super(message);
  }
}
