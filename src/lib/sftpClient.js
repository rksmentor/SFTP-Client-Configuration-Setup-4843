/**
 * SFTP Client using WebSocket for communication with the bridge server
 */

class SFTPClient {
  constructor() {
    this.ws = null;
    this.serverUrl = 'ws://localhost:3000';
    this.isConnected = false;
    this.connectionId = null;
    this.eventListeners = {
      connect: [],
      disconnect: [],
      error: [],
      fileList: [],
      fileContent: [],
      uploadSuccess: [],
      deleteSuccess: [],
      mkdirSuccess: []
    };
  }

  /**
   * Connect to the WebSocket server
   */
  connectToWebsocket() {
    return new Promise((resolve, reject) => {
      // Close existing connection if any
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }

      // Create new WebSocket connection
      this.ws = new WebSocket(this.serverUrl);

      // Set up event listeners
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        resolve();
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.connectionId = null;
        this._emitEvent('disconnect', { message: 'WebSocket connection closed' });
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
        this._emitEvent('error', { error: 'WebSocket connection error' });
      };

      this.ws.onmessage = (event) => {
        this._handleMessage(event.data);
      };
    });
  }

  /**
   * Connect to SFTP server
   * @param {Object} connection - Connection details
   * @returns {Promise} - Resolves when connected
   */
  async connect(connection) {
    try {
      // Ensure WebSocket connection
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        await this.connectToWebsocket();
      }

      // Send connect message
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Connection timed out'));
        }, 15000);

        // Set up one-time listeners for this connection attempt
        const onConnectSuccess = (data) => {
          clearTimeout(timeoutId);
          this.isConnected = true;
          this.connectionId = data.connectionId;
          resolve({ success: true });
        };

        const onConnectError = (data) => {
          clearTimeout(timeoutId);
          reject(new Error(data.error || 'Connection failed'));
        };

        // Add temporary listeners
        this.once('connect_success', onConnectSuccess);
        this.once('connect_error', onConnectError);

        // Send connection request
        this._sendMessage({
          type: 'connect',
          host: connection.host,
          port: connection.port || 22,
          username: connection.username,
          password: connection.password,
          // Add privateKey if using key authentication
          ...(connection.privateKey && { privateKey: connection.privateKey })
        });
      });
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  /**
   * List files in a directory
   * @param {string} path - Directory path
   * @returns {Promise} - Resolves with file list
   */
  listFiles(path = '/') {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to any SFTP server'));
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('List files operation timed out'));
      }, 10000);

      // Set up one-time listeners
      const onFileList = (data) => {
        clearTimeout(timeoutId);
        resolve(data.files);
      };

      const onError = (data) => {
        clearTimeout(timeoutId);
        reject(new Error(data.error || 'Failed to list files'));
      };

      // Add temporary listeners
      this.once('file_list', onFileList);
      this.once('error', onError);

      // Send list files request
      this._sendMessage({
        type: 'list_files',
        path
      });
    });
  }

  /**
   * Download a file
   * @param {string} remotePath - Remote file path
   * @returns {Promise} - Resolves with file content
   */
  downloadFile(remotePath) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to any SFTP server'));
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Download operation timed out'));
      }, 30000);

      // Set up one-time listeners
      const onFileContent = (data) => {
        clearTimeout(timeoutId);
        // Convert base64 content to binary data
        const binaryContent = atob(data.content);
        resolve({
          content: binaryContent,
          size: data.size,
          path: data.path
        });
      };

      const onError = (data) => {
        clearTimeout(timeoutId);
        reject(new Error(data.error || 'Failed to download file'));
      };

      // Add temporary listeners
      this.once('file_content', onFileContent);
      this.once('error', onError);

      // Send download request
      this._sendMessage({
        type: 'download_file',
        remotePath
      });
    });
  }

  /**
   * Upload a file
   * @param {string} remotePath - Remote file path
   * @param {string|ArrayBuffer} content - File content
   * @returns {Promise} - Resolves when upload is complete
   */
  uploadFile(remotePath, content) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to any SFTP server'));
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Upload operation timed out'));
      }, 30000);

      // Set up one-time listeners
      const onUploadSuccess = (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      };

      const onError = (data) => {
        clearTimeout(timeoutId);
        reject(new Error(data.error || 'Failed to upload file'));
      };

      // Add temporary listeners
      this.once('upload_success', onUploadSuccess);
      this.once('error', onError);

      // Convert content to base64
      let base64Content;
      if (typeof content === 'string') {
        base64Content = btoa(content);
      } else if (content instanceof ArrayBuffer) {
        base64Content = btoa(String.fromCharCode.apply(null, new Uint8Array(content)));
      } else {
        reject(new Error('Invalid content type'));
        return;
      }

      // Send upload request
      this._sendMessage({
        type: 'upload_file',
        remotePath,
        content: base64Content
      });
    });
  }

  /**
   * Delete a file or directory
   * @param {string} path - Path to delete
   * @param {boolean} isDirectory - Whether path is a directory
   * @returns {Promise} - Resolves when delete is complete
   */
  deleteFile(path, isDirectory = false) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to any SFTP server'));
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Delete operation timed out'));
      }, 10000);

      // Set up one-time listeners
      const onDeleteSuccess = (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      };

      const onError = (data) => {
        clearTimeout(timeoutId);
        reject(new Error(data.error || 'Failed to delete file'));
      };

      // Add temporary listeners
      this.once('delete_success', onDeleteSuccess);
      this.once('error', onError);

      // Send delete request
      this._sendMessage({
        type: 'delete_file',
        path,
        isDirectory
      });
    });
  }

  /**
   * Create a directory
   * @param {string} path - Directory path
   * @returns {Promise} - Resolves when directory is created
   */
  createDirectory(path) {
    if (!this.isConnected) {
      return Promise.reject(new Error('Not connected to any SFTP server'));
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Create directory operation timed out'));
      }, 10000);

      // Set up one-time listeners
      const onMkdirSuccess = (data) => {
        clearTimeout(timeoutId);
        resolve(data);
      };

      const onError = (data) => {
        clearTimeout(timeoutId);
        reject(new Error(data.error || 'Failed to create directory'));
      };

      // Add temporary listeners
      this.once('mkdir_success', onMkdirSuccess);
      this.once('error', onError);

      // Send create directory request
      this._sendMessage({
        type: 'create_directory',
        path
      });
    });
  }

  /**
   * Disconnect from SFTP server
   * @returns {Promise} - Resolves when disconnected
   */
  disconnect() {
    if (!this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // Set up one-time listener
      this.once('disconnect', () => {
        this.isConnected = false;
        this.connectionId = null;
        resolve();
      });

      // Send disconnect request
      this._sendMessage({
        type: 'disconnect'
      });
    });
  }

  /**
   * Close WebSocket connection
   */
  close() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.isConnected = false;
    this.connectionId = null;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }

  /**
   * Add one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    const onceCallback = (data) => {
      this.off(event, onceCallback);
      callback(data);
    };
    this.on(event, onceCallback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {string} data - Message data
   * @private
   */
  _handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message.type);
      
      // Emit event
      this._emitEvent(message.type, message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Send message to WebSocket server
   * @param {Object} message - Message to send
   * @private
   */
  _sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @private
   */
  _emitEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event handler:`, error);
        }
      });
    }
  }
}

// Create singleton instance
const sftpClient = new SFTPClient();
export default sftpClient;