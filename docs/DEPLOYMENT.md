# MyHome - Deployment Overview

This guide covers deploying the MyHome Service Provider Marketplace to production.

## Prerequisites

- Docker 24.x and Docker Compose 2.x
- Git
- A cloud provider account (Heroku, Vercel, AWS, or DigitalOcean)
- MongoDB Atlas account (or self-hosted MongoDB)
- Domain name (optional but recommended)

## Architecture

```
                        ┌──────────────────┐
                        │  Load Balancer   │
                        │  (Nginx / ALB)   │
                        └────────┬─────────┘
                    ┌────────────┴────────────┐
                    ▼                         ▼
           ┌────────────────┐       ┌─────────────────┐
           │  Frontend      │       │  Backend API    │
           │  (React/Nginx) │       │  (Node.js)      │
           │  Port: 3000    │       │  Port: 5000     │
           └────────────────┘       └────────┬────────┘
                                             │
                                  ┌──────────┴──────────┐
                                  ▼                     ▼
                           ┌──────────────┐    ┌──────────────┐
                           │  MongoDB     │    │  Redis       │
                           │  Port: 27017 │    │  Port: 6379  │
                           └──────────────┘    └──────────────┘
```

## Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/rajkumaro/MyHome.git
cd MyHome

# Copy and configure environment variables
cp env/.env.example .env
# Edit .env with your values

# Start all services with Docker Compose
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

## Deployment Options

| Platform | Best For | Cost | Complexity |
|----------|----------|------|------------|
| Heroku | Quick deploys, small projects | Free tier available | Low |
| Vercel | Frontend only | Free tier available | Low |
| DigitalOcean | VPS with full control | ~$6/month | Medium |
| AWS | Enterprise, scalable | Pay-as-you-go | High |

## Deployment Guides

- [Docker Setup](DOCKER.md) - Local Docker development
- [Heroku Deployment](HEROKU_DEPLOYMENT.md) - Deploy to Heroku
- [AWS Deployment](AWS_DEPLOYMENT.md) - Deploy to AWS
- [Monitoring Setup](MONITORING.md) - Monitoring and logging

## Environment Variables

See `env/.env.example` for all required environment variables.

Critical variables to set for production:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Strong random secret (min 64 chars)
- `STRIPE_SECRET_KEY` - Payment processing
- `NODE_ENV=production`

## Step-by-Step Production Deployment

### 1. Prepare your server

```bash
# DigitalOcean
chmod +x deployment/digitalocean/setup.sh
sudo ./deployment/digitalocean/setup.sh yourdomain.com your@email.com

# AWS EC2
chmod +x deployment/aws/setup.sh
sudo ./deployment/aws/setup.sh
```

### 2. Configure environment

```bash
cp env/.env.production /opt/myhome/.env
nano /opt/myhome/.env  # Edit with your actual values
```

### 3. Deploy

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh production
```

### 4. Set up SSL

```bash
chmod +x scripts/setup-ssl.sh
sudo ./scripts/setup-ssl.sh yourdomain.com your@email.com
```

### 5. Set up automated backups

```bash
# Add to crontab: daily backup at 2 AM
(crontab -l; echo "0 2 * * * /opt/myhome/scripts/backup.sh s3") | crontab -
```

## Troubleshooting

### Container not starting
```bash
docker-compose -f docker/docker-compose.yml logs backend
docker-compose -f docker/docker-compose.yml ps
```

### Database connection issues
```bash
# Check MongoDB is running
docker exec myhome-mongodb mongosh --eval "db.adminCommand('ping')"

# Check network connectivity from backend
docker exec myhome-backend ping mongodb
```

### Port conflicts
```bash
# Check what's using a port
lsof -i :5000
lsof -i :3000
```

### Reset everything
```bash
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml up -d
```
