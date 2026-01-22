"use client";

import { AdminSetupForm } from "@/components/auth/AdminSetupForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function RegisterPage() {
  const hasUsers = useQuery(api.queries.userProfiles.hasUsers);

  if (hasUsers === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show admin setup form if no users exist
  if (!hasUsers) {
    return (
      <div className="flex flex-1">
        <AdminSetupForm />
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <LoginForm register />
    </div>
  );
}
