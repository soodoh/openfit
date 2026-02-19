import { email, object, string } from "zod";

export const SignUpSchema = object({
  email: email({ message: "Invalid email" }),
  password: string({ message: "Password is required" })
    .min(1, "Password is required")
    .min(8, { message: "Be at least 8 characters long" })
    .max(64, { message: "Be at most 64 characters long" })
    .regex(/[a-zA-Z]/, { message: "Contain at least one letter" })
    .regex(/[0-9]/, { message: "Contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Contain at least one special character",
    }),
});
