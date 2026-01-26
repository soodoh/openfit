---
"open-fit": patch
---

Fix missing NEXT_PUBLIC_CONVEX_URL in Docker builds

- Set placeholder URL during Docker build so Next.js bakes it into client JS
- Entrypoint script replaces placeholder with actual runtime value
