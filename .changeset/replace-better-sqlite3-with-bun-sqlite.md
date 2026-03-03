---
"openfit": patch
---

Replace better-sqlite3 with bun:sqlite to eliminate native C++ compilation during Docker builds. Simplifies Dockerfile by using oven/bun:1-alpine as the builder base image and installs production deps directly in the runner stage.
