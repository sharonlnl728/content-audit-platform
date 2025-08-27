#!/bin/bash

echo "=== Starting Template Service ==="

# Wait for PostgreSQL to be ready
echo "Step 1: Waiting for PostgreSQL to be ready..."
while ! nc -z audit-postgres 5432; do
  echo "PostgreSQL is not ready yet. Waiting..."
  sleep 5
done

echo "PostgreSQL is ready!"

# Start Spring Boot application
echo "Step 2: Starting Spring Boot app..."
exec java -jar app.jar
