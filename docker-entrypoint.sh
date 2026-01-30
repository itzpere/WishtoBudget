#!/bin/sh
set -e

echo "Starting Budget Wishlist application..."

# Ensure data directory exists
mkdir -p /app/data

# Initialize database if it doesn't exist
if [ ! -f /app/data/sqlite.db ]; then
  echo "Database not found. Running migrations..."
  node migrate.js || echo "Warning: Migration failed, database will be created on first access"
fi

echo "Starting Next.js server..."
exec "$@"
