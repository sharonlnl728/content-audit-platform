# Build stage
FROM maven:3.8.4-openjdk-11 AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Compile Java code
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:11-jre-slim

# Set timezone to UTC
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Copy JAR file from build stage
COPY --from=builder /app/target/*.jar app.jar

# Copy configuration files
COPY src/main/resources/application.yml ./config/

# Install necessary tools
RUN apt-get update && apt-get install -y netcat-openbsd postgresql-client curl tzdata && rm -rf /var/lib/apt/lists/*

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose port
EXPOSE 8081

# Use new startup script
CMD ["/start.sh"] 