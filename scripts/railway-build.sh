#!/bin/bash

echo "🚂 Railway Build Script"
echo "======================="

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
cd packages/db
npx prisma generate
cd ../..

# Build API
echo "🏗️  Building API..."
cd apps/api
yarn build
cd ../..

echo "✅ Build complete!"
