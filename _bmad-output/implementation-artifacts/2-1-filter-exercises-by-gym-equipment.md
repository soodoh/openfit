# Story 2.1: Filter Exercises by Gym Equipment

Status: review

## Story

As a **user**,
I want **to see exercise search results filtered by my selected gym's equipment**,
so that **I only see exercises I can actually perform**.

## Acceptance Criteria

1. **AC1: Filter by Gym Equipment**
   - **Given** I have a gym with specific equipment selected
   - **When** I search for exercises with that gym's filter active
   - **Then** I only see exercises that use equipment in my gym's list (FR10, FR14)
   - **And** exercises requiring equipment I don't have are hidden

2. **AC2: Performance**
   - **Given** I search for exercises
   - **When** results are filtered by gym equipment
   - **Then** the filter is applied server-side
   - **And** results return within 100ms (NFR1)

3. **AC3: Practical Filtering Example**
   - **Given** I have a gym with dumbbells and a bench
   - **When** I search "chest exercises"
   - **Then** I see dumbbell press, dumbbell fly, etc.
   - **And** I do NOT see cable fly, barbell bench (unless I have those)

4. **AC4: All Equipment Default**
   - **Given** my default gym is null (All Equipment)
   - **When** I search for exercises
   - **Then** I see all exercises without any equipment filtering (FR13 behavior as default)

## Tasks / Subtasks

- [x] Task 1: Modify exercises query for equipment filtering (AC: #1, #2, #3)
  - [x] 1.1: Add `equipmentIds` parameter to `exercises.list` query args
  - [x] 1.2: When equipmentIds provided, filter exercises where `exercise.equipmentId` is in the array
  - [x] 1.3: When equipmentIds is empty/undefined, return all exercises (no filter)
  - [x] 1.4: Ensure server-side filtering for <100ms performance

- [x] Task 2: Create gym lookup query (AC: #1)
  - [x] 2.1: Add `get()` query to `convex/queries/gyms.ts`
  - [x] 2.2: Accept gymId parameter
  - [x] 2.3: Return gym with equipmentIds array
  - [x] 2.4: Verify user ownership

- [x] Task 3: Update exercises page to use equipment filter (AC: #1, #4)
  - [x] 3.1: Add state for selectedGymId (initialized from user's defaultGymId)
  - [x] 3.2: Fetch selected gym's equipmentIds
  - [x] 3.3: Pass equipmentIds to exercises query
  - [x] 3.4: Handle null gymId (All Equipment = no filter)

- [x] Task 4: Test filtering with real data (AC: #2, #3)
  - [x] 4.1: Create test gym with subset of equipment
  - [x] 4.2: Verify exercises are correctly filtered
  - [x] 4.3: Measure query performance (<100ms target)

## Dev Notes

### Architecture Compliance

**Modified Exercises Query** (`convex/queries/exercises.ts`):
```typescript
export const list = query({
  args: {
    equipmentId: v.optional(v.id("equipment")),
    equipmentIds: v.optional(v.array(v.id("equipment"))), // NEW: for gym filtering
    level: v.optional(LevelEnumValidator),
    categoryId: v.optional(v.id("categories")),
    primaryMuscleId: v.optional(v.id("muscles")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("exercises");

    // Apply equipment filter from gym
    if (args.equipmentIds && args.equipmentIds.length > 0) {
      // Filter exercises where equipmentId is in the gym's equipment list
      const exercises = await query.collect();
      const filtered = exercises.filter(
        (ex) => ex.equipmentId && args.equipmentIds!.includes(ex.equipmentId)
      );
      // Apply pagination manually after filtering
      // ... pagination logic
    }

    // Existing filters...
    if (args.equipmentId) {
      query = query.filter((q) => q.eq(q.field("equipmentId"), args.equipmentId));
    }

    // ... rest of existing logic
  },
});
```

**Alternative: More Efficient Filtering**
```typescript
// If performance is critical, consider:
// 1. Pre-compute exercises per equipment in a denormalized table
// 2. Use Convex search index if available
// 3. Client-side filtering for small result sets
```

**Gym Get Query** (`convex/queries/gyms.ts`):
```typescript
export const get = query({
  args: {
    id: v.id("gyms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const gym = await ctx.db.get(args.id);

    if (!gym || gym.userId !== userId) {
      return null;
    }

    return gym;
  },
});
```

### Technical Requirements

**Exercises Page State Management:**
```typescript
// In app/exercises/page.tsx or component
const [selectedGymId, setSelectedGymId] = useState<Id<"gyms"> | null>(null);

// Fetch user's default gym on mount
const userProfile = useQuery(api.queries.userProfiles.getCurrent);
useEffect(() => {
  if (userProfile?.profile?.defaultGymId) {
    setSelectedGymId(userProfile.profile.defaultGymId);
  }
}, [userProfile]);

// Fetch selected gym's equipment
const selectedGym = useQuery(
  api.queries.gyms.get,
  selectedGymId ? { id: selectedGymId } : "skip"
);

// Pass to exercises query
const exercises = useQuery(api.queries.exercises.list, {
  equipmentIds: selectedGym?.equipmentIds,
  paginationOpts: { numItems: 20, cursor: null },
});
```

### File Structure Requirements

**Modified Files:**
- `convex/queries/exercises.ts` - Add equipmentIds filter
- `convex/queries/gyms.ts` - Add get() query
- `app/exercises/page.tsx` - Add gym filter state and pass to query

### Performance Considerations

**Server-Side Filtering:**
- Convex queries run on server, ensuring <100ms response
- Filter applied before pagination for correct results
- With 800+ exercises, filtering is still fast in Convex

**Client-Side Fallback:**
- If server filtering proves complex, client-side filter is acceptable
- All 800 exercises load quickly via Convex
- Client filter maintains <100ms perceived performance

### Dependencies

- **Depends on:** Story 1.1 (gyms table), Story 1.5 (defaultGymId)
- **Enables:** Story 2.2 (filter indicator), Story 2.3 (gym switching)

### References

- [Source: architecture.md#Data Architecture] - Server-side filtering decision
- [Source: architecture.md#API Design] - exercises.listByGym pattern
- [Source: epics.md#Story 2.1] - Original acceptance criteria
- [Source: prd.md#Exercise Filtering] - FR10, FR14, NFR1

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Added `equipmentIds` parameter to exercises.list, exercises.search, exercises.listCount, and exercises.searchCount queries
- Equipment filtering includes bodyweight exercises (no equipment) plus exercises matching gym equipment
- Created `get()` query in gyms.ts with ownership verification
- Updated exercises page with selectedGymId state, initialized from user's defaultGymId
- Gym's equipmentIds passed to exercise queries for server-side filtering
- Null gymId = "All Equipment" (no filtering applied)
- Build verified successfully

### File List

- [x] `convex/queries/exercises.ts` (modified - add equipmentIds filter to all queries)
- [x] `convex/queries/gyms.ts` (modified - add get query)
- [x] `app/exercises/page.tsx` (modified - add filter state and gym equipment integration)
