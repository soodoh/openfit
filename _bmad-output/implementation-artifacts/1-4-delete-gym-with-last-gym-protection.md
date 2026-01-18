# Story 1.4: Delete Gym with Last-Gym Protection

Status: done

## Story

As a **user**,
I want **to delete a gym I no longer use**,
so that **my gym list stays relevant and uncluttered**.

## Acceptance Criteria

1. **AC1: Delete Confirmation**
   - **Given** I click "Delete" from the gym menu
   - **When** the delete confirmation modal opens
   - **Then** I see the gym name and a warning about the action being permanent

2. **AC2: Successful Deletion**
   - **Given** I confirm deletion of a gym
   - **When** I have more than one gym
   - **Then** the gym is deleted and removed from my list
   - **And** the operation completes within 500ms (NFR4)

3. **AC3: Last Gym Protection**
   - **Given** I try to delete my only remaining gym
   - **When** I click "Delete"
   - **Then** I see an error message explaining I cannot delete my last gym (FR5)
   - **And** the delete action is blocked

4. **AC4: Default Gym Reset**
   - **Given** the deleted gym was my default gym
   - **When** the deletion completes
   - **Then** my default gym is reset to null (All Equipment behavior)

5. **AC5: Cancel Deletion**
   - **Given** I am in the delete confirmation modal
   - **When** I click "Cancel"
   - **Then** the modal closes and the gym is not deleted

## Tasks / Subtasks

- [x] Task 1: Add remove mutation with protection (AC: #2, #3, #4)
  - [x] 1.1: Add `remove()` mutation to `convex/mutations/gyms.ts`
  - [x] 1.2: Count user's gyms before deletion
  - [x] 1.3: Throw error if gym count is 1 (last gym protection)
  - [x] 1.4: Check if gym is user's default, reset defaultGymId to null if so (deferred to Story 1-5 when defaultGymId field is added)
  - [x] 1.5: Verify ownership before allowing delete

- [x] Task 2: Create DeleteGymModal component (AC: #1, #5)
  - [x] 2.1: Create `components/gyms/DeleteGymModal.tsx`
  - [x] 2.2: Display gym name in confirmation message
  - [x] 2.3: Show warning text about permanent deletion
  - [x] 2.4: Add Cancel and Delete buttons
  - [x] 2.5: Style Delete button as destructive

- [x] Task 3: Handle deletion errors (AC: #3)
  - [x] 3.1: Catch "last gym" error from mutation
  - [x] 3.2: Display user-friendly error message in modal
  - [x] 3.3: Keep modal open on error to allow user to cancel

- [x] Task 4: Wire up DeleteGymModal in GymMenu (AC: #1)
  - [x] 4.1: Import DeleteGymModal into GymMenu
  - [x] 4.2: Control modal state from GymMenu
  - [x] 4.3: Pass gym to DeleteGymModal

## Dev Notes

### Architecture Compliance

**Remove Mutation with Protection:**
```typescript
export const remove = mutation({
  args: {
    id: v.id("gyms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Verify ownership
    const gym = await ctx.db.get(args.id);
    if (!gym || gym.userId !== userId) {
      throw new Error("Gym not found or unauthorized");
    }

    // Count user's gyms
    const userGyms = await ctx.db
      .query("gyms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (userGyms.length <= 1) {
      throw new Error("Cannot delete your last gym");
    }

    // Check if this is the default gym
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile?.defaultGymId === args.id) {
      // Reset default to null (All Equipment)
      await ctx.db.patch(profile._id, {
        defaultGymId: undefined,
      });
    }

    // Delete the gym
    await ctx.db.delete(args.id);

    return args.id;
  },
});
```

### Technical Requirements

**DeleteGymModal Component:**
```typescript
interface DeleteGymModalProps {
  open: boolean;
  onClose: () => void;
  gym: Gym;
}
```

**Error Handling Pattern:**
```typescript
try {
  await removeGym({ id: gym._id });
  onClose();
} catch (error) {
  if (error.message === "Cannot delete your last gym") {
    setError("You cannot delete your only gym. Create another gym first.");
  } else {
    setError("Failed to delete gym. Please try again.");
  }
}
```

### File Structure Requirements

**New Files:**
```
components/gyms/
└── DeleteGymModal.tsx
```

**Modified Files:**
- `convex/mutations/gyms.ts` - Add remove mutation
- `components/gyms/GymMenu.tsx` - Wire up DeleteGymModal

### UI/UX Requirements

**DeleteGymModal Layout:**
```
┌─────────────────────────────────────────┐
│ Delete Gym                          [X] │
│ ─────────────────────────────────────── │
│                                         │
│ Are you sure you want to delete         │
│ "Home Gym"?                             │
│                                         │
│ ⚠️ This action cannot be undone.        │
│                                         │
│ [Cancel]              [Delete Gym] (red)│
└─────────────────────────────────────────┘
```

**Last Gym Error State:**
```
┌─────────────────────────────────────────┐
│ Delete Gym                          [X] │
│ ─────────────────────────────────────── │
│                                         │
│ ⛔ Cannot Delete Last Gym               │
│                                         │
│ You cannot delete your only gym.        │
│ Create another gym first.               │
│                                         │
│ [Close]                                 │
└─────────────────────────────────────────┘
```

### Dependencies

- **Depends on:** Story 1.3 (GymMenu component)
- **Enables:** Safe gym management with data integrity

### References

- [Source: architecture.md#Code Patterns] - Ownership verification
- [Source: epics.md#Story 1.4] - Original acceptance criteria
- [Source: prd.md#Gym Management] - FR5 (cannot delete last gym)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Added `remove()` mutation with ownership verification and last-gym protection
- Created DeleteGymModal with confirmation dialog and error handling
- Error state shows user-friendly message when trying to delete last gym
- Wired DeleteGymModal into GymMenu
- Note: Default gym reset (AC4) deferred to Story 1-5 when defaultGymId field is added

### File List

- [x] `convex/mutations/gyms.ts` (modified - add remove)
- [x] `components/gyms/DeleteGymModal.tsx` (new)
- [x] `components/gyms/GymMenu.tsx` (modified - wire up delete)
