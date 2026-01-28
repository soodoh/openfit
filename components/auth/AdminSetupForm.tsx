"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignUpSchema } from "@/lib/authSchema";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { flattenError } from "zod";

export const AdminSetupForm = () => {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string[]>([]);
  const [passwordError, setPasswordError] = useState<string[]>([]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailError([]);
    setPasswordError([]);

    const validation = SignUpSchema.safeParse({ email, password });
    if (validation.error) {
      const errors = flattenError(validation.error);
      setEmailError(errors.fieldErrors.email || []);
      setPasswordError(errors.fieldErrors.password || []);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", "signUp");

      await signIn("password", formData);
      // Redirect to dashboard after successful signup
      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Account creation failed";
      setPasswordError([message]);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-sm) flex flex-1 flex-col items-center justify-center gap-4">
      <div className="text-center space-y-2 mb-4">
        <h1 className="text-2xl font-bold">Welcome to OpenFit</h1>
        <p className="text-muted-foreground">
          Create your admin account to get started
        </p>
      </div>
      <form
        className="flex w-full max-w-sm flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={emailError.length > 0 ? "border-destructive" : ""}
          />
          {emailError.length > 0 && (
            <p className="text-sm text-destructive">{emailError[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={passwordError.length > 0 ? "border-destructive" : ""}
          />
          {passwordError.length > 0 && (
            <p className="text-sm text-destructive">{passwordError[0]}</p>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Create Admin Account"}
        </Button>
      </form>
    </div>
  );
};
