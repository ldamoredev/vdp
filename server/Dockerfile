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
COPY packages/shared packages/shared
COPY server server
RUN pnpm --filter @vdp/shared build && pnpm --filter @vdp/server build

# ─── Production image ────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/server/node_modules server/node_modules
COPY --from=deps /app/packages/shared/node_modules packages/shared/node_modules
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/package.json server/package.json
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
COPY server/src/migrations server/src/migrations
COPY server/drizzle.config.ts server/drizzle.config.ts
COPY pnpm-workspace.yaml package.json ./

WORKDIR /app/server
EXPOSE 4001
CMD ["node", "dist/main.js"]
