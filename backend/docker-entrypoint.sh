#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until nc -z postgres 5432; do
  echo "Waiting for postgres..."
  sleep 2
done
echo "PostgreSQL is ready."

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Run database seed (optional, for development)
# You might want to remove this or wrap it in an IF statement for production
echo "Running database seed..."
npm run seed

# Start the application
echo "Starting BrainBrawler backend server..."
exec "$@" 