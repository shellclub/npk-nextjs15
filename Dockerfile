# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

# ---- Build (Production) ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# ---- Migration / Seed runner ----
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# This stage is used by docker-compose for one-off migration/seed

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "server.js"]
