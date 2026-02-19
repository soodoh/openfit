# Repository Guidelines

## Project Structure & Module Organization

OpenFit is a TanStack Start + React TypeScript app. Core code lives in `src/`:

- `src/routes/`: page and API routes (`api/*` for server endpoints, `*.tsx` for UI routes)
- `src/components/`: feature UI (`auth`, `sessions`, `routines`, `ui`, etc.)
- `src/hooks/`: React Query hooks split into `queries/` and `mutations/`
- `src/lib/`: shared utilities, auth helpers, and types

Data and infra:

- `db/schema/`, `db/migrations/`, `db/seed.ts` for Drizzle + SQLite
- `e2e/` for Playwright tests (fixtures, page objects, specs)
- `public/` static assets, `scripts/` setup/entrypoint scripts

## Build, Test, and Development Commands

Use Bun for package management and scripts:

- `bun dev`: start local dev server
- `bun run build`: production build
- `bun run start`: run built server (`dist/server/index.js`)
- `bun run lint`: run oxlint
- `bun run test`: run Vitest in watch mode
- `bun run test:run`: single-run unit/component tests
- `bun run test:coverage`: coverage report (text + HTML)
- `bun run test:e2e`: Playwright E2E suite
- `bun run db:migrate` / `bun run db:seed`: apply schema and seed base data

## Coding Style & Naming Conventions

- TypeScript with strict settings; use 2-space indentation and semicolons.
- Prefer alias imports (`@/...`, `@/db/...`); relative imports outside same folder fail lint.
- Components: `PascalCase.tsx`; hooks: `use-*.ts` or `use-*.tsx`; route files follow TanStack conventions (for example `gyms.$id.ts`).
- Run `bun run lint` before opening a PR.

## Testing Guidelines

- Unit/component tests use Vitest + Testing Library.
- Keep test files as `*.test.ts` or `*.test.tsx` near related code (see `src/lib` and `src/components/ui`).
- E2E tests use Playwright under `e2e/tests/**` with `*.spec.ts` naming.
- Run `bun run test:run` plus relevant `bun run test:e2e` flows for user-facing changes.

## Commit & Pull Request Guidelines

- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `refactor:`), matching existing history.
- Keep commits focused and descriptive; include schema or seed updates when behavior depends on them.
- PRs should include: clear summary, linked issue (if any), testing notes, and UI screenshots for visual changes.
- For release-worthy changes, add a changeset via `bun run changeset`.

## Security & Configuration Tips

- Copy `.env.example` to `.env.local`; never commit secrets.
- Validate auth/storage-related environment variables before running E2E or Docker workflows.
