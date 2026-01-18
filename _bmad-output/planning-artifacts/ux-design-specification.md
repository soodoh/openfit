---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-core-experience
  - step-04-emotional-response
  - step-05-inspiration
  - step-06-design-system
  - step-07-defining-experience
  - step-08-visual-foundation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/component-inventory.md
feature: "Gym/Equipment Management"
---

# UX Design Specification - open-fit

**Author:** Paul
**Date:** 2026-01-18
**Feature:** Gym/Equipment Management

---

## Executive Summary

### Project Vision

**Feature:** Gym/Equipment Management for open-fit

Adding gym-based exercise filtering to an existing fitness tracking app. Users define custom "gyms" with their available equipment, then the exercise library automatically filters to show only exercises they can perform.

**Core Value:** Relevance + Discovery - users find exercises they can actually do, and discover new ones they didn't know were possible with their equipment.

### Target Users

| User Type | Context | Primary Need |
|-----------|---------|--------------|
| **Multi-gym user** | Works out at home AND commercial gym | Quick context switching |
| **Home gym owner** | Limited equipment (dumbbells, bench, pull-up bar) | See only what they can do |
| **Traveler** | Uses unpredictable hotel gyms | Routines that work anywhere |

**User Characteristics:**
- Already using open-fit for workout tracking
- Tech-savvy enough to use a fitness app
- Primarily mobile users (workouts at gym)
- Want speed during active workouts

### Key Design Challenges

| Challenge | Impact |
|-----------|--------|
| **Equipment selection complexity** | 50+ equipment types to choose from - needs smart grouping |
| **Filter visibility vs. intrusiveness** | Users need to know filter is active, but it shouldn't dominate |
| **Mid-workout speed** | Switching gyms or showing all must be instant (1-2 taps max) |
| **Integration with existing UI** | New features must feel native to current app |

### Design Opportunities

| Opportunity | Potential |
|-------------|-----------|
| **Discovery moments** | "You can do 12 tricep exercises with just dumbbells!" |
| **Progressive disclosure** | Start with "All Equipment", gradually encourage gym setup |
| **Smart defaults** | New users start with everything - no friction |

---

## Core User Experience

### Defining Experience

**Core User Action:** Searching for exercises and seeing only those they can do at their current gym.

**Critical to get right:** The gym filter dropdown in exercise search - this is the primary touchpoint for the entire feature.

### Platform Strategy

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Platform** | Web (Next.js) | Existing app |
| **Primary interaction** | Touch (mobile at gym) | Users are mid-workout |
| **Secondary** | Desktop (routine planning) | Home planning sessions |
| **Offline** | Not required | Convex real-time sync |

### Effortless Interactions

| Interaction | Should Feel Like... |
|-------------|---------------------|
| **Default filtering** | "It just knows what I have" |
| **Gym switching** | 1 tap, instant results |
| **Equipment setup** | "5 minutes and done forever" |
| **Show all** | Instant escape hatch, no friction |

### Critical Success Moments

| Moment | Experience |
|--------|------------|
| **First filtered search** | "Wait, these are all things I can actually do!" |
| **Discovery** | "I didn't know I could do THAT with dumbbells" |
| **Mid-workout switch** | "That was easy" (tap → new results → done) |
| **Gym setup complete** | "Now my app understands my gym" |

### Experience Principles

1. **Filter First, Ask Later** - Filtering is on by default; users opt-out, not opt-in
2. **Speed Over Precision** - Mid-workout, fast matters more than perfect
3. **Invisible When Working** - Feature fades into background once set up
4. **Escape Hatch Always** - "All Equipment" is always one tap away

---

## Desired Emotional Response

### Primary Emotional Goals

| Emotion | When | Why It Matters |
|---------|------|----------------|
| **Confidence** | Searching exercises | "I know I can do all of these" |
| **Efficiency** | Mid-workout | "That took 2 seconds, not 2 minutes" |
| **Discovery** | Finding new exercises | "I didn't know I could do that!" |
| **Control** | Managing gyms | "My app understands my setup" |

### Emotional Journey Mapping

| Stage | Current (Without Feature) | Target (With Feature) |
|-------|---------------------------|----------------------|
| **Search exercises** | Frustration (irrelevant results) | Confidence (all results valid) |
| **Add to workout** | Hesitation (will this work?) | Certainty (yes, I have this equipment) |
| **Discover new** | Overwhelm (800+ exercises) | Delight (curated for me) |
| **Switch context** | Friction (change settings) | Seamless (one tap) |

### Micro-Emotions

| Encourage | Avoid |
|-----------|-------|
| Confidence → "I can do this" | Confusion → "Why am I seeing this?" |
| Satisfaction → "That was easy" | Frustration → "Too many steps" |
| Delight → "Oh, that's clever" | Overwhelm → "Too many options" |

### Design Implications

| Emotional Goal | UX Approach |
|----------------|-------------|
| **Confidence** | Clear filter indicator showing which gym is active |
| **Efficiency** | 1-tap gym switching, instant results |
| **Discovery** | Subtle "discovery" cues (e.g., "12 exercises you can do") |
| **Control** | Visible "All Equipment" escape hatch always present |

### Emotional Design Principles

1. **Invisible Success** - When it's working, users shouldn't think about filtering at all
2. **Confident Discovery** - Every result feels like a valid recommendation
3. **Zero Anxiety Switching** - Changing gyms is casual, not a commitment

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

| App | What They Do Well | Pattern to Consider |
|-----|-------------------|---------------------|
| **Strong** | Equipment filter chips | Tappable filter badges above search |
| **Hevy** | Equipment icons in exercise cards | Visual equipment indicators |
| **FitBod** | Auto-generates workouts by equipment | Smart equipment matching |
| **Apple Fitness** | Filter sidebar with checkboxes | Category-based equipment selection |

### Existing open-fit Patterns to Leverage

| Existing Pattern | Can Use For |
|------------------|-------------|
| `Badge` component | Filter indicator ("Filtering: Home Gym") |
| `DropdownMenu` | Gym selector |
| `Checkbox` | Equipment selection |
| `Command` (cmdk) | Equipment search in setup |
| `Dialog` modal pattern | Gym CRUD modals |
| `ProfileModal` | Add "My Gyms" section |

### Transferable UX Patterns

| Pattern | Source | Application |
|---------|--------|-------------|
| **Filter chip with X** | Many apps | "Home Gym ✕" - tap to show all |
| **Grouped checkboxes** | Apple Fitness | Equipment by category (Free Weights, Machines, Cables) |
| **Inline edit** | iOS Settings | Gym name editable in place |
| **Empty state CTA** | Best practices | "Add your first gym" prompt for new users |

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Alternative |
|--------------|--------------|-------------|
| **Modal for gym switch** | Too heavy for quick action | Dropdown inline |
| **Filter hidden in settings** | Users won't find it mid-workout | Always visible in search |
| **Equipment as text list** | Hard to scan 50+ items | Icons + categories |
| **No visual feedback on filter** | Users forget filter is active | Persistent badge |

### Design Inspiration Strategy

**Adopt:** shadcn/ui patterns already in codebase (Badge, DropdownMenu, Dialog)
**Adapt:** Filter chip pattern for gym indicator with dropdown
**Avoid:** Heavy modals for quick actions, text-only equipment lists

---

## Design System Foundation

### Design System Choice

**Existing System:** shadcn/ui (Radix UI + Tailwind CSS)

| Aspect | Choice |
|--------|--------|
| **Foundation** | shadcn/ui (Radix UI + Tailwind CSS) |
| **Styling** | Tailwind CSS utility classes |
| **Components** | 23 UI primitives already in use |
| **Theming** | Dark/light mode via ThemeProvider |
| **Icons** | Lucide React |

### Components to Leverage

| Feature Need | Existing Component | Notes |
|--------------|-------------------|-------|
| **Gym filter indicator** | `Badge` | Add dropdown trigger behavior |
| **Gym selector dropdown** | `DropdownMenu` | List user's gyms + "All Equipment" |
| **Equipment selection** | `Checkbox` + `Command` | Grouped by category with search |
| **Gym management modals** | `Dialog` pattern | Create/Edit/Delete gym |
| **Settings section** | `ProfileModal` | Add "My Gyms" section |
| **Gym name input** | `Input` | For creating/editing gym names |

### New Components to Create

| Component | Purpose | Based On |
|-----------|---------|----------|
| **GymFilterDropdown** | Filter badge + gym selector in exercise search | `Badge` + `DropdownMenu` |
| **EquipmentSelector** | Grouped equipment checklist with search | `Checkbox` + `Command` |
| **GymCard** | Gym display in profile settings | `Card` pattern |
| **GymFormModal** | Create/Edit gym dialog | `Dialog` pattern |

### Implementation Approach

**Extend, don't reinvent:**
1. Compose new components from existing primitives
2. Follow established patterns (Modal, Menu, Card)
3. Use existing Tailwind classes for consistency
4. Match existing spacing, typography, colors

---

## Interaction Flows

### Defining Experience

**Core Interaction:** "Search for exercises and instantly see only what I can do at my gym"

This is an **established pattern** (filtering) with a **contextual twist** (gym-aware defaults).

### User Mental Model

| Current Behavior | Expected Behavior |
|------------------|-------------------|
| Search all 800+ exercises | Search my available exercises |
| Mentally filter by equipment | App filters for me |
| Switch to settings to change filter | Switch inline while searching |

**Mental Metaphor:** Like a grocery app that only shows products in stock at your local store.

### Flow 1: Exercise Search with Filter

```
┌─────────────────────────────────────────┐
│ Exercise Search                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔍 Search exercises...              │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────┐                         │
│ │ 🏠 Home Gym ▾│  ← Filter indicator    │
│ └─────────────┘                         │
│                                         │
│ Results filtered by gym equipment...    │
└─────────────────────────────────────────┘
```

**Tap filter badge → Dropdown appears:**

```
┌─────────────────────┐
│ ✓ Home Gym          │
│   Commercial Gym    │
│   Hotel Gym         │
│ ─────────────────── │
│   All Equipment     │
└─────────────────────┘
```

### Flow 2: Gym Setup in Settings

```
┌─────────────────────────────────────────┐
│ Profile Settings                        │
│ ─────────────────────────────────────── │
│ My Gyms                                 │
│ ┌─────────────────────────────────────┐ │
│ │ 🏠 Home Gym              ⭐ Default │ │
│ │    Dumbbells, Bench, Pull-up bar    │ │
│ │                              Edit ▸ │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 🏋️ Commercial Gym                   │ │
│ │    Full equipment                   │ │
│ │                              Edit ▸ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Add Gym]                             │
└─────────────────────────────────────────┘
```

### Flow 3: Equipment Selection

```
┌─────────────────────────────────────────┐
│ Edit Gym: Home Gym                      │
│ ─────────────────────────────────────── │
│ Gym Name: [Home Gym_________]           │
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
│ ▼ Benches                               │
│   ☑ Flat Bench                          │
│   ☐ Incline Bench                       │
│                                         │
│ ▸ Machines (collapsed)                  │
│ ▸ Cables (collapsed)                    │
│                                         │
│ [Cancel]                    [Save Gym]  │
└─────────────────────────────────────────┘
```

### Success Criteria

| Criteria | Measurement |
|----------|-------------|
| **Instant feedback** | Results update as user types/switches |
| **Clear filter state** | User always knows which gym is active |
| **One-tap switching** | No modals, no navigation |
| **Smart defaults** | New users see everything, no friction |

---

## Visual Design Foundation

### Existing Visual System

| Aspect | Current Implementation |
|--------|----------------------|
| **Colors** | Tailwind CSS + CSS variables for theming |
| **Dark/Light Mode** | ThemeProvider with system detection |
| **Typography** | Tailwind defaults + shadcn/ui |
| **Spacing** | Tailwind spacing scale (4px base) |
| **Border Radius** | Consistent rounded corners via shadcn |
| **Shadows** | Tailwind shadow utilities |

### New Components Visual Specs

| Component | Visual Treatment |
|-----------|-----------------|
| **GymFilterDropdown** | `Badge` variant with dropdown - subtle background, border |
| **GymCard** | Match existing `Card` style with header/content pattern |
| **EquipmentSelector** | `Checkbox` groups with category headers |
| **GymFormModal** | Standard `Dialog` with form layout |

### Color Usage for Gym Feature

| Element | Color Token | Purpose |
|---------|-------------|---------|
| Filter badge (active) | `primary` | Indicates active filter |
| "All Equipment" option | `muted` | De-emphasized option |
| Default gym indicator | `accent` | Star/highlight for default |
| Equipment category headers | `muted-foreground` | Section dividers |

### Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | Inherit from existing theme (WCAG AA) |
| Focus indicators | shadcn/ui defaults |
| Touch targets | Minimum 44x44px for mobile |
| Screen reader support | ARIA labels on filter badge |
