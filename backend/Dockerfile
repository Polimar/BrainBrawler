# Node.js 22 LTS Alpine base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for potential native modules
RUN apk add --no-cache python3 make g++ netcat-openbsd

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy application source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start command
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"] 