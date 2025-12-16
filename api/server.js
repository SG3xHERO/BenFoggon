const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "*.scdn.co", "*.spotifycdn.com"],
      connectSrc: ["'self'", "api.spotify.com"]
    }
  }
}));

app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:8082', 'https://benfoggon.com'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Spotify configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
  console.error('Missing required Spotify environment variables');
  process.exit(1);
}

// In-memory token storage (in production, use Redis or database)
let accessTokenCache = {
  token: null,
  expires_at: null
};

// Function to get access token
async function getAccessToken() {
  // Check if we have a valid cached token
  if (accessTokenCache.token && accessTokenCache.expires_at > Date.now()) {
    return accessTokenCache.token;
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: SPOTIFY_REFRESH_TOKEN
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    const { access_token, expires_in } = response.data;
    
    // Cache the token
    accessTokenCache = {
      token: access_token,
      expires_at: Date.now() + (expires_in * 1000) - 60000 // Refresh 1 minute early
    };

    return access_token;
  } catch (error) {
    console.error('Error refreshing Spotify token:', error.response?.data || error.message);
    throw new Error('Failed to refresh Spotify token');
  }
}

// Endpoint to refresh token (for compatibility with existing client code)
app.post('/auth/refresh', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    res.json({ access_token: accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Endpoint to get currently playing track
app.get('/spotify/now-playing', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 204) {
      return res.json({ error: 'Currently not playing', isPlaying: false });
    }

    const data = response.data;
    
    // Format the response to match what the client expects
    const formattedResponse = {
      albumImageUrl: data.item.album.images[0]?.url || '',
      artist: data.item.artists.map(artist => artist.name).join(', '),
      isPlaying: data.is_playing,
      songUrl: data.item.external_urls.spotify,
      title: data.item.name,
      timePlayed: data.progress_ms,
      timeTotal: data.item.duration_ms,
      artistUrl: data.item.artists[0]?.external_urls.spotify || ''
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error fetching now playing:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        accessTokenCache = { token: null, expires_at: null };
        const newToken = await getAccessToken();
        // Retry the request with new token
        const retryResponse = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            'Authorization': `Bearer ${newToken}`
          }
        });
        
        if (retryResponse.status === 204) {
          return res.json({ error: 'Currently not playing', isPlaying: false });
        }
        
        const retryData = retryResponse.data;
        const formattedResponse = {
          albumImageUrl: retryData.item.album.images[0]?.url || '',
          artist: retryData.item.artists.map(artist => artist.name).join(', '),
          isPlaying: retryData.is_playing,
          songUrl: retryData.item.external_urls.spotify,
          title: retryData.item.name,
          timePlayed: retryData.progress_ms,
          timeTotal: retryData.item.duration_ms,
          artistUrl: retryData.item.artists[0]?.external_urls.spotify || ''
        };
        
        return res.json(formattedResponse);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return res.status(500).json({ error: 'Unable to fetch song' });
      }
    } else if (error.response?.status === 204) {
      res.json({ error: 'Currently not playing', isPlaying: false });
    } else {
      res.status(500).json({ error: 'Unable to fetch song' });
    }
  }
});

// Endpoint for user's recent tracks (bonus feature)
app.get('/spotify/recent-tracks', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const tracks = response.data.items.map(item => ({
      title: item.track.name,
      artist: item.track.artists.map(artist => artist.name).join(', '),
      albumImageUrl: item.track.album.images[0]?.url || '',
      songUrl: item.track.external_urls.spotify,
      playedAt: item.played_at
    }));

    res.json({ tracks });
  } catch (error) {
    console.error('Error fetching recent tracks:', error);
    res.status(500).json({ error: 'Unable to fetch recent tracks' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Spotify API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;