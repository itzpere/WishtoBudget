# Use specific version for reproducibility
FROM node:20.18-alpine AS base

# Build stage with all dependencies
FROM base AS builder
WORKDIR /app

# Install build dependencies
# hadolint ignore=DL3018
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source files
COPY . .

# Generate Drizzle migrations
RUN npm run db:generate

# Compile migration script
RUN npx tsx --tsconfig tsconfig.json migrate.ts > /dev/null 2>&1 || true
RUN npx esbuild migrate.ts --bundle --platform=node --outfile=migrate.js --external:better-sqlite3

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production image - minimal size
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Install runtime dependencies only
# hadolint ignore=DL3018
RUN apk add --no-cache \
    dumb-init \
    sqlite

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create directories with proper permissions before copying files
RUN mkdir -p /app/data /app/public/icons && \
    chmod 777 /app/data /app/public/icons

# Copy only necessary files from builder (standalone includes required node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/migrate.js ./migrate.js

# Copy entrypoint script
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/

# Set ownership for app directory
RUN chown nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["/usr/bin/dumb-init", "--", "docker-entrypoint.sh"]
CMD ["node", "server.js"]
