---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-01-18'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# open-fit - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for open-fit, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Gym Management**

| ID | Requirement |
|----|-------------|
| FR1 | Users can create a new gym with a name |
| FR2 | Users can edit an existing gym's name |
| FR3 | Users can delete a gym they created |
| FR4 | Users can view all their gyms in profile settings |
| FR5 | Users cannot delete their last remaining gym |

**Equipment Configuration**

| ID | Requirement |
|----|-------------|
| FR6 | Users can add equipment to a gym from the available equipment list |
| FR7 | Users can remove equipment from a gym |
| FR8 | Users can view equipment grouped by category |
| FR9 | Users can search/filter equipment by name |

**Exercise Filtering**

| ID | Requirement |
|----|-------------|
| FR10 | Users can see exercise search results filtered by selected gym's equipment |
| FR11 | Users can see which gym is currently filtering results (filter indicator) |
| FR12 | Users can switch to a different gym for filtering via dropdown |
| FR13 | Users can select "All Equipment" to see unfiltered exercise results |
| FR14 | System filters exercises where exercise equipment matches gym's equipment list |

**User Preferences**

| ID | Requirement |
|----|-------------|
| FR15 | Users can set a default gym in their profile |
| FR16 | System uses user's default gym as initial filter when searching exercises |

**New User & Migration**

| ID | Requirement |
|----|-------------|
| FR17 | System creates an "All Equipment" gym for new users on registration |
| FR18 | System sets the "All Equipment" gym as default for new users |
| FR19 | System creates "All Equipment" gym for existing users who have no gyms (migration) |

### NonFunctional Requirements

**Performance**

| ID | Requirement | Target |
|----|-------------|--------|
| NFR1 | Exercise search with gym filter responds quickly | <100ms |
| NFR2 | Gym dropdown switch triggers new results immediately | <200ms |
| NFR3 | Equipment list loads without blocking UI | <200ms |
| NFR4 | Gym CRUD operations complete without noticeable delay | <500ms |

**Accessibility**

| ID | Requirement | Standard |
|----|-------------|----------|
| NFR5 | All new UI components meet accessibility standards | WCAG 2.1 AA |
| NFR6 | Gym selector dropdown supports keyboard navigation | Arrow keys, Enter, Escape |
| NFR7 | Equipment checkboxes are keyboard accessible | Space to toggle, Tab to navigate |
| NFR8 | Filter indicator is announced to screen readers | ARIA live region |
| NFR9 | Focus management is logical when switching gyms | Focus returns to search input |

### Additional Requirements

**From Architecture:**

- Brownfield project - no starter template, integrate with existing codebase
- Must use existing stack: Next.js 16.1.1, React 19.2.3, Convex 1.31.3, shadcn/ui
- Add `gyms` table to `convex/schema.ts` with fields: userId, name, equipmentIds[], updatedAt
- Add `defaultGymId` field to `userProfiles` table (null = "All Equipment")
- Create `convex/queries/gyms.ts` for list() and get() queries
- Create `convex/mutations/gyms.ts` for create(), update(), remove() mutations
- Extend `exercises.list` query with equipmentIds filter parameter
- All queries/mutations must use `getAuthenticatedUserId(ctx)` for auth
- All queries must use `.withIndex("by_user", ...)` for user-scoping
- Virtual "All Equipment" via null gymId (no data migration needed)
- Server-side Convex filtering for performance

**From Architecture - New Components:**

- `components/gyms/GymCard.tsx` - Gym display card for profile settings
- `components/gyms/GymFormModal.tsx` - Create/Edit gym dialog
- `components/gyms/GymFilterDropdown.tsx` - Badge + dropdown for exercise search
- `components/gyms/EquipmentSelector.tsx` - Command search + grouped checkboxes
- `components/gyms/DeleteGymModal.tsx` - Delete confirmation with protection logic
- `components/gyms/GymMenu.tsx` - DropdownMenu with Edit/Delete options

**From Architecture - Modified Files:**

- `convex/schema.ts` - Add gyms table, add defaultGymId to userProfiles
- `convex/queries/exercises.ts` - Add equipmentIds filter parameter
- `convex/mutations/userProfiles.ts` - Add setDefaultGym mutation
- `app/exercises/page.tsx` - Integrate GymFilterDropdown component
- `components/profile/ProfileModal.tsx` - Add "My Gyms" section

**From UX Design:**

- Mobile-first touch interactions (primary usage is at gym)
- Touch targets minimum 44x44px for mobile
- 1-tap gym switching with instant results
- Badge + dropdown pattern for GymFilterDropdown
- Command search + grouped checkboxes for EquipmentSelector
- Dark/light mode support (existing ThemeProvider)
- Filter indicator must clearly show active gym state
- "All Equipment" escape hatch always visible and accessible
- Follow existing patterns: Dialog for modals, DropdownMenu for menus, Card for gym display
- Equipment organized by category (Free Weights, Machines, Cables, etc.)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Create gym with name |
| FR2 | Epic 1 | Edit gym name |
| FR3 | Epic 1 | Delete gym |
| FR4 | Epic 1 | View all gyms in settings |
| FR5 | Epic 1 | Cannot delete last gym |
| FR6 | Epic 1 | Add equipment to gym |
| FR7 | Epic 1 | Remove equipment from gym |
| FR8 | Epic 1 | View equipment by category |
| FR9 | Epic 1 | Search/filter equipment |
| FR10 | Epic 2 | Filter exercises by gym equipment |
| FR11 | Epic 2 | See filter indicator |
| FR12 | Epic 2 | Switch gyms via dropdown |
| FR13 | Epic 2 | Select "All Equipment" |
| FR14 | Epic 2 | System filters by equipment match |
| FR15 | Epic 1 | Set default gym |
| FR16 | Epic 2 | System uses default gym initially |
| FR17 | Epic 1 | Create "All Equipment" for new users |
| FR18 | Epic 1 | Set "All Equipment" as default for new users |
| FR19 | Epic 1 | Create "All Equipment" for existing users (migration) |

**Coverage Summary:**
- **Epic 1:** 13 FRs (FR1-FR9, FR15, FR17-FR19)
- **Epic 2:** 6 FRs (FR10-FR14, FR16)
- **Total:** 19/19 FRs covered

## Epic List

### Epic 1: Gym Management & Configuration

**Goal:** Enable users to create, configure, and manage their custom gym profiles with specific equipment lists.

**User Outcomes:**
- Create gyms with custom names (e.g., "Home Gym", "Commercial Gym", "Hotel Gym")
- Select equipment from a categorized, searchable list
- Edit gym names and equipment at any time
- Delete gyms (with protection for last gym)
- View all gyms in profile settings
- Set a default gym for automatic filtering
- New users start with seamless "All Equipment" default (no setup required)

**FRs Covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR15, FR17, FR18, FR19

**Implementation Notes:**
- Requires schema changes (gyms table, userProfiles extension)
- New components: GymCard, GymFormModal, GymMenu, DeleteGymModal, EquipmentSelector
- Integration with ProfileModal for "My Gyms" section
- Virtual "All Equipment" via null defaultGymId (no data migration)

### Epic 2: Exercise Filtering by Gym Equipment

**Goal:** Enable users to filter exercise search results based on their selected gym's available equipment, making exercise discovery relevant and efficient.

**User Outcomes:**
- See only exercises performable with current gym's equipment
- Clear visual indicator showing which gym is filtering results
- Quick gym switching via dropdown (1 tap)
- "All Equipment" escape hatch always accessible
- Default gym applied automatically when searching exercises

**FRs Covered:** FR10, FR11, FR12, FR13, FR14, FR16

**Implementation Notes:**
- Requires exercise query modification for equipment filtering
- New component: GymFilterDropdown (Badge + DropdownMenu)
- Integration with exercises page
- Server-side Convex filtering for <100ms performance

---

## Epic 1: Gym Management & Configuration

### Story 1.1: Display My Gyms in Profile Settings

**As a** user,
**I want** to view all my gyms in profile settings,
**So that** I can see what gym configurations I have and manage them.

**Acceptance Criteria:**

**Given** I am logged in and open profile settings
**When** I navigate to the "My Gyms" section
**Then** I see a list of all my gyms with their names
**And** each gym card shows the count of equipment selected (e.g., "12 equipment items")

**Given** I have no gyms created yet
**When** I view the "My Gyms" section
**Then** I see an empty state with an "Add Gym" call-to-action

**Given** I am viewing my gyms
**When** the page loads
**Then** the gym list loads within 500ms (NFR4)

**Technical Notes:**
- Creates `gyms` table in `convex/schema.ts`
- Creates `convex/queries/gyms.ts` with `list()` query
- Creates `components/gyms/GymCard.tsx`
- Modifies `components/profile/ProfileModal.tsx` to add "My Gyms" section

---

### Story 1.2: Create New Gym with Equipment Selection

**As a** user,
**I want** to create a new gym with a name and select equipment from a categorized list,
**So that** I can define what equipment is available at that location.

**Acceptance Criteria:**

**Given** I am in the "My Gyms" section
**When** I click "Add Gym"
**Then** a modal opens with a name input field and equipment selector

**Given** I am creating a new gym
**When** I enter a gym name (e.g., "Home Gym")
**Then** the name field accepts the input and validates it is not empty

**Given** I am selecting equipment
**When** I view the equipment selector
**Then** equipment is grouped by category (Free Weights, Machines, Cables, Benches, etc.)
**And** I can expand/collapse each category

**Given** I am selecting equipment
**When** I search for equipment by name (e.g., "dumbbell")
**Then** the list filters to show only matching equipment (FR9)
**And** results appear within 200ms (NFR3)

**Given** I am selecting equipment
**When** I check/uncheck equipment items
**Then** the selection updates immediately
**And** checkboxes are keyboard accessible (Space to toggle, Tab to navigate) (NFR7)

**Given** I have entered a name and selected equipment
**When** I click "Save Gym"
**Then** the gym is created and appears in my gym list
**And** the modal closes
**And** the operation completes within 500ms (NFR4)

**Given** I try to save without a gym name
**When** I click "Save Gym"
**Then** I see a validation error and the gym is not created

**Technical Notes:**
- Creates `convex/mutations/gyms.ts` with `create()` mutation
- Creates `components/gyms/GymFormModal.tsx`
- Creates `components/gyms/EquipmentSelector.tsx` (Command search + grouped checkboxes)
- Uses existing `equipment` table data for the selector

---

### Story 1.3: Edit Gym Name and Equipment

**As a** user,
**I want** to edit my gym's name and equipment list,
**So that** I can keep my gym configuration up to date as my equipment changes.

**Acceptance Criteria:**

**Given** I am viewing my gym list
**When** I click the menu icon (three dots) on a gym card
**Then** I see a dropdown menu with "Edit" and "Delete" options

**Given** I click "Edit" on a gym
**When** the edit modal opens
**Then** the gym name field is pre-populated with the current name
**And** the equipment selector shows my currently selected equipment as checked

**Given** I am editing a gym
**When** I change the gym name
**Then** the name field accepts the new value

**Given** I am editing equipment
**When** I check additional equipment items
**Then** those items are added to my gym's equipment list (FR6)

**Given** I am editing equipment
**When** I uncheck equipment items
**Then** those items are removed from my gym's equipment list (FR7)

**Given** I have made changes to my gym
**When** I click "Save"
**Then** the gym is updated with the new name and equipment
**And** the modal closes
**And** the gym card reflects the changes immediately
**And** the operation completes within 500ms (NFR4)

**Given** I am editing a gym
**When** I click "Cancel" or close the modal
**Then** no changes are saved and the gym remains unchanged

**Technical Notes:**
- Creates `convex/mutations/gyms.ts` `update()` mutation
- Creates `components/gyms/GymMenu.tsx` (DropdownMenu with Edit/Delete)
- Reuses `GymFormModal.tsx` in edit mode
- Updates `GymCard.tsx` to include GymMenu

---

### Story 1.4: Delete Gym with Last-Gym Protection

**As a** user,
**I want** to delete a gym I no longer use,
**So that** my gym list stays relevant and uncluttered.

**Acceptance Criteria:**

**Given** I click "Delete" from the gym menu
**When** the delete confirmation modal opens
**Then** I see the gym name and a warning about the action being permanent

**Given** I confirm deletion of a gym
**When** I have more than one gym
**Then** the gym is deleted and removed from my list
**And** the operation completes within 500ms (NFR4)

**Given** I try to delete my only remaining gym
**When** I click "Delete"
**Then** I see an error message explaining I cannot delete my last gym (FR5)
**And** the delete action is blocked

**Given** the deleted gym was my default gym
**When** the deletion completes
**Then** my default gym is reset to null (All Equipment behavior)

**Given** I am in the delete confirmation modal
**When** I click "Cancel"
**Then** the modal closes and the gym is not deleted

**Technical Notes:**
- Creates `convex/mutations/gyms.ts` `remove()` mutation with last-gym protection
- Creates `components/gyms/DeleteGymModal.tsx`
- Mutation checks gym count before allowing deletion

---

### Story 1.5: Set Default Gym with All-Equipment Fallback

**As a** user,
**I want** to set a default gym for exercise filtering,
**So that** my preferred location is automatically used when searching exercises.

**Acceptance Criteria:**

**Given** I am viewing my gym list
**When** I look at a gym card
**Then** the default gym shows a visual indicator (star icon or "Default" badge)

**Given** I want to change my default gym
**When** I click "Set as Default" on a gym card (or via menu)
**Then** that gym becomes my default
**And** the previous default gym loses its indicator
**And** the change is saved immediately

**Given** I am a new user who has never created a gym
**When** I use the app
**Then** my defaultGymId is null, which means "All Equipment" (FR17, FR18)
**And** I can use the full exercise library without any setup

**Given** I am an existing user with no gyms
**When** the system checks my profile
**Then** null defaultGymId is treated as "All Equipment" (FR19)
**And** no migration or gym creation is required

**Given** I delete my default gym
**When** the deletion completes
**Then** my defaultGymId is set to null (All Equipment fallback)

**Technical Notes:**
- Adds `defaultGymId: v.optional(v.id("gyms"))` to `userProfiles` in schema
- Creates `convex/mutations/userProfiles.ts` `setDefaultGym()` mutation
- Updates `GymCard.tsx` to show default indicator and "Set as Default" action
- null = "All Equipment" is a design decision, not stored data

---

## Epic 2: Exercise Filtering by Gym Equipment

### Story 2.1: Filter Exercises by Gym Equipment

**As a** user,
**I want** to see exercise search results filtered by my selected gym's equipment,
**So that** I only see exercises I can actually perform.

**Acceptance Criteria:**

**Given** I have a gym with specific equipment selected
**When** I search for exercises with that gym's filter active
**Then** I only see exercises that use equipment in my gym's list (FR10, FR14)
**And** exercises requiring equipment I don't have are hidden

**Given** I search for exercises
**When** results are filtered by gym equipment
**Then** the filter is applied server-side
**And** results return within 100ms (NFR1)

**Given** I have a gym with dumbbells and a bench
**When** I search "chest exercises"
**Then** I see dumbbell press, dumbbell fly, etc.
**And** I do NOT see cable fly, barbell bench (unless I have those)

**Given** my default gym is null (All Equipment)
**When** I search for exercises
**Then** I see all exercises without any equipment filtering (FR13 behavior as default)

**Technical Notes:**
- Modifies `convex/queries/exercises.ts` to accept `equipmentIds` filter parameter
- Server-side filtering using Convex query with equipment matching
- Query checks if exercise.equipmentId is in the provided equipmentIds array

---

### Story 2.2: Display Gym Filter Indicator

**As a** user,
**I want** to see which gym is currently filtering my exercise results,
**So that** I understand why certain exercises appear or don't appear.

**Acceptance Criteria:**

**Given** I am on the exercises page
**When** the page loads
**Then** I see a filter indicator badge showing my current gym filter (FR11)
**And** the badge displays the gym name (e.g., "Home Gym") or "All Equipment"

**Given** my default gym is set
**When** I open the exercises page
**Then** the filter indicator shows my default gym name (FR16)

**Given** my default gym is null
**When** I open the exercises page
**Then** the filter indicator shows "All Equipment"

**Given** a screen reader user navigates to the filter
**When** they focus on the filter indicator
**Then** the current filter state is announced (NFR8)

**Technical Notes:**
- Creates `components/gyms/GymFilterDropdown.tsx` (Badge portion)
- Integrates into `app/exercises/page.tsx`
- Uses user's `defaultGymId` to initialize filter state
- ARIA live region for screen reader announcements

---

### Story 2.3: Switch Gym Filter via Dropdown

**As a** user,
**I want** to quickly switch to a different gym for filtering,
**So that** I can find exercises for my current location without changing settings.

**Acceptance Criteria:**

**Given** I click/tap the gym filter badge
**When** the dropdown opens
**Then** I see a list of all my gyms plus "All Equipment" option (FR12, FR13)
**And** my currently selected gym has a checkmark

**Given** the dropdown is open
**When** I select a different gym
**Then** the filter updates immediately
**And** exercise results refresh with the new filter
**And** the switch completes within 200ms (NFR2)
**And** the dropdown closes

**Given** I select "All Equipment"
**When** the filter updates
**Then** I see all exercises without equipment filtering (FR13)
**And** the badge updates to show "All Equipment"

**Given** I am using keyboard navigation
**When** I open the dropdown
**Then** I can navigate with arrow keys and select with Enter (NFR6)
**And** Escape closes the dropdown

**Given** I switch gyms
**When** the results refresh
**Then** focus returns to the search input or filter badge (NFR9)

**Given** I switch gyms during a search session
**When** I navigate away from the exercises page
**Then** the filter resets to my default gym (session-only state per PRD)

**Technical Notes:**
- Completes `components/gyms/GymFilterDropdown.tsx` (DropdownMenu portion)
- Local React state for selected gym (not persisted)
- Initializes from user's `defaultGymId`
- Triggers new exercise query with updated equipmentIds
