# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install necessary packages
RUN apk add --no-cache dumb-init wget

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies with verbose output for debugging
RUN npm config set loglevel info && \
    npm install --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check using wget (more reliable in Alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["dumb-init", "node", "server.js"]