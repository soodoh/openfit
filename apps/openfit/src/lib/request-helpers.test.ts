import { describe, expect, it } from "vitest";
import { object, string } from "zod";
import { parseJsonBody, parseSearchParams } from "./request-helpers";

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
