# MyHome - Docker Setup Guide

Complete guide to building, running, and managing MyHome with Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 24.x+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.x+

Verify installation:
```bash
docker --version
docker compose version
```

## Project Docker Structure

```
docker/
├── Dockerfile.backend      # Node.js backend image (multi-stage)
├── Dockerfile.frontend     # React + Nginx frontend image (multi-stage)
├── nginx.conf              # Nginx configuration for SPA routing
├── docker-compose.yml      # Local development compose file
└── .dockerignore           # Files excluded from Docker builds
```

## Building Images

### Build backend image
```bash
docker build -f docker/Dockerfile.backend -t myhome-backend:latest .
```

### Build frontend image
```bash
docker build -f docker/Dockerfile.frontend -t myhome-frontend:latest .
```

### Build both images
```bash
docker-compose -f docker/docker-compose.yml build
```

### Build with no cache (useful when dependencies change)
```bash
docker-compose -f docker/docker-compose.yml build --no-cache
```

## Running Containers

### Start all services
```bash
# Copy environment file first
cp env/.env.example .env
# Edit .env with your values, then:

docker-compose -f docker/docker-compose.yml up -d
```

### Start specific service
```bash
docker-compose -f docker/docker-compose.yml up -d backend
```

### View running containers
```bash
docker-compose -f docker/docker-compose.yml ps
```

### View logs
```bash
# All services
docker-compose -f docker/docker-compose.yml logs -f

# Specific service
docker-compose -f docker/docker-compose.yml logs -f backend
docker-compose -f docker/docker-compose.yml logs -f frontend
docker-compose -f docker/docker-compose.yml logs -f mongodb
```

### Stop services
```bash
# Stop but keep volumes
docker-compose -f docker/docker-compose.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker/docker-compose.yml down -v
```

## Service URLs (Development)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| MongoDB | mongodb://localhost:27017 |
| Redis | redis://localhost:6379 |

## Health Checks

All services include health checks. Verify with:
```bash
docker inspect myhome-backend --format='{{.State.Health.Status}}'
docker inspect myhome-frontend --format='{{.State.Health.Status}}'
docker inspect myhome-mongodb --format='{{.State.Health.Status}}'
docker inspect myhome-redis --format='{{.State.Health.Status}}'
```

## Executing Commands Inside Containers

```bash
# Open a shell in the backend container
docker exec -it myhome-backend sh

# Run a Node.js REPL in backend
docker exec -it myhome-backend node

# Access MongoDB shell
docker exec -it myhome-mongodb mongosh

# Access Redis CLI
docker exec -it myhome-redis redis-cli
```

## Volume Management

```bash
# List volumes
docker volume ls | grep myhome

# Inspect a volume
docker volume inspect myhome_mongodb-data

# Backup a volume
docker run --rm -v myhome_mongodb-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/mongodb-backup.tar.gz /data

# Remove all project volumes (WARNING: deletes all data)
docker volume rm myhome_mongodb-data myhome_redis-data myhome_uploads
```

## Production Docker Compose

For production use the DigitalOcean production compose file:
```bash
docker-compose -f deployment/digitalocean/docker-compose.prod.yml up -d
```

## Multi-Stage Build Details

### Backend (`Dockerfile.backend`)
- **Stage 1 (builder)**: Installs production npm dependencies
- **Stage 2 (production)**: Copies only node_modules + source, runs as non-root user

### Frontend (`Dockerfile.frontend`)
- **Stage 1 (builder)**: Installs dependencies + builds React app
- **Stage 2 (production)**: Nginx serving only the static build output

This keeps images lean and secure.

## Environment Variables in Docker

Variables are loaded from the `.env` file in the project root. Docker Compose automatically reads this file.

```bash
# Override specific variables
MONGODB_URI=mongodb+srv://... docker-compose -f docker/docker-compose.yml up -d
```

## Cleaning Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all unused resources (containers, networks, images, volumes)
docker system prune -a --volumes
```
