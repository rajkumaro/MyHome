# MyHome - Heroku Deployment Guide

Deploy the MyHome backend to Heroku and the frontend to Vercel.

## Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- [Vercel CLI](https://vercel.com/docs/cli) (for frontend)
- [Git](https://git-scm.com/)
- Heroku account (free tier available)
- MongoDB Atlas account

## Backend Deployment (Heroku)

### 1. Install and Login to Heroku CLI

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login
```

### 2. Create Heroku App

```bash
# Create a new Heroku app
heroku create myhome-backend

# Or with a specific region
heroku create myhome-backend --region eu
```

### 3. Set Environment Variables

```bash
heroku config:set NODE_ENV=production \
  JWT_SECRET=your_very_strong_jwt_secret \
  MONGODB_URI=your_mongodb_atlas_connection_string \
  STRIPE_SECRET_KEY=sk_live_your_stripe_key \
  CLIENT_URL=https://myhome-frontend.vercel.app \
  --app myhome-backend
```

### 4. Deploy to Heroku

```bash
# Add Heroku remote
heroku git:remote -a myhome-backend

# Push to Heroku
git push heroku main

# For deploying from a subdirectory (if backend is in a subfolder)
git subtree push --prefix backend heroku main
```

### 5. Verify Deployment

```bash
# Check logs
heroku logs --tail --app myhome-backend

# Open the app
heroku open --app myhome-backend

# Test health endpoint
curl https://myhome-backend.herokuapp.com/api/health
```

### 6. Using the Procfile

The `deployment/heroku/Procfile` is automatically detected by Heroku:

```
web: node server.js
```

Copy it to the project root for Heroku detection:
```bash
cp deployment/heroku/Procfile ./Procfile
```

### 7. Using app.json (One-Click Deploy)

The `deployment/heroku/app.json` enables one-click deployment:

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/rajkumaro/MyHome)

## Frontend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy Frontend

```bash
# Navigate to client directory
cd client

# Deploy (follow the prompts)
vercel

# Or deploy to production
vercel --prod
```

### 4. Configure Environment Variables on Vercel

```bash
vercel env add REACT_APP_API_URL
# Enter: https://myhome-backend.herokuapp.com

vercel env add REACT_APP_SOCKET_URL
# Enter: https://myhome-backend.herokuapp.com

vercel env add REACT_APP_STRIPE_PUBLIC_KEY
# Enter: pk_live_your_stripe_public_key
```

### 5. Using vercel.json

The `deployment/vercel.json` file configures Vercel deployment. Copy it to the client directory:

```bash
cp deployment/vercel.json client/vercel.json
```

## Connecting Backend and Frontend

### Update CORS on Backend

Add the Vercel URL to your Heroku backend environment:
```bash
heroku config:set CLIENT_URL=https://your-frontend.vercel.app --app myhome-backend
```

### Update Frontend API URL

```bash
vercel env add REACT_APP_API_URL
# Enter: https://your-backend.herokuapp.com
```

## MongoDB Atlas Setup

### 1. Create a Free Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Build a Database" → "M0 Free"
3. Choose a cloud provider and region
4. Name your cluster (e.g., `myhome-cluster`)

### 2. Create a Database User

1. Go to "Database Access" → "Add New Database User"
2. Authentication method: Password
3. Username: `myhome_user`
4. Auto-generate a secure password
5. Built-in role: "Read and write to any database"

### 3. Configure Network Access

1. Go to "Network Access" → "Add IP Address"
2. For Heroku: Click "Allow Access from Anywhere" (0.0.0.0/0)
3. For AWS/DigitalOcean: Add your server's static IP

### 4. Get Connection String

1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Driver: Node.js, Version: 4.1+
4. Copy the connection string
5. Replace `<password>` with your database user password

```
mongodb+srv://myhome_user:<password>@myhome-cluster.xxxxx.mongodb.net/myhome?retryWrites=true&w=majority
```

## CI/CD with GitHub Actions

The `.github/workflows/ci-cd.yml` pipeline automatically:
1. Runs tests on every push
2. Builds Docker images on push to `main`
3. Deploys to production when tests pass

Add these secrets to your GitHub repository:
- `DEPLOY_HOST` - Your server IP
- `DEPLOY_USER` - SSH user (e.g., `ec2-user`)
- `DEPLOY_SSH_KEY` - Your private SSH key

## Scaling on Heroku

```bash
# Scale to 2 dynos
heroku ps:scale web=2 --app myhome-backend

# Enable autoscaling (Eco/Basic plan required)
heroku ps:autoscale:enable web --min 1 --max 3 --app myhome-backend
```

## Heroku Add-ons

```bash
# Add MongoDB Atlas (via mLab)
heroku addons:create mongolab:sandbox --app myhome-backend

# Add Redis
heroku addons:create heroku-redis:mini --app myhome-backend

# Add Papertrail for logging
heroku addons:create papertrail:choklad --app myhome-backend
```

## Rollback

```bash
# List recent releases
heroku releases --app myhome-backend

# Rollback to previous release
heroku rollback --app myhome-backend

# Rollback to specific release
heroku rollback v42 --app myhome-backend
```
