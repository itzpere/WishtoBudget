#!/bin/sh
set -e

echo "Starting Budget Wishlist application..."

# Ensure data directory exists with proper permissions
mkdir -p /app/data
chmod 777 /app/data

# Initialize database if it doesn't exist
if [ ! -f /app/data/sqlite.db ]; then
  echo "Database not found. Running migrations..."
  cd /app && npm run db:push || echo "Warning: Migration failed, database will be created on first access"
fi

echo "Starting Next.js server..."
exec "$@"
