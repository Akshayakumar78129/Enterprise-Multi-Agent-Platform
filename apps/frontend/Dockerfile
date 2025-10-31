FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy workspace configuration and package files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy all package.json files for workspace packages
COPY packages/components/package.json ./packages/components/package.json
COPY packages/constants/package.json ./packages/constants/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

# Install all dependencies using workspace
RUN pnpm install --frozen-lockfile

# Copy source files for shared packages
COPY packages/components ./packages/components
COPY packages/constants ./packages/constants

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm for build
RUN npm install -g pnpm@9.0.0

# Copy entire workspace structure from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy frontend source code
COPY apps/frontend ./apps/frontend

# Set environment variable
ENV NEXT_TELEMETRY_DISABLED=1

# Build from root (pnpm workspaces need root context)
RUN cd apps/frontend && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy workspace configuration
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/package.json ./package.json

# Copy built files from builder stage
COPY --from=builder /app/apps/frontend ./apps/frontend
COPY --from=builder /app/node_modules ./node_modules

# Copy shared packages needed at runtime
COPY --from=builder /app/packages ./packages

# Install pnpm in runner
RUN npm install -g pnpm@9.0.0

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start from apps/frontend directory
WORKDIR /app/apps/frontend
CMD ["pnpm", "start"]
