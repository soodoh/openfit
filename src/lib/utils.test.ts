import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", null, undefined, false, "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active",
    );
  });

  it("resolves Tailwind conflicts - padding", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("py-4", "py-2")).toBe("py-2");
  });

  it("resolves Tailwind conflicts - margin", () => {
    expect(cn("m-4", "m-2")).toBe("m-2");
    expect(cn("mx-4", "mx-2")).toBe("mx-2");
    expect(cn("my-4", "my-2")).toBe("my-2");
  });

  it("resolves Tailwind conflicts - colors", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("resolves Tailwind conflicts - display", () => {
    expect(cn("block", "flex")).toBe("flex");
    expect(cn("hidden", "block")).toBe("block");
  });

  it("resolves Tailwind conflicts - width and height", () => {
    expect(cn("w-full", "w-auto")).toBe("w-auto");
    expect(cn("h-10", "h-12")).toBe("h-12");
  });

  it("preserves non-conflicting classes", () => {
    expect(cn("p-4", "m-2", "text-red-500")).toBe("p-4 m-2 text-red-500");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
    expect(cn(["foo"], ["bar"])).toBe("foo bar");
  });

  it("handles object inputs for conditional classes", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles mixed inputs", () => {
    expect(cn("base", ["array-class"], { conditional: true })).toBe(
      "base array-class conditional",
    );
  });
});
