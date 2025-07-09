import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useConnection } from '../contexts/ConnectionContext';

const { FiMenu, FiWifi, FiWifiOff, FiServer } = FiIcons;

const Header = ({ onMenuClick, currentView }) => {
  const { isConnected, activeConnection, disconnect } = useConnection();

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'files':
        return 'File Manager';
      case 'settings':
        return 'Settings';
      default:
        return 'SFTP Client';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiMenu} className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiServer} className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              {getViewTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isConnected && activeConnection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full"
            >
              <SafeIcon icon={FiWifi} className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {activeConnection.name}
              </span>
              <button
                onClick={disconnect}
                className="ml-2 text-green-600 hover:text-green-800 transition-colors"
              >
                <SafeIcon icon={FiWifiOff} className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          
          {!isConnected && (
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full">
              <SafeIcon icon={FiWifiOff} className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Disconnected</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;