// Types for the result object with discriminated union
type Success<T> = {
  data: T;
  hasError: false;
  error: null;
};

type Failure<E> = {
  data: null;
  hasError: true;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, hasError: false, error: null };
  } catch (error) {
    return { data: null, hasError: true, error: error as E };
  }
}
