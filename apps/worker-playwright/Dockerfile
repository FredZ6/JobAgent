FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y chromium \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker-playwright/package.json apps/worker-playwright/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN npm install

RUN npx playwright install --with-deps chromium

COPY . .
