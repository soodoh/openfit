# Story 2.2: Display Gym Filter Indicator

Status: review

## Story

As a **user**,
I want **to see which gym is currently filtering my exercise results**,
so that **I understand why certain exercises appear or don't appear**.

## Acceptance Criteria

1. **AC1: Filter Indicator Visible**
   - **Given** I am on the exercises page
   - **When** the page loads
   - **Then** I see a filter indicator badge showing my current gym filter (FR11)
   - **And** the badge displays the gym name (e.g., "Home Gym") or "All Equipment"

2. **AC2: Default Gym Applied**
   - **Given** my default gym is set
   - **When** I open the exercises page
   - **Then** the filter indicator shows my default gym name (FR16)

3. **AC3: All Equipment State**
   - **Given** my default gym is null
   - **When** I open the exercises page
   - **Then** the filter indicator shows "All Equipment"

4. **AC4: Screen Reader Accessibility**
   - **Given** a screen reader user navigates to the filter
   - **When** they focus on the filter indicator
   - **Then** the current filter state is announced (NFR8)

## Tasks / Subtasks

- [x] Task 1: Create GymFilterDropdown component - badge portion (AC: #1, #3)
  - [x] 1.1: Create `components/gyms/GymFilterDropdown.tsx`
  - [x] 1.2: Display Badge with gym name or "All Equipment"
  - [x] 1.3: Add filter icon (Dumbbell or Filter) before text
  - [x] 1.4: Add dropdown chevron indicator after text
  - [x] 1.5: Style with primary color for active filter

- [x] Task 2: Implement accessibility (AC: #4)
  - [x] 2.1: Add ARIA live region for filter changes
  - [x] 2.2: Add appropriate aria-label to badge
  - [x] 2.3: Ensure focus is visible on badge

- [x] Task 3: Integrate into exercises page (AC: #1, #2, #3)
  - [x] 3.1: Place GymFilterDropdown near search input
  - [x] 3.2: Pass selectedGymId and gym data as props
  - [x] 3.3: Initialize with user's defaultGymId

- [x] Task 4: Handle loading states (AC: #1)
  - [x] 4.1: Show skeleton/loading state while fetching gym
  - [x] 4.2: Handle case where gym is deleted (fallback to All Equipment)

## Dev Notes

### Architecture Compliance

**GymFilterDropdown Component Structure:**
```typescript
interface GymFilterDropdownProps {
  selectedGymId: Id<"gyms"> | null;
  selectedGymName: string | null; // null = "All Equipment"
  userGyms: Gym[];
  onGymChange: (gymId: Id<"gyms"> | null) => void;
}

export function GymFilterDropdown({
  selectedGymId,
  selectedGymName,
  userGyms,
  onGymChange,
}: GymFilterDropdownProps) {
  const displayName = selectedGymName ?? "All Equipment";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          aria-label={`Filtering by ${displayName}. Click to change.`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>{displayName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      {/* Dropdown content in Story 2.3 */}
    </DropdownMenu>
  );
}
```

### Technical Requirements

**Badge Styling:**
- Use `Button variant="outline"` for clickable appearance
- Include Dumbbell icon for gym context
- Include ChevronDown to indicate dropdown
- Use `gap-2` for icon spacing

**ARIA Requirements:**
```typescript
// Live region for announcements
<div aria-live="polite" className="sr-only">
  {`Now filtering by ${displayName}`}
</div>

// Button accessibility
<Button
  aria-label={`Filtering exercises by ${displayName}. Click to change gym.`}
  aria-haspopup="menu"
  aria-expanded={isOpen}
>
```

### File Structure Requirements

**New Files:**
```
components/gyms/
└── GymFilterDropdown.tsx
```

**Modified Files:**
- `app/exercises/page.tsx` - Add GymFilterDropdown

### UI/UX Requirements

**Filter Badge Placement:**
```
┌─────────────────────────────────────────┐
│ Exercise Search                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔍 Search exercises...              │ │
│ └─────────────────────────────────────┘ │
│ ┌───────────────────┐                   │
│ │ 🏋️ Home Gym    ▾ │  ← Filter badge   │
│ └───────────────────┘                   │
│                                         │
│ Results...                              │
└─────────────────────────────────────────┘
```

**Badge Variants:**

| State | Display |
|-------|---------|
| Gym selected | `🏋️ Home Gym ▾` |
| All Equipment | `🏋️ All Equipment ▾` |
| Loading | Skeleton badge |

### Dependencies

- **Depends on:** Story 2.1 (filter state management)
- **Enables:** Story 2.3 (dropdown functionality)

### References

- [Source: ux-design-specification.md#Flow 1: Exercise Search with Filter] - UI wireframe
- [Source: architecture.md#Frontend Architecture] - Filter state design
- [Source: epics.md#Story 2.2] - Original acceptance criteria
- [Source: prd.md#Accessibility] - NFR8 (screen reader)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Created GymFilterDropdown component with Button showing Dumbbell icon, gym name, and chevron
- Added ARIA live region for screen reader announcements on filter changes
- Button has descriptive aria-label for accessibility
- Integrated into exercises page between search bar and other filters
- Loading state shows spinner with disabled button
- Fallback to "All Equipment" when no gym selected or gym deleted
- Vertical separator added between gym filter and other filters for visual clarity

### File List

- [x] `components/gyms/GymFilterDropdown.tsx` (new)
- [x] `app/exercises/page.tsx` (modified - integrate component)
