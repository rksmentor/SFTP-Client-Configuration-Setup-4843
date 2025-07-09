import React from 'react';
import { motion } from 'framer-motion';
import { useConnection } from '../contexts/ConnectionContext';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiServer, FiPlus, FiActivity, FiHardDrive, FiUsers, FiClock, FiWifi, FiWifiOff } = FiIcons;

const Dashboard = () => {
  const { connections, activeConnection, isConnected, connectToServer, disconnect } = useConnection();
  const navigate = useNavigate();

  const stats = [
    {
      label: 'Total Connections',
      value: connections.length,
      icon: FiServer,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Active Sessions',
      value: isConnected ? 1 : 0,
      icon: FiActivity,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Storage Used',
      value: '2.4 GB',
      icon: FiHardDrive,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Last Activity',
      value: '2 min ago',
      icon: FiClock,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];

  const handleConnect = async (connection) => {
    await connectToServer(connection);
    navigate('/files');
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white"
      >
        <h2 className="text-2xl font-bold mb-2">Welcome to SFTP Client</h2>
        <p className="text-primary-100 mb-4">
          Manage your SFTP connections and transfer files securely
        </p>
        {!isConnected && (
          <button
            onClick={() => navigate('/settings')}
            className="bg-white text-primary-600 px-4 py-2 rounded-md font-medium hover:bg-primary-50 transition-colors"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2 inline" />
            Add New Connection
          </button>
        )}
        {isConnected && activeConnection && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiWifi} className="w-5 h-5" />
              <span>Connected to {activeConnection.name}</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-500 text-white px-4 py-2 rounded-md font-medium hover:bg-red-600 transition-colors"
            >
              <SafeIcon icon={FiWifiOff} className="w-4 h-4 mr-2 inline" />
              Disconnect
            </button>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <SafeIcon icon={stat.icon} className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Connections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Connections</h3>
        </div>
        <div className="p-6">
          {connections.length > 0 ? (
            <div className="space-y-4">
              {connections.slice(0, 5).map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      activeConnection?.id === connection.id ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <SafeIcon 
                        icon={FiServer} 
                        className={`w-5 h-5 ${
                          activeConnection?.id === connection.id ? 'text-green-600' : 'text-gray-600'
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
                      <p className="text-sm text-gray-500">{connection.host}:{connection.port}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeConnection?.id === connection.id ? (
                      <button
                        onClick={() => navigate('/files')}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-2"
                      >
                        Browse Files
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(connection)}
                        disabled={isConnected}
                        className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <SafeIcon icon={FiServer} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No connections configured yet</p>
              <button
                onClick={() => navigate('/settings')}
                className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors"
              >
                Add Your First Connection
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;