# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock turbo.json ./

# Copy all workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN yarn install --frozen-lockfile

# Generate Prisma Client
RUN cd packages/db && npx prisma generate

# Build the API
RUN cd apps/api && yarn build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json yarn.lock ./

# Copy packages
COPY packages/db/package.json ./packages/db/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/redis/package.json ./packages/redis/package.json
COPY packages/llm-provider/package.json ./packages/llm-provider/package.json

# Copy API package.json
COPY apps/api/package.json ./apps/api/package.json

# Install production dependencies only
RUN yarn install --production --frozen-lockfile

# Copy built files
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy Prisma schema for migrations
COPY packages/db/prisma ./packages/db/prisma

# Generate Prisma Client in production
RUN cd packages/db && npx prisma generate

# Expose port
EXPOSE 4000

# Run migrations and start the app
CMD cd packages/db && npx prisma migrate deploy && cd ../../apps/api && node dist/index.js
