#!/bin/bash

echo "🚀 Railway Start Script"
echo "======================"

# Run migrations
echo "🔄 Running database migrations..."
cd packages/db
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Migration failed!"
  exit 1
fi

echo "✅ Migrations complete!"

# Start API
echo "🚀 Starting API..."
cd ../../apps/api
node dist/index.js
