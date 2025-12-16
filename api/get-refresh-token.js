const readline = require('readline');
const https = require('https');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
require('dotenv').config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:8888/callback';
const SCOPES = 'user-read-currently-playing user-read-recently-played';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎵 Spotify Refresh Token Generator');
console.log('====================================');

// Step 1: Get authorization URL
const authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
  response_type: 'code',
  client_id: CLIENT_ID,
  scope: SCOPES,
  redirect_uri: REDIRECT_URI,
});

console.log('\n1. Open this URL in your browser:');
console.log('\n' + authUrl);
console.log('\n2. After authorization, you\'ll be redirected to a localhost URL.');
console.log('3. Copy the entire URL from your browser and paste it below.');

rl.question('\nPaste the redirect URL here: ', (redirectUrl) => {
  const parsedUrl = url.parse(redirectUrl, true);
  const code = parsedUrl.query.code;
  
  if (!code) {
    console.error('❌ No authorization code found in the URL');
    rl.close();
    return;
  }
  
  console.log('\n✅ Authorization code received');
  console.log('🔄 Exchanging code for tokens...');
  
  // Step 2: Exchange code for tokens
  const postData = querystring.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
  });
  
  const auth = Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');
  
  const options = {
    hostname: 'accounts.spotify.com',
    port: 443,
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + auth,
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const tokens = JSON.parse(data);
        
        if (tokens.error) {
          console.error('❌ Error getting tokens:', tokens.error_description || tokens.error);
          rl.close();
          return;
        }
        
        console.log('\n🎉 Success! Here are your tokens:');
        console.log('\n📋 Add these to your .env file:');
        console.log('=====================================');
        console.log(`SPOTIFY_CLIENT_ID=${CLIENT_ID}`);
        console.log(`SPOTIFY_CLIENT_SECRET=${CLIENT_SECRET}`);
        console.log(`SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('=====================================');
        
        console.log('\n💡 The refresh token never expires (unless revoked)');
        console.log('💡 Keep it secure - treat it like a password');
        
        // Test the refresh token
        console.log('\n🧪 Testing refresh token...');
        testRefreshToken(tokens.refresh_token);
        
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.log('Raw response:', data);
        rl.close();
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
    rl.close();
  });
  
  req.write(postData);
  req.end();
});

function testRefreshToken(refreshToken) {
  const postData = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  
  const auth = Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');
  
  const options = {
    hostname: 'accounts.spotify.com',
    port: 443,
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + auth,
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.access_token) {
          console.log('✅ Refresh token is working correctly!');
          console.log('✅ You can now use your Spotify player');
        } else {
          console.log('⚠️  Warning: Could not test refresh token');
          console.log('Response:', data);
        }
      } catch (error) {
        console.log('⚠️  Warning: Could not parse test response');
      }
      
      rl.close();
    });
  });
  
  req.on('error', (error) => {
    console.log('⚠️  Warning: Could not test refresh token');
    rl.close();
  });
  
  req.write(postData);
  req.end();
}