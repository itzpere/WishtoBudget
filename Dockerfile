# Use specific version for reproducibility
FROM node:20.18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Add necessary libraries for native modules
# hadolint ignore=DL3018
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++
WORKDIR /app

# Copy only dependency files for better layer caching
COPY package.json package-lock.json* ./
# Use npm ci for faster, more reliable installs
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Build stage with dev dependencies
FROM base AS builder
# hadolint ignore=DL3018
RUN apk add --no-cache \
    python3 \
    make \
    g++
WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source files
COPY . .

# Generate Drizzle migrations
RUN npm run db:generate

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production image - minimal size
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts

# Create data directory with correct permissions
RUN mkdir -p /app/data /app/public/icons && \
    chown -R nextjs:nodejs /app && \
    chmod -R 777 /app/data /app/public/icons

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
