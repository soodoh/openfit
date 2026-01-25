# OpenFit - Claude Development Guide

## Project Overview

OpenFit is an open-source fitness tracking application for logging workouts, managing routines, and tracking progress.

**Tech Stack:**
- Next.js 16 (App Router)
- Convex (backend/database)
- TypeScript
- Tailwind CSS v4
- Radix UI + shadcn/ui components
- class-variance-authority (CVA)

## Development Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Auto-fix lint issues
pnpm seed         # Seed database with exercises
pnpm generate:keys # Generate JWT auth keys
```

## Code Conventions

### Imports

- **Always use absolute imports with `@/` prefix**
- Never use relative imports (enforced by ESLint)

```typescript
// Correct
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Wrong
import { Button } from "../ui/button";
```

### Components

- Use `"use client"` directive for client components
- Follow Radix UI + CVA pattern for UI components
- Use `cn()` utility from `@/lib/utils` for class merging

### Convex Backend

- Queries: `convex/queries/*.ts`
- Mutations: `convex/mutations/*.ts`
- Always validate auth with `getAuthenticatedUserId(ctx)` from `@/convex/lib/auth`
- Use `Doc<"tableName">` and `Id<"tableName">` types from generated types

### TypeScript

- Import type aliases from `@/lib/convex-types`
- Use Zod for form validation
- Convex schema provides database type safety

## Architecture

### Frontend Structure

```
app/                    # Next.js App Router pages
components/
  ├── ui/              # Base shadcn/Radix components
  ├── admin/           # Admin panel components
  ├── auth/            # Authentication components
  ├── exercises/       # Exercise-related components
  ├── gyms/            # Gym management components
  ├── layout/          # Layout components (Header, etc.)
  ├── profile/         # User profile components
  ├── providers/       # React context providers
  ├── routines/        # Routine management components
  ├── sessions/        # Workout session components
  └── workoutSet/      # Set/rep tracking components
lib/
  ├── utils.ts         # Utility functions (cn, etc.)
  └── convex-types.ts  # Type aliases for Convex documents
```

### Backend Structure

```
convex/
  ├── schema.ts        # Database schema
  ├── auth.ts          # Auth configuration
  ├── auth.config.ts   # Auth providers
  ├── queries/         # Read operations
  ├── mutations/       # Write operations
  ├── lib/             # Shared utilities (auth helpers)
  ├── utils/           # Storage utilities
  └── seedData/        # Seed data files
```

## Common Patterns

### Data Fetching (Client-side)

```typescript
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Simple query
const data = useQuery(api.queries.exercises.list);

// Paginated query
const { results, loadMore, status } = usePaginatedQuery(
  api.queries.exercises.list,
  {},
  { initialNumItems: 12 }
);

// Conditional/skip pattern
const data = useQuery(
  api.queries.exercises.get,
  exerciseId ? { id: exerciseId } : "skip"
);
```

### Mutations

```typescript
const createExercise = useMutation(api.mutations.admin.createExercise);
await createExercise({ name: "Bench Press", categoryId });
```

### Auth Check in Backend

```typescript
import { getAuthenticatedUserId } from "./lib/auth";

export const myMutation = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    // userId is guaranteed to exist, throws if not authenticated
  },
});
```

### Server-side Data Fetching (Admin Routes)

```typescript
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const data = await fetchQuery(
  api.queries.admin.getUsers,
  {},
  { token, url: process.env.NEXT_PUBLIC_CONVEX_URL }
);
```

## Adding New Features

1. Define/update schema in `convex/schema.ts` if needed
2. Create queries in `convex/queries/`
3. Create mutations in `convex/mutations/`
4. Build page in `app/` directory
5. Create components in `components/` organized by domain

## Verifying Changes with Playwright

**Always verify UI changes using Playwright in headless mode.**

- Use the Playwright MCP tools to test changes in the browser
- Always run in `--headless` mode (no visible browser window)
- Login credentials are stored in `.env.local`:
  - Username: `TEST_USER`
  - Password: `TEST_PASSWORD`

Verification workflow:
1. Navigate to the relevant page
2. Login using the test credentials from `.env.local`
3. Verify the UI changes work as expected
4. Check for console errors or unexpected behavior

## UI Component Pattern

```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", secondary: "..." },
    size: { sm: "...", md: "...", lg: "..." }
  },
  defaultVariants: { variant: "default", size: "md" }
});

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema definition |
| `convex/auth.config.ts` | Auth provider configuration |
| `convex/lib/auth.ts` | Auth helper functions |
| `components/ui/` | Base UI components |
| `lib/convex-types.ts` | Type aliases for documents/IDs |
| `lib/utils.ts` | Utility functions (cn) |
| `app/layout.tsx` | Root layout with providers |

## Environment Setup

Required environment variables:

```bash
NEXT_PUBLIC_CONVEX_URL    # Convex backend URL
JWT_PRIVATE_KEY           # Auth private key (generate with pnpm generate:keys)
JWKS                      # JSON Web Key Set (generate with pnpm generate:keys)

# OAuth providers (as needed)
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
```

## Type System

Common type imports from `@/lib/convex-types`:

```typescript
// Document types
import type { Exercise, Routine, WorkoutSession, WorkoutSet } from "@/lib/convex-types";

// ID types
import type { ExerciseId, RoutineId, WorkoutSessionId } from "@/lib/convex-types";

// Complex types with relations
import type { WorkoutSessionWithData, RoutineDayWithData } from "@/lib/convex-types";

// Enums
import { SetType, SetGroupType, ListView } from "@/lib/convex-types";
```
