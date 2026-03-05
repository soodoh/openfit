/**
 * Type-safe wrappers for JSON request/response handling.
 * These avoid no-unsafe-assignment/member-access lint errors from fetch API's `any` return types.
 */

/** Parse a request body as JSON with a specific type. */
export async function parseJsonBody<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

/** Parse a response body as JSON with a specific type. Throws on non-OK responses. */
export async function fetchJson<T>(
  response: Response,
  errorMessage: string,
): Promise<T> {
  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? errorMessage);
  }
  return (await response.json()) as T;
}

/** Parse a response body as JSON with a specific type. Does NOT check response.ok. */
export async function parseResponseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
