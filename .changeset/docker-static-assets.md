---
"open-fit": patch
---

Fix missing CSS/static assets in Docker image

- Copy `public/` and `.next/static/` to standalone output directory
- Required for Next.js standalone mode to serve static assets correctly
