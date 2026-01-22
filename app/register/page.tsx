"use client";

import { AdminSetupForm } from "@/components/auth/AdminSetupForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const hasUsers = useQuery(api.queries.userProfiles.hasUsers);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || hasUsers === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
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
