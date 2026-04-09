import type { ZodType } from "zod";

/**
 * Type-safe wrappers for JSON request/response handling.
 * These avoid no-unsafe-assignment/member-access lint errors from fetch API's `any` return types.
 */

function formatZodIssues(error: {
	issues: Array<{ message: string; path: PropertyKey[] }>;
}) {
	return error.issues.map((issue) => ({
		message: issue.message,
		path: issue.path,
	}));
}

/** Parse a request body as JSON with a specific type. */
export async function parseJsonBody<T>(request: Request): Promise<T>;
export async function parseJsonBody<T>(
	request: Request,
	schema: ZodType<T>,
): Promise<T>;
export async function parseJsonBody<T>(
	request: Request,
	schema?: ZodType<T>,
): Promise<T> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw Response.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (!schema) {
		return body as T;
	}

	const result = schema.safeParse(body);
	if (!result.success) {
		throw Response.json(
			{
				error: "Invalid request body",
				issues: formatZodIssues(result.error),
			},
			{ status: 400 },
		);
	}

	return result.data;
}

function searchParamsToObject(
	searchParams: URLSearchParams,
): Record<string, string | string[]> {
	const entries = new Map<string, string[]>();

	for (const [key, value] of searchParams.entries()) {
		const values = entries.get(key);
		if (values) {
			values.push(value);
			continue;
		}
		entries.set(key, [value]);
	}

	return Object.fromEntries(
		Array.from(entries.entries(), ([key, values]) => [
			key,
			values.length === 1 ? values[0] : values,
		]),
	);
}

/** Parse URL search params with a specific schema. */
export function parseSearchParams<T>(
	searchParams: URLSearchParams,
	schema: ZodType<T>,
): T {
	const result = schema.safeParse(searchParamsToObject(searchParams));
	if (!result.success) {
		throw Response.json(
			{
				error: "Invalid query parameters",
				issues: formatZodIssues(result.error),
			},
			{ status: 400 },
		);
	}

	return result.data;
}

/** Parse a response body as JSON with a specific type. Throws on non-OK responses. */
export async function fetchJson<T>(
	response: Response,
	errorMessage: string,
): Promise<T> {
	if (!response.ok) {
		let body: { error?: string } | undefined;
		try {
			body = (await response.json()) as { error?: string };
		} catch {
			throw new Error(errorMessage);
		}
		throw new Error(body.error ?? errorMessage);
	}
	return (await response.json()) as T;
}

/** Parse a response body as JSON with a specific type. Does NOT check response.ok. */
export async function parseResponseJson<T>(response: Response): Promise<T> {
	return (await response.json()) as T;
}
