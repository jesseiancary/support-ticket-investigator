# Bundle the api into a self-contained ESM file (inlining @sti/shared) with tsup, then
# ship only that bundle. With no external npm deps yet, the runtime needs no
# node_modules at all. When external deps land (Phase 2), keep them external and add a
# pruned prod install (e.g. `pnpm deploy`) for them — the bundle still carries the
# first-party code.
# Context is the repo root (see docker-compose.yml).

# ---- build: install the workspace, then bundle just the api ----
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
COPY packages/api ./packages/api
RUN pnpm --filter @sti/api run build

# ---- runtime: carry only the self-contained bundle ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# package.json supplies "type": "module" so Node runs the bundle as ESM.
COPY --from=build /app/packages/api/package.json ./package.json
COPY --from=build /app/packages/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
