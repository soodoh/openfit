"use client";

import { LoginForm } from "@/components/auth/LoginForm";

export default function RegisterPage() {
  return (
    <div className="flex flex-1">
      <LoginForm register />
    </div>
  );
}
