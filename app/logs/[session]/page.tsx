"use client";

import { CurrentSessionPage } from "@/components/sessions/CurrentSessionPage";
import { SessionPage } from "@/components/sessions/SessionPage";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  return <SessionPageContent />;
}

function SessionPageContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.session as Id<"workoutSessions">;

  const session = useQuery(api.queries.sessions.get, { id: sessionId });
  const currentSession = useQuery(api.queries.sessions.getCurrent);
  const units = useQuery(api.queries.units.list);

  // Redirect if session not found
  useEffect(() => {
    if (session === null) {
      router.push("/logs");
    }
  }, [session, router]);

  if (session === undefined || units === undefined) {
    return (
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-lg) mt-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (session._id === currentSession?._id) {
    return <CurrentSessionPage session={session} units={units} />;
  }
  return <SessionPage session={session} units={units} />;
}
