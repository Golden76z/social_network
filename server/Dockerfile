# Build stage
FROM golang:1.24.3 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /template

# Final stage
FROM gcr.io/distroless/base-debian11:nonroot

# Copy binaries and configs
COPY --from=builder --chown=nonroot:nonroot /template /app/
COPY --chown=nonroot:nonroot configs/ /app/configs/

# Security hardening
USER nonroot:nonroot
WORKDIR /app

# Health check endpoint should be added to your Go code
HEALTHCHECK --interval=30s --timeout=3s \
  CMD ["/wget", "-qO-", "http://localhost:8080/health"]

EXPOSE 8080
ENTRYPOINT ["/app/template"]