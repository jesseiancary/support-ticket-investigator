# Bundle the web placeholder into a self-contained ESM file with tsup, then ship only
# that bundle (no node_modules needed). Phase 5 replaces this with a Vite build served
# statically.
# Context is the repo root (see docker-compose.yml).

# ---- build: install the workspace, then bundle just the web placeholder ----
FROM node:22-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web
RUN pnpm --filter @sti/web run build

# ---- runtime: carry only the self-contained bundle ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# package.json supplies "type": "module" so Node runs the bundle as ESM.
COPY --from=build /app/packages/web/package.json ./package.json
COPY --from=build /app/packages/web/dist ./dist
USER node
EXPOSE 5173
CMD ["node", "dist/index.js"]
