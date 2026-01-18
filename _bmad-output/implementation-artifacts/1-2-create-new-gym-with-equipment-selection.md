# Story 1.2: Create New Gym with Equipment Selection

Status: review

## Story

As a **user**,
I want **to create a new gym with a name and select equipment from a categorized list**,
so that **I can define what equipment is available at that location**.

## Acceptance Criteria

1. **AC1: Add Gym Button**
   - **Given** I am in the "My Gyms" section
   - **When** I click "Add Gym"
   - **Then** a modal opens with a name input field and equipment selector

2. **AC2: Gym Name Input**
   - **Given** I am creating a new gym
   - **When** I enter a gym name (e.g., "Home Gym")
   - **Then** the name field accepts the input and validates it is not empty

3. **AC3: Equipment Grouped by Category**
   - **Given** I am selecting equipment
   - **When** I view the equipment selector
   - **Then** equipment is grouped by category (Free Weights, Machines, Cables, Benches, etc.)
   - **And** I can expand/collapse each category

4. **AC4: Equipment Search**
   - **Given** I am selecting equipment
   - **When** I search for equipment by name (e.g., "dumbbell")
   - **Then** the list filters to show only matching equipment (FR9)
   - **And** results appear within 200ms (NFR3)

5. **AC5: Equipment Selection**
   - **Given** I am selecting equipment
   - **When** I check/uncheck equipment items
   - **Then** the selection updates immediately
   - **And** checkboxes are keyboard accessible (Space to toggle, Tab to navigate) (NFR7)

6. **AC6: Save Gym**
   - **Given** I have entered a name and selected equipment
   - **When** I click "Save Gym"
   - **Then** the gym is created and appears in my gym list
   - **And** the modal closes
   - **And** the operation completes within 500ms (NFR4)

7. **AC7: Validation Error**
   - **Given** I try to save without a gym name
   - **When** I click "Save Gym"
   - **Then** I see a validation error and the gym is not created

## Tasks / Subtasks

