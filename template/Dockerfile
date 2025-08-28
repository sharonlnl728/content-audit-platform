# Use pre-built JAR file
FROM openjdk:17-slim

# Install necessary tools and timezone data
RUN apt-get update && apt-get install -y netcat-openbsd postgresql-client curl tzdata && rm -rf /var/lib/apt/lists/*

# Set timezone to UTC
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose port
EXPOSE 8085

# Copy pre-built JAR file
COPY target/*.jar app.jar

# Use startup script
CMD ["/start.sh"]
