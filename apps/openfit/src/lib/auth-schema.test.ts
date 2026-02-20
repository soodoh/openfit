import { describe, expect, it } from "vitest";
import { SignUpSchema } from "./auth-schema";

function expectValidationFailure(
  result: ReturnType<typeof SignUpSchema.safeParse>,
) {
  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error("Expected schema validation to fail");
  }
  return result.error;
}

describe("SignUpSchema", () => {
  describe("email validation", () => {
    it("accepts valid email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.org",
        "user+tag@example.co.uk",
      ];
      for (const email of validEmails) {
        const result = SignUpSchema.safeParse({
          email,
          password: "ValidPass1!",
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid email addresses", () => {
      const invalidEmails = ["notanemail", "missing@domain", "@nodomain.com"];
      for (const email of invalidEmails) {
        const result = SignUpSchema.safeParse({
          email,
          password: "ValidPass1!",
        });
        expect(result.success).toBe(false);
      }
    });
  });
  describe("password validation", () => {
    it("accepts valid passwords", () => {
      const validPasswords = [
        "Password1!",
        "MySecure@123",
        "Test1234#",
        "Complex$Pass99",
      ];
      for (const password of validPasswords) {
        const result = SignUpSchema.safeParse({
          email: "test@example.com",
          password,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "Pass1!",
      });
      const error = expectValidationFailure(result);
      expect(error.issues[0].message).toBe("Be at least 8 characters long");
    });

    it("rejects passwords longer than 64 characters", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: `${"A".repeat(60)}b1c2!`,
      });
      const error = expectValidationFailure(result);
      expect(error.issues[0].message).toBe("Be at most 64 characters long");
    });

    it("rejects passwords without letters", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "12345678!",
      });
      const error = expectValidationFailure(result);
      expect(error.issues[0].message).toBe("Contain at least one letter");
    });

    it("rejects passwords without numbers", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "Password!",
      });
      const error = expectValidationFailure(result);
      expect(error.issues[0].message).toBe("Contain at least one number");
    });

    it("rejects passwords without special characters", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "Password1",
      });
      const error = expectValidationFailure(result);
      expect(error.issues[0].message).toBe(
        "Contain at least one special character",
      );
    });

    it("accepts passwords at minimum length boundary", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: "Passwrd1!", // exactly 9 chars (8 min + working)
      });
      expect(result.success).toBe(true);
    });

    it("accepts passwords at maximum length boundary", () => {
      const result = SignUpSchema.safeParse({
        email: "test@example.com",
        password: `${"A".repeat(59)}b1c2!`, // exactly 64 chars
      });
      expect(result.success).toBe(true);
    });
  });
  describe("combined validation", () => {
    it("returns multiple errors for completely invalid input", () => {
      const result = SignUpSchema.safeParse({
        email: "notanemail",
        password: "short",
      });
      const error = expectValidationFailure(result);
      expect(error.issues.length).toBeGreaterThan(1);
    });
  });
});
