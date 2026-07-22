import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

      {/* Primary Page Layout */}
      <div 
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-hidden"
        style={{ paddingLeft: sidebarOpen ? '260px' : '80px' }}
      >
        {/* Top Navbar */}
        <Navbar toggleSidebar={() => setSidebarOpen(true)} isSidebarOpen={sidebarOpen} />
        
        {/* Main Content Workspace */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
