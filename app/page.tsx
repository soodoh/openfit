"use client";

import { CreateSessionButton } from "@/components/sessions/CreateSession";
import { ResumeSessionButton } from "@/components/sessions/ResumeSessionButton";
import { SessionDetailModal } from "@/components/sessions/SessionDetailModal";
import { SessionSummaryCard } from "@/components/sessions/SessionSummaryCard";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import {
  ArrowRight,
  CalendarDays,
  Dumbbell,
  Flame,
  LayoutGrid,
  Loader2,
  Plus,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type { WorkoutSessionWithData } from "@/lib/convex-types";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <DashboardContent />;
}

function DashboardContent() {
  const [selectedSessionId, setSelectedSessionId] =
    useState<Id<"workoutSessions"> | null>(null);

  const stats = useQuery(api.queries.dashboard.getStats);
  const recentSessions = useQuery(api.queries.dashboard.getRecentSessions);
  const currentSession = useQuery(api.queries.sessions.getCurrent);
  const units = useQuery(api.queries.units.list);

  const isLoading =
    stats === undefined ||
    recentSessions === undefined ||
    currentSession === undefined ||
    units === undefined;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="border-b border-border/50 bg-linear-to-b from-accent/5 to-transparent">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) py-8 md:py-12">
          {/* Resume Session Banner */}
          {currentSession && (
            <div className="mb-8">
              <ResumeSessionButton session={currentSession} />
            </div>
          )}

          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="text-muted-foreground mt-1">
                Ready to crush your next workout?
              </p>
            </div>
            <CreateSessionButton />
          </div>

          {/* Stats Grid */}
          {isLoading ? (
            <StatsLoadingSkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Trophy className="h-5 w-5" />}
                label="Total Sessions"
                value={stats.totalSessions}
              />
              <StatCard
                icon={<CalendarDays className="h-5 w-5" />}
                label="This Week"
                value={stats.thisWeekSessions}
              />
              <StatCard
                icon={<Flame className="h-5 w-5" />}
                label="Day Streak"
                value={stats.currentStreak}
              />
              <StatCard
                icon={<LayoutGrid className="h-5 w-5" />}
                label="Routines"
                value={stats.totalRoutines}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) py-8">
        {/* Feature Cards */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              href="/routines"
              icon={<Target className="h-6 w-6" />}
              title="Routines"
              description="Create and manage your workout templates"
            />
            <FeatureCard
              href="/exercises"
              icon={<Dumbbell className="h-6 w-6" />}
              title="Exercises"
              description="Browse the exercise library"
            />
            <FeatureCard
              href="/logs"
              icon={<CalendarDays className="h-6 w-6" />}
              title="Workout Logs"
              description="Review your past sessions"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            {recentSessions && recentSessions.length > 0 && (
              <Link
                href="/logs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <RecentActivitySkeleton />
          ) : recentSessions.length === 0 ? (
            <EmptyActivity />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSessions.map((session: WorkoutSessionWithData) => (
                <SessionSummaryCard
                  key={session._id}
                  session={session}
                  onClick={() => setSelectedSessionId(session._id)}
                  showEditMenu={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      {units && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          units={units}
          open={!!selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground truncate">{label}</div>
      </div>
    </Card>
  );
}

function FeatureCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="p-6 h-full transition-all duration-200 hover:shadow-lg hover:border-foreground/20 hover:-translate-y-0.5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-lg bg-linear-to-br from-primary/10 to-accent/20 dark:from-primary/20 dark:to-accent/30 flex items-center justify-center text-primary dark:text-foreground group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base group-hover:text-primary dark:group-hover:text-white transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </Card>
    </Link>
  );
}

function EmptyActivity() {
  return (
    <Card className="border-dashed p-8 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary/10 to-accent/20 dark:from-primary/20 dark:to-accent/30 flex items-center justify-center mb-4">
        <Plus className="w-8 h-8 text-primary/70 dark:text-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No workouts yet
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Start your first workout session to begin tracking your fitness journey.
      </p>
      <CreateSessionButton />
    </Card>
  );
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-4 flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-7 w-12 bg-muted rounded animate-pulse mb-1" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  );
}
