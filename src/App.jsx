import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import FileManager from './pages/FileManager';
import { ConnectionProvider } from './contexts/ConnectionContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <ConnectionProvider>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              onMenuClick={() => setSidebarOpen(true)}
              currentView={currentView}
            />
            
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="container mx-auto px-6 py-8"
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/files" element={<FileManager />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </motion.div>
            </main>
          </div>
        </div>
      </Router>
    </ConnectionProvider>
  );
}

export default App;