#!/bin/bash

# Ben Foggon Portfolio - Docker Setup Script
# This script sets up the complete Docker environment

echo "🚀 Ben Foggon Portfolio Setup"
echo "============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your Spotify credentials"
    echo "   You can get them by running: cd api && node get-refresh-token.js"
    echo ""
    read -p "Press Enter to continue once you've set up your .env file..."
fi

# Check API .env file
if [ ! -f api/.env ]; then
    echo "📋 Creating API .env file from template..."
    cp api/.env.example api/.env
    echo "✅ API .env file created"
fi

# Build and start containers
echo "🔨 Building Docker containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "000")
if [ "$API_STATUS" = "200" ]; then
    echo "✅ API server is running (http://localhost:3001)"
else
    echo "❌ API server is not responding (status: $API_STATUS)"
fi

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8082 || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is running (http://localhost:8082)"
else
    echo "❌ Frontend is not responding (status: $FRONTEND_STATUS)"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📍 Your portfolio is available at: http://localhost:8082"
echo "📍 API health check: http://localhost:3001/health"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs"
echo "   Stop services: docker-compose down"
echo "   Restart: docker-compose restart"
echo ""

if [ "$API_STATUS" != "200" ]; then
    echo "⚠️  If the API is not working, check your Spotify credentials in .env"
    echo "   Run: cd api && node get-refresh-token.js"
fi