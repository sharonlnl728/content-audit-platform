#!/bin/bash

echo "=== Starting Admin Service ==="

# Wait for PostgreSQL to be ready
echo "Step 1: Waiting for PostgreSQL to be ready..."
while ! nc -z audit-postgres 5432; do
  echo "PostgreSQL is not ready yet. Waiting..."
  sleep 5
done

echo "PostgreSQL is ready!"

# Wait extra 60 seconds to ensure PostgreSQL is fully initialized
echo "Step 2: Waiting extra 60s for PostgreSQL to settle..."
sleep 60

# Test PostgreSQL connection
echo "Step 3: Testing PostgreSQL connection..."
if pg_isready -h audit-postgres -U admin -d content_audit > /dev/null 2>&1; then
  echo "PostgreSQL connection test successful!"
else
  echo "PostgreSQL connection test failed!"
  exit 1
fi

# Start Spring Boot application
echo "Step 4: Starting Spring Boot app..."
exec java -jar app.jar 