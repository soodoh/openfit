# OpenFit Monorepo

This repository is a Turborepo with the following workspaces:

- `apps/openfit`: Main OpenFit web application.
- `apps/docs`: Documentation app (skeleton).
- `apps/mobile-app`: Mobile app (skeleton).

## Prerequisites

- Node.js 18+
- Bun

## Install

```bash
bun install
```

## Common Commands

```bash
bun run dev             # Run openfit in dev mode
bun run build           # Build all workspaces
bun run lint            # Lint all workspaces
bun run test:run        # Run test suites for all workspaces
bun run test:e2e        # Run openfit e2e tests
```

## Workspace Commands

```bash
bun run dev:openfit
bun run dev:docs
bun run dev:mobile-app
```
