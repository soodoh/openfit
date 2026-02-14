# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache curl bash python3 make g++

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Install dependencies (cached layer - only re-runs when lockfile changes)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Copy static assets into standalone output
RUN cp -r public .next/standalone/public && \
    cp -r .next/static .next/standalone/.next/static

# Install production-only dependencies for runtime
RUN mkdir /prod-deps && \
    cp package.json bun.lock /prod-deps/ && \
    cd /prod-deps && \
    bun install --production

# Stage 2: Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Install tsx for running TypeScript db scripts at startup
RUN npm install -g tsx --no-fund --no-audit 2>/dev/null

# Copy standalone Next.js build (includes server.js, .next/, public/)
COPY --from=builder /app/.next/standalone ./

# Replace traced node_modules with full production deps (superset needed by db scripts)
COPY --from=builder /prod-deps/node_modules ./node_modules

# Copy db scripts and files needed for migrations/seeding
COPY --from=builder /app/db ./db
COPY --from=builder /app/lib/auth.ts ./lib/auth.ts

# Minimal tsconfig for tsx path alias resolution (avoids needing @tsconfig/next devDep)
RUN echo '{"compilerOptions":{"paths":{"@/*":["./*"]},"target":"ES2017","esModuleInterop":true}}' > tsconfig.json

# Copy entrypoint
COPY --from=builder /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh

# Create data directory for SQLite and uploads
RUN mkdir -p /app/data/uploads

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/openfit.db
ENV SKIP_SCHEMA_PUSH=1

EXPOSE 3000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
