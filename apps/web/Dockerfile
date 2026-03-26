FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
WORKDIR /app

# ─── Install dependencies ────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod=false

# ─── Build ────────────────────────────────────────────────
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/web apps/web
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm --filter @vdp/shared build && pnpm --filter @vdp/web build

# ─── Production image ────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

RUN addgroup --gid 1001 appgroup && adduser --uid 1001 --ingroup appgroup --disabled-password appuser

COPY --from=build --chown=appuser:appgroup /app/apps/web/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /app/apps/web/.next/static apps/web/.next/static
COPY --from=build --chown=appuser:appgroup /app/apps/web/public apps/web/public

USER appuser
WORKDIR /app/apps/web

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "server.js"]
