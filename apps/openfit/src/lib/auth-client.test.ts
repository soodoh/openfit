import { describe, expect, it } from "vitest";
import { resolveAuthBaseUrl } from "./auth-client";

describe("resolveAuthBaseUrl", () => {
	it("prefers the current browser origin over the configured app url", () => {
		expect(
			resolveAuthBaseUrl("http://localhost:3000", "http://127.0.0.1:3100"),
		).toBe("http://127.0.0.1:3100");
	});

	it("falls back to the configured app url when no browser origin exists", () => {
		expect(resolveAuthBaseUrl("http://localhost:3000")).toBe(
			"http://localhost:3000",
		);
	});

	it("uses the default local url when neither source is available", () => {
		expect(resolveAuthBaseUrl()).toBe("http://localhost:3000");
	});
});
