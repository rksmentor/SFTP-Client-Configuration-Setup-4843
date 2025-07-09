# SFTP Client with Bridge Server

This project provides a web-based SFTP client with a Node.js bridge server to enable secure file transfers between the browser and SFTP servers.

## Architecture

The application consists of two main components:

1. **React Frontend**: A modern web interface for browsing and managing files
2. **Node.js Bridge Server**: Acts as an intermediary between the browser and SFTP servers

## Features

- Connect to SFTP servers with username/password authentication
- Browse remote file systems
- Upload and download files
- Create, delete, and manage directories
- Real-time connection status

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn

### Running the Application

#### Development Mode

1. Start the bridge server:
   ```
   cd server
   npm install
   npm run dev
   ```

2. In a separate terminal, start the frontend:
   ```
   npm install
   npm run dev
   ```

3. Open your browser and navigate to the URL shown in the terminal

#### Production Mode

1. Build the frontend:
   ```
   npm run build
   ```

2. Start the server:
   ```
   cd server
   npm start
   ```

The server will serve both the API and the built frontend.

## Docker Deployment

You can also run the application using Docker:

```
docker build -f server/Dockerfile -t sftp-bridge .
docker run -p 3000:3000 sftp-bridge
```

## Security Considerations

- The bridge server handles all sensitive credentials and SFTP connections
- The WebSocket connection between frontend and server should be secured in production
- No credentials are stored in browser localStorage (only connection details)

## Technical Details

- The bridge server uses the `ssh2` library for SFTP connections
- Communication between frontend and server happens via WebSockets
- File transfers are handled as binary data encoded in base64