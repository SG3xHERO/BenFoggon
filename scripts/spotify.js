// Spotify widget — big art, tilt/shine hover, smooth art-change animation
class SpotifyNowPlaying {
  constructor() {
    this.playerElement = document.querySelector('.music-player');
    this.apiBaseUrl    = this.getApiBaseUrl();
    this.updateInterval = null;
    this.retryCount    = 0;
    this.maxRetries    = 3;
    this.lastArtUrl    = null;   // detects track/playlist change
    this.lastIsPlaying = null;   // detects play/pause toggle
    this.playlistArt   = null;   // cached oembed thumbnail (''/url/null=unfetched)
  }

  getApiBaseUrl() {
    const h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:3001';
    if (h === 'benfoggon.com' || h === 'www.benfoggon.com') return 'https://api.benfoggon.com';
    return `${window.location.protocol}//api.${h}`;
  }

  /* Try to get The Cat Screaming playlist art via Spotify oEmbed (public, no auth) */
  async fetchPlaylistArt() {
    if (this.playlistArt !== null) return this.playlistArt;
    try {
      const res = await fetch(
        'https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/3wvxICxPbq5MCt1TBn3D2q',
        { signal: AbortSignal.timeout(5000) }
      );
      this.playlistArt = res.ok ? ((await res.json()).thumbnail_url || '') : '';
    } catch (_) {
      this.playlistArt = '';
    }
    return this.playlistArt;
  }

