# syntax=docker/dockerfile:1
# Debian-based (not Nixpacks' Nix sandbox) specifically so `playwright install --with-deps` can
# shell out to apt for Chromium's system libraries — see pdf.functions.ts, which launches a real
# Chromium at request time to render the PDF export. Installing the browser at runtime (matched
# to whatever `playwright` npm version is actually installed) avoids having to hand-pin a
# Microsoft-published base image tag to the exact same patch version.
FROM node:22-slim AS deps
WORKDIR /app
# node:22-slim ships an older npm than what generated package-lock.json locally — `npm ci`'s
# strict lockfile validation is sensitive to that version gap (it rejected an otherwise-valid
# lockfile with a spurious "missing lru-cache" error). Pinning npm avoids the mismatch entirely.
RUN npm install -g npm@11.11.0
COPY package.json package-lock.json ./
# Cache mount persists npm's download cache across builds (this and Railway's own build
# infrastructure both support BuildKit cache mounts) — without it, any network hiccup mid-install
# means the next build attempt re-downloads everything instead of resuming from cache.
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm config set fetch-retries 5 fetch-retry-mintimeout 20000 fetch-timeout 300000 \
    && npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copied from `build`, not `deps` — the generated Prisma Client (node_modules/.prisma/client)
# only exists after `npm run build`'s `prisma generate` step runs, which happens in the build
# stage. Copying from `deps` (npm ci only) silently ships a node_modules with no generated
# client at all, which fails at first real query rather than at container startup.
COPY --from=build /app/node_modules ./node_modules
RUN npx playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# Railway injects PORT; srvx (see the "start" script) reads it automatically.
CMD ["npm", "start"]
