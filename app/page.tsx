"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";

export default function Home() {
  return (
    <AuthGuard>
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) mt-8">
        TODO home page dashboard
      </div>
    </AuthGuard>
  );
}
