# Story 2.3: Switch Gym Filter via Dropdown

Status: review

## Story

As a **user**,
I want **to quickly switch to a different gym for filtering**,
so that **I can find exercises for my current location without changing settings**.

## Acceptance Criteria

1. **AC1: Dropdown Opens**
   - **Given** I click/tap the gym filter badge
   - **When** the dropdown opens
   - **Then** I see a list of all my gyms plus "All Equipment" option (FR12, FR13)
   - **And** my currently selected gym has a checkmark

2. **AC2: Select Different Gym**
   - **Given** the dropdown is open
   - **When** I select a different gym
   - **Then** the filter updates immediately
   - **And** exercise results refresh with the new filter
   - **And** the switch completes within 200ms (NFR2)
   - **And** the dropdown closes

3. **AC3: Select All Equipment**
   - **Given** I select "All Equipment"
   - **When** the filter updates
   - **Then** I see all exercises without equipment filtering (FR13)
   - **And** the badge updates to show "All Equipment"

4. **AC4: Keyboard Navigation**
   - **Given** I am using keyboard navigation
   - **When** I open the dropdown
   - **Then** I can navigate with arrow keys and select with Enter (NFR6)
   - **And** Escape closes the dropdown

5. **AC5: Focus Management**
   - **Given** I switch gyms
   - **When** the results refresh
   - **Then** focus returns to the search input or filter badge (NFR9)

6. **AC6: Session-Only State**
   - **Given** I switch gyms during a search session
   - **When** I navigate away from the exercises page
   - **Then** the filter resets to my default gym (session-only state per PRD)

## Tasks / Subtasks

- [x] Task 1: Complete GymFilterDropdown with dropdown menu (AC: #1)
  - [x] 1.1: Add DropdownMenuContent to GymFilterDropdown
  - [x] 1.2: Map user's gyms to DropdownMenuItem components
  - [x] 1.3: Add "All Equipment" option at bottom with separator
  - [x] 1.4: Show checkmark on currently selected item

- [x] Task 2: Implement gym switching (AC: #2, #3)
  - [x] 2.1: Call onGymChange callback when item selected
  - [x] 2.2: Update selectedGymId state in parent
  - [x] 2.3: Trigger new exercises query with updated equipmentIds
  - [x] 2.4: Close dropdown after selection

- [x] Task 3: Implement keyboard navigation (AC: #4)
  - [x] 3.1: Verify DropdownMenu default keyboard support works
  - [x] 3.2: Test arrow keys, Enter, Escape functionality
  - [x] 3.3: Add any custom keyboard handling if needed

- [x] Task 4: Implement focus management (AC: #5)
  - [x] 4.1: After gym switch, return focus to filter badge
  - [x] 4.2: Optionally return focus to search input for continued search

- [x] Task 5: Verify session-only state behavior (AC: #6)
  - [x] 5.1: Confirm state is local React state (not persisted)
  - [x] 5.2: Confirm navigation away resets to defaultGymId
  - [x] 5.3: Test page refresh resets filter

## Dev Notes

### Architecture Compliance

**Complete GymFilterDropdown Component:**
```typescript
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

      <DropdownMenuContent align="start" className="w-56">
        {userGyms.map((gym) => (
          <DropdownMenuItem
            key={gym._id}
            onClick={() => onGymChange(gym._id)}
            className="flex items-center justify-between"
          >
            <span>{gym.name}</span>
            {selectedGymId === gym._id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => onGymChange(null)}
          className="flex items-center justify-between"
        >
          <span>All Equipment</span>
          {selectedGymId === null && (
            <Check className="h-4 w-4" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Technical Requirements

**Exercises Page Integration:**
```typescript
// In app/exercises/page.tsx
const [selectedGymId, setSelectedGymId] = useState<Id<"gyms"> | null>(null);

// Initialize from user's default
const userProfile = useQuery(api.queries.userProfiles.getCurrent);
useEffect(() => {
  if (userProfile?.profile) {
    setSelectedGymId(userProfile.profile.defaultGymId ?? null);
  }
}, [userProfile?.profile]);

// Fetch all user gyms for dropdown
const userGyms = useQuery(api.queries.gyms.list) ?? [];

// Get selected gym details
const selectedGym = userGyms.find((g) => g._id === selectedGymId);

// Handle gym change
const handleGymChange = (gymId: Id<"gyms"> | null) => {
  setSelectedGymId(gymId);
  // Query will automatically update with new equipmentIds
};

return (
  <GymFilterDropdown
    selectedGymId={selectedGymId}
    selectedGymName={selectedGym?.name ?? null}
    userGyms={userGyms}
    onGymChange={handleGymChange}
  />
);
```

**Session-Only State:**
- Uses React `useState` - not persisted to database
- Resets when component unmounts (navigation away)
- Initialized from `defaultGymId` on each mount
- This is intentional per PRD requirements

### File Structure Requirements

**Modified Files:**
- `components/gyms/GymFilterDropdown.tsx` - Complete dropdown functionality
- `app/exercises/page.tsx` - Wire up gym switching

### UI/UX Requirements

**Dropdown Menu:**
```
┌─────────────────────────┐
│ ✓ Home Gym              │
│   Commercial Gym        │
│   Hotel Gym             │
│ ─────────────────────── │
│   All Equipment         │
└─────────────────────────┘
```

**Interaction Details:**
- Click outside → close dropdown
- Escape key → close dropdown
- Arrow keys → navigate items
- Enter/Space → select item
- Touch: tap to select

**Performance:**
- Dropdown opens instantly (local state)
- Gym switch updates query within 200ms
- Results stream in via Convex real-time

### Dependencies

- **Depends on:** Story 2.1 (filter logic), Story 2.2 (badge component)
- **Completes:** Epic 2 (Exercise Filtering by Gym Equipment)

### References

- [Source: ux-design-specification.md#Flow 1: Exercise Search with Filter] - Dropdown wireframe
- [Source: architecture.md#Frontend Architecture] - Session-only state
- [Source: epics.md#Story 2.3] - Original acceptance criteria
- [Source: prd.md#Accessibility] - NFR6 (keyboard), NFR9 (focus)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Dropdown menu shows all user gyms with checkmark on selected item
- "All Equipment" option at bottom with separator
- onClick handlers call onGymChange callback
- Parent component updates selectedGymId state triggering query refresh
- Radix DropdownMenu provides keyboard navigation (arrow keys, Enter, Escape)
- Focus returns to trigger button after selection (default Radix behavior)
- State is local React useState - resets on navigation/refresh
- State initialized from user's defaultGymId on component mount
- Build verified successfully

### File List

- [x] `components/gyms/GymFilterDropdown.tsx` (modified - complete dropdown)
- [x] `app/exercises/page.tsx` (modified - wire up switching)
