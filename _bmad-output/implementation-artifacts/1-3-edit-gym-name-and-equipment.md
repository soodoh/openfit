# Story 1.3: Edit Gym Name and Equipment

Status: review

## Story

As a **user**,
I want **to edit my gym's name and equipment list**,
so that **I can keep my gym configuration up to date as my equipment changes**.

## Acceptance Criteria

1. **AC1: Gym Menu**
   - **Given** I am viewing my gym list
   - **When** I click the menu icon (three dots) on a gym card
   - **Then** I see a dropdown menu with "Edit" and "Delete" options

2. **AC2: Edit Modal Pre-populated**
   - **Given** I click "Edit" on a gym
   - **When** the edit modal opens
   - **Then** the gym name field is pre-populated with the current name
   - **And** the equipment selector shows my currently selected equipment as checked

3. **AC3: Edit Name**
   - **Given** I am editing a gym
   - **When** I change the gym name
   - **Then** the name field accepts the new value

4. **AC4: Add Equipment**
   - **Given** I am editing equipment
   - **When** I check additional equipment items
   - **Then** those items are added to my gym's equipment list (FR6)

5. **AC5: Remove Equipment**
   - **Given** I am editing equipment
   - **When** I uncheck equipment items
   - **Then** those items are removed from my gym's equipment list (FR7)

6. **AC6: Save Changes**
   - **Given** I have made changes to my gym
   - **When** I click "Save"
   - **Then** the gym is updated with the new name and equipment
   - **And** the modal closes
   - **And** the gym card reflects the changes immediately
   - **And** the operation completes within 500ms (NFR4)

7. **AC7: Cancel Edit**
   - **Given** I am editing a gym
   - **When** I click "Cancel" or close the modal
   - **Then** no changes are saved and the gym remains unchanged

## Tasks / Subtasks

- [x] Task 1: Add update mutation (AC: #6)
  - [x] 1.1: Add `update()` mutation to `convex/mutations/gyms.ts`
  - [x] 1.2: Verify ownership before allowing update
  - [x] 1.3: Include `updatedAt: Date.now()` on update
  - [x] 1.4: Validate name is not empty

- [x] Task 2: Create GymMenu component (AC: #1)
  - [x] 2.1: Create `components/gyms/GymMenu.tsx`
  - [x] 2.2: Use DropdownMenu with MoreVertical trigger
  - [x] 2.3: Add "Edit" menu item with Edit icon
  - [x] 2.4: Add "Delete" menu item with Trash2 icon (red/destructive)
  - [x] 2.5: Manage modal state for Edit and Delete

- [x] Task 3: Update GymFormModal for edit mode (AC: #2, #3, #4, #5, #6, #7)
  - [x] 3.1: Accept optional `gym` prop for edit mode
  - [x] 3.2: Pre-populate name and equipment from gym prop
  - [x] 3.3: Change title to "Edit Gym" when editing
  - [x] 3.4: Call update mutation instead of create when gym prop exists
  - [x] 3.5: Handle cancel without saving

- [x] Task 4: Integrate GymMenu into GymCard (AC: #1)
  - [x] 4.1: Add GymMenu to GymCard header
  - [x] 4.2: Position menu button in top-right corner
  - [x] 4.3: Pass gym data to menu for edit/delete operations

## Dev Notes

### Architecture Compliance

**Update Mutation Pattern:**
```typescript
export const update = mutation({
  args: {
    id: v.id("gyms"),
    name: v.string(),
    equipmentIds: v.array(v.id("equipment")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Verify ownership
    const gym = await ctx.db.get(args.id);
    if (!gym || gym.userId !== userId) {
      throw new Error("Gym not found or unauthorized");
    }

    // Validate name
    if (!args.name.trim()) {
      throw new Error("Gym name is required");
    }

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      equipmentIds: args.equipmentIds,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
```

### Technical Requirements

**GymMenu Component:**
```typescript
interface GymMenuProps {
  gym: Gym;
}

// Uses enum pattern from EditRoutineMenu:
enum Modal {
  EDIT = "edit",
  DELETE = "delete",
}
```

**GymFormModal Edit Mode:**
```typescript
// When gym prop is provided:
// - Title: "Edit Gym" instead of "Create New Gym"
// - Name input: defaultValue={gym.name}
// - EquipmentSelector: selectedIds={gym.equipmentIds}
// - Save button calls update() instead of create()
```

### File Structure Requirements

**New Files:**
```
components/gyms/
└── GymMenu.tsx
```

**Modified Files:**
- `convex/mutations/gyms.ts` - Add update mutation
- `components/gyms/GymFormModal.tsx` - Support edit mode
- `components/gyms/GymCard.tsx` - Add GymMenu

### UI/UX Requirements

**GymMenu Dropdown:**
```
┌─────────────────────┐
│ ✏️ Edit             │
│ ─────────────────── │
│ 🗑️ Delete (red)     │
└─────────────────────┘
```

**Menu Button Position:**
- Top-right corner of GymCard header
- Uses `Button variant="ghost" size="icon"`
- Icon: `MoreVertical` from lucide-react

### Dependencies

- **Depends on:** Story 1.1 (GymCard), Story 1.2 (GymFormModal, EquipmentSelector)
- **Enables:** Story 1.4 (Delete Gym - GymMenu triggers delete)

### References

- [Source: architecture.md#Code Patterns] - Ownership verification
- [Source: epics.md#Story 1.3] - Original acceptance criteria
- [Source: components/routines/EditRoutineMenu.tsx] - Menu pattern to follow

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Added `update()` mutation with ownership verification and validation
- Created GymMenu with DropdownMenu following EditRoutineMenu pattern
- Updated GymFormModal to support edit mode with pre-populated values
- Integrated GymMenu into GymCard header
- All ACs satisfied: menu, pre-populated edit modal, save/cancel functionality

### File List

- [x] `convex/mutations/gyms.ts` (modified - add update)
- [x] `components/gyms/GymMenu.tsx` (new)
- [x] `components/gyms/GymFormModal.tsx` (modified - edit mode)
- [x] `components/gyms/GymCard.tsx` (modified - add menu)
