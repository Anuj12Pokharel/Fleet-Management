FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

ENV DATABASE_URL="file:/app/dev.db"

COPY package*.json ./
COPY .npmrc* ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=8030
ENV DATABASE_URL="file:/app/dev.db"

COPY package*.json ./
COPY .npmrc* ./
COPY prisma ./prisma/

RUN npm ci --omit=dev --legacy-peer-deps
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/uploads

EXPOSE 8030

CMD ["sh", "-c", "npx prisma db push --skip-generate && if [ -f dist/src/main.js ]; then node dist/src/main.js; else node dist/main.js; fi"]
