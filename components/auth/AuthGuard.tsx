"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) mt-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
