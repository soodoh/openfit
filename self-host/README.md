# Open Fit - Self-Hosted Deployment

Everything you need to self-host Open Fit.

## Requirements

- Docker with Compose plugin

## Quick Start

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

## Files

- `docker-compose.yml` - Docker Compose configuration
- `.env.example` - Reference template

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | `http://localhost:3210` | URL browsers use to connect to Convex |
| `APP_PORT` | `3000` | Port for the web application |

**Using a reverse proxy?** Update `NEXT_PUBLIC_CONVEX_URL` to your public Convex URL:

```env
NEXT_PUBLIC_CONVEX_URL=https://convex.yourdomain.com
```

## Updating

```bash
docker compose pull
docker compose up -d
```

## Data Backup

```bash
docker run --rm -v openfit_convex-data:/data -v $(pwd):/backup alpine tar czf /backup/convex-backup.tar.gz /data
```

## Troubleshooting

**Database not initialized?**
```bash
docker exec openfit ./scripts/init.sh
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
