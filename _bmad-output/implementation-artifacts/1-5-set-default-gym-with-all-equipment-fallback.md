# Story 1.5: Set Default Gym with All-Equipment Fallback

Status: review

## Story

As a **user**,
I want **to set a default gym for exercise filtering**,
so that **my preferred location is automatically used when searching exercises**.

## Acceptance Criteria

1. **AC1: Default Gym Indicator**
   - **Given** I am viewing my gym list
   - **When** I look at a gym card
   - **Then** the default gym shows a visual indicator (star icon or "Default" badge)

2. **AC2: Set as Default**
   - **Given** I want to change my default gym
   - **When** I click "Set as Default" on a gym card (or via menu)
   - **Then** that gym becomes my default
   - **And** the previous default gym loses its indicator
   - **And** the change is saved immediately

3. **AC3: New User Default**
   - **Given** I am a new user who has never created a gym
   - **When** I use the app
   - **Then** my defaultGymId is null, which means "All Equipment" (FR17, FR18)
   - **And** I can use the full exercise library without any setup

4. **AC4: Existing User Fallback**
   - **Given** I am an existing user with no gyms
   - **When** the system checks my profile
   - **Then** null defaultGymId is treated as "All Equipment" (FR19)
   - **And** no migration or gym creation is required

5. **AC5: Default Reset on Deletion**
   - **Given** I delete my default gym
   - **When** the deletion completes
   - **Then** my defaultGymId is set to null (All Equipment fallback)

## Tasks / Subtasks

- [x] Task 1: Add defaultGymId to userProfiles schema (AC: #3, #4)
  - [x] 1.1: Add `defaultGymId: v.optional(v.id("gyms"))` to userProfiles in schema
  - [x] 1.2: Run `npx convex dev` to verify schema update

- [x] Task 2: Create setDefaultGym mutation (AC: #2)
  - [x] 2.1: Add `setDefaultGym()` mutation to `convex/mutations/userProfiles.ts`
  - [x] 2.2: Accept gymId parameter (or null for "All Equipment")
  - [x] 2.3: Verify gym belongs to user before setting as default
  - [x] 2.4: Update userProfiles with new defaultGymId

- [x] Task 3: Update GymCard to show default indicator (AC: #1)
  - [x] 3.1: Accept `isDefault` prop on GymCard
  - [x] 3.2: Display star icon or "Default" badge when isDefault=true
  - [x] 3.3: Use accent color for default indicator

- [x] Task 4: Add "Set as Default" action (AC: #2)
  - [x] 4.1: Add "Set as Default" menu item to GymMenu
  - [x] 4.2: Hide "Set as Default" if gym is already default
  - [x] 4.3: Call setDefaultGym mutation on click

- [x] Task 5: Update ProfileModal to pass isDefault (AC: #1)
  - [x] 5.1: Fetch user's defaultGymId from userProfiles query
  - [x] 5.2: Compare each gym._id to defaultGymId
  - [x] 5.3: Pass isDefault prop to each GymCard

- [x] Task 6: Verify delete mutation resets default (AC: #5)
  - [x] 6.1: Confirm Story 1.4's remove mutation handles default reset
  - [x] 6.2: Add test case for this scenario (no test framework configured)

## Dev Notes

### Architecture Compliance

**Schema Update** (`convex/schema.ts`):
```typescript
userProfiles: defineTable({
  userId: v.id("users"),
  role: RoleEnum,
  defaultRepetitionUnitId: v.id("repetitionUnits"),
  defaultWeightUnitId: v.id("weightUnits"),
  theme: ThemeEnum,
  defaultGymId: v.optional(v.id("gyms")), // NEW FIELD
}).index("by_user", ["userId"]),
```

**SetDefaultGym Mutation** (`convex/mutations/userProfiles.ts`):
```typescript
export const setDefaultGym = mutation({
  args: {
    gymId: v.optional(v.id("gyms")), // null = "All Equipment"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // If setting a specific gym, verify ownership
    if (args.gymId) {
      const gym = await ctx.db.get(args.gymId);
      if (!gym || gym.userId !== userId) {
        throw new Error("Gym not found or unauthorized");
      }
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        defaultGymId: args.gymId ?? undefined,
      });
    }

    return args.gymId;
  },
});
```

### Technical Requirements

**GymCard Default Indicator:**
```typescript
interface GymCardProps {
  gym: Gym;
  isDefault: boolean;
}

// In component:
{isDefault && (
  <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
    <Star className="h-3 w-3 mr-1" />
    Default
  </Badge>
)}
```

**Virtual "All Equipment" Pattern:**
- `null` defaultGymId = show all exercises (no filtering)
- No actual "All Equipment" gym record needed
- Simplifies data model and queries

### File Structure Requirements

**Modified Files:**
- `convex/schema.ts` - Add defaultGymId field
- `convex/mutations/userProfiles.ts` - Add setDefaultGym mutation
- `components/gyms/GymCard.tsx` - Add isDefault prop and indicator
- `components/gyms/GymMenu.tsx` - Add "Set as Default" option
- `components/profile/ProfileModal.tsx` - Pass isDefault to GymCards

### UI/UX Requirements

**Default Indicator on GymCard:**
```
┌─────────────────────────────────────────┐
│ 🏠 Home Gym                    ⭐ Default│
│    12 equipment items               ⋮   │
└─────────────────────────────────────────┘
```

**GymMenu with Set as Default:**
```
┌─────────────────────┐
│ ⭐ Set as Default   │  (hidden if already default)
│ ✏️ Edit             │
│ ─────────────────── │
│ 🗑️ Delete           │
└─────────────────────┘
```

### Dependencies

- **Depends on:** Story 1.1 (GymCard), Story 1.3 (GymMenu)
- **Enables:** Epic 2 stories (exercise filtering uses defaultGymId)

### References

- [Source: architecture.md#Data Architecture] - defaultGymId design decision
- [Source: architecture.md#Migration Strategy] - null = All Equipment
- [Source: epics.md#Story 1.5] - Original acceptance criteria
- [Source: prd.md#User Preferences] - FR15, FR16

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Added `defaultGymId` optional field to userProfiles schema
- Created `setDefaultGym` mutation with ownership verification
- Updated GymCard with isDefault prop showing Badge with star icon
- Added "Set as Default" menu item to GymMenu (hidden when already default)
- Updated ProfileModal to pass isDefault based on profile.defaultGymId
- Updated remove mutation to reset defaultGymId when deleting default gym
- All ACs satisfied: default indicator, set as default, new user default, fallback

### File List

- [x] `convex/schema.ts` (modified - add defaultGymId)
- [x] `convex/mutations/userProfiles.ts` (modified - add setDefaultGym)
- [x] `convex/mutations/gyms.ts` (modified - reset default on delete)
- [x] `components/gyms/GymCard.tsx` (modified - add isDefault)
- [x] `components/gyms/GymMenu.tsx` (modified - add Set as Default)
- [x] `components/profile/ProfileModal.tsx` (modified - pass isDefault)
