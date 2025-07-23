# Variables
CLIENT_DIR = client
SERVER_DIR = server

# Default target
all: init run

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
