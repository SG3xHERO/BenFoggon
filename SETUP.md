# Ben Foggon Portfolio - Complete Setup Guide

This portfolio includes a custom Spotify player that displays currently playing music. The setup includes both a frontend (Nginx-served static site) and a backend API (Node.js Express) for secure Spotify integration.

## Architecture

- **Frontend**: Static HTML/CSS/JS served by Nginx
- **Backend**: Node.js Express API for Spotify Web API integration
- **Deployment**: Docker Compose with multi-container setup
- **Reverse Proxy**: Nginx proxy for production routing

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- Spotify Developer App (for API credentials)

### 2. Spotify Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your **Client ID** and **Client Secret**
4. Add redirect URI: `http://localhost:3001/callback` (for development)
5. Get a refresh token using the included script (see below)

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Spotify credentials
# SPOTIFY_CLIENT_ID=your_client_id_here
# SPOTIFY_CLIENT_SECRET=your_client_secret_here
# SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

### 4. Get Spotify Refresh Token

Use the included utility script:

```bash
cd api
npm install
node get-refresh-token.js
```

Follow the instructions to authorize your Spotify account and get a refresh token.

### 5. Deploy with Docker

```bash
# Development (with logs)
docker-compose up --build

# Production (detached)
docker-compose up -d --build

# With reverse proxy (production)
docker-compose --profile production up -d --build
```

### 6. Access Your Site

- **Development**: http://localhost:8082
- **API Health Check**: http://localhost:3001/health
- **Production**: Configure your domain in nginx-proxy.conf

## Manual Setup (Without Docker)

### Frontend
```bash
# Serve with any static server
npx serve . -p 8082
# or
python -m http.server 8082
```

### Backend
```bash
cd api
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

## API Endpoints

- `GET /health` - Health check
- `GET /spotify/now-playing` - Currently playing track
- `GET /spotify/recent-tracks` - Recently played tracks
- `POST /auth/refresh` - Get access token (legacy)

## Troubleshooting

### Spotify Player Not Working

1. **Check API connectivity**: Visit http://localhost:3001/health
2. **Verify credentials**: Ensure your .env file has correct Spotify credentials
3. **Check refresh token**: Make sure your refresh token is valid and not expired
4. **CORS issues**: Ensure the API server is running and accessible

### Docker Issues

```bash
# View logs
docker-compose logs benfoggon-api
docker-compose logs benfoggon-site

# Restart services
docker-compose restart

# Rebuild containers
docker-compose down
docker-compose up --build
```

### Common Errors

- **401 Unauthorized**: Invalid or expired refresh token
- **CORS errors**: API server not accessible from frontend
- **404 on /api/**: Nginx proxy configuration issue

## Production Deployment

1. **Domain Setup**: Update nginx-proxy.conf with your domain
2. **SSL Certificates**: Add SSL configuration to nginx-proxy.conf
3. **Environment Variables**: Use production-ready secrets management
4. **Monitoring**: Set up health checks and logging

## Security Notes

- Never commit real credentials to version control
- Use environment variables for all sensitive data
- The refresh token should be kept secure
- Consider using a secrets management system in production

## Development

### Adding New Features

The Spotify player is modular and can be extended:

- **New endpoints**: Add to `api/server.js`
- **Frontend updates**: Modify `scripts/spotify.js`
- **Styling**: Update `styles/styles.css`

### Testing

```bash
# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/spotify/now-playing

# Frontend testing
# Open browser developer tools and check console for errors
```

## Support

If you encounter issues:

1. Check the logs with `docker-compose logs`
2. Verify your Spotify app settings
3. Ensure all environment variables are set
4. Check that your refresh token is valid