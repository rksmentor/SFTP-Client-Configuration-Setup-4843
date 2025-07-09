FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy server files
COPY server/ ./

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]