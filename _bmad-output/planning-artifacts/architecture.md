---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/development-guide.md
  - docs/api-contracts.md
  - docs/data-models.md
  - docs/component-inventory.md
  - docs/source-tree-analysis.md
workflowType: 'architecture'
project_name: 'open-fit'
user_name: 'Paul'
date: '2026-01-18'
feature: 'Gym/Equipment Management'
lastStep: 8
status: 'complete'
completedAt: '2026-01-18'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
19 requirements across 5 categories:
- **Gym Management (FR1-5):** CRUD operations for user gyms with deletion protection
- **Equipment Configuration (FR6-9):** Equipment selection with categories and search
- **Exercise Filtering (FR10-14):** Filter exercises by gym equipment with visible indicator
- **User Preferences (FR15-16):** Default gym setting persisted in profile
- **Migration (FR17-19):** "All Equipment" gym for new/existing users

**Non-Functional Requirements:**

| Requirement | Target | Architectural Impact |
|-------------|--------|---------------------|
| Exercise filter response | <100ms | Server-side Convex query with equipment filter |
| Gym switch response | <200ms | Client-side state triggers new query |
| Accessibility | WCAG 2.1 AA | Keyboard navigation, ARIA labels, focus management |

**Scale & Complexity:**
- Primary domain: Full-stack web application
- Complexity level: Low (brownfield feature addition)
- New components needed: 4 (GymFilterDropdown, EquipmentSelector, GymCard, GymFormModal)

### Technical Constraints & Dependencies

| Constraint | Details |
|------------|---------|
| **Existing Tech Stack** | Must use Next.js 16, React 19, Convex, shadcn/ui |
| **Existing Data Model** | `equipment` and `exercises.equipmentId` already exist |
| **Real-time Sync** | Convex reactive queries - gym changes must reflect immediately |
| **Component Patterns** | Must follow established Dialog, DropdownMenu, Card patterns |

### Cross-Cutting Concerns Identified

| Concern | Impact |
|---------|--------|
| **Data Migration** | Existing users need "All Equipment" gym created on first access |
| **User Preferences** | Default gym stored in `userProfiles` table |
| **Exercise Search Integration** | GymFilterDropdown must integrate with existing search UI |
| **ProfileModal Extension** | "My Gyms" section added to existing profile settings |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (brownfield feature addition)

### Existing Foundation Analysis

This is a **brownfield project** with an established technology stack. No starter template selection is needed — the architectural foundation already exists.

**Established Stack:**

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | Next.js | 16.1.1 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.9.3 |
| Backend | Convex | 1.31.3 |
| Styling | Tailwind CSS | 3.4.19 |
| UI Components | shadcn/ui (Radix UI) | various |
| Package Manager | pnpm | 10.27.0 |

**Architectural Decisions Already Made:**

| Decision | Implementation |
|----------|----------------|
| **Component Organization** | Domain-specific folders (`components/routines/`, `components/sessions/`) |
| **Backend Pattern** | Convex queries/mutations with user-scoped data access |
| **State Management** | Convex reactive queries (no Redux needed) |
| **UI Patterns** | shadcn/ui primitives composed into domain components |
| **Real-time Sync** | Convex WebSocket subscriptions |
| **Auth Pattern** | Convex Auth with JWT, protected routes via middleware |

**Implication for Gym Feature:**

All new code must follow these established patterns:
- New Convex tables in `convex/schema.ts`
- New queries in `convex/queries/gyms.ts`
- New mutations in `convex/mutations/gyms.ts`
- New components in `components/gyms/`
- Use existing shadcn/ui primitives (Dialog, DropdownMenu, Badge, etc.)

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Gym data model with embedded equipment IDs
- Server-side exercise filtering in Convex
- Default gym storage in userProfiles

**Important Decisions (Shape Architecture):**
- Virtual "All Equipment" via null gymId
- Local state for gym filter in exercise search
- Hybrid equipment selector UI

**Deferred Decisions (Post-MVP):**
- Location-based gym auto-selection
- Gym sharing between users

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Gym Model** | `gyms` table with `equipmentIds: Id<"equipment">[]` | Document model, fast reads, no joins |
| **Exercise Filtering** | Server-side Convex query with equipment filter | <100ms performance with 800+ exercises |
| **Default Gym Storage** | `defaultGymId` field on `userProfiles` table | Follows existing pattern, single query |

**New Table Schema:**

```typescript
gyms: defineTable({
  userId: v.id("users"),
  name: v.string(),
  equipmentIds: v.array(v.id("equipment")),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
```

**userProfiles Extension:**

```typescript
defaultGymId: v.optional(v.id("gyms"))  // null = "All Equipment"
```

### Migration Strategy

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Existing Users** | No migration needed | `null` defaultGymId = show all equipment |
| **New Users** | defaultGymId starts as `null` | Automatic "All Equipment" behavior |
| **"All Equipment"** | Virtual option (null = no filter) | No data to maintain, cleaner queries |

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Filter State** | React local state in search component | Session-only per PRD, resets on navigation |
| **State Initialization** | Initialize from user's defaultGymId | Respects user preference |
| **Equipment Selector** | Command search + grouped checkboxes | Matches UX spec, searchable + browsable |

### API Design

**New Queries:**
- `gyms.list` — List user's gyms
- `gyms.get` — Get single gym with equipment
- `exercises.listByGym` — Filter exercises by gym equipment (or extend existing `exercises.list`)

**New Mutations:**
- `gyms.create` — Create gym with name and equipment
- `gyms.update` — Update gym name/equipment
- `gyms.remove` — Delete gym (with last-gym protection)
- `userProfiles.setDefaultGym` — Set default gym preference

### Decision Impact Analysis

**Implementation Sequence:**
1. Schema changes (gyms table, userProfiles extension)
2. Convex queries/mutations for gyms
3. Exercise filtering query modification
4. GymFilterDropdown component
5. EquipmentSelector component
6. Gym management UI in ProfileModal

## Implementation Patterns & Consistency Rules

### Pattern Inheritance

This feature inherits all existing patterns from the open-fit codebase. The following rules ensure AI agents implement consistently.

### Naming Patterns

**Convex Database:**

| Element | Convention | Gym Feature Example |
|---------|------------|---------------------|
| Table names | Plural, lowercase | `gyms` |
| Field names | camelCase | `userId`, `equipmentIds`, `updatedAt` |
| Foreign keys | `[entity]Id` | `gymId`, `equipmentId` |
| Indexes | `by_[field]` | `by_user` |

**File & Component Naming:**

| Element | Convention | Gym Feature Example |
|---------|------------|---------------------|
| Component files | PascalCase.tsx | `GymCard.tsx`, `GymFormModal.tsx` |
| Component folders | lowercase plural | `components/gyms/` |
| Query files | lowercase entity | `convex/queries/gyms.ts` |
| Mutation files | lowercase entity | `convex/mutations/gyms.ts` |

**API Naming:**

| Element | Convention | Gym Feature Example |
|---------|------------|---------------------|
| Queries | `entity.action` | `gyms.list`, `gyms.get` |
| Mutations | `entity.action` | `gyms.create`, `gyms.update`, `gyms.remove` |

### Structure Patterns

**File Locations:**

```
components/gyms/
├── GymCard.tsx
├── GymFormModal.tsx
├── GymFilterDropdown.tsx
├── EquipmentSelector.tsx
├── DeleteGymModal.tsx
└── GymMenu.tsx

convex/
├── queries/gyms.ts
└── mutations/gyms.ts
```

**Component Composition:**
- Modals use `Dialog` from `components/ui/dialog`
- Dropdowns use `DropdownMenu` from `components/ui/dropdown-menu`
- Cards use `Card` from `components/ui/card`
- Forms use `Input`, `Button`, `Checkbox` from `components/ui/`

### Code Patterns

**Authentication (MANDATORY):**

```typescript
// Every query and mutation must start with:
const userId = await getAuthenticatedUserId(ctx);
```

**User-Scoped Queries:**

```typescript
// Always filter by userId:
.withIndex("by_user", (q) => q.eq("userId", userId))
```

**Ownership Verification (Mutations):**

```typescript
// Before modifying, verify ownership:
const gym = await ctx.db.get(args.id);
if (!gym || gym.userId !== userId) {
  throw new Error("Not found or unauthorized");
}
```

**Timestamp Updates:**

```typescript
// Include on create and update:
updatedAt: Date.now()
```

### UI Patterns

**Modal Pattern:**

```typescript
// Follow existing pattern from EditRoutineModal, DeleteSessionModal
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>...</DialogTitle></DialogHeader>
    {/* Form content */}
    <DialogFooter>{/* Actions */}</DialogFooter>
  </DialogContent>
</Dialog>
```

**Menu Pattern:**

```typescript
// Follow existing pattern from EditRoutineMenu, EditDayMenu
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreVertical /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Direct `ctx.db.query()` without user filter | Always use `withIndex("by_user", ...)` |
| Creating new UI primitives | Use existing shadcn/ui components |
| Storing filter state globally | Use React local state for session-only filters |
| Checking auth inline in each function | Use `getAuthenticatedUserId(ctx)` helper |
| snake_case in TypeScript | Use camelCase consistently |

## Project Structure & Boundaries

### New Files for Gym Feature

```
components/gyms/
├── GymCard.tsx                # Gym display card for profile settings
├── GymFormModal.tsx           # Create/Edit gym dialog (name + equipment)
├── GymFilterDropdown.tsx      # Badge + dropdown for exercise search filter
├── EquipmentSelector.tsx      # Command search + grouped checkboxes
├── DeleteGymModal.tsx         # Delete confirmation with protection logic
└── GymMenu.tsx                # DropdownMenu with Edit/Delete options

convex/queries/
└── gyms.ts                    # list(), get() queries

convex/mutations/
└── gyms.ts                    # create(), update(), remove() mutations
```

### Modified Files

| File | Modification |
|------|--------------|
| `convex/schema.ts` | Add `gyms` table definition |
| `convex/schema.ts` | Add `defaultGymId` to `userProfiles` |
| `convex/queries/exercises.ts` | Add `equipmentIds` filter parameter |
| `convex/mutations/userProfiles.ts` | Add `setDefaultGym` mutation |
| `app/exercises/page.tsx` | Integrate `GymFilterDropdown` component |
| `components/profile/ProfileModal.tsx` | Add "My Gyms" section |

### Requirements to Structure Mapping

| FR Category | Primary Files |
|-------------|---------------|
| **Gym Management (FR1-5)** | `mutations/gyms.ts`, `GymFormModal.tsx`, `DeleteGymModal.tsx` |
| **Equipment Config (FR6-9)** | `EquipmentSelector.tsx`, `queries/gyms.ts` |
| **Exercise Filtering (FR10-14)** | `GymFilterDropdown.tsx`, `queries/exercises.ts` |
| **User Preferences (FR15-16)** | `mutations/userProfiles.ts`, `GymCard.tsx` |

### Component Integration Map

```
ProfileModal.tsx
└── [My Gyms Section]
    ├── GymCard.tsx (for each gym)
    │   └── GymMenu.tsx
    │       ├── → GymFormModal.tsx (edit)
    │       └── → DeleteGymModal.tsx (delete)
    └── [Add Gym Button]
        └── → GymFormModal.tsx (create)
            └── EquipmentSelector.tsx

app/exercises/page.tsx
└── GymFilterDropdown.tsx
    └── [Dropdown Menu]
        ├── User's gyms (from gyms.list query)
        └── "All Equipment" option (null)
```

### Data Flow

```
User selects gym in filter
    ↓
GymFilterDropdown updates local state (selectedGymId)
    ↓
exercises.list query called with equipmentIds from selected gym
    ↓
Convex filters exercises server-side
    ↓
Filtered results render in exercise list
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All architectural decisions are compatible with the existing open-fit codebase. The gym feature uses the same Convex document model, authentication patterns, and UI components as existing features.

**Pattern Consistency:**
Implementation patterns directly inherit from established codebase conventions. No new patterns are introduced — only extensions of existing ones.

**Structure Alignment:**
New files follow the established domain-folder organization. Integration points use existing components (ProfileModal, exercises page).

### Requirements Coverage Validation ✅

**Functional Requirements:**
All 19 functional requirements across 5 categories have clear architectural support:
- Gym CRUD → `mutations/gyms.ts` + modal components
- Equipment Config → `EquipmentSelector` + queries
- Exercise Filtering → `GymFilterDropdown` + server-side filter
- User Preferences → `userProfiles.defaultGymId`
- Migration → null = all equipment (zero migration)

**Non-Functional Requirements:**
- Performance: Server-side Convex filtering ensures <100ms response
- Accessibility: shadcn/ui provides WCAG 2.1 AA compliant primitives
- Real-time: Convex reactive queries auto-update on gym changes

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical decisions documented with rationale
- Technology versions verified from existing codebase
- Integration patterns mapped to specific components

**Pattern Completeness:**
- Code examples provided for auth, queries, mutations, modals
- Anti-patterns documented to prevent common mistakes
- File locations explicitly specified

### Architecture Completeness Checklist

- [x] Project context analyzed
- [x] Requirements mapped to components
- [x] Data model designed (gyms table, userProfiles extension)
- [x] API design complete (queries + mutations)
- [x] Component structure defined
- [x] Integration points mapped
- [x] Patterns documented with examples
- [x] Anti-patterns identified

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Leverages existing patterns — minimal learning curve
- No migration needed — null = all equipment is elegant
- Server-side filtering ensures performance
- Clear file structure for implementation

**First Implementation Priority:**
1. Add `gyms` table to `convex/schema.ts`
2. Add `defaultGymId` to `userProfiles` in schema
3. Create `convex/queries/gyms.ts` and `convex/mutations/gyms.ts`
4. Build components in `components/gyms/`

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-18
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 8 architectural decisions made
- 5 implementation patterns defined
- 6 new components + 2 Convex files specified
- 19 requirements fully supported

**AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing the Gym/Equipment Management feature. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Priority:**
1. Add `gyms` table to `convex/schema.ts`
2. Add `defaultGymId` to `userProfiles` in schema
3. Create `convex/queries/gyms.ts` and `convex/mutations/gyms.ts`
4. Build components in `components/gyms/`

**Development Sequence:**
1. Schema changes (gyms table, userProfiles extension)
2. Convex queries/mutations for gyms
3. Exercise filtering query modification
4. GymFilterDropdown component
5. EquipmentSelector component
6. Gym management UI in ProfileModal

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

