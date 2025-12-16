# Ben Foggon Portfolio with Spotify Integration

A modern, responsive portfolio website featuring a custom Spotify "Now Playing" widget. The site includes both frontend and backend components for secure Spotify Web API integration.

## 🎵 Features

- **Custom Spotify Player**: Real-time display of currently playing music
- **Secure API Integration**: Backend API handles Spotify authentication
- **Responsive Design**: Optimized for all device sizes
- **Docker Deployment**: Complete containerized setup
- **Modern Tech Stack**: HTML5, CSS3, Vanilla JavaScript, Node.js, Express

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (recommended) or Node.js 18+
- **Spotify Developer Account** for API credentials

### 1. Get Spotify Credentials

1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your **Client ID** and **Client Secret**
4. Add redirect URI: `http://localhost:8888/callback`

### 2. Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd BenFoggon

# Copy environment template
copy .env.example .env

# Edit .env with your Spotify credentials
```

### 3. Get Refresh Token

```bash
cd api
npm install
node get-refresh-token.js
# Follow the browser authorization flow
# Copy the refresh token to your .env file
```

### 4. Deploy with Docker

**Windows:**
```cmd
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Manual Docker:**
```bash
docker-compose up --build
```

### 5. Access Your Site

- **Portfolio**: http://localhost:8082
- **API Health**: http://localhost:3001/health

## 🛠 Manual Setup (Without Docker)

### Backend API
```bash
cd api
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

### Frontend
```bash
# Serve static files (any method)
npx serve . -p 8082
# or
python -m http.server 8082
```

## 📁 Project Structure

```
BenFoggon/
├── 📂 api/                    # Backend Express API
│   ├── server.js              # Main API server
│   ├── get-refresh-token.js   # Spotify auth helper
│   ├── package.json           # Node.js dependencies
│   └── Dockerfile             # API container
├── 📂 scripts/                # Frontend JavaScript
│   ├── spotify.js             # Spotify player logic
│   └── script.js              # Main site functionality
├── 📂 styles/                 # CSS stylesheets
├── 📂 assets/                 # Images and static assets
├── index.html                 # Main HTML file
├── docker-compose.yml         # Multi-container setup
├── nginx.conf                 # Nginx configuration
└── SETUP.md                   # Detailed setup guide
```

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/spotify/now-playing` | GET | Currently playing track |
| `/spotify/recent-tracks` | GET | Recently played tracks |
| `/auth/refresh` | POST | Token refresh (legacy) |

## 🐳 Docker Services

- **benfoggon-site**: Nginx serving static frontend
- **benfoggon-api**: Node.js Express API server
- **nginx-proxy**: Reverse proxy (production profile)

## ⚙️ Configuration

### Environment Variables

```env
# Required
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token

# Optional
DOMAIN=benfoggon.com
ALLOWED_ORIGINS=https://benfoggon.com,http://localhost:8082
```

### Production Deployment

1. **Domain Setup**: Update `nginx-proxy.conf` with your domain
2. **SSL Configuration**: Add certificates to nginx config
3. **Environment Security**: Use proper secrets management
4. **Health Monitoring**: Set up logging and alerts

## 🔍 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Spotify player shows "Unable to connect" | Check API server is running and .env has correct credentials |
| CORS errors | Ensure API server is accessible from frontend |
| 401 Unauthorized | Refresh token may be expired, regenerate it |
| Docker build fails | Ensure Docker Desktop is installed and running |

### Debug Commands

```bash
# View service logs
docker-compose logs benfoggon-api
docker-compose logs benfoggon-site

# Test API directly
curl http://localhost:3001/health
curl http://localhost:3001/spotify/now-playing

# Restart services
docker-compose restart
```

## 🛡 Security Notes

- Never commit real credentials to version control
- Refresh tokens should be treated as passwords
- Use HTTPS in production
- Consider rate limiting for API endpoints
- Regular security updates for dependencies

## 🚧 Development

### Adding Features

The codebase is modular and extensible:

- **New API endpoints**: Add to `api/server.js`
- **Frontend updates**: Modify `scripts/spotify.js`
- **Styling changes**: Update `styles/styles.css`

### Local Development

```bash
# API with auto-reload
cd api && npm run dev

# Frontend with live server
npx live-server --port=8082
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Support

For issues and questions:

1. Check the troubleshooting section
2. Review Docker logs for errors  
3. Verify Spotify app configuration
4. Ensure environment variables are correct

---

Built with ❤️ by Ben Foggon - Personal Portfolio

A modern, responsive personal portfolio website showcasing my work as a Developer, Networker & IT Technician based in Yeovil, UK.

![Ben Foggon Portfolio](./assets/images/og-image.jpg)

## 🌟 Features

- **Modern Design**: Sleek gradient design with glassmorphism effects and animated backgrounds
- **Responsive**: Fully responsive design that works on all devices
- **Red Gradient Theme**: Eye-catching red to orange gradient color scheme
- **Spotify Integration**: Live "Now Playing" widget showing current music
- **Project Showcase**: Featured projects including Project Networks and Photography portfolio
- **Performance Optimized**: Fast loading with optimized assets and animations
- **SEO Ready**: Comprehensive meta tags, Open Graph, and Schema.org structured data

## 🎨 Design Highlights

- Animated gradient orbs background
- Glassmorphic cards with backdrop blur effects
- Smooth scroll animations with AOS library
- 3D card hover effects
- Mobile-first responsive design
- Custom gradient buttons and badges

## 🚀 Quick Start

### Local Development

Simply open `index.html` in your browser or use a local server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js (http-server)
npx http-server -p 8080
```

Visit `http://localhost:8080`

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:8080
```

The site will be available on port 8080.

## 🐳 Docker

This project includes Docker support for easy deployment:

- **Image**: Nginx Alpine (lightweight)
- **Port**: 8080 → 80
- **Container Name**: benfoggon-portfolio
- **Network**: web (for reverse proxy integration)

### Build Docker Image

```bash
docker build -t benfoggon-portfolio .
```

### Run Container

```bash
docker run -d -p 8080:80 --name benfoggon-portfolio benfoggon-portfolio
```

### Using Docker Compose

```bash
docker-compose up -d
```

## 📁 Project Structure

```
Ben Foggon/
├── index.html              # Main HTML file
├── assets/                 # Images and media
│   ├── images/
│   └── me.ico
├── scripts/                # JavaScript files
│   ├── script.js          # Main functionality
│   └── spotify.js         # Spotify integration
├── styles/                 # CSS files
│   └── styles.css         # Main stylesheet
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
└── README.md             # This file
```

## 🛠️ Technologies Used

- **HTML5**: Semantic markup with SEO optimization
- **CSS3**: Modern CSS with custom properties, flexbox, grid, and animations
- **JavaScript**: Vanilla JS for interactions and Spotify integration
- **Fonts**: Inter (body) and Poppins (headings) from Google Fonts
- **Libraries**: AOS (Animate On Scroll) v2.3.1
- **Docker**: Nginx Alpine for containerized deployment

## 🎵 Spotify Integration

The site features a live "Now Playing" widget that displays:
- Currently playing track
- Artist information
- Album artwork
- Playback progress

Additional featured playlists are linked in the bonus section.

## 🎨 Color Scheme

- **Primary**: `#ff0844` (Red)
- **Secondary**: `#ff6b00` (Orange)
- **Accent**: `#ffdd00` (Yellow)
- **Background**: `#0a0a0f` (Dark)
- **Surface**: `#12121a` (Elevated Dark)

## 📱 Responsive Breakpoints

- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: Below 768px

## 🌐 Deployment

### Nginx Reverse Proxy

If deploying with Nginx Proxy Manager or similar:

1. Point your domain to the container
2. Container exposes port 80 internally
3. No SSL needed in container (handled by reverse proxy)

Example Nginx config:
```nginx
server {
    listen 80;
    server_name benfoggon.com;
    
    location / {
        proxy_pass http://benfoggon-portfolio;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Portainer Stack

Upload the `docker-compose.yml` file directly to Portainer as a new stack.

## 📄 License

© 2025 Ben Foggon. All rights reserved.

## 🔗 Links

- **Live Site**: [benfoggon.com](https://benfoggon.com)
- **Project Networks**: [projectnetworks.co.uk](https://projectnetworks.co.uk)
- **Photography**: [photos.benfoggon.com](https://photos.benfoggon.com)
- **GitHub**: [@SG3xHERO](https://github.com/SG3xHERO)

## 📧 Contact

- **Email**: contact@benfoggon.com
- **Location**: Yeovil, United Kingdom

---

Built with ❤️ by Ben Foggon
