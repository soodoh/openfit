# Open Fit

A fitness tracking application built with TanStack Start, SQLite, and Drizzle ORM.

## Development Setup

For contributors who want to run the full development environment.

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Bun](https://bun.sh/) package manager

### 1. Clone and Install

```bash
git clone https://github.com/soodoh/openfit.git
cd openfit
bun install
```

### 2. Configure Environment

Copy `apps/openfit/.env.example` to `apps/openfit/.env.local` and configure as needed. The app uses SQLite by default, so no external database is required.

### 3. Initialize Database

```bash
bun run db:migrate    # Run database migrations
bun run db:seed       # Seed exercise data (873 exercises)
```

Set `SKIP_EXERCISE_IMAGE_DOWNLOADS=true` when running `db:seed` to skip
external exercise image downloads for faster local setup or CI test containers.

### 4. Start Development Server

```bash
bun run dev:openfit
```

Open [http://localhost:3000](http://localhost:3000) to get started. The first user to register becomes the admin.

### Seed Test Data (Optional)

```bash
bun run db:seed-mock -- your@email.com
```

---

## Self-Hosted Auth Configuration

OpenFit auth is configured with environment variables. The production Docker
container reads these values at startup.

Email/password sign-in is enabled by default. Set
`DISABLE_EMAIL_PASSWORD_REGISTRATION=true` to block new email/password signups
while keeping existing email/password sign-in working.

Set `DISABLE_REGISTRATION=true` to block self-service account creation after
the first user is created. OIDC providers can still auto-provision users when
their indexed provider config sets `OIDC_N_ALLOW_ACCOUNT_CREATION=true`.

The first account created on a fresh install becomes an admin whether it is
created through email/password, social login, or OIDC.

OIDC providers are configured with indexed variables:

```env
OIDC_1_PROVIDER_ID=authentik
OIDC_1_PROVIDER_NAME=Authentik
OIDC_1_CLIENT_ID=replace-with-client-id
OIDC_1_CLIENT_SECRET=replace-with-client-secret
OIDC_1_ISSUER=https://auth.example.com/application/o/openfit
OIDC_1_ALLOW_ACCOUNT_CREATION=true
```

Use this callback URL in the OIDC provider:

```text
https://your-openfit-host.example.com/api/auth/oauth2/callback/<provider-id>
```

---

## Project Structure

```
apps/openfit/
├── src/
│   ├── routes/            # UI and API routes
│   ├── components/        # Feature components
│   ├── hooks/             # Query/mutation hooks
│   └── lib/               # Shared utilities and auth helpers
├── db/                    # Drizzle schema/migrations/seeds
├── e2e/                   # Playwright tests
├── public/                # Static assets
└── scripts/               # Setup/entrypoint scripts
```

## Tech Stack

- **Frontend**: TanStack Start, React 19, TypeScript
- **Database**: SQLite with Drizzle ORM
- **Data Fetching**: TanStack React Query
- **Authentication**: BetterAuth (email/password + optional Google, GitHub, Discord OAuth)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Drag & Drop**: dnd-kit

---

## Contributing

### Creating a Changeset

This project uses [Changesets](https://github.com/changesets/changesets) for version management. When making changes that should be included in a release, create a changeset:

```bash
bun run changeset
```

You'll be prompted to:

1. Select the type of change: `patch` (bug fix), `minor` (new feature), or `major` (breaking change)
2. Write a summary of your changes

This creates a markdown file in `.changeset/` that should be committed with your PR.

### Release Workflow

Releases are automated via GitHub Actions:

1. **Create changes** - Make your code changes and create a changeset
2. **Open a PR** - Include the changeset file with your changes. CI runs lint,
   unit tests, and a reduced Playwright suite against the Docker image.
3. **Merge to main** - Once approved and merged, the release workflow detects pending changesets
4. **Version PR created** - A "chore: release" PR is automatically created/updated with version bumps
5. **Merge the release PR** - This triggers:
   - `apps/openfit/package.json` version is updated
   - `apps/openfit/CHANGELOG.md` is generated
   - A git tag is created (e.g., `v1.2.0`)
   - Docker image is built and pushed to `ghcr.io/soodoh/openfit` with the version tag

### Docker Image Tags

Docker images are tagged with:

- `latest` - Most recent main branch build
- `x.y.z` - Semantic version from `apps/openfit/package.json` (e.g., `1.2.0`)
- `vx.y.z` - Version tags (e.g., `v1.2.0`)
- `main` - Latest main branch commit
