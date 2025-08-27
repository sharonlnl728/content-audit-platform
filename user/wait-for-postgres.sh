#!/bin/bash

echo "Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be ready
while ! nc -z audit-postgres 5432; do
  echo "PostgreSQL is not ready yet. Waiting..."
  sleep 5
done

echo "PostgreSQL is ready! Waiting additional 30 seconds for PostgreSQL to fully initialize..."

# Wait additional 30 seconds to ensure PostgreSQL is fully initialized
sleep 30

echo "Starting application..."

# Start application
exec java -jar app.jar 