import { describe, expect, it } from "vitest";
import { object, string } from "zod";
import {
	fetchJson,
	parseJsonBody,
	parseResponseJson,
	parseSearchParams,
} from "./request-helpers";

describe("parseJsonBody", () => {
	it("parses typed JSON bodies without a schema", async () => {
		const request = new Request("http://localhost/test", {
			method: "POST",
			body: JSON.stringify({ name: "OpenFit" }),
			headers: { "Content-Type": "application/json" },
		});

		await expect(parseJsonBody<{ name: string }>(request)).resolves.toEqual({
			name: "OpenFit",
		});
	});

	it("returns parsed data when the schema passes", async () => {
		const request = new Request("http://localhost/test", {
			method: "POST",
			body: JSON.stringify({ name: "OpenFit" }),
			headers: { "Content-Type": "application/json" },
		});

		await expect(
			parseJsonBody(
				request,
				object({
					name: string().min(1),
				}),
			),
		).resolves.toEqual({ name: "OpenFit" });
	});

	it("throws a 400 Response when schema validation fails", async () => {
		const request = new Request("http://localhost/test", {
			method: "POST",
			body: JSON.stringify({ name: "" }),
			headers: { "Content-Type": "application/json" },
		});

		try {
			await parseJsonBody(
				request,
				object({
					name: string().min(1, "Name is required"),
				}),
			);
			throw new Error("Expected parseJsonBody to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(Response);
			const response = error as Response;
			expect(response.status).toBe(400);
			await expect(response.json()).resolves.toEqual({
				error: "Invalid request body",
				issues: [{ message: "Name is required", path: ["name"] }],
			});
		}
	});

	it("throws a 400 Response when the request body is invalid JSON", async () => {
		const request = new Request("http://localhost/test", {
			method: "POST",
			body: "{invalid-json",
			headers: { "Content-Type": "application/json" },
		});

		try {
			await parseJsonBody(request);
			throw new Error("Expected parseJsonBody to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(Response);
			const response = error as Response;
			expect(response.status).toBe(400);
			await expect(response.json()).resolves.toEqual({
				error: "Invalid JSON body",
			});
		}
	});
});

describe("parseSearchParams", () => {
	it("parses repeated query params into arrays", () => {
		const searchParams = new URLSearchParams();
		searchParams.append("q", "bench");
		searchParams.append("equipmentIds", "barbell");
		searchParams.append("equipmentIds", "rack");

		expect(
			parseSearchParams(
				searchParams,
				object({
					q: string(),
					equipmentIds: string().array(),
				}),
			),
		).toEqual({
			q: "bench",
			equipmentIds: ["barbell", "rack"],
		});
	});

	it("throws a 400 Response when query validation fails", async () => {
		const searchParams = new URLSearchParams({
			limit: "abc",
		});

		try {
			parseSearchParams(
				searchParams,
				object({
					limit: string().regex(/^\d+$/, "Limit must be numeric"),
				}),
			);
			throw new Error("Expected parseSearchParams to throw");
		} catch (error) {
			expect(error).toBeInstanceOf(Response);
			const response = error as Response;
			expect(response.status).toBe(400);
			await expect(response.json()).resolves.toEqual({
				error: "Invalid query parameters",
				issues: [{ message: "Limit must be numeric", path: ["limit"] }],
			});
		}
	});
});

describe("response JSON helpers", () => {
	it("returns parsed JSON when fetchJson receives an OK response", async () => {
		const response = Response.json({ ok: true }, { status: 200 });

		await expect(
			fetchJson<{ ok: boolean }>(response, "Fallback"),
		).resolves.toEqual({ ok: true });
	});

	it("throws the fallback error message for empty/non-JSON error payloads", async () => {
		const response = new Response("not-json", {
			status: 500,
			headers: { "Content-Type": "text/plain" },
		});

		await expect(
			fetchJson<Record<string, never>>(response, "Fallback failure message"),
		).rejects.toThrow("Fallback failure message");
	});

	it("throws the server-provided error message for non-OK responses", async () => {
		const response = Response.json(
			{ error: "Server says no" },
			{ status: 403 },
		);

		await expect(
			fetchJson<Record<string, never>>(response, "Fallback failure message"),
		).rejects.toThrow("Server says no");
	});

	it("parses response JSON without checking response.ok", async () => {
		const payload = { reason: "teapot" };
		const response = Response.json(payload, { status: 418 });

		await expect(parseResponseJson<typeof payload>(response)).resolves.toEqual(
			payload,
		);
	});
});
