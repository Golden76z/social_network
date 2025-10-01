#!/bin/bash

# Alternative Docker commands without docker-compose
# This script builds and runs the containers manually

echo "Building Docker images..."

# Build server image
echo "Building server image..."
docker build -t social-network-server ./server

# Build client image  
echo "Building client image..."
docker build -t social-network-client ./client

echo "Starting containers..."

# Create network
docker network create social-network 2>/dev/null || true

# Create volumes
docker volume create server_uploads 2>/dev/null || true
docker volume create server_db 2>/dev/null || true

# Run server container
echo "Starting server container..."
docker run -d \
  --name social-network-backend \
  --network social-network \
  -p 8080:8080 \
  -v server_uploads:/app/uploads \
  -v server_db:/app \
  -e ENV=production \
  -e PORT=8080 \
  -e DB_PATH=/app/social_network.db \
  -e MIGRATIONS_DIR=/app/migrations \
  -e JWT_EXPIRATION_HOURS=24 \
  -e CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001 \
  -e LOG_LEVEL=info \
  -e ENABLE_REGISTRATION=true \
  -e ENABLE_FILE_UPLOAD=true \
  -e ENABLE_CHAT=true \
  --restart unless-stopped \
  social-network-server

# Wait a moment for server to start
echo "Waiting for server to start..."
sleep 10

# Run client container
echo "Starting client container..."
docker run -d \
  --name social-network-frontend \
  --network social-network \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \
  -e NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 \
  -e NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws \
  --restart unless-stopped \
  social-network-client

echo "Containers started!"
echo "Server: http://localhost:8080"
echo "Client: http://localhost:3000"
echo ""
echo "To stop containers:"
echo "docker stop social-network-backend social-network-frontend"
echo "docker rm social-network-backend social-network-frontend"
