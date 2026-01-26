# open-fit

## 0.3.2

### Patch Changes

- 7d1190e: Fix missing CSS/static assets in Docker image
  - Copy `public/` and `.next/static/` to standalone output directory
  - Required for Next.js standalone mode to serve static assets correctly

## 0.3.1

### Patch Changes

- 69ba8bb: Add semver version tags to Docker publish workflow
  - Docker images now include major and major.minor tags (e.g., `0`, `0.2`)
  - Allows users to pin to rolling version tags for automatic updates within a version range

## 0.3.0

### Minor Changes

- c48176c: Add "End Session" button to active workout page
  - Added a red "End Session" button at the bottom of the current session page
  - Clicking the button sets the session's `endTime` to the current timestamp
  - Automatically navigates back to the workout logs list after ending
  - Uses the existing `sessions.update` mutation for consistency

## 0.2.3

### Patch Changes

- 41f5121: New logo/favicon assets

## 0.2.2

### Patch Changes

- cf03e04: More UI enhancements

## 0.2.1

### Patch Changes

- 491ae14: Upgrade tailwind

## 0.2.0

### Minor Changes

- 7b8ab8d: UI enhancements, almost feature complete

### Patch Changes

- fd3cbf7: Test workflow after checkout update
