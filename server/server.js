import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { Client } from 'ssh2';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store active connections
const activeConnections = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const connectionId = uuidv4();
  let sftpClient = null;

  console.log(`New WebSocket connection established: ${connectionId}`);

  // Send response to client
  const sendResponse = (type, data) => {
    ws.send(JSON.stringify({ type, ...data }));
  };

  // Handle incoming messages from client
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message type: ${data.type}`);

      switch (data.type) {
        case 'connect': {
          // Disconnect existing connection if any
          if (sftpClient) {
            sftpClient.end();
            sftpClient = null;
          }

          // Create new SSH client
          sftpClient = new Client();

          // Handle connection
          sftpClient
            .on('ready', () => {
              console.log('SSH Client :: ready');
              activeConnections.set(connectionId, { client: sftpClient, ws });
              
              // Get SFTP session
              sftpClient.sftp((err, sftp) => {
                if (err) {
                  console.error('SFTP error:', err);
                  sendResponse('connect_error', { error: err.message });
                  return;
                }
                
                // Store SFTP session
                activeConnections.get(connectionId).sftp = sftp;
                sendResponse('connect_success', { connectionId });
              });
            })
            .on('error', (err) => {
              console.error('SSH Client error:', err);
              sendResponse('connect_error', { error: err.message });
            })
            .on('end', () => {
              console.log('SSH Client :: end');
              sendResponse('disconnect', { message: 'Connection ended' });
            })
            .on('close', () => {
              console.log('SSH Client :: close');
              activeConnections.delete(connectionId);
              sendResponse('disconnect', { message: 'Connection closed' });
            })
            .connect({
              host: data.host,
              port: data.port || 22,
              username: data.username,
              password: data.password,
              // Add support for key authentication if needed
              ...(data.privateKey && { privateKey: data.privateKey }),
            });
          break;
        }

        case 'list_files': {
          const connection = activeConnections.get(connectionId);
          if (!connection || !connection.sftp) {
            sendResponse('error', { error: 'No active SFTP connection' });
            return;
          }

          const path = data.path || '/';
          
          connection.sftp.readdir(path, (err, list) => {
            if (err) {
              console.error('Error listing files:', err);
              sendResponse('error', { error: err.message });
              return;
            }

            // Format file list
            const files = list.map(item => {
              const isDirectory = item.attrs.isDirectory();
              return {
                name: item.filename,
                type: isDirectory ? 'folder' : 'file',
                size: isDirectory ? '-' : formatFileSize(item.attrs.size),
                modified: formatDate(item.attrs.mtime * 1000), // Convert to milliseconds
                permissions: item.attrs.mode,
                isDirectory
              };
            });

            sendResponse('file_list', { path, files });
          });
          break;
        }

        case 'download_file': {
          const connection = activeConnections.get(connectionId);
          if (!connection || !connection.sftp) {
            sendResponse('error', { error: 'No active SFTP connection' });
            return;
          }

          const { remotePath } = data;
          
          // Get file stats first
          connection.sftp.stat(remotePath, (err, stats) => {
            if (err) {
              console.error('Error getting file stats:', err);
              sendResponse('error', { error: err.message });
              return;
            }

            if (stats.isDirectory()) {
              sendResponse('error', { error: 'Cannot download a directory' });
              return;
            }

            // Create read stream
            const stream = connection.sftp.createReadStream(remotePath);
            const chunks = [];

            stream.on('data', (chunk) => {
              chunks.push(chunk);
            });

            stream.on('end', () => {
              const fileContent = Buffer.concat(chunks);
              sendResponse('file_content', { 
                path: remotePath, 
                content: fileContent.toString('base64'),
                size: stats.size 
              });
            });

            stream.on('error', (err) => {
              console.error('Error downloading file:', err);
              sendResponse('error', { error: err.message });
            });
          });
          break;
        }

        case 'upload_file': {
          const connection = activeConnections.get(connectionId);
          if (!connection || !connection.sftp) {
            sendResponse('error', { error: 'No active SFTP connection' });
            return;
          }

          const { remotePath, content } = data;
          
          // Convert base64 content to buffer
          const buffer = Buffer.from(content, 'base64');
          
          // Create write stream
          const stream = connection.sftp.createWriteStream(remotePath);
          
          stream.on('error', (err) => {
            console.error('Error uploading file:', err);
            sendResponse('error', { error: err.message });
          });
          
          stream.on('close', () => {
            sendResponse('upload_success', { path: remotePath });
          });
          
          // Write data to stream
          stream.end(buffer);
          break;
        }

        case 'delete_file': {
          const connection = activeConnections.get(connectionId);
          if (!connection || !connection.sftp) {
            sendResponse('error', { error: 'No active SFTP connection' });
            return;
          }

          const { path, isDirectory } = data;
          
          if (isDirectory) {
            connection.sftp.rmdir(path, (err) => {
              if (err) {
                console.error('Error deleting directory:', err);
                sendResponse('error', { error: err.message });
                return;
              }
              sendResponse('delete_success', { path });
            });
          } else {
            connection.sftp.unlink(path, (err) => {
              if (err) {
                console.error('Error deleting file:', err);
                sendResponse('error', { error: err.message });
                return;
              }
              sendResponse('delete_success', { path });
            });
          }
          break;
        }

        case 'create_directory': {
          const connection = activeConnections.get(connectionId);
          if (!connection || !connection.sftp) {
            sendResponse('error', { error: 'No active SFTP connection' });
            return;
          }

          const { path } = data;
          
          connection.sftp.mkdir(path, (err) => {
            if (err) {
              console.error('Error creating directory:', err);
              sendResponse('error', { error: err.message });
              return;
            }
            sendResponse('mkdir_success', { path });
          });
          break;
        }

        case 'disconnect': {
          if (sftpClient) {
            sftpClient.end();
            sftpClient = null;
            activeConnections.delete(connectionId);
          }
          sendResponse('disconnect', { message: 'Disconnected' });
          break;
        }

        default:
          sendResponse('error', { error: 'Unknown command' });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        error: 'Invalid message format or server error' 
      }));
    }
  });

  // Handle WebSocket close
  ws.on('close', () => {
    console.log(`WebSocket connection closed: ${connectionId}`);
    
    // Clean up resources
    if (sftpClient) {
      sftpClient.end();
    }
    
    activeConnections.delete(connectionId);
  });
});

// Helper functions
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString().replace('T', ' ').substr(0, 19);
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SFTP Bridge Server running on port ${PORT}`);
});