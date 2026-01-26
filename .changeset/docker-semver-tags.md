---
"open-fit": patch
---

Add semver version tags to Docker publish workflow

- Docker images now include major and major.minor tags (e.g., `0`, `0.2`)
- Allows users to pin to rolling version tags for automatic updates within a version range
