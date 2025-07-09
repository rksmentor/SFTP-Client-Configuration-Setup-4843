import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useConnection } from '../contexts/ConnectionContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit2, FiTrash2, FiServer, FiEye, FiEyeOff, FiSave, FiX, FiWifi, FiWifiOff } = FiIcons;

const Settings = () => {
  const { connections, saveConnection, deleteConnection, connectToServer, disconnect, activeConnection, isConnected } = useConnection();
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '22',
    username: '',
    password: '',
    authMethod: 'password'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveConnection(formData);
    setFormData({
      name: '',
      host: '',
      port: '22',
      username: '',
      password: '',
      authMethod: 'password'
    });
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleConnect = async (connection) => {
    setConnecting(connection.id);
    try {
      await connectToServer(connection);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Connection Settings</h2>
          <p className="text-gray-600 mt-1">Manage your SFTP server connections</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4" />
          <span>Add Connection</span>
        </button>
      </div>

      {/* Add Connection Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add New Connection</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <SafeIcon icon={FiX} className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="My Server"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host
                </label>
                <input
                  type="text"
                  name="host"
                  value={formData.host}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="22"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authentication Method
                </label>
                <select
                  name="authMethod"
                  value={formData.authMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="password">Password</option>
                  <option value="key">SSH Key</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <SafeIcon icon={FiSave} className="w-4 h-4" />
                <span>Save Connection</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Connections List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Saved Connections</h3>
        </div>
        <div className="p-6">
          {connections.length > 0 ? (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      activeConnection?.id === connection.id ? 'bg-green-100' : 'bg-primary-100'
                    }`}>
                      <SafeIcon 
                        icon={FiServer} 
                        className={`w-5 h-5 ${
                          activeConnection?.id === connection.id ? 'text-green-600' : 'text-primary-600'
                        }`} 
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{connection.name}</h4>
                        {activeConnection?.id === connection.id && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {connection.username}@{connection.host}:{connection.port}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeConnection?.id === connection.id ? (
                      <button
                        onClick={handleDisconnect}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center space-x-1"
                      >
                        <SafeIcon icon={FiWifiOff} className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(connection)}
                        disabled={connecting === connection.id || isConnected}
                        className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                      >
                        <SafeIcon icon={FiWifi} className="w-4 h-4" />
                        <span>{connecting === connection.id ? 'Connecting...' : 'Connect'}</span>
                      </button>
                    )}
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteConnection(connection.id)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <SafeIcon icon={FiServer} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No connections saved yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;