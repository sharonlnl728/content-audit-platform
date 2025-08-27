#!/bin/bash

echo "=== Starting Content Service ==="

# Wait for PostgreSQL to be ready
echo "Step 1: Waiting for PostgreSQL to be ready..."
while ! nc -z audit-postgres 5432; do
  echo "PostgreSQL is not ready yet. Waiting..."
  sleep 5
done

echo "PostgreSQL is ready!"

# Wait extra 10s for PostgreSQL to fully initialize
echo "Step 2: Waiting extra 10s for PostgreSQL to settle..."
sleep 10

# Start Spring Boot application
echo "Step 3: Starting Spring Boot app..."
exec java -jar app.jar 