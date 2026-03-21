# MyHome - Monitoring & Logging Guide

Complete guide to monitoring, logging, and alerting for the MyHome application.

## Overview

The monitoring stack covers:
- **Application logging** - Structured JSON logs
- **Error tracking** - Sentry
- **Performance monitoring** - Docker stats + optional New Relic
- **Database monitoring** - MongoDB Atlas monitoring
- **Log aggregation** - Docker json-file driver
- **Health checks** - Built-in Docker health checks
- **Alerting** - CloudWatch Alarms / UptimeRobot

## Application Health Checks

The backend exposes a health check endpoint:

```bash
# Check backend health
curl http://localhost:5000/api/health
# Expected: {"status":"Server is running"}

# Docker health status
docker inspect myhome-backend --format='{{.State.Health.Status}}'
docker inspect myhome-frontend --format='{{.State.Health.Status}}'
docker inspect myhome-mongodb --format='{{.State.Health.Status}}'
docker inspect myhome-redis --format='{{.State.Health.Status}}'
```

## Application Logs

### View logs with Docker

```bash
# All services (follow mode)
docker-compose -f docker/docker-compose.yml logs -f

# Backend only (last 100 lines)
docker-compose -f docker/docker-compose.yml logs --tail=100 backend

# Filter by time
docker-compose -f docker/docker-compose.yml logs --since="2024-01-01T00:00:00" backend
```

### Log rotation configuration

Logs are configured with automatic rotation in `docker-compose.yml`:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # Rotate when file reaches 10 MB
    max-file: "3"      # Keep last 3 files
```

## Sentry Error Tracking

### Setup

1. Create a free account at [sentry.io](https://sentry.io/)
2. Create a new project (Node.js)
3. Copy your DSN

### Install Sentry in Backend

```bash
npm install @sentry/node @sentry/profiling-node
```

### Configure Sentry in server.js

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Add to Express middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Set Environment Variable

```bash
# In .env or Heroku config
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
```

## Performance Monitoring

### Docker Stats

```bash
# Real-time container stats
docker stats

# Single snapshot
docker stats --no-stream

# Specific containers
docker stats myhome-backend myhome-frontend myhome-mongodb
```

### MongoDB Performance

```bash
# Connect to MongoDB and run diagnostics
docker exec -it myhome-mongodb mongosh

# In mongosh:
db.serverStatus()
db.stats()
db.currentOp()
db.collection.explain("executionStats").find({})
```

### MongoDB Atlas Monitoring

When using MongoDB Atlas:
1. Go to your cluster → "Metrics" tab
2. Monitor: Operations/sec, Connections, Disk usage
3. Set up alerts under "Alerts" → "Add New Alert"

Recommended Atlas alerts:
- Connections > 80% of max
- Disk usage > 80%
- Query targeting > 1000 docs scanned per returned doc
- Replication oplog window < 1 hour

## Log Aggregation

### Using CloudWatch (AWS)

Install the CloudWatch agent on EC2:

```bash
sudo yum install amazon-cloudwatch-agent

# Configure
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

Example CloudWatch agent config:
```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/lib/docker/containers/**/*-json.log",
            "log_group_name": "/myhome/docker",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 30
          }
        ]
      }
    }
  }
}
```

### Query logs in CloudWatch

```bash
# Using AWS CLI
aws logs filter-log-events \
  --log-group-name /myhome/docker \
  --start-time $(date -d '-1 hour' +%s000) \
  --filter-pattern "ERROR"
```

## Alerting System

### UptimeRobot (Free)

1. Go to [UptimeRobot](https://uptimerobot.com/)
2. Add HTTP monitor: `https://yourdomain.com/api/health`
3. Set check interval: 5 minutes
4. Add email/Slack notification

### AWS CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "myhome-high-cpu" \
  --alarm-description "CPU over 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:myhome-alerts

# Low disk space alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "myhome-low-disk" \
  --alarm-description "Disk usage over 85%" \
  --metric-name DiskSpaceUtilization \
  --namespace System/Linux \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789:myhome-alerts
```

## Production Checklist

Before going live, verify:

- [ ] Health check endpoint returns 200 OK
- [ ] All containers show "healthy" status
- [ ] Sentry DSN configured and test error received
- [ ] MongoDB Atlas alerts configured
- [ ] UptimeRobot or similar monitoring active
- [ ] Log rotation configured (max-size, max-file)
- [ ] CloudWatch or equivalent log aggregation active
- [ ] Backup cron job running (`crontab -l`)
- [ ] SSL certificate valid and auto-renewal working
- [ ] Alerts sent to correct email/Slack channel

## Viewing Metrics Summary

```bash
# Quick health summary script
echo "=== Container Status ==="
docker-compose -f docker/docker-compose.yml ps

echo ""
echo "=== Container Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
echo "=== Disk Usage ==="
df -h /

echo ""
echo "=== Backend Health ==="
curl -s http://localhost:5000/api/health
```
