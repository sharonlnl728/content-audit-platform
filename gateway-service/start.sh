#!/bin/bash

echo "=== Starting Gateway Service ==="

# Wait for Consul to be ready
echo "Step 1: Waiting for Consul to be ready..."
while ! nc -z audit-consul 8500; do
  echo "Consul is not ready yet. Waiting..."
  sleep 5
done

echo "Consul is ready!"

# Start Spring Boot application
echo "Step 2: Starting Spring Boot app..."
exec java -jar app.jar
