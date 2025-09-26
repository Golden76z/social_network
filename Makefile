# Variables
CLIENT_DIR = client
SERVER_DIR = server
COMPOSE_FILE = docker-compose.yml
COMPOSE_FILE_DEV = docker-compose.dev.yml

# Default target
all: init run

# Docker commands
docker-build:
	@echo "Building Docker images..."
	docker-compose -f $(COMPOSE_FILE) build

docker-build-dev:
	@echo "Building development Docker images..."
	docker-compose -f $(COMPOSE_FILE_DEV) build

docker-up:
	@echo "Starting all services with Docker Compose..."
	docker-compose -f $(COMPOSE_FILE) up -d

docker-up-dev:
	@echo "Starting development services with Docker Compose..."
	docker-compose -f $(COMPOSE_FILE_DEV) up -d

docker-down:
	@echo "Stopping all Docker services..."
	docker-compose -f $(COMPOSE_FILE) down
	docker-compose -f $(COMPOSE_FILE_DEV) down

docker-logs:
	@echo "Viewing logs..."
	docker-compose -f $(COMPOSE_FILE) logs -f

docker-logs-dev:
	@echo "Viewing development logs..."
	docker-compose -f $(COMPOSE_FILE_DEV) logs -f

# Initialize the project
init:
	@echo "Initializing the project..."
	@cd $(SERVER_DIR) && go mod tidy
	@cd $(CLIENT_DIR) && npm install

# Run the server and client
run: run_server run_client

run_server:
	@echo "Initializing Go modules and starting the Go server..."
	@cd $(SERVER_DIR) && go mod tidy && nohup go run server.go &

run_client:
	@echo "Starting the Next.js client..."
	@cd $(CLIENT_DIR) && npm run dev

# Docker quick start
docker: docker-build docker-up

docker-dev: docker-build-dev docker-up-dev

# Stop the services (optional)
stop:
	@echo "Stopping the services..."
	@pkill -f "go run server.go" || true
	@pkill -f "npm run dev" || true

# Clean up (optional)
clean:
	@echo "Cleaning up..."
	@cd $(SERVER_DIR) && go clean
	@rm -f $(SERVER_DIR)/social_network.db || true
	@rm -f $(SERVER_DIR)/demo/seed.lock || true
	@cd $(CLIENT_DIR) && npm run clean || true

# Docker clean
docker-clean:
	@echo "Cleaning Docker images and containers..."
	docker-compose -f $(COMPOSE_FILE) down -v --rmi all
	docker-compose -f $(COMPOSE_FILE_DEV) down -v --rmi all
	docker system prune -f

# Help
help:
	@echo "Available commands:"
	@echo "  init          - Initialize project dependencies"
	@echo "  run           - Run server and client locally"
	@echo "  docker        - Build and run with Docker"
	@echo "  docker-dev    - Build and run development environment"
	@echo "  docker-build  - Build Docker images"
	@echo "  docker-up     - Start Docker services"
	@echo "  docker-down   - Stop Docker services"
	@echo "  docker-logs   - View Docker logs"
	@echo "  clean         - Clean up local environment"
	@echo "  docker-clean  - Clean up Docker environment"
	@echo "  stop          - Stop local services"
	@echo "  help          - Show this help message"
