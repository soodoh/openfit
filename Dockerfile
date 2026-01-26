# Stage 1: Build Stage
FROM node:lts

RUN apt-get -qy update && apt-get -qy install openssl curl

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy all the application files
COPY ./ ./

# Install dependencies
RUN pnpm install

# Set placeholder for NEXT_PUBLIC_* vars that will be replaced at runtime by entrypoint
# Next.js bakes these into client JS at build time, so we use placeholders
ENV NEXT_PUBLIC_CONVEX_URL=http://PLACEHOLDER_CONVEX_URL:3210

# Build the app in standalone mode
RUN pnpm build

# Copy static assets to standalone output (required for standalone mode)
RUN cp -r public .next/standalone/public
RUN cp -r .next/static .next/standalone/.next/static

# Make entrypoint script executable
RUN chmod +x /app/scripts/docker-entrypoint.sh

# Set environment variable for production
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Use custom entrypoint for auto-initialization
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]

