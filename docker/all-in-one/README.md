# OpenFit All-in-One Docker Image

A single Docker image containing everything needed to run OpenFit:
- **nginx** - Reverse proxy (port 3000)
- **Convex backend** - Database and serverless functions (ports 3210/3211)
- **Next.js** - Web application (port 3001)

## Quick Start

### 1. Generate Required Keys

```bash
# Clone the repository
git clone https://github.com/soodoh/openfit.git
cd openfit

# Install dependencies and generate keys
pnpm install
pnpm generate:keys
```

Copy the output to a `.env` file (without quotes):

```bash
# .env (no quotes around values!)
INSTANCE_SECRET=your-generated-secret
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----
JWKS={"keys":[...]}
```

### 2. Generate Admin Key

```bash
docker run --rm -e INSTANCE_SECRET='your-instance-secret' \
  --entrypoint ./generate_admin_key.sh \
  ghcr.io/get-convex/convex-backend:latest
```

Add to your `.env`:

```bash
CONVEX_SELF_HOSTED_ADMIN_KEY='generated-admin-key'
```

### 3. Run with Docker Compose

```bash
cd docker/all-in-one
cp /path/to/.env .env
docker compose up -d
```

### 4. Access the Application

Open http://localhost:3000 in your browser.

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `INSTANCE_SECRET` | Yes | - | Convex instance secret (32 hex bytes) |
| `JWT_PRIVATE_KEY` | Yes | - | RSA private key for JWT signing |
| `JWKS` | Yes | - | JSON Web Key Set for JWT verification |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | No | Auto-generated | Admin key for Convex CLI operations |
| `NEXT_PUBLIC_CONVEX_URL` | No | `http://localhost:3000/convex` | Public URL for browser connections |
| `CONVEX_AUTH_SITE_URL` | No | `http://localhost:3000` | Auth callback URL |
| `INSTANCE_NAME` | No | `convex-self-hosted` | Instance name |
| `APP_PORT` | No | `3000` | Host port to expose |

### External Access

For access from other machines, update the URLs:

```bash
# .env
NEXT_PUBLIC_CONVEX_URL=http://your-server-ip:3000/convex
CONVEX_AUTH_SITE_URL=http://your-server-ip:3000
```

### HTTPS with Reverse Proxy

For production, put a reverse proxy (nginx, Traefik, Caddy) in front of the container:

```yaml
# docker-compose.yml
services:
  openfit:
    image: ghcr.io/soodoh/openfit:latest
    # Don't expose ports directly
    environment:
      - NEXT_PUBLIC_CONVEX_URL=https://your-domain.com/convex
      - CONVEX_AUTH_SITE_URL=https://your-domain.com
    # ... rest of config

  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
```

## Manual Docker Commands

### Build Image

```bash
# From repository root
docker build -t openfit:latest -f docker/all-in-one/Dockerfile .
```

### Run Container

```bash
docker run -d \
  --name openfit \
  -p 3000:3000 \
  -v openfit-data:/convex/data \
  --env-file .env \
  -e NEXT_PUBLIC_CONVEX_URL=http://localhost:3000/convex \
  -e CONVEX_AUTH_SITE_URL=http://localhost:3000 \
  ghcr.io/soodoh/openfit:latest
```

### View Logs

```bash
# All logs
docker logs -f openfit

# Individual service logs
docker exec openfit cat /var/log/supervisor/convex.log
docker exec openfit cat /var/log/supervisor/nextjs.log
docker exec openfit cat /var/log/supervisor/nginx.log
```

### Manual Initialization

If automatic initialization fails:

```bash
docker exec -it openfit bash

# Set environment variables
npx convex env set --url http://127.0.0.1:3210 SITE_URL http://localhost:3000
npx convex env set --url http://127.0.0.1:3210 -- JWT_PRIVATE_KEY "$JWT_PRIVATE_KEY"
npx convex env set --url http://127.0.0.1:3210 JWKS "$JWKS"

# Deploy and seed
npx convex deploy --url http://127.0.0.1:3210
npx convex run --url http://127.0.0.1:3210 seed:run
```

## Architecture

```
                    Host Port 3000
                         |
                         v
┌─────────────────────────────────────────────────┐
│              All-in-One Container               │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │              nginx (:3000)               │   │
│  │                                          │   │
│  │  /.well-known/*  → Convex HTTP (:3211)  │   │
│  │  /convex_http/*  → Convex HTTP (:3211)  │   │
│  │  /convex/*       → Convex API  (:3210)  │   │
│  │  /*              → Next.js     (:3001)  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Next.js   │  │    Convex Backend       │  │
│  │   (:3001)   │  │  API:3210  HTTP:3211    │  │
│  └─────────────┘  └───────────┬─────────────┘  │
│                               │                 │
│                      /convex/data (volume)      │
│                                                 │
│            supervisord (PID 1)                  │
└─────────────────────────────────────────────────┘
```

## Troubleshooting

### Container won't start

1. Check logs: `docker logs openfit`
2. Verify environment variables are set correctly
3. Ensure ports are not in use

### Initialization fails

1. Check if Convex is ready: `docker exec openfit curl http://127.0.0.1:3210/version`
2. Check initialization logs: `docker logs openfit | grep "\[init\]"`
3. Run initialization manually (see above)

### WebSocket connection errors

1. Verify `NEXT_PUBLIC_CONVEX_URL` matches your access URL
2. Check if firewall allows WebSocket connections
3. For reverse proxy, ensure WebSocket upgrade is configured

### Auth not working

1. Verify `CONVEX_AUTH_SITE_URL` matches your access URL
2. Check JWT keys are set: `docker exec openfit npx convex env list --url http://127.0.0.1:3210`
3. Ensure cookies are not being blocked

## Data Persistence

All data is stored in the `/convex/data` volume:

```bash
# Backup
docker run --rm -v openfit-data:/data -v $(pwd):/backup ubuntu \
  tar czf /backup/openfit-backup.tar.gz -C /data .

# Restore
docker run --rm -v openfit-data:/data -v $(pwd):/backup ubuntu \
  tar xzf /backup/openfit-backup.tar.gz -C /data
```
