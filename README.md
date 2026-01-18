# Open Fit

A fitness tracking application built with Next.js and Convex.

## Self-Host with Docker

Deploy Open Fit on your home server or VPS in minutes.

### Requirements

- Docker with Compose plugin

### Quick Start

**1. Download the compose file:**

```bash
mkdir openfit && cd openfit
curl -LO https://raw.githubusercontent.com/soodoh/open-fit/main/self-host/docker-compose.yml
```

**2. Generate environment variables:**

```bash
docker run --rm ghcr.io/soodoh/open-fit pnpm generate:keys
```

This outputs all required keys and a command to generate the admin key. Run the admin key command shown in the output.

**3. Create your `.env` file:**

Copy all the generated values into a `.env` file:

```env
INSTANCE_SECRET='...'
JWT_PRIVATE_KEY='...'
JWKS='...'
NEXT_PUBLIC_CONVEX_URL=http://localhost:3210
CONVEX_SELF_HOSTED_ADMIN_KEY='...'
```

**4. Start the application:**

```bash
docker compose up -d
```

The database initializes automatically on first boot. Open http://localhost:3000 to create your account.

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | `http://localhost:3210` | URL browsers use to connect to Convex |
| `APP_PORT` | `3000` | Port for the web application |

**Using a reverse proxy?** Update `NEXT_PUBLIC_CONVEX_URL` to your public Convex URL:

```env
NEXT_PUBLIC_CONVEX_URL=https://convex.yourdomain.com
```

### Updating

```bash
docker compose pull
docker compose up -d
```

### Data Backup

```bash
docker run --rm -v openfit_convex-data:/data -v $(pwd):/backup alpine tar czf /backup/convex-backup.tar.gz /data
```

### Troubleshooting

**Database not initialized?**
```bash
docker exec openfit pnpm initdb
```

**Regenerate keys?**
```bash
docker run --rm ghcr.io/soodoh/open-fit pnpm generate:keys
# Update .env with new values, then:
docker compose down && docker compose up -d
```

**Check logs:**
```bash
docker compose logs -f
```

---

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
pnpm initdb
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
