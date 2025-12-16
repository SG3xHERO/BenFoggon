# Ben Foggon Spotify API

A secure Express.js API server that handles Spotify Web API authentication and requests for the Ben Foggon portfolio website.

## Features

- Secure Spotify token management
- CORS-enabled endpoints
- Caching for better performance  
- Docker support
- Health check endpoint

## Setup

1. Copy `.env.example` to `.env` and fill in your Spotify credentials
2. Install dependencies: `npm install`
3. Run in development: `npm run dev`
4. Run in production: `npm start`

## Environment Variables

- `SPOTIFY_CLIENT_ID`: Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify app client secret
- `SPOTIFY_REFRESH_TOKEN`: A valid refresh token for your account
- `PORT`: Server port (default: 3001)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## Endpoints

- `GET /health` - Health check
- `POST /auth/refresh` - Get access token (legacy compatibility)
- `GET /spotify/now-playing` - Get currently playing track
- `GET /spotify/recent-tracks` - Get recently played tracks

## Docker

Build: `docker build -t benfoggon-api .`
Run: `docker run -p 3001:3001 --env-file .env benfoggon-api`