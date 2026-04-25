# Env-Driven Auth Onboarding Design

## Context

OpenFit is a self-hosted app where production Docker installs should be configurable by environment variables. Authentication currently uses Better Auth with email/password, social OAuth, and a generic OIDC provider. The current UI also reads some `VITE_AUTH_*` variables to decide which provider buttons to show, and the admin panel includes an auth provider status tab.

The desired behavior is:

- Self-hosted operators configure email/password registration and OIDC providers through env vars.
- Account creation can be disabled globally.
- Email/password registration can be disabled independently.
- OIDC providers can each opt in to automatic account creation.
- OIDC account creation defaults to disabled.
- The first account created in a fresh install becomes an admin, whether it is created through email/password or OIDC.
- Auth provider configuration should not require database-backed settings or admin UI.

## Configuration Contract

Add a single server-side auth configuration parser in `apps/openfit/src/lib/auth-config.ts`. This parser is the source of truth for Better Auth setup, auth policy checks, provider status responses, and auth UI visibility.

Supported registration env vars:

```env
DISABLE_REGISTRATION=true
DISABLE_EMAIL_PASSWORD_REGISTRATION=true
```

Supported indexed OIDC env vars:

```env
OIDC_1_PROVIDER_ID=authentik
OIDC_1_PROVIDER_NAME=Authentik
OIDC_1_CLIENT_ID=...
OIDC_1_CLIENT_SECRET=...
OIDC_1_ISSUER=https://auth.example.com/application/o/openfit/
OIDC_1_SCOPES=openid,email,profile
OIDC_1_ALLOW_ACCOUNT_CREATION=true

OIDC_2_PROVIDER_ID=authelia
OIDC_2_PROVIDER_NAME=Authelia
OIDC_2_CLIENT_ID=...
OIDC_2_CLIENT_SECRET=...
OIDC_2_ISSUER=https://sso.example.com
OIDC_2_ALLOW_ACCOUNT_CREATION=false
```

OIDC parsing rules:

- Discover providers from `OIDC_1_*`, `OIDC_2_*`, and so on, stopping at the first completely absent index.
- A provider is configured only when `PROVIDER_ID`, `CLIENT_ID`, `CLIENT_SECRET`, and `ISSUER` are present and non-blank.
- `OIDC_N_PROVIDER_NAME` defaults to `OIDC_N_PROVIDER_ID`.
- `OIDC_N_SCOPES` defaults to `openid,email,profile`.
- `OIDC_N_ALLOW_ACCOUNT_CREATION` defaults to `false`.
- Partial or malformed provider entries fail closed. They must not accidentally enable sign-in or account creation.

Legacy `AUTH_OIDC_*` and `VITE_AUTH_OIDC_*` variables should be removed from docs and tests. They should not be part of the new supported contract. Indexed `OIDC_N_*` variables are the supported contract.

## Registration Policy

Email/password signup is allowed only when one of these is true:

- No user exists yet, because first-user bootstrap is always allowed.
- `DISABLE_REGISTRATION` is not true and `DISABLE_EMAIL_PASSWORD_REGISTRATION` is not true.

OIDC auto-provisioning is allowed only when one of these is true:

- No user exists yet, because first-user bootstrap is always allowed.
- The matched OIDC provider has `OIDC_N_ALLOW_ACCOUNT_CREATION=true`.

`DISABLE_REGISTRATION=true` blocks all non-bootstrap self-service account creation except OIDC providers that explicitly allow account creation. `DISABLE_EMAIL_PASSWORD_REGISTRATION=true` blocks only email/password signup. Existing users can continue signing in through their existing auth methods when registration is disabled.

The request does not include disabling email/password login, so email/password sign-in remains available even when email/password registration is disabled.

## Auth Integration

Better Auth remains the auth engine. OpenFit owns the account-creation policy around it.

`apps/openfit/src/lib/auth-config.ts` should expose parsed config with these fields:

- `registration.disableAll`
- `registration.disableEmailPassword`
- `emailPassword.enabled`
- `oidcProviders[]`
- each OIDC provider's `providerId`, `displayName`, `clientId`, `clientSecret`, `discoveryUrl`, `scopes`, and `allowAccountCreation`

`apps/openfit/src/lib/auth.ts` should feed parsed OIDC providers into Better Auth's `genericOAuth` plugin using each configured `providerId`.

Server-side account creation rules must be enforced in auth code, not only through UI visibility. If Better Auth exposes enough hook context to distinguish email/password signup from OIDC auto-provisioning before user creation, use that hook. If not, enforce the policy in the `/api/auth/$` route wrapper by detecting signup and OIDC callback flows before delegating to `auth.handler`.

## First-User Admin

The user profile creation hook should decide the profile role at creation time:

- If no user existed before this creation, create the profile with `role: "ADMIN"`.
- Otherwise create the profile with `role: "USER"`.

This applies to email/password, OIDC, and any other auth provider. The seed script can stop relying on a post-create upgrade for the first admin, but it may still force the `ADMIN_USER` account to `ADMIN` idempotently as a safety measure.

## Provider Status API

`GET /api/auth/providers` should return the configured auth surface without secrets. It should be the client source of truth for sign-in and registration UI.

The response should include:

- Whether email/password sign-in is enabled.
- Whether email/password registration is enabled for the current install state.
- Whether first-user bootstrap is available.
- Configured OAuth/OIDC providers with provider IDs and display names.
- For OIDC providers, whether account creation is enabled.

The endpoint must never return client secrets, issuer client secrets, tokens, or other sensitive values.

## UI Cleanup

The sign-in and register UI should stop reading auth provider availability from `import.meta.env`.

UI behavior:

- Sign-in fetches `/api/auth/providers` and renders provider buttons from that response.
- Register shows the email/password registration form only when email registration is allowed or first-user bootstrap is available.
- If email/password registration is disabled, `/register` shows a concise unavailable state with a link back to sign in, unless OIDC providers are available, in which case it can still show those provider buttons.
- Sign-in does not show "Create an account" when email/password registration is disabled and first-user bootstrap is not available.

Remove the admin auth provider UI:

- Remove `AuthProvidersTable`.
- Remove the Admin "Auth" tab.
- Remove tests that only verify the old admin auth provider table.

Auth provider configuration should live in `.env.example` and self-hosting docs, not in database-backed settings or admin UI.

## Errors

Disabled email/password registration should return a clear forbidden-style error such as `Email/password registration is disabled`.

Disabled OIDC auto-provisioning should return a clear forbidden-style error such as `Account creation is disabled for this OIDC provider`.

Existing-user sign-in failures should keep Better Auth's normal error behavior.

Partial OIDC configuration must fail closed. Docker startup does not need to crash for a partial provider entry unless the parser can provide a clear startup validation error without preventing unrelated auth modes from working.

## Tests

Add or update unit tests for env parsing:

- Booleans parse only explicit truthy values.
- Multiple indexed OIDC providers parse correctly.
- OIDC account creation defaults to false.
- Missing required OIDC fields disable that provider.
- Provider names and scopes default correctly.

Add auth policy tests:

- First email/password user can register and becomes admin even when registration is disabled.
- Later email/password signup is blocked by `DISABLE_REGISTRATION=true`.
- Later email/password signup is blocked by `DISABLE_EMAIL_PASSWORD_REGISTRATION=true`.
- OIDC first user can bootstrap admin.
- OIDC auto-provisioning works only when the matched provider has `OIDC_N_ALLOW_ACCOUNT_CREATION=true`.
- Existing users can sign in when registration is disabled.

Add API and UI tests:

- `/api/auth/providers` returns configured providers without secrets.
- Login/register UI renders based on `/api/auth/providers`.
- Admin page no longer includes the Auth tab.

## Out Of Scope

- Admin UI for configuring auth providers.
- Database schema for storing provider configuration.
- Disabling email/password login entirely.
- Invite flows or user approval queues.
- OIDC group-to-role mapping.