- [x] Task 1: Create gyms mutation file (AC: #6)
  - [x] 1.1: Create `convex/mutations/gyms.ts`
  - [x] 1.2: Implement `create()` mutation with validation
  - [x] 1.3: Include `updatedAt: Date.now()` on creation
  - [x] 1.4: Verify ownership pattern with `userId`

- [x] Task 2: Create EquipmentSelector component (AC: #3, #4, #5)
  - [x] 2.1: Create `components/gyms/EquipmentSelector.tsx`
  - [x] 2.2: Fetch all equipment using existing lookups query
  - [x] 2.3: Group equipment by category (use equipment.category or derive from name patterns)
  - [x] 2.4: Implement Command search from shadcn/ui for filtering
  - [x] 2.5: Implement expandable/collapsible category sections
  - [x] 2.6: Use Checkbox components with keyboard accessibility
  - [x] 2.7: Track selected equipment IDs in local state

- [x] Task 3: Create GymFormModal component (AC: #1, #2, #6, #7)
  - [x] 3.1: Create `components/gyms/GymFormModal.tsx`
  - [x] 3.2: Implement Dialog with name Input field
  - [x] 3.3: Integrate EquipmentSelector component
  - [x] 3.4: Add form validation (name required)
  - [x] 3.5: Show validation error with AlertCircle icon
  - [x] 3.6: Call create mutation on save
  - [x] 3.7: Close modal on successful save

- [x] Task 4: Wire up Add Gym button in ProfileModal (AC: #1)
  - [x] 4.1: Add state for controlling GymFormModal open/close
  - [x] 4.2: Connect "Add Gym" button to open modal
  - [x] 4.3: Refetch gym list after creation

## Dev Notes

### Architecture Compliance

**CRITICAL: This story creates the core gym creation flow. Future stories (1.3 Edit, 1.4 Delete) will reuse GymFormModal.**

**Mutation Pattern** (`convex/mutations/gyms.ts`):
```typescript
export const create = mutation({
  args: {
    name: v.string(),
    equipmentIds: v.array(v.id("equipment")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    // Validate name
    if (!args.name.trim()) {
      throw new Error("Gym name is required");
    }

    const gymId = await ctx.db.insert("gyms", {
      userId,
      name: args.name.trim(),
      equipmentIds: args.equipmentIds,
      updatedAt: Date.now(),
    });

    return gymId;
  },
});
```

### Technical Requirements

**EquipmentSelector Component:**
- Use `Command` from shadcn/ui for searchable list
- Use `Collapsible` for category expand/collapse
- Use `Checkbox` for selection with proper ARIA attributes
- Props: `selectedIds: Id<"equipment">[]`, `onSelectionChange: (ids) => void`

**Equipment Categories** (derive from existing data or hardcode initially):
- Free Weights (Dumbbells, Barbell, EZ Curl Bar, Kettlebells)
- Machines (Leg Press, Chest Press, Lat Pulldown, etc.)
- Cables (Cable Machine, Cable Crossover)
- Benches (Flat Bench, Incline Bench, Decline Bench)
- Cardio (Treadmill, Bike, Rowing Machine)
- Other (Pull-up Bar, Resistance Bands, etc.)

**GymFormModal Structure:**
```typescript
interface GymFormModalProps {
  open: boolean;
  onClose: () => void;
  gym?: Gym; // For edit mode (Story 1.3)
}
```

### File Structure Requirements

**New Files:**
```
components/gyms/
├── GymFormModal.tsx
└── EquipmentSelector.tsx

convex/mutations/
└── gyms.ts
```

**Modified Files:**
- `components/profile/ProfileModal.tsx` - Wire up Add Gym button

### UI/UX Requirements

**GymFormModal Layout:**
```
┌─────────────────────────────────────────┐
│ Create New Gym                      [X] │
│ ─────────────────────────────────────── │
│ Gym Name                                │
│ ┌─────────────────────────────────────┐ │
│ │ Home Gym                            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Equipment                               │
│ ┌─────────────────────────────────────┐ │
│ │ 🔍 Search equipment...              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ▼ Free Weights                          │
│   ☑ Dumbbells                           │
│   ☑ Barbell                             │
│   ☐ EZ Curl Bar                         │
│                                         │
│ ▸ Machines (collapsed)                  │
│                                         │
│ [Cancel]                    [Save Gym]  │
└─────────────────────────────────────────┘
```

**Accessibility:**
- All checkboxes keyboard accessible (Space to toggle)
- Tab navigation through categories and items
- Search input auto-focuses on modal open
- Error messages announced to screen readers

### Dependencies

- **Depends on:** Story 1.1 (gyms table schema, GymCard component)
- **Enables:** Story 1.3 (Edit Gym - reuses GymFormModal)

### References

- [Source: architecture.md#API Design] - Mutation patterns
- [Source: ux-design-specification.md#Flow 3: Equipment Selection] - UI wireframe
- [Source: epics.md#Story 1.2] - Original acceptance criteria
- [Source: prd.md#Equipment Configuration] - FR6-FR9

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Created `convex/mutations/gyms.ts` with authenticated `create()` mutation including validation
- Created `EquipmentSelector.tsx` with searchable, categorized equipment list using Collapsible and Checkbox
- Equipment auto-categorized by name patterns (Free Weights, Machines, Cables, etc.)
- Created `GymFormModal.tsx` with Dialog, name input, validation, and EquipmentSelector integration
- Wired Add Gym button in ProfileModal to open GymFormModal
- Convex reactive queries auto-refresh gym list after creation
- All ACs satisfied: Add Gym button, name validation, categorized equipment, search, checkboxes, save

### File List

- [x] `convex/mutations/gyms.ts` (new)
- [x] `components/gyms/GymFormModal.tsx` (new)
- [x] `components/gyms/EquipmentSelector.tsx` (new)
- [x] `components/profile/ProfileModal.tsx` (modified)
