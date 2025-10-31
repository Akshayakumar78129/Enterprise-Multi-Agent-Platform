FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy workspace configuration and package files
COPY pnpm-workspace.yaml* ./
COPY package.json pnpm-lock.yaml* ./

# Copy shared packages that frontend depends on
COPY packages/components ./packages/components
COPY packages/constants ./packages/constants

# Copy frontend package.json
COPY apps/frontend/package.json ./apps/frontend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm for build
RUN npm install -g pnpm@9.0.0

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy workspace and root package files
COPY pnpm-workspace.yaml* ./
COPY package.json pnpm-lock.yaml* ./

# Copy frontend source code
COPY apps/frontend ./apps/frontend

# Set environment variable
ENV NEXT_TELEMETRY_DISABLED=1

# Build from frontend directory
WORKDIR /app/apps/frontend
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files from builder stage
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/frontend/package.json ./package.json

# Copy shared packages needed at runtime
COPY --from=builder /app/packages ./packages

# Install pnpm in runner
RUN npm install -g pnpm@9.0.0

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]
