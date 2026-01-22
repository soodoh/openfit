"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignUpSchema } from "@/lib/authSchema";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useState } from "react";
import { flattenError } from "zod";

export const LoginForm = ({ register }: { register?: boolean }) => {
  const { signIn } = useAuthActions();
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
      formData.set("flow", register ? "signUp" : "signIn");

      await signIn("password", formData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      setPasswordError([message]);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-sm) flex flex-1 flex-col items-center justify-center gap-4">
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
          {loading ? "Loading..." : register ? "Register" : "Login"}
        </Button>

        {register ? (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/signin">Back to sign in</Link>
          </Button>
        ) : (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/register">Create an account</Link>
          </Button>
        )}
      </form>
    </div>
  );
};
