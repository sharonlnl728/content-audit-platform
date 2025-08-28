# Use nginx as static file server
FROM nginx:alpine

# Set timezone to UTC (frontend container timezone is not important as frontend will intelligently convert)
ENV TZ=UTC
RUN apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Copy built files to nginx directory
COPY dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 