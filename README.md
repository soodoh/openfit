# Open Fit

A fitness tracking application built with Next.js and Convex.

## Development Setup

For contributors who want to run the full development environment.

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) package manager
- [Docker](https://docker.com/) for Convex backend

### 1. Clone and Install

```bash
git clone https://github.com/soodoh/open-fit.git
cd open-fit
pnpm install
```

### 2. Start Convex Backend

```bash
docker compose up -d
```

### 3. Generate Environment Variables

```bash
pnpm generate:keys
```

Copy the output to `.env.local` and run the admin key command shown.

Add the remaining config:
```env
CONVEX_SELF_HOSTED_URL='http://localhost:3210'
INSTANCE_NAME='convex-self-hosted'
```

### 4. Initialize Database

```bash
./scripts/dev-init.sh
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

### Seed Test Data (Optional)

```bash
pnpm convex run seed:mockUserData '{"email": "your@email.com"}'
```

---

## Project Structure

```
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── auth/              # Authentication components
│   ├── exercises/         # Exercise-related components
│   ├── routines/          # Routine management components
│   ├── sessions/          # Workout session components
│   ├── ui/                # Shared UI components
│   └── workoutSet/        # Workout set components
├── convex/                 # Convex backend
│   ├── mutations/         # Data mutation functions
│   ├── queries/           # Data query functions
│   ├── schema.ts          # Database schema
│   └── seed.ts            # Database seeding
├── lib/                    # Utility functions and types
├── self-host/             # Self-hosting docker-compose
└── public/                 # Static assets
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Convex (real-time database and serverless functions)
- **Authentication**: Convex Auth with email/password
- **Styling**: Tailwind CSS, shadcn/ui components
- **Drag & Drop**: dnd-kit
