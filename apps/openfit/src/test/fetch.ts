import { vi } from "vitest";

export function createJsonSuccessResponse<T>(
	body: T,
	init?: ResponseInit,
): Response {
	return Response.json(body, init);
}

export function createJsonErrorResponse(
	error: string,
	init?: ResponseInit,
): Response {
	return Response.json(
		{ error },
		{
			status: 400,
			...init,
		},
	);
}

export function mockJsonSuccess<T>(body: T, init?: ResponseInit) {
	return vi.fn().mockResolvedValue(createJsonSuccessResponse(body, init));
}

export function mockJsonError(error: string, init?: ResponseInit) {
	return vi.fn().mockResolvedValue(createJsonErrorResponse(error, init));
}
