import { describe, it, expect } from "vitest";
import { parseDurationToSeconds } from "./duration-input";

describe("parseDurationToSeconds", () => {
  describe("basic parsing", () => {
    it("parses MM:ss format correctly", () => {
      expect(parseDurationToSeconds("1:30")).toBe(90);
      expect(parseDurationToSeconds("2:00")).toBe(120);
      expect(parseDurationToSeconds("10:45")).toBe(645);
    });

    it("parses minutes only (no colon)", () => {
      expect(parseDurationToSeconds("5")).toBe(300);
      expect(parseDurationToSeconds("10")).toBe(600);
      expect(parseDurationToSeconds("60")).toBe(3600);
    });

    it("parses with leading zeros", () => {
      expect(parseDurationToSeconds("01:05")).toBe(65);
      expect(parseDurationToSeconds("00:30")).toBe(30);
    });
  });

  describe("edge cases", () => {
    it("returns undefined for empty string", () => {
      expect(parseDurationToSeconds("")).toBeUndefined();
    });

    it("handles zero values", () => {
      expect(parseDurationToSeconds("0")).toBe(0);
      expect(parseDurationToSeconds("0:00")).toBe(0);
      expect(parseDurationToSeconds("0:0")).toBe(0);
    });

    it("handles colon with missing seconds", () => {
      expect(parseDurationToSeconds("5:")).toBe(300);
    });

    it("handles colon with missing minutes", () => {
      expect(parseDurationToSeconds(":30")).toBe(30);
    });

    it("handles large minute values", () => {
      expect(parseDurationToSeconds("120:00")).toBe(7200);
      expect(parseDurationToSeconds("999:59")).toBe(59999);
    });
  });

  describe("seconds boundary", () => {
    it("handles 59 seconds", () => {
      expect(parseDurationToSeconds("1:59")).toBe(119);
    });

    it("handles single digit seconds", () => {
      expect(parseDurationToSeconds("1:5")).toBe(65);
      expect(parseDurationToSeconds("1:9")).toBe(69);
    });
  });
});
