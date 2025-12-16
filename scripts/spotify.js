// Spotify widget implementation with currently playing track using Spotify Web API
class SpotifyNowPlaying {
  constructor() {
    this.playerElement = document.querySelector('.music-player');
    // Determine API base URL based on environment
    this.apiBaseUrl = this.getApiBaseUrl();
    this.updateInterval = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  getApiBaseUrl() {
    // Check if we're in development or production
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // In development with Docker Compose, use the API path through nginx proxy
      return `${window.location.origin}/api`;
    }
    // In production, use the /api path (handled by reverse proxy)
    return `${window.location.origin}/api`;
  }
  
  async getNowPlaying() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/spotify/now-playing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if there's an error in the response
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Reset retry count on success
      this.retryCount = 0;
      
      return data;
    } catch (error) {
      console.error('Error fetching currently playing song:', error);
      
      // Increment retry count
      this.retryCount++;
      
      // If it's a network error and we haven't exceeded max retries
      if (this.retryCount <= this.maxRetries && (error.name === 'AbortError' || error.message.includes('fetch'))) {
        console.log(`Retrying... Attempt ${this.retryCount}/${this.maxRetries}`);
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, this.retryCount) * 1000));
        return this.getNowPlaying();
      }
      
      return { error: error.message };
    }
  }
  
  pad(num) {
    return (num < 10) ? `0${num}` : num;
  }
  
  async updatePlayer() {
    const data = await this.getNowPlaying();
    
    if (!this.playerElement) return;
    
    if (data.error) {
      if (data.error === 'Currently not playing') {
        this.playerElement.innerHTML = `
          <div class="spotify-not-playing">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="10" y1="15" x2="10" y2="9"></line>
              <line x1="14" y1="15" x2="14" y2="9"></line>
            </svg>
            <span>Not listening to music....</span>
          </div>
        `;
      } else {
        this.playerElement.innerHTML = `
          <div class="spotify-error">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Unable to connect to Spotify${this.retryCount > 0 ? ` (Retried ${this.retryCount}x)` : ''}</span>
          </div>
        `;
      }
      return;
    }
    
    // Format time
    const minutesPlayed = Math.floor(data.timePlayed / 60000);
    const secondsPlayed = Math.floor((data.timePlayed % 60000) / 1000);
    const minutesTotal = Math.floor(data.timeTotal / 60000);
    const secondsTotal = Math.floor((data.timeTotal % 60000) / 1000);
    
    // Calculate progress percentage
    const progressPercentage = (data.timePlayed / data.timeTotal) * 100;
    
    // Create now playing HTML that's standalone without being in a box
    this.playerElement.innerHTML = `
      <div class="spotify-now-playing-container">
        <h3 class="music-title-floating">Currently Listening To</h3>
        <div class="spotify-now-playing ${data.isPlaying ? 'playing' : ''}">
          <div class="album-art-large">
            <img src="${data.albumImageUrl}" alt="${data.title} album art">
          </div>
          <div class="track-details-floating">
            <div class="track-name-large">
              <a href="${data.songUrl}" target="_blank">${data.title}</a>
            </div>
            <div class="artist-name-large">
              <a href="${data.artistUrl}" target="_blank">${data.artist}</a>
            </div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress" style="width: ${progressPercentage}%"></div>
              </div>
              <div class="track-time">
                <span>${this.pad(minutesPlayed)}:${this.pad(secondsPlayed)}</span>
                <span>${this.pad(minutesTotal)}:${this.pad(secondsTotal)}</span>
              </div>
            </div>
            <div class="spotify-footer">
              <div class="playing-status">
                ${data.isPlaying ? 
                  `<div class="waveform">
                    <span></span><span></span><span></span><span></span>
                  </div> 
                  <span>Playing now</span>` : 
                  '<span>Paused</span>'}
              </div>
              <div class="spotify-logo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                  <path fill="currentColor" d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  init() {
    if (this.playerElement) {
      // Initial loading state
      this.playerElement.innerHTML = `
        <div class="spotify-loading">
          <div class="loading-spinner"></div>
          <p>Connecting to Spotify...</p>
        </div>
      `;
      
      // First update
      this.updatePlayer();
      
      // Set interval for updates (every 3 seconds)
      this.updateInterval = setInterval(() => this.updatePlayer(), 3000);
    }
  }
  
  // Clean up when not needed
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const spotifyPlayer = new SpotifyNowPlaying();
  spotifyPlayer.init();
});