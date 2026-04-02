# Replace oxlint + prettier with biome

## Summary

Migrate from oxlint (linting) + prettier (formatting) to biome, which handles linting, formatting, and import sorting in a single tool. This is a big-bang swap: add biome, remove old tools, reformat the codebase, and commit.

## Motivation

- Single tool replaces two, reducing config surface and dependency count.
- Biome is faster than prettier + oxlint combined.
- Built-in import sorting eliminates the need for a separate plugin.

## Biome Configuration

A single `biome.json` at the repo root, covering all workspaces.

### Formatter

Match current prettier defaults (which are also biome defaults):

- 2-space indentation
- Semicolons
- Double quotes
- 80 character line width

### Linter

Use biome's `recommended` ruleset. No test-file overrides needed: the current oxlint overrides disable `typescript/no-unsafe-*` rules for test files, but biome doesn't perform type-checked linting, so these rules don't exist in biome.

### Import Sorting

Enable `organizeImports` with default settings.

### Ignored Files

Consolidate ignore patterns from `.prettierignore` (root + app level) and oxlint config:

- `.output`
- `node_modules`
- `e2e/.auth`
- `playwright-report`
- `test-results`
- `coverage`
- `src/routeTree.gen.ts`
- `src/route-tree.gen.ts`

## Package Changes

### Root `package.json`

- Remove devDependencies: `oxlint`, `prettier`
- Add devDependency: `@biomejs/biome`
- Lint scripts unchanged (they delegate via turbo)

### `apps/openfit/package.json`

- Remove devDependencies: `oxlint`, `@standard-config/oxlint`, `prettier`
- Update scripts:
  - `lint`: `biome check .`
  - `lint:fix`: `biome check --write .`

### `apps/docs/package.json` and `apps/mobile-app/package.json`

- Update placeholder lint scripts:
  - `lint`: `biome check .`
  - `lint:fix`: `biome check --write .`

## Files to Remove

- `.prettierrc` (root)
- `.prettierignore` (root)
- `apps/openfit/.prettierignore`
- `apps/openfit/oxlint.config.mjs`

## Git Hooks

Update `lefthook.yml` to consolidate the two pre-commit commands (`prettier` + `oxlint`) into one:

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{js,jsx,ts,tsx,json,css}"
      run: bunx biome check --write {staged_files}
      stage_fixed: true
```

The glob is narrowed to biome-supported file types only.

## CI

No workflow changes needed. CI runs `bunx turbo run lint --filter=openfit`, which calls the workspace lint script. Updating the script in `package.json` is sufficient.

## Git Blame

Add `.git-blame-ignore-revs` at the repo root containing the SHA of the mass-reformat commit. Configure git locally:

```sh
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

## Migration Steps (High Level)

1. Install `@biomejs/biome`, create `biome.json` at root
2. Remove oxlint/prettier configs and dependencies
3. Update lint scripts in all workspace `package.json` files
4. Update `lefthook.yml`
5. Run `biome check --write .` to reformat the entire codebase
6. Verify: `biome check .` passes, `bun run lint` passes
7. Commit config changes + formatting diff
8. Add commit SHA to `.git-blame-ignore-revs`
9. Run existing tests to verify nothing broke
