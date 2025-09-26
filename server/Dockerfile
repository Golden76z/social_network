# Build stage
FROM golang:1.23-alpine AS builder

# Install build dependencies for SQLite support
RUN apk add --no-cache sqlite-dev build-base git

WORKDIR /app

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application with CGO enabled for SQLite
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-w -s" -o /social-network ./server.go

# Final stage - lightweight Alpine with SQLite runtime
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache sqlite ca-certificates tzdata wget curl

# Create app user for security
RUN adduser -D -s /bin/sh appuser

WORKDIR /app

# Copy binary from builder
COPY --from=builder /social-network /app/

# Copy configuration and migrations
COPY --from=builder /app/config/ /app/config/
COPY --from=builder /app/db/migrations/ /app/migrations/

# Copy important server files
COPY --from=builder /app/demo/ /app/demo/

# Set permissions
RUN chown -R appuser:appuser /app
USER appuser

# Create directories for uploaded files
RUN mkdir -p /app/uploads/avatars /app/uploads/posts


EXPOSE 8080
CMD ["./social-network"]