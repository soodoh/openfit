# Repository Guidelines

## Project Structure & Module Organization

This repository is a Turborepo monorepo with app workspaces under `apps/`:

- `apps/openfit/`: TanStack Start + React TypeScript app
- `apps/docs/`: docs workspace (currently a skeleton)
- `apps/mobile-app/`: mobile workspace (currently a skeleton)

OpenFit core code lives in `apps/openfit/src/`:

- `apps/openfit/src/routes/`: page and API routes (`api/*` for server endpoints, `*.tsx` for UI routes)
- `apps/openfit/src/components/`: feature UI (`auth`, `sessions`, `routines`, `ui`, etc.)
- `apps/openfit/src/hooks/`: React Query hooks split into `queries/` and `mutations/`
- `apps/openfit/src/lib/`: shared utilities, auth helpers, and types

Data and infra:

- `apps/openfit/db/schema/`, `apps/openfit/db/migrations/`, `apps/openfit/db/seed.ts` for Drizzle + SQLite
- `apps/openfit/e2e/` for Playwright tests (fixtures, page objects, specs)
- `apps/openfit/public/` static assets, `apps/openfit/scripts/` setup/entrypoint scripts

## Build, Test, and Development Commands

Use Bun for package management and scripts:

- `bun run dev` or `bun run dev:openfit`: start OpenFit dev server
- `bun run build`: build all workspaces
- `bun run build:openfit`: build OpenFit
- `bun run lint`: lint all workspaces
- `bun run test:run`: single-run tests across workspaces
- `bun run test:coverage`: OpenFit coverage report
- `bun run test:e2e`: OpenFit Playwright E2E suite
- `bun run db:migrate` / `bun run db:seed`: run OpenFit database tasks

## Coding Style & Naming Conventions

- TypeScript with strict settings; use 2-space indentation and semicolons.
- Prefer alias imports (`@/...`, `@/db/...`); relative imports outside same folder fail lint.
- Components: `PascalCase.tsx`; hooks: `use-*.ts` or `use-*.tsx`; route files follow TanStack conventions (for example `gyms.$id.ts`).
- Run `bun run lint` before opening a PR.

## Testing Guidelines

- Unit/component tests use Vitest + Testing Library.
- Keep test files as `*.test.ts` or `*.test.tsx` near related code (see `apps/openfit/src/lib` and `apps/openfit/src/components/ui`).
- E2E tests use Playwright under `apps/openfit/e2e/tests/**` with `*.spec.ts` naming.
- Run `bun run test:run` plus relevant `bun run test:e2e` flows for user-facing changes.

## Commit & Pull Request Guidelines

- Follow Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `refactor:`), matching existing history.
- Keep commits focused and descriptive; include schema or seed updates when behavior depends on them.
- PRs should include: clear summary, linked issue (if any), testing notes, and UI screenshots for visual changes.
- For release-worthy changes, add a changeset via `bun run changeset`.

## Security & Configuration Tips

- Copy `apps/openfit/.env.example` to `apps/openfit/.env.local`; never commit secrets.
- Validate auth/storage-related environment variables before running E2E or Docker workflows.
