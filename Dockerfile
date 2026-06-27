# syntax=docker/dockerfile:1

# Multi-stage build for the Lighthouse Oracle dashboard (Next.js standalone).
# Final image runs the standalone server on Node 22 Alpine.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# ---- deps: install with a cached, frozen lockfile ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: compile the production build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are inlined at build time. Override per environment.
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_CHAIN_ID=11155111
ARG NEXT_PUBLIC_CHAIN_NAME="Ethereum Sepolia"
ARG NEXT_PUBLIC_EXPLORER_URL=https://sepolia.etherscan.io
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_UPWORK_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID \
    NEXT_PUBLIC_CHAIN_NAME=$NEXT_PUBLIC_CHAIN_NAME \
    NEXT_PUBLIC_EXPLORER_URL=$NEXT_PUBLIC_EXPLORER_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_UPWORK_URL=$NEXT_PUBLIC_UPWORK_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- runner: minimal standalone runtime ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
