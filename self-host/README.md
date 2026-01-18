# Open Fit - Self-Hosted Deployment

Everything you need to self-host Open Fit.

## Quick Start

**1. Generate environment variables:**

```bash
docker run --rm ghcr.io/soodoh/open-fit pnpm generate:keys
```

**2. Run the admin key command shown in the output.**

**3. Create `.env` with all the generated values.**

**4. Start:**

```bash
docker compose up -d
```

Open http://localhost:3000 to create your account.

## Files

- `docker-compose.yml` - Docker Compose configuration
- `setup.sh` - Alternative: generates `.env` file automatically (requires `openssl`)
- `.env.example` - Reference template

## Alternative: Automated Setup

If you have `openssl` installed locally:

```bash
bash setup.sh
docker compose up -d
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | `http://localhost:3210` | Browser URL for Convex |
| `APP_PORT` | `3000` | Web app port |

## Updating

```bash
docker compose pull
docker compose up -d
```

## Data Backup

```bash
docker run --rm -v openfit_convex-data:/data -v $(pwd):/backup alpine tar czf /backup/convex-backup.tar.gz /data
```
