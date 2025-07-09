import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnection } from '../contexts/ConnectionContext';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import sftpClient from '../lib/sftpClient';
import * as FiIcons from 'react-icons/fi';

const { 
  FiFolder, FiFile, FiDownload, FiUpload, FiTrash2, 
  FiEdit2, FiRefreshCw, FiHome, FiChevronRight, 
  FiGrid, FiList, FiSearch, FiMoreVertical, FiPlus,
  FiX, FiCheck, FiLoader
} = FiIcons;

const FileManager = () => {
  const { isConnected, activeConnection, connectToServer, connections } = useConnection();
  const navigate = useNavigate();
  
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const loadFiles = useCallback(async () => {
    if (!isConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fileList = await sftpClient.listFiles(currentPath);
      setFiles(fileList);
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err.message || 'Failed to load files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, currentPath]);

  useEffect(() => {
    if (isConnected) {
      loadFiles();
    }
  }, [isConnected, currentPath, loadFiles]);

  const handleConnect = async () => {
    if (!selectedConnection) return;
    
    const connection = connections.find(c => c.id === selectedConnection);
    if (connection) {
      await connectToServer(connection);
    }
  };

  const handleFileClick = (file) => {
    if (file.type === 'folder') {
      setCurrentPath(currentPath === '/' 
        ? `/${file.name}` 
        : `${currentPath}/${file.name}`);
    } else {
      setSelectedFile(file);
    }
  };

  const handleDownload = async (file) => {
    try {
      const filePath = currentPath === '/' 
        ? `/${file.name}` 
        : `${currentPath}/${file.name}`;
      
      const result = await sftpClient.downloadFile(filePath);
      
      // Create blob from content
      const blob = new Blob([result.content], { 
        type: 'application/octet-stream' 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download file');
    }
  };

  const handleDelete = async (file) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }
    
    try {
      const filePath = currentPath === '/' 
        ? `/${file.name}` 
        : `${currentPath}/${file.name}`;
      
      await sftpClient.deleteFile(filePath, file.type === 'folder');
      loadFiles();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete file');
    }
  };

  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingFile(true);
    setError(null);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        // Use promise to handle file reading
        await new Promise((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const content = e.target.result;
              const remotePath = currentPath === '/' 
                ? `/${file.name}` 
                : `${currentPath}/${file.name}`;
              
              await sftpClient.uploadFile(remotePath, content);
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsArrayBuffer(file);
        });
      }
      
      // Reload files after upload
      loadFiles();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }
    
    try {
      const folderPath = currentPath === '/' 
        ? `/${newFolderName}` 
        : `${currentPath}/${newFolderName}`;
      
      await sftpClient.createDirectory(folderPath);
      setShowNewFolderModal(false);
      setNewFolderName('');
      loadFiles();
    } catch (err) {
      console.error('Create folder error:', err);
      setError(err.message || 'Failed to create folder');
    }
  };

  const getPathSegments = () => {
    if (currentPath === '/') return [{ name: 'Home', path: '/' }];
    
    const segments = currentPath.split('/').filter(Boolean);
    return [
      { name: 'Home', path: '/' },
      ...segments.map((segment, index) => ({
        name: segment,
        path: '/' + segments.slice(0, index + 1).join('/')
      }))
    ];
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render connection form if not connected
  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <SafeIcon icon={FiFolder} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect to Server</h3>
          <p className="text-gray-600 mb-6">Select a connection to browse files</p>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {connections.length > 0 ? (
            <div className="max-w-md mx-auto space-y-4">
              <select
                value={selectedConnection}
                onChange={(e) => setSelectedConnection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a connection</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.host})
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleConnect}
                disabled={!selectedConnection}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Connect
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/settings')}
              className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors"
            >
              Add Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Manager Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">File Manager</h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              title={viewMode === 'list' ? 'Grid View' : 'List View'}
            >
              <SafeIcon icon={viewMode === 'list' ? FiGrid : FiList} className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              title="Create New Folder"
            >
              <SafeIcon icon={FiPlus} className="w-5 h-5" />
            </button>
            
            <button
              onClick={loadFiles}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <SafeIcon icon={FiRefreshCw} className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4 overflow-x-auto pb-2">
          {getPathSegments().map((segment, index) => (
            <div key={segment.path} className="flex items-center space-x-2 flex-shrink-0">
              {index > 0 && <SafeIcon icon={FiChevronRight} className="w-4 h-4" />}
              <button
                onClick={() => setCurrentPath(segment.path)}
                className="hover:text-primary-600 transition-colors whitespace-nowrap"
              >
                {segment.name}
              </button>
            </div>
          ))}
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md">
            <div className="flex items-start">
              <SafeIcon icon={FiX} className="w-5 h-5 mr-2 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200"
      >
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <SafeIcon icon={FiRefreshCw} className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading files...</p>
            </div>
          ) : filteredFiles.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
              {filteredFiles.map((file, index) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group ${
                    viewMode === 'grid'
                      ? 'p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer'
                      : 'flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer'
                  } transition-all`}
                  onClick={() => handleFileClick(file)}
                >
                  <div className={`flex items-center ${viewMode === 'grid' ? 'flex-col text-center' : 'space-x-3'}`}>
                    <div className={`p-2 rounded-full ${file.type === 'folder' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <SafeIcon
                        icon={file.type === 'folder' ? FiFolder : FiFile}
                        className={`w-6 h-6 ${file.type === 'folder' ? 'text-blue-600' : 'text-gray-600'}`}
                      />
                    </div>
                    <div className={viewMode === 'grid' ? 'mt-2' : ''}>
                      <h4 className="font-medium text-gray-900 truncate">{file.name}</h4>
                      {viewMode === 'list' && (
                        <p className="text-sm text-gray-500">{file.size} • {file.modified}</p>
                      )}
                    </div>
                  </div>
                  {viewMode === 'list' && (
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.type !== 'folder' && (
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                          title="Download"
                        >
                          <SafeIcon icon={FiDownload} className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                        title="Delete"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <SafeIcon icon={FiFolder} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No files match your search' : 'This folder is empty'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h3>
        <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors block cursor-pointer">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploadingFile}
          />
          {uploadingFile ? (
            <>
              <SafeIcon icon={FiLoader} className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 mb-2">Uploading files...</p>
            </>
          ) : (
            <>
              <SafeIcon icon={FiUpload} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop files here or click to browse</p>
              <button
                type="button"
                className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors"
              >
                Select Files
              </button>
            </>
          )}
        </label>
      </motion.div>

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Folder</h3>
                <button
                  onClick={() => setShowNewFolderModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <SafeIcon icon={FiX} className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter folder name"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createNewFolder}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <SafeIcon icon={FiCheck} className="w-4 h-4" />
                  <span>Create Folder</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileManager;