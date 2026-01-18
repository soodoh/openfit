# Open Fit

A fitness tracking application built with Next.js and Convex.

## Self-Host with Docker

The easiest way to self-host Open Fit on your home server or VPS. No need to clone the repo.

### Requirements

- Docker with Compose plugin
- `curl` and `openssl` (for setup script)

### Quick Start

```bash
# 1. Create a directory and download the setup files
mkdir openfit && cd openfit
curl -LO https://raw.githubusercontent.com/soodoh/open-fit/main/self-host/docker-compose.yml
curl -LO https://raw.githubusercontent.com/soodoh/open-fit/main/self-host/setup.sh

# 2. Generate environment variables (creates .env file)
bash setup.sh

# 3. Start the application
docker compose up -d
```

That's it! Open http://localhost:3000 to create your account.

### What Happens Automatically

1. **Key Generation** - `setup.sh` generates all required secrets:
   - `INSTANCE_SECRET` - Convex instance secret
   - `CONVEX_SELF_HOSTED_ADMIN_KEY` - Admin key for Convex operations
   - `JWT_PRIVATE_KEY` / `JWKS` - Authentication keys

2. **Database Initialization** - On first boot, the app automatically:
   - Deploys the Convex schema
   - Configures authentication
   - Seeds the exercise database (873 exercises)

3. **Runtime Configuration** - Environment variables are injected at container startup

### Configuration

Edit the `.env` file to customize your deployment:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | `http://localhost:3210` | URL browsers use to connect to Convex. Change if using a reverse proxy. |
| `APP_PORT` | `3000` | Port for the web application |

**Example: Exposing via reverse proxy**

If you're running behind a reverse proxy (e.g., Traefik, Caddy, nginx) with a domain:

```env
NEXT_PUBLIC_CONVEX_URL=https://convex.yourdomain.com
```

### Updating

```bash
docker compose pull
docker compose up -d
```

### Data Persistence

Convex data is stored in a Docker volume. To backup:

```bash
docker run --rm -v openfit_convex-data:/data -v $(pwd):/backup alpine tar czf /backup/convex-backup.tar.gz /data
```

### Troubleshooting

**Database not initialized?**
```bash
docker exec openfit pnpm initdb
```

**Need to regenerate keys?**
```bash
rm .env && bash setup.sh
docker compose down && docker compose up -d
```

**Check logs:**
```bash
docker compose logs -f openfit      # App logs
docker compose logs -f convex-backend  # Convex logs
```

**Container won't start?**
```bash
docker compose down
docker volume rm openfit_convex-data  # Warning: deletes all data
docker compose up -d
```

---

## Development Setup

For contributors and developers who want to run the full development environment.

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
# Generate keys
pnpm generate:keys
```

Copy the output to a new `.env.local` file and add:

```env
NEXT_PUBLIC_CONVEX_URL='http://localhost:3210'
CONVEX_SELF_HOSTED_URL='http://localhost:3210'
INSTANCE_NAME='convex-self-hosted'

# Paste generated values below
JWT_PRIVATE_KEY='...'
JWKS='...'
INSTANCE_SECRET='...'
```

### 4. Generate Admin Key

```bash
docker run --rm -e INSTANCE_SECRET="your-instance-secret" \
  --entrypoint ./generate_admin_key.sh \
  ghcr.io/get-convex/convex-backend:latest
```

Add to `.env.local`:
```env
CONVEX_SELF_HOSTED_ADMIN_KEY='...'
```

### 5. Initialize Database

```bash
pnpm initdb
```

### 6. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

### Seed Test Data (Optional)

After creating an account, seed 50 test routines:

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
├── self-host/             # Self-hosting files (compose, setup script)
└── public/                 # Static assets
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Convex (real-time database and serverless functions)
- **Authentication**: Convex Auth with email/password
- **Styling**: Tailwind CSS, shadcn/ui components
- **Drag & Drop**: dnd-kit
