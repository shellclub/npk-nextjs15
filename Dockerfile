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

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Install dotenv + tsx for migrations/seed (lightweight)
RUN npm install --no-save dotenv tsx typescript @types/node pg @prisma/adapter-pg

# Create entrypoint that writes .env then starts server
RUN printf '#!/bin/sh\necho "DATABASE_URL=$DATABASE_URL" > .env\necho "AUTH_SECRET=$AUTH_SECRET" >> .env\necho "AUTH_URL=$AUTH_URL" >> .env\necho "NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL" >> .env\nnpx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1 || true\nexec node server.js\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 3000
CMD ["/app/entrypoint.sh"]
