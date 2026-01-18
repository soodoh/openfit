---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain-skipped
  - step-06-innovation-skipped
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/data-models.md
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 4
workflowType: 'prd'
projectType: 'brownfield'
classification:
  projectType: web_app
  domain: consumer_fitness
  complexity: low
  projectContext: brownfield
---

# Product Requirements Document - open-fit

**Author:** Paul
**Date:** 2026-01-18

## Executive Summary

**Feature:** Gym/Equipment Management for open-fit

This PRD defines the requirements for adding gym-based exercise filtering to open-fit. Users will be able to define custom "gyms" with specific equipment lists, then filter the exercise library to show only exercises they can perform at their current gym. This improves exercise discovery relevance and reduces friction during workout planning and active sessions.

**Classification:**
- **Project Type:** Web App (SPA with real-time sync)
- **Domain:** Consumer Fitness / Health & Wellness
- **Complexity:** Low
- **Project Context:** Brownfield (feature addition to existing app)

---

## Success Criteria

### User Success

**Relevance**
- When searching for exercises, users only see exercises they can perform with their current gym's equipment
- Zero frustration from irrelevant results (no "I don't have a cable machine" moments)

**Discovery**
- Users discover exercises they didn't know they could do with their available equipment
- "I didn't realize I could hit triceps with just dumbbells" moments

**Seamless Experience**
- New users start with a default gym containing all equipment - no setup friction
- Gym filter dropdown in exercise search with quick switching - no need to change settings
- "All Equipment" option always available as escape hatch

### Business Success

| Metric | Indicator |
|--------|-----------|
| Feature Adoption | Users create 2+ gyms (home, commercial, travel) |
| Exercise Discovery | Increase in unique exercises added to routines |
| Session Completion | Reduced abandoned sessions due to equipment mismatch |

### Technical Success

| Requirement | Target |
|-------------|--------|
| Filter Performance | Exercise search filters in <100ms (800+ exercises) |
| UX Responsiveness | Gym switching in routine view - no page reload |
| Data Integrity | Gym deletion handles orphaned references gracefully |

### Measurable Outcomes

- Users with custom gyms find relevant exercises 3x faster than browsing full library
- 80%+ of active users define at least one custom gym within first month

---

## Product Scope

### MVP - Minimum Viable Product

1. **Gym CRUD** - Create/edit/delete gyms in profile settings (name + equipment list)
2. **Default Gym** - Set default gym in profile
3. **New User Default** - Auto-create "All Equipment" gym for new users
4. **Exercise Filtering** - Search/browse filters by selected gym's equipment
5. **Gym Filter Dropdown** - In exercise search, shows current gym filter with ability to switch gyms or select "All Equipment"

### Growth Features (Post-MVP)

- Location-based gym auto-selection
- Gym sharing between users (e.g., shared home gym with partner)
- Equipment suggestions based on frequently filtered-out exercises

### Vision (Future)

- Gym check-in integration (auto-detect which gym you're at)
- Equipment availability tracking (this cable machine is taken)
- Community gyms with verified equipment lists

---

## User Journeys

### Journey 1: Alex Sets Up Their Home Gym

*Alex has been using open-fit at their commercial gym for months. They just bought a basic home setup - adjustable dumbbells, a pull-up bar, and a bench. They're excited to work out at home but frustrated when searching for exercises - half the results need cable machines they don't have.*

**Opening Scene:** Alex opens Settings, sees "My Gyms" section. They tap "Add Gym" and name it "Home Gym."

**Rising Action:** Alex scrolls through the equipment list, checking off what they own. The interface shows equipment categories (free weights, machines, bodyweight) making it easy to find their items.

**Climax:** Alex sets "Home Gym" as their default. They go to add exercises to a new routine - suddenly, every result is something they can actually do. They discover 3 tricep exercises they never knew existed for dumbbells.

**Resolution:** Alex creates their first home workout in 5 minutes instead of 20. No more scrolling past cable machine exercises.

---

### Journey 2: Sam's Mid-Workout Discovery

*Sam is at their commercial gym, mid-session. They finished their planned exercises early and want to add one more chest exercise. They search, but the results are filtered to their "Home Gym" default - missing the cable fly they wanted.*

**Opening Scene:** Sam searches "chest exercises" and doesn't see the cable fly they wanted.

**Rising Action:** Sam notices the filter badge showing "Filtering: Home Gym." They tap it and see a dropdown with their gyms plus "All Equipment."

**Climax:** Sam selects "All Equipment." The full exercise library appears. Sam finds the cable fly and adds it to their session.

**Resolution:** Sam makes a mental note to create a "Commercial Gym" profile later, but for now they finish their workout without friction.

---

### Journey 3: Jordan Searches for Travel-Friendly Exercises

*Jordan works out at their home gym most days but travels for work twice a month. Hotel gyms are unpredictable - usually just dumbbells, a treadmill, and maybe a cable machine. They want a routine with exercises that work anywhere.*

**Opening Scene:** Jordan creates a new routine called "Travel Full Body" and taps to add an exercise. The exercise search opens, showing a filter badge: "Filtering: Home Gym" (their default).

**Rising Action:** Jordan taps the filter badge. A dropdown appears showing their gyms: "Home Gym", "Commercial Gym", "Hotel Gym", and "All Equipment". They select "Hotel Gym."

**Climax:** The exercise list instantly updates. Jordan searches "back" and sees only dumbbell rows, cable rows, and pull-up variations - no barbells. They add exercises knowing each one will work on the road.

**Resolution:** Jordan finishes the routine. The filter selection was just for that search session - the routine itself doesn't store a gym. Next time Jordan edits it, the search will default back to their profile default, but they can switch again anytime.

---

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---------|----------------------|
| Alex (Gym Setup) | Gym CRUD, equipment selection UI, default gym setting, filtered exercise search |
| Sam (Mid-Workout) | Gym filter dropdown in exercise search, "All Equipment" option, session context |
| Jordan (Travel Routine) | Multiple gym profiles, quick gym switching in search, filter badge visibility |

---

## Web App Specific Requirements

### Technical Architecture Considerations

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Filtering** | Server-side (Convex query) | Performance at scale with 800+ exercises |
| **Real-time** | Convex reactive queries | Gym changes reflect immediately across UI |
| **State** | No gym persistence on routines | Filter is UI-only, simplifies data model |

### Performance Targets

| Operation | Target | Implementation |
|-----------|--------|----------------|
| Exercise filter by gym | <100ms | Convex query with equipment filter argument |
| Gym switching in dropdown | Instant | Client-side state, triggers new query |
| Equipment list load | <200ms | Single query for all equipment |

### Responsive Design

| Breakpoint | Gym Management UI |
|------------|-------------------|
| Mobile | Full-featured - create/edit gyms, select equipment |
| Tablet | Same as mobile with more horizontal space |
| Desktop | Same functionality, potentially side-by-side layout |

### Accessibility (WCAG 2.1 AA)

| Component | Requirements |
|-----------|--------------|
| Gym selector dropdown | Keyboard navigation, arrow keys, Enter to select |
| Equipment checklist | Focusable checkboxes, space to toggle |
| Filter badge | Screen reader announces current filter |
| "All Equipment" option | Clearly labeled escape hatch |

### Browser Support

Inherits from existing app - modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

---

## Risk Analysis & Mitigation

| Risk Type | Risk | Mitigation |
|-----------|------|------------|
| **Technical** | Exercise query performance with equipment filter | Test with full 800+ exercise dataset early |
| **UX** | Equipment selection UI complexity (many items) | Group equipment by category, allow search |
| **Data Migration** | Existing users have no gyms | Migration creates "All Equipment" default for all existing users |
| **Edge Case** | User deletes their only gym | Prevent deletion of last gym, or auto-create default |

---

## Functional Requirements

### Gym Management

| ID | Requirement |
|----|-------------|
| FR1 | Users can create a new gym with a name |
| FR2 | Users can edit an existing gym's name |
| FR3 | Users can delete a gym they created |
| FR4 | Users can view all their gyms in profile settings |
| FR5 | Users cannot delete their last remaining gym |

### Equipment Configuration

| ID | Requirement |
|----|-------------|
| FR6 | Users can add equipment to a gym from the available equipment list |
| FR7 | Users can remove equipment from a gym |
| FR8 | Users can view equipment grouped by category |
| FR9 | Users can search/filter equipment by name |

### Exercise Filtering

| ID | Requirement |
|----|-------------|
| FR10 | Users can see exercise search results filtered by selected gym's equipment |
| FR11 | Users can see which gym is currently filtering results (filter indicator) |
| FR12 | Users can switch to a different gym for filtering via dropdown |
| FR13 | Users can select "All Equipment" to see unfiltered exercise results |
| FR14 | System filters exercises where exercise equipment matches gym's equipment list |

### User Preferences

| ID | Requirement |
|----|-------------|
| FR15 | Users can set a default gym in their profile |
| FR16 | System uses user's default gym as initial filter when searching exercises |

### New User & Migration

| ID | Requirement |
|----|-------------|
| FR17 | System creates an "All Equipment" gym for new users on registration |
| FR18 | System sets the "All Equipment" gym as default for new users |
| FR19 | System creates "All Equipment" gym for existing users who have no gyms (migration) |

---

## Non-Functional Requirements

### Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR1 | Exercise search with gym filter responds quickly | <100ms |
| NFR2 | Gym dropdown switch triggers new results immediately | <200ms |
| NFR3 | Equipment list loads without blocking UI | <200ms |
| NFR4 | Gym CRUD operations complete without noticeable delay | <500ms |

### Accessibility

| ID | Requirement | Standard |
|----|-------------|----------|
| NFR5 | All new UI components meet accessibility standards | WCAG 2.1 AA |
| NFR6 | Gym selector dropdown supports keyboard navigation | Arrow keys, Enter, Escape |
| NFR7 | Equipment checkboxes are keyboard accessible | Space to toggle, Tab to navigate |
| NFR8 | Filter indicator is announced to screen readers | ARIA live region |
| NFR9 | Focus management is logical when switching gyms | Focus returns to search input |

