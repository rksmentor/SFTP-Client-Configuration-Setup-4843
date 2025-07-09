import React, { createContext, useContext, useState, useEffect } from 'react';
import sftpClient from '../lib/sftpClient';

const ConnectionContext = createContext();

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

export const ConnectionProvider = ({ children }) => {
  const [connections, setConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    connecting: false,
    error: null
  });

  useEffect(() => {
    // Load saved connections from localStorage
    const savedConnections = localStorage.getItem('sftp-connections');
    if (savedConnections) {
      setConnections(JSON.parse(savedConnections));
    }

    // Set up event listeners for SFTP client
    sftpClient.on('disconnect', () => {
      setIsConnected(false);
      setActiveConnection(null);
    });

    return () => {
      // Clean up on unmount
      if (isConnected) {
        sftpClient.disconnect().catch(console.error);
      }
    };
  }, []);

  const saveConnection = (connection) => {
    const newConnection = {
      ...connection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const updatedConnections = [...connections, newConnection];
    setConnections(updatedConnections);
    localStorage.setItem('sftp-connections', JSON.stringify(updatedConnections));
    
    return newConnection;
  };

  const deleteConnection = (id) => {
    const updatedConnections = connections.filter(conn => conn.id !== id);
    setConnections(updatedConnections);
    localStorage.setItem('sftp-connections', JSON.stringify(updatedConnections));
    
    if (activeConnection?.id === id) {
      disconnect();
    }
  };

  const connectToServer = async (connection) => {
    try {
      setConnectionStatus({
        connecting: true,
        error: null
      });

      // Ensure WebSocket connection is established
      if (!sftpClient.ws || sftpClient.ws.readyState !== WebSocket.OPEN) {
        await sftpClient.connectToWebsocket();
      }
      
      // Connect to SFTP server
      const result = await sftpClient.connect(connection);
      
      if (result.success) {
        setActiveConnection(connection);
        setIsConnected(true);
        setConnectionStatus({
          connecting: false,
          error: null
        });
        return { success: true };
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus({
        connecting: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  };

  const disconnect = async () => {
    try {
      await sftpClient.disconnect();
      setActiveConnection(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const value = {
    connections,
    activeConnection,
    isConnected,
    connectionStatus,
    saveConnection,
    deleteConnection,
    connectToServer,
    disconnect
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};