# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenFit is an open-source fitness tracking application for logging workouts, managing routines, and tracking progress.

**Tech Stack:**
- Next.js 16 (App Router) with React 19
- SQLite + Drizzle ORM (database)
- BetterAuth (authentication with email/password + optional OAuth)
- TanStack React Query (data fetching & cache management)
- TypeScript
- Tailwind CSS v4
- Radix UI + shadcn/ui components
- class-variance-authority (CVA)
- dnd-kit for drag-and-drop

## Development Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix lint issues
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with exercise data (873 exercises)
pnpm db:studio        # Open Drizzle Studio (DB browser)
pnpm changeset        # Create a changeset for version management
```

### Initial Setup

```bash
pnpm install                   # Install dependencies
pnpm db:migrate                # Run database migrations
pnpm db:seed                   # Seed exercise data
pnpm dev                       # Start Next.js dev server
```

### Seeding Test Data

```bash
pnpm db:seed-mock your@email.com
```

## Code Conventions

### Imports

- **Always use absolute imports with `@/` prefix** (enforced by ESLint)

```typescript
import { Button } from "@/components/ui/button";
```

### Components

- Use `"use client"` directive for client components
- Use `cn()` utility from `@/lib/utils` for class merging
- Follow CVA pattern for variants (see `components/ui/` for examples)

### API Routes & Backend

- API routes: `app/api/<resource>/route.ts`
- Database schema: `db/schema/*.ts` (Drizzle ORM)
- Auth helpers in `lib/auth-middleware.ts`:
  - `requireAuth(request)` - throws 401 if not authenticated
  - `requireAdmin(request)` - throws 403 if not admin
  - `getOptionalSession(request)` - returns null if not authenticated
- Query hooks: `hooks/queries/use-*.ts` (TanStack React Query)
- Mutation hooks: `hooks/mutations/use-*-mutations.ts`
- Query key factory: `lib/query-keys.ts`

## Architecture

### Provider Hierarchy (app/layout.tsx)

```
ThemeProvider
  └── QueryProvider (TanStack React Query)
        └── AuthProvider (BetterAuth)
              └── AppWrapper
```

### Data Flow

**Client-side queries (via custom hooks):**
```typescript
import { useExercises, useExercise } from "@/hooks";

// List with filters
const { data, fetchNextPage, hasNextPage } = useExercises({ search: "bench" });

// Single item (enabled only when ID exists)
const { data: exercise } = useExercise(exerciseId);
```

**API routes (server-side):**
```typescript
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/db";

export async function GET(request: Request) {
  const session = await requireAuth(request);
  const data = await db.query.exercises.findMany();
  return Response.json(data);
}
```

### Type System

Import types from `@/lib/types`:

```typescript
// Document types
import type { Exercise, Routine, WorkoutSession } from "@/lib/types";

// ID types
import type { ExerciseId, RoutineId } from "@/lib/types";

// Complex types with relations
import type { WorkoutSessionWithData, RoutineDayWithData } from "@/lib/types";

// Enums
import { SetType, SetGroupType, ListView } from "@/lib/types";
```

## Verifying Changes with Playwright

**Always verify UI changes using Playwright MCP tools in headless mode.**

Test credentials are in `.env.local`:
- Username: `ADMIN_USER`
- Password: `ADMIN_PASSWORD`

## Key Files

| File | Purpose |
|------|---------|
| `db/schema/` | Database schema definition (Drizzle ORM) |
| `lib/auth.ts` | BetterAuth configuration |
| `lib/auth-middleware.ts` | Auth helper functions for API routes |
| `lib/types.ts` | Type aliases and API response shapes |
| `lib/query-keys.ts` | TanStack Query key factory |
| `hooks/queries/` | React Query hooks for data fetching |
| `hooks/mutations/` | React Query hooks for mutations |
| `app/api/` | Next.js API routes (RESTful endpoints) |
| `app/layout.tsx` | Root layout with provider hierarchy |

## Contributing

When making changes for a release, create a changeset:
```bash
pnpm changeset  # Select patch/minor/major, write summary
```
The changeset file in `.changeset/` should be committed with your PR.
