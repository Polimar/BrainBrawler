#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Waiting for PostgreSQL to be ready..."
nc -z -w 5 postgres 5432
while [ $? -ne 0 ]; do
  sleep 1
  nc -z -w 5 postgres 5432
done
echo "PostgreSQL is ready."

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting BrainBrawler backend server..."
exec "$@" 