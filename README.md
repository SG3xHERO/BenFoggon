# Ben Foggon - Personal Portfolio

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
