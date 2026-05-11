# ─────────────────────────────────────────────────────────────────────────────
#  Node.js API — Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
# Install dependencies and openssl for Prisma
RUN apk add --no-cache openssl libc6-compat python3 && ln -sf python3 /usr/bin/python
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "src/index.js"]
