# Open Fit

A fitness tracking application built with Next.js, SQLite, and Drizzle ORM.

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

Copy `.env.example` to `.env.local` and configure as needed. The app uses SQLite by default, so no external database is required.

### 3. Initialize Database

```bash
bun run db:migrate    # Run database migrations
bun run db:seed       # Seed exercise data (873 exercises)
```

### 4. Start Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to get started. The first user to register becomes the admin.

### Seed Test Data (Optional)

```bash
bun run db:seed-mock your@email.com
```

---

## Project Structure

```
├── app/                    # Next.js app router pages
│   └── api/               # REST API routes
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── exercises/         # Exercise-related components
│   ├── routines/          # Routine management components
│   ├── sessions/          # Workout session components
│   ├── ui/                # Shared UI components
│   └── workoutSet/        # Workout set components
├── db/                     # Database layer
│   ├── schema/            # Drizzle ORM schema definitions
│   ├── migrations/        # Database migrations
│   ├── seed.ts            # Exercise data seeding
│   └── seed-mock-user-data.ts  # Mock user data for testing
├── hooks/                  # React hooks
│   ├── queries/           # TanStack React Query hooks
│   └── mutations/         # Mutation hooks with optimistic updates
├── lib/                    # Utility functions, types, and auth
└── public/                 # Static assets
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
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
2. **Open a PR** - Include the changeset file with your changes
3. **Merge to main** - Once approved and merged, the release workflow detects pending changesets
4. **Version PR created** - A "chore: release" PR is automatically created/updated with version bumps
5. **Merge the release PR** - This triggers:
   - `package.json` version is updated
   - `CHANGELOG.md` is generated
   - A git tag is created (e.g., `v1.2.0`)
   - Docker image is built and pushed to `ghcr.io/soodoh/openfit` with the version tag

### Docker Image Tags

Docker images are tagged with:
- `latest` - Most recent main branch build
- `x.y.z` - Semantic version from package.json (e.g., `1.2.0`)
- `vx.y.z` - Version tags (e.g., `v1.2.0`)
- `main` - Latest main branch commit
