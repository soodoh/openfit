# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenFit is an open-source fitness tracking application for logging workouts, managing routines, and tracking progress.

**Tech Stack:**
- Next.js 16 (App Router) with React 19
- Convex (self-hosted backend/database)
- TypeScript
- Tailwind CSS v4
- Radix UI + shadcn/ui components
- class-variance-authority (CVA)
- dnd-kit for drag-and-drop

## Development Commands

```bash
pnpm dev              # Start dev server (requires Convex backend running)
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix lint issues
pnpm generate:keys    # Generate JWT auth keys for .env.local
pnpm changeset        # Create a changeset for version management
```

### Initial Setup (requires Docker)

```bash
docker compose up -d           # Start Convex backend
pnpm generate:keys             # Generate keys, copy output to .env.local
./scripts/dev-init.sh          # Deploy schema and seed database
pnpm dev                       # Start Next.js dev server
```

### Seeding Test Data

```bash
pnpm convex run seed:mockUserData '{"email": "your@email.com"}'
```

## Code Conventions

### Imports

- **Always use absolute imports with `@/` prefix** (enforced by ESLint)
- Exception: Convex folder uses relative imports (has its own tsconfig)

```typescript
// Correct (frontend)
import { Button } from "@/components/ui/button";

// Correct (convex folder)
import { getAuthenticatedUserId } from "./lib/auth";
```

### Components

- Use `"use client"` directive for client components
- Use `cn()` utility from `@/lib/utils` for class merging
- Follow CVA pattern for variants (see `components/ui/` for examples)

### Convex Backend

- Queries: `convex/queries/*.ts`
- Mutations: `convex/mutations/*.ts`
- Always validate auth:
  - `getAuthenticatedUserId(ctx)` - throws if not authenticated
  - `getOptionalUserId(ctx)` - returns null if not authenticated
- Use `Doc<"tableName">` and `Id<"tableName">` from generated types

## Architecture

### Provider Hierarchy (app/layout.tsx)

```
ConvexAuthNextjsServerProvider
  └── ThemeProvider
        └── ConvexClientProvider
              └── AppWrapper
```

### Data Flow

**Client-side queries:**
```typescript
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const data = useQuery(api.queries.exercises.list);
const { results, loadMore, status } = usePaginatedQuery(api.queries.exercises.list, {}, { initialNumItems: 12 });

// Skip pattern for conditional queries
const data = useQuery(api.queries.exercises.get, exerciseId ? { id: exerciseId } : "skip");
```

**Server-side queries (admin routes):**
```typescript
import { fetchQuery } from "convex/nextjs";
const data = await fetchQuery(api.queries.admin.getUsers, {}, { token, url: process.env.NEXT_PUBLIC_CONVEX_URL });
```

### Type System

Import types from `@/lib/convex-types`:

```typescript
// Document types
import type { Exercise, Routine, WorkoutSession } from "@/lib/convex-types";

// ID types
import type { ExerciseId, RoutineId } from "@/lib/convex-types";

// Complex types with relations
import type { WorkoutSessionWithData, RoutineDayWithData } from "@/lib/convex-types";

// Enums
import { SetType, SetGroupType, ListView } from "@/lib/convex-types";
```

## Verifying Changes with Playwright

**Always verify UI changes using Playwright MCP tools in headless mode.**

Test credentials are in `.env.local`:
- Username: `TEST_USER`
- Password: `TEST_PASSWORD`

## Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema definition |
| `convex/lib/auth.ts` | Auth helper functions |
| `lib/convex-types.ts` | Type aliases for Convex documents |
| `app/layout.tsx` | Root layout with provider hierarchy |

## Contributing

When making changes for a release, create a changeset:
```bash
pnpm changeset  # Select patch/minor/major, write summary
```
The changeset file in `.changeset/` should be committed with your PR.
