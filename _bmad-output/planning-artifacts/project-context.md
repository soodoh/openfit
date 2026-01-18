---
project_name: 'open-fit'
user_name: 'Paul'
date: '2026-01-18'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - anti_patterns
status: 'complete'
rule_count: 18
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for consistent code implementation in open-fit._

---

## Technology Stack & Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 16.1.1 | App Router, React 19 |
| React | 19.2.3 | Server Components default |
| TypeScript | 5.9.3 | Strict mode via @tsconfig/next |
| Convex | 1.31.3 | Serverless BaaS with real-time |
| Tailwind CSS | 3.4.19 | With tailwindcss-animate |
| shadcn/ui | Radix UI | Dialog, DropdownMenu, Card, etc. |
| pnpm | 10.27.0 | Package manager |

## Critical Implementation Rules

### Import Rules (MANDATORY)

- Use `@/*` prefix for all imports — no relative imports
- Exception: `convex/` folder uses relative imports
- Import order: builtin/external → parent/sibling → types (alphabetized)

### Convex Backend Rules (MANDATORY)

- Start every query/mutation with: `const userId = await getAuthenticatedUserId(ctx);`
- User-scoped queries: `.withIndex("by_user", (q) => q.eq("userId", userId))`
- Verify ownership before modifying: `entity.userId === userId`
- Include `updatedAt: Date.now()` on create and update
- Table naming: plural, lowercase (`gyms`, `routines`)
- Field naming: camelCase (`userId`, `equipmentIds`)

### React Component Rules

- File naming: PascalCase.tsx (`GymCard.tsx`)
- Folder organization: `components/[domain]/`
- Use shadcn/ui from `@/components/ui/`
- State: Convex reactive queries (no Redux)
- Modals: `Dialog` from `@/components/ui/dialog`
- Menus: `DropdownMenu` from `@/components/ui/dropdown-menu`

### File Organization

| Type | Location |
|------|----------|
| Domain components | `components/[domain]/` |
| Convex queries | `convex/queries/[entity].ts` |
| Convex mutations | `convex/mutations/[entity].ts` |
| UI primitives | `components/ui/` |
| Pages | `app/[route]/page.tsx` |

## Anti-Patterns to AVOID

| Don't | Do Instead |
|-------|------------|
| Relative imports (`../`) | `@/*` prefix |
| Queries without user filter | `.withIndex("by_user", ...)` |
| Custom UI primitives | Use shadcn/ui |
| Global state for session data | React local state |
| `snake_case` | `camelCase` |
| Inline auth checks | `getAuthenticatedUserId(ctx)` |

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Reference architecture.md for feature-specific decisions

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-01-18

