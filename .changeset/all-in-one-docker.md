---
"openfit": minor
---

Add all-in-one Docker image for simplified self-hosting

- New `docker/all-in-one/` with single-container deployment combining nginx, Convex backend, and Next.js
- Automatic database initialization on first run
- Updated GitHub Actions to publish:
  - `ghcr.io/soodoh/openfit:latest` - All-in-one image (recommended)
  - `ghcr.io/soodoh/openfit-standalone:latest` - Next.js only (requires separate Convex)