  async getNowPlaying() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/spotify/now-playing`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      this.retryCount = 0;
      return data;
    } catch (err) {
      console.error('Spotify fetch error:', err);
      this.retryCount++;
      if (this.retryCount <= this.maxRetries &&
          (err.name === 'AbortError' || err.message.includes('fetch'))) {
        await new Promise(r => setTimeout(r, Math.pow(2, this.retryCount) * 1000));
        return this.getNowPlaying();
      }
      return { error: err.message };
    }
  }

  pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* Attach 3-D tilt + cursor shine to the rendered card */
  attachTilt() {
    const card    = this.playerElement.querySelector('.sp-card');
    const artWrap = card && card.querySelector('.sp-art-wrap');
    if (!card || !artWrap) return;

    card.addEventListener('mousemove', e => {
      const r    = card.getBoundingClientRect();
      const xR   = (e.clientX - r.left) / r.width;
      const yR   = (e.clientY - r.top)  / r.height;
      const rotX = (yR - 0.5) * -12;
      const rotY = (xR - 0.5) *  14;
      card.style.transform =
        `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.025)`;
      const shine = artWrap.querySelector('.sp-shine');
      if (shine) {
        shine.style.background =
          `radial-gradient(circle at ${(xR * 100).toFixed(1)}% ${(yR * 100).toFixed(1)}%, rgba(255,255,255,0.14) 0%, transparent 58%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      const shine = artWrap.querySelector('.sp-shine');
      if (shine) shine.style.background = 'none';
    });
  }

  /* Render "not listening" state — shows The Cat Screaming playlist */
  async renderNotPlaying() {
    const art = await this.fetchPlaylistArt();
    const artInner = art
      ? `<img src="${art}" alt="The Cat Screaming" class="sp-art-img sp-art-enter">`
      : `<div class="sp-art-fallback">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
             <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
           </svg>
         </div>`;

    this.lastArtUrl    = 'playlist';
    this.lastIsPlaying = false;

    this.playerElement.innerHTML = `
      <div class="sp-card sp-idle">
        <a href="https://open.spotify.com/playlist/3wvxICxPbq5MCt1TBn3D2q"
           target="_blank" rel="noopener" class="sp-art-wrap">
          ${artInner}
          <div class="sp-art-overlay">
            <svg class="sp-overlay-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div class="sp-shine"></div>
        </a>
        <div class="sp-meta">
          <div class="sp-label">MY PLAYLIST</div>
          <div class="sp-track">
            <a href="https://open.spotify.com/playlist/3wvxICxPbq5MCt1TBn3D2q"
               target="_blank" rel="noopener">The Cat Screaming</a>
          </div>
          <div class="sp-artist">Playlist &bull; Open on Spotify</div>
          <div class="sp-idle-line">
            <span class="sp-idle-dot"></span>
            Not listening right now
          </div>
        </div>
      </div>`;
    this.attachTilt();
  }

  /* Render currently playing / paused track */
  renderTrack(data, progressPct, mPlayed, sPlayed, mTotal, sTotal, isNewArt) {
    const stateClass = data.isPlaying ? 'sp-playing' : 'sp-paused';
    const labelHTML  = data.isPlaying
      ? `<div class="sp-waveform-sm"><span></span><span></span><span></span></div> NOW PLAYING`
      : 'PAUSED';
    const overlayHTML = data.isPlaying
      ? `<div class="sp-waveform"><span></span><span></span><span></span><span></span></div>`
      : `<svg class="sp-overlay-icon" viewBox="0 0 24 24" fill="currentColor">
           <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
         </svg>`;

    this.playerElement.innerHTML = `
      <div class="sp-card ${stateClass}">
        <a href="${data.songUrl}" target="_blank" rel="noopener" class="sp-art-wrap">
          <img src="${data.albumImageUrl}" alt="${data.title}"
               class="sp-art-img${isNewArt ? ' sp-art-enter' : ''}">
          <div class="sp-art-overlay">${overlayHTML}</div>
          <div class="sp-shine"></div>
        </a>
        <div class="sp-meta">
          <div class="sp-label">${labelHTML}</div>
          <div class="sp-track" title="${data.title}">
            <a href="${data.songUrl}" target="_blank" rel="noopener">${data.title}</a>
          </div>
          <div class="sp-artist">
            <a href="${data.artistUrl}" target="_blank" rel="noopener">${data.artist}</a>
          </div>
          <div class="sp-progress-wrap">
            <div class="sp-progress-bar">
              <div class="sp-progress-fill" style="width:${progressPct}%"></div>
            </div>
            <div class="sp-times">
              <span>${this.pad(mPlayed)}:${this.pad(sPlayed)}</span>
              <span>${this.pad(mTotal)}:${this.pad(sTotal)}</span>
            </div>
          </div>
        </div>
      </div>`;
    this.attachTilt();
  }

  /* Only update progress numbers in-place (no re-render, no animation) */
  updateProgressOnly(progressPct, mPlayed, sPlayed) {
    const fill = this.playerElement.querySelector('.sp-progress-fill');
    const time = this.playerElement.querySelector('.sp-times span:first-child');
    if (fill) fill.style.width = progressPct + '%';
    if (time) time.textContent = `${this.pad(mPlayed)}:${this.pad(sPlayed)}`;
  }

  async updatePlayer() {
    const data = await this.getNowPlaying();
    if (!this.playerElement) return;

    if (data.error) {
      if (data.error === 'Currently not playing') {
        /* Only re-render if we weren't already showing the playlist card */
        if (this.lastArtUrl !== 'playlist') await this.renderNotPlaying();
      } else {
        this.playerElement.innerHTML = `
          <div class="sp-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Unable to connect to Spotify</span>
          </div>`;
        this.lastArtUrl = null;
      }
      return;
    }

    const mPlayed  = Math.floor(data.timePlayed / 60000);
    const sPlayed  = Math.floor((data.timePlayed % 60000) / 1000);
    const mTotal   = Math.floor(data.timeTotal / 60000);
    const sTotal   = Math.floor((data.timeTotal % 60000) / 1000);
    const progress = (data.timePlayed / data.timeTotal) * 100;

    const artChanged       = this.lastArtUrl    !== data.albumImageUrl;
    const playStateChanged = this.lastIsPlaying !== data.isPlaying;

    if (artChanged || playStateChanged) {
      this.lastArtUrl    = data.albumImageUrl;
      this.lastIsPlaying = data.isPlaying;
      this.renderTrack(data, progress, mPlayed, sPlayed, mTotal, sTotal, artChanged);
    } else {
      this.updateProgressOnly(progress, mPlayed, sPlayed);
    }
  }

  init() {
    if (!this.playerElement) return;
    this.playerElement.innerHTML =
      `<div class="sp-loading"><div class="sp-spinner"></div></div>`;
    this.updatePlayer();
    this.updateInterval = setInterval(() => this.updatePlayer(), 3000);
  }

  destroy() {
    if (this.updateInterval) clearInterval(this.updateInterval);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const spotifyPlayer = new SpotifyNowPlaying();
  spotifyPlayer.init();
});
    // Check if we're in development or production
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local development
      return 'http://localhost:3001';
    }
    
    // Production - use your actual API domain configured in Nginx Proxy Manager
    if (hostname === 'benfoggon.com' || hostname === 'www.benfoggon.com') {
      return 'https://api.benfoggon.com';  // Your API subdomain
    }
    
    // Fallback for other domains - try /api path first, then subdomain
    return `${window.location.protocol}//api.${hostname}`;
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