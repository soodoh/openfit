---
"openfit": patch
---

Update dependencies and migrate authentication and browser tests for Better Auth 1.7 and Vitest 5. OIDC identity providers must register `/api/auth/callback/<PROVIDER_ID>` as their redirect URI instead of `/api/auth/oauth2/callback/<PROVIDER_ID>`.
