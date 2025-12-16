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

// Spotify Authorization Flow Endpoints
const SCOPES = 'user-read-currently-playing user-read-recently-played';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://api.benfoggon.com/auth/callback';

// Step 1: Get authorization URL
app.get('/auth/login', (req, res) => {
  if (!SPOTIFY_CLIENT_ID) {
    return res.status(400).json({
      error: 'Spotify Client ID not configured',
      message: 'Add SPOTIFY_CLIENT_ID to environment variables'
    });
  }

  const state = Math.random().toString(36).substring(2, 15);
  const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state: state
  });

  res.json({
    authUrl: authUrl,
    message: 'Visit the authUrl to authorize your Spotify account',
    redirectUri: REDIRECT_URI
  });
});

// Step 2: Handle authorization callback and get tokens
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <html>
        <head><title>Spotify Authorization Error</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1 style="color: #ff0844;">❌ Authorization Failed</h1>
          <p><strong>Error:</strong> ${error}</p>
          <p><a href="/auth/login">Try again</a></p>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <html>
        <head><title>Missing Authorization Code</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1 style="color: #ff0844;">❌ No Authorization Code</h1>
          <p>No authorization code received from Spotify.</p>
          <p><a href="/auth/login">Try again</a></p>
        </body>
      </html>
    `);
  }

  try {
    // Exchange code for tokens
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Update our cached token
    accessTokenCache = {
      token: access_token,
      expires_at: Date.now() + (expires_in * 1000) - 60000
    };

    // Send success page with tokens
    res.send(`
      <html>
        <head><title>Spotify Authorization Success</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #191414; color: white;">
          <h1 style="color: #1db954;">🎵 Spotify Authorization Successful!</h1>
          
          <div style="background: #282828; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>✅ Your Refresh Token:</h3>
            <div style="background: #000; padding: 15px; border-radius: 4px; font-family: monospace; word-break: break-all; margin: 10px 0;">
              ${refresh_token}
            </div>
            <button onclick="copyToClipboard('${refresh_token}')" style="background: #1db954; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
              📋 Copy Refresh Token
            </button>
          </div>

          <div style="background: #282828; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🔧 Add this to your Portainer environment variables:</h3>
            <div style="background: #000; padding: 15px; border-radius: 4px; font-family: monospace;">
SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID}<br>
SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}<br>
SPOTIFY_REFRESH_TOKEN=${refresh_token}
            </div>
            <button onclick="copyToClipboard('SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID}\\nSPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}\\nSPOTIFY_REFRESH_TOKEN=${refresh_token}')" style="background: #1db954; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
              📋 Copy All Environment Variables
            </button>
          </div>

          <div style="background: #282828; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📱 Test your setup:</h3>
            <p><a href="/spotify/now-playing" style="color: #1db954;">Test Now Playing endpoint</a></p>
            <p><a href="/health" style="color: #1db954;">Check API health</a></p>
          </div>

          <p style="color: #b3b3b3;"><strong>Important:</strong> Keep this refresh token secure! It never expires unless you revoke access.</p>

          <script>
            function copyToClipboard(text) {
              navigator.clipboard.writeText(text).then(() => {
                event.target.textContent = '✅ Copied!';
                setTimeout(() => {
                  event.target.textContent = '📋 Copy Refresh Token';
                }, 2000);
              }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                event.target.textContent = '✅ Copied!';
                setTimeout(() => {
                  event.target.textContent = '📋 Copy Refresh Token';
                }, 2000);
              });
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).send(`
      <html>
        <head><title>Token Exchange Error</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1 style="color: #ff0844;">❌ Token Exchange Failed</h1>
          <p><strong>Error:</strong> ${error.response?.data?.error_description || error.message}</p>
          <p><a href="/auth/login">Try again</a></p>
        </body>
      </html>
    `);
  }
});

// Get current authorization status
app.get('/auth/status', (req, res) => {
  const hasValidToken = accessTokenCache.token && accessTokenCache.expires_at > Date.now();
  res.json({
    hasValidToken,
    tokenExpiresAt: accessTokenCache.expires_at ? new Date(accessTokenCache.expires_at).toISOString() : null,
    hasRefreshToken: !!SPOTIFY_REFRESH_TOKEN,
    clientIdConfigured: !!SPOTIFY_CLIENT_ID,
    clientSecretConfigured: !!SPOTIFY_CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
    refreshTokenLength: SPOTIFY_REFRESH_TOKEN ? SPOTIFY_REFRESH_TOKEN.length : 0
  });
});

// Debug endpoint to test token refresh
app.get('/auth/test-refresh', async (req, res) => {
  try {
    if (!SPOTIFY_REFRESH_TOKEN) {
      return res.status(400).json({ error: 'No refresh token configured' });
    }

    const token = await getAccessToken();
    res.json({ 
      success: true, 
      message: 'Refresh token works!',
      tokenLength: token.length,
      expiresAt: accessTokenCache.expires_at ? new Date(accessTokenCache.expires_at).toISOString() : null
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Refresh token failed',
      details: error.message,
      response: error.response?.data
    });
  }
});

// Spotify configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.warn('⚠️  Spotify Client ID or Secret missing - some endpoints will not work');
  console.warn('Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to environment variables');
}

if (!SPOTIFY_REFRESH_TOKEN) {
  console.warn('⚠️  Spotify Refresh Token missing - use /auth/login to get one');
}

// In-memory token storage (in production, use Redis or database)
let accessTokenCache = {
  token: null,
  expires_at: null
};

// Function to get access token
async function getAccessToken() {
  if (!SPOTIFY_REFRESH_TOKEN) {
    throw new Error('No refresh token available - visit /auth/login to get one');
  }

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
    console.error('Error fetching now playing:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      hasRefreshToken: !!SPOTIFY_REFRESH_TOKEN,
      hasClientCredentials: !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)
    });
    
    if (error.message.includes('No refresh token available')) {
      return res.status(400).json({ 
        error: 'No refresh token configured',
        message: 'Visit /auth/login to get a refresh token',
        authUrl: '/auth/login'
      });
    }
    
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
        console.error('Retry failed:', retryError.response?.data || retryError.message);
        return res.status(500).json({ 
          error: 'Token refresh failed',
          details: retryError.response?.data || retryError.message
        });
      }
    } else if (error.response?.status === 204) {
      res.json({ error: 'Currently not playing', isPlaying: false });
    } else {
      res.status(500).json({ 
        error: 'Unable to fetch song',
        status: error.response?.status,
        details: error.response?.data || error.message
      });
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