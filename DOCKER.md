# Docker Setup for Social Network

This document explains how to use Docker with your social network project.

## Project Structure

```
social_network/
├── server/              # Go backend
│   ├── Dockerfile
│   └── ...
├── client/              # Next.js frontend
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── ...
├── docker-compose.yml   # Production setup
├── docker-compose.dev.yml # Development setup
└── Makefile            # Contains Docker commands
```

## Quick Start

### Production Environment
```bash
# Build and start all services
make docker

# Or manually:
docker-compose build
docker-compose up -d
```

### Development Environment
```bash
# Build and start development services
make docker-dev

# Or manually:
docker-compose -f docker-compose.dev.yml build
docker-compose -f docker-compose.dev.yml up -d
```

## Commands

### Make Commands
- `make docker` - Build and start production environment
- `make docker-dev` - Build and start development environment
- `make docker-build` - Build Docker images
- `make docker-up` - Start Docker services
- `make docker-down` - Stop Docker services
- `make docker-logs` - View logs
- `make docker-clean` - Clean up Docker containers, images, and volumes

### Docker Compose Commands

#### Production
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up
docker-compose down -v --rmi all
```

#### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View development logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## Services

### Production Environment (`docker-compose.yml`)

1. **server** (Go Backend)
   - Port: 8080
   - Build context: `./server`
   - Health check: `/health` endpoint
   - Volumes: Database persistence, upload files

2. **client** (Next.js Frontend)
   - Port: 3000
   - Build context: `./client`
   - Environment: Production mode
   - Depends on: Backend health check

3. **db-admin** (Optional SQLite Admin)
   - Port: 8888
   - Profile: tools (use `--profile tools`)
   - Access: http://localhost:8888

### Development Environment (`docker-compose.dev.yml`)

Similar structure but optimized for development:
- Volume bindings for live reload
- Development configurations
- Hot module replacement

## Configuration

### Environment Variables (Production)
Set in `docker-compose.yml`:
- `ENV=production`
- `PORT=8080`
- `CORS_ALLOWED_ORIGINS` - Frontend URL
- `JWT_EXPIRATION_HOURS` - Session duration
- `LOG_LEVEL` - Logging verbosity

### Environment Variables (Development)
In `docker-compose.dev.yml`:
- `ENV=development`
- `LOG_LEVEL=debug` - More verbose logging
- Volume mounts for code synchronization

## Storage

### Volumes
- `server_uploads` - User uploaded files (avatars, posts)
- `server_db` - SQLite database file

### Backups
```bash
# Backup database
docker-compose exec server sqlite3 social_network.db ".backup backup.db"

# Backup uploads
docker cp social-network-backend:/app/uploads ./uploads-backup/
```

## Troubleshooting

### Common Issues

1. **SQLite permission errors**
   ```bash
   # Set correct ownership
   docker-compose exec server chown -R appuser:appuser /app
   ```

2. **Port conflicts**
   - Check if ports 3000 or 8080 are already in use
   - Modify ports in `docker-compose.yml` if needed

3. **Health check failures**
   - Ensure backend has `/health` endpoint
   - Check server logs: `docker-compose logs server`

4. **CORS errors**
   - Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
   - Check environment variable is set correctly

### Useful Commands

```bash
# Check containers status
docker-compose ps

# Execute shell in backend container
docker-compose exec server sh

# View backend logs
docker-compose logs server

# View database contents (if db-admin is running)
# Access at http://localhost:8888
```

## Performance Optimization

### Resource Limits
Add to services in `docker-compose.yml`:
```yaml
services:
  server:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Database Optimization
- SQLite ideal for development/small deployment
- Consider PostgreSQL for production scaling
- Regular database backup strategy

## Security Considerations

1. **Non-root users**: Both services run as non-privileged users
2. **File permissions**: Proper ownership set on uploads
3. **Network isolation**: Services communicate through private network
4. **Environment variables**: Sensitive config via environment, not files

## Scaling

For larger deployments:
1. Replace SQLite with PostgreSQL
2. Add load balancer (nginx/traefik)
3. Add Redis for session management
4. Configure database replication
5. Implement file storage backend (AWS S3/MinIO)

## Support

Available commands via Makefile:
```bash
make help
```

## File Structure Reference

```
server/Dockerfile - Production Go backend image
client/Dockerfile - Production Next.js image
client/Dockerfile.dev - Development Next.js image
docker-compose.yml - Production environment
docker-compose.dev.yml - Development environment
"""

Makefile - Build automation with Docker support
DOCKER.md - This documentation
```
