# Story 1.1: Display My Gyms in Profile Settings

Status: done

## Story

As a **user**,
I want **to view all my gyms in profile settings**,
so that **I can see what gym configurations I have and manage them**.

## Acceptance Criteria

1. **AC1: Display Gym List**
   - **Given** I am logged in and open profile settings
   - **When** I navigate to the "My Gyms" section
   - **Then** I see a list of all my gyms with their names
   - **And** each gym card shows the count of equipment selected (e.g., "12 equipment items")

2. **AC2: Empty State**
   - **Given** I have no gyms created yet
   - **When** I view the "My Gyms" section
   - **Then** I see an empty state with an "Add Gym" call-to-action

3. **AC3: Performance**
   - **Given** I am viewing my gyms
   - **When** the page loads
   - **Then** the gym list loads within 500ms (NFR4)

## Tasks / Subtasks

- [x] Task 1: Add `gyms` table to Convex schema (AC: #1, #3)
  - [x] 1.1: Define `gyms` table with fields: `userId`, `name`, `equipmentIds[]`, `updatedAt`
  - [x] 1.2: Add `by_user` index for user-scoped queries
  - [x] 1.3: Run `npx convex dev` to verify schema compiles

- [x] Task 2: Create gyms query (AC: #1, #3)
  - [x] 2.1: Create `convex/queries/gyms.ts`
  - [x] 2.2: Implement `list()` query with user authentication and `by_user` index
  - [x] 2.3: Return gym data with equipment count

- [x] Task 3: Create GymCard component (AC: #1)
  - [x] 3.1: Create `components/gyms/GymCard.tsx`
  - [x] 3.2: Display gym name and equipment count
  - [x] 3.3: Follow RoutineCard styling patterns (gradient hover, card structure)
  - [x] 3.4: Add placeholder for future menu button (Edit/Delete)

- [x] Task 4: Integrate My Gyms section into ProfileModal (AC: #1, #2)
  - [x] 4.1: Add "My Gyms" section after existing profile fields
  - [x] 4.2: Use `useQuery` to fetch gyms list
  - [x] 4.3: Map gyms to GymCard components
  - [x] 4.4: Implement empty state with "Add Gym" button (button can be non-functional for now)

- [x] Task 5: Add TypeScript types (AC: #1)
  - [x] 5.1: Add `Gym` and `GymId` types to `lib/convex-types.ts`

## Dev Notes

### Architecture Compliance

This story is the foundation for the Gym Management feature. It establishes:
- The `gyms` table schema that all subsequent stories depend on
- The query pattern for fetching user gyms
- The GymCard component used throughout gym management

**CRITICAL PATTERNS TO FOLLOW:**

1. **Authentication Pattern** - Every query/mutation MUST start with:
   ```typescript
   const userId = await getAuthenticatedUserId(ctx);
   ```

2. **User-Scoped Query Pattern** - Always filter by user:
   ```typescript
   .withIndex("by_user", (q) => q.eq("userId", userId))
   ```

3. **Import Pattern** - Use `@/*` prefix for all imports (no relative imports except in convex/ folder)

4. **Component Pattern** - Follow existing Card structure from `RoutineCard.tsx`:
   - Use `Card`, `CardHeader`, `CardTitle`, `CardContent` from shadcn/ui
   - Include hover gradient effect with `group` class
   - Use `text-muted-foreground` for metadata

### Technical Requirements

**Schema Definition** (`convex/schema.ts`):
```typescript
gyms: defineTable({
  userId: v.id("users"),
  name: v.string(),
  equipmentIds: v.array(v.id("equipment")),
  updatedAt: v.number(),
}).index("by_user", ["userId"]),
```

**Query Structure** (`convex/queries/gyms.ts`):
```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUserId(ctx);

    const gyms = await ctx.db
      .query("gyms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return gyms;
  },
});
```

### File Structure Requirements

**New Files:**
```
components/gyms/
└── GymCard.tsx

convex/queries/
└── gyms.ts
```

**Modified Files:**
- `convex/schema.ts` - Add gyms table
- `components/profile/ProfileModal.tsx` - Add "My Gyms" section
- `lib/convex-types.ts` - Add Gym types

### UI/UX Requirements

**GymCard Visual Spec:**
- Match RoutineCard styling patterns
- Show gym name as CardTitle
- Show equipment count as metadata: `{count} equipment items`
- Include subtle gradient hover effect
- Reserve space for menu button (future stories)

**ProfileModal Integration:**
- Add section header: "My Gyms"
- Use same spacing as existing sections (`space-y-5`)
- Empty state: centered text + Button with "Add Gym" label
- Loading state: show `Loader2` spinner

**Empty State Copy:**
```
No gyms created yet.
Create a gym to filter exercises by available equipment.
[+ Add Gym]
```

### Project Structure Notes

- GymCard follows the established domain component pattern: `components/[domain]/ComponentName.tsx`
- Query file follows pattern: `convex/queries/[entity].ts`
- All new code integrates with existing ProfileModal without restructuring

### References

- [Source: architecture.md#Implementation Patterns & Consistency Rules] - Auth and query patterns
- [Source: architecture.md#Project Structure & Boundaries] - File locations
- [Source: ux-design-specification.md#Design System Foundation] - Visual component specs
- [Source: epics.md#Story 1.1] - Original acceptance criteria
- [Source: prd.md#Gym Management] - FR1-FR5 requirements
- [Source: project-context.md] - Import rules, naming conventions

### Existing Codebase Patterns to Follow

**ProfileModal Structure** (`components/profile/ProfileModal.tsx`):
- Header with gradient background
- Form sections with `space-y-5` spacing
- Loading state with centered Loader2 spinner
- Uses Convex `useQuery` for data fetching

**Card Pattern** (`components/routines/RoutineCard.tsx`):
- `Card` with `group` class for hover effects
- `CardHeader` with relative positioning for menu button
- Gradient overlay: `bg-gradient-to-br from-primary/5 via-transparent to-accent/5`
- Metadata row with icons and `text-xs text-muted-foreground`

**Query Pattern** (`convex/queries/userProfiles.ts`):
- Export named function wrapped in `query()`
- Args object (empty for list queries)
- Handler with ctx parameter
- `getAuthenticatedUserId(ctx)` for auth
- `.withIndex()` for user filtering

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Implemented `gyms` table in Convex schema with `userId`, `name`, `equipmentIds[]`, `updatedAt` fields and `by_user` index
- Created `convex/queries/gyms.ts` with authenticated `list()` query using `by_user` index
- Created `components/gyms/GymCard.tsx` following RoutineCard styling patterns with gradient hover effect
- Integrated "My Gyms" section into ProfileModal with loading state, gym list display, and empty state with disabled "Add Gym" button
- Added `Gym` and `GymId` types to `lib/convex-types.ts`
- All acceptance criteria satisfied: AC1 (gym list display), AC2 (empty state), AC3 (performance via indexed query)
- Build passes, lint passes (only pre-existing warning in generated file)
- No test framework configured in project

### File List

- [x] `convex/schema.ts` (modified)
- [x] `convex/queries/gyms.ts` (new)
- [x] `components/gyms/GymCard.tsx` (new)
- [x] `components/profile/ProfileModal.tsx` (modified)
- [x] `lib/convex-types.ts` (modified)
