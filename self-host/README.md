# Open Fit - Self-Hosted Deployment

This directory contains everything you need to self-host Open Fit.

## Quick Start

```bash
# 1. Generate environment variables (creates .env file)
bash setup.sh

# 2. Start the application
docker compose up -d
```

That's it! Open http://localhost:3000 to create your account.

## Files

- `docker-compose.yml` - Docker Compose configuration
- `setup.sh` - Generates all required environment variables
- `.env.example` - Reference template for environment variables
- `.env` - Created by setup.sh (gitignored)

## Requirements

- Docker with Compose plugin
- `curl` and `openssl` (for setup.sh)

## Configuration

After running `setup.sh`, you can edit `.env` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | 3000 | Web application port |
| `PUBLIC_CONVEX_URL` | (internal) | Public URL if exposing Convex via reverse proxy |

## Updating

```bash
docker compose pull
docker compose up -d
```

## Data Persistence

Convex data is stored in a Docker volume named `convex-data`. To backup:

```bash
docker run --rm -v openfit_convex-data:/data -v $(pwd):/backup alpine tar czf /backup/convex-backup.tar.gz /data
```
