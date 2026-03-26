FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

# ─── Install dependencies ────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY server/package.json server/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod=false

# ─── Build ────────────────────────────────────────────────
FROM deps AS build
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared packages/shared
COPY server server
RUN pnpm --filter @vdp/shared build && pnpm --filter @vdp/server build

# ─── Production image ────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

RUN addgroup --gid 1001 appgroup && adduser --uid 1001 --ingroup appgroup --disabled-password appuser

COPY --from=deps --chown=appuser:appgroup /app/node_modules node_modules
COPY --from=deps --chown=appuser:appgroup /app/server/node_modules server/node_modules
COPY --from=deps --chown=appuser:appgroup /app/packages/shared/node_modules packages/shared/node_modules
COPY --from=build --chown=appuser:appgroup /app/server/dist server/dist
COPY --from=build --chown=appuser:appgroup /app/server/package.json server/package.json
COPY --from=build --chown=appuser:appgroup /app/packages/shared/dist packages/shared/dist
COPY --from=build --chown=appuser:appgroup /app/packages/shared/package.json packages/shared/package.json
COPY --chown=appuser:appgroup server/src/migrations server/src/migrations
COPY --chown=appuser:appgroup server/drizzle.config.ts server/drizzle.config.ts
COPY --chown=appuser:appgroup pnpm-workspace.yaml package.json ./

USER appuser
WORKDIR /app/server

ENV NODE_ENV=production
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "--import", "tsx/esm", "dist/main.js"]
