# 🚀 Portainer Deployment Fix Guide

The Docker build error you're seeing is likely due to npm installation issues. Here's how to fix it:

## 🔧 Quick Fix Options

### Option 1: Use the Updated Files (Recommended)

The files have been updated to fix the npm installation issue:

1. **Updated Dockerfile** - Uses `npm install` instead of `npm ci` for better compatibility
2. **Added .dockerignore** - Prevents conflicting files from being copied
3. **Added wget** - For better health checks in Alpine Linux

### Option 2: Use Pre-built Images

If the build continues to fail, you can use pre-built images. Create this simpler stack file:

```yaml
version: '3.8'

services:
  benfoggon-site:
    image: nginx:alpine
    container_name: benfoggon-portfolio
    restart: unless-stopped
    ports:
      - "8082:80"
    volumes:
      - ./:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - benfoggon-api

  benfoggon-api:
    image: node:18-alpine
    container_name: benfoggon-api
    restart: unless-stopped
    working_dir: /app
    command: sh -c "npm install --production && node server.js"
    expose:
      - "3001"
    ports:
      - "3001:3001"
    volumes:
      - ./api:/app:ro
    environment:
      - NODE_ENV=production
      - PORT=3001
      - SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID}
      - SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}
      - SPOTIFY_REFRESH_TOKEN=${SPOTIFY_REFRESH_TOKEN}
      - ALLOWED_ORIGINS=https://benfoggon.com,https://api.benfoggon.com
```

## 📋 Step-by-Step Portainer Deployment

### 1. Prepare Your Repository

Make sure your repository has these files:
- ✅ `portainer-stack.yml` (created above)
- ✅ `api/.dockerignore` (prevents build conflicts)
- ✅ Updated `api/Dockerfile` (fixed npm install)

### 2. Set Environment Variables in Portainer

In Portainer Stack configuration, add these environment variables:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here  
SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token_here
```

### 3. Deploy the Stack

1. **Go to Portainer** → Stacks → Add Stack
2. **Name**: `benfoggon-portfolio`
3. **Build method**: 
   - **Repository**: Paste your Git repository URL
   - **Branch**: `main` 
   - **Compose file**: `portainer-stack.yml`
4. **Environment variables**: Add your Spotify credentials
5. **Deploy**

### 4. Nginx Proxy Manager Setup

Create these proxy hosts in Nginx Proxy Manager:

**Frontend (Main Site):**
- Domain: `benfoggon.com`
- Forward to: `benfoggon-portfolio:80`

**API (Backend):**  
- Domain: `api.benfoggon.com`
- Forward to: `benfoggon-api:3001`

## 🐛 Troubleshooting Build Errors

### Error: "npm ci failed"
**Solution**: Use the updated Dockerfile that uses `npm install` instead of `npm ci`

### Error: "COPY failed" 
**Solution**: Ensure `.dockerignore` files are present to exclude unnecessary files

### Error: "No package-lock.json"
**Solution**: The updated package.json and Dockerfile handle this automatically

### Error: "Permission denied"
**Solution**: The Dockerfile now properly sets up user permissions

## 🔍 Debug Commands

If deployment fails, check these in Portainer:

```bash
# Check container logs
docker logs benfoggon-api
docker logs benfoggon-portfolio

# Test API directly
curl http://localhost:3001/health

# Check if containers can communicate
docker exec benfoggon-portfolio ping benfoggon-api
```

## 🎯 Alternative: Manual Container Deployment

If stack deployment continues to fail, deploy containers individually:

### 1. Deploy API Container
```bash
docker run -d \
  --name benfoggon-api \
  --restart unless-stopped \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e SPOTIFY_CLIENT_ID=your_client_id \
  -e SPOTIFY_CLIENT_SECRET=your_client_secret \
  -e SPOTIFY_REFRESH_TOKEN=your_refresh_token \
  -v /path/to/your/repo/api:/app \
  -w /app \
  node:18-alpine \
  sh -c "npm install --production && node server.js"
```

### 2. Deploy Frontend Container  
```bash
docker run -d \
  --name benfoggon-portfolio \
  --restart unless-stopped \
  -p 8082:80 \
  -v /path/to/your/repo:/usr/share/nginx/html:ro \
  -v /path/to/your/repo/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine
```

## ✅ Verification Steps

After deployment:

1. **Check containers are running**: `docker ps`
2. **Test API health**: Visit `http://your-server:3001/health`
3. **Test frontend**: Visit `http://your-server:8082`
4. **Check Spotify integration**: Look for the music player on the site

The updated configuration should resolve the npm installation error and work properly with your Nginx Proxy Manager setup!