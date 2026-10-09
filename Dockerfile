# Stage 1: Build & Package
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Copy root workspace manifests
COPY package.json bun.lock turbo.json ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/db/package.json ./packages/db/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install workspace dependencies
RUN bun install

# Copy all source files
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY *.xlsx ./

# Build shared packages and apps
RUN cd packages/shared-types && bun run build || true
RUN cd packages/db && bun run typecheck
RUN cd apps/frontend && bun run build
RUN cd apps/backend && bun run build

# Stage 2: Production Runner
FROM oven/bun:1.2-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy workspace dependencies, code, and built artifacts
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist
COPY --from=builder /app/*.xlsx ./

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
