import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiFolder, FiSettings, FiX, FiServer } = FiIcons;

const Sidebar = ({ isOpen, onClose, currentView, setCurrentView }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/' },
    { id: 'files', label: 'File Manager', icon: FiFolder, path: '/files' },
    { id: 'settings', label: 'Settings', icon: FiSettings, path: '/settings' },
  ];

  const handleNavigation = (item) => {
    setCurrentView(item.id);
    navigate(item.path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:translate-x-0"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiServer} className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">SFTP Client</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6">
          <div className="px-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center px-3 py-2 mb-1 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <SafeIcon icon={item.icon} className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;