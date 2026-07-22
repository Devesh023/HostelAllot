import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiGrid, 
  FiUsers, 
  FiHome, 
  FiGitCommit, 
  FiLayers, 
  FiSliders, 
  FiAward, 
  FiFileText, 
  FiSettings, 
  FiLogOut, 
  FiChevronLeft, 
  FiChevronRight 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { admin, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FiGrid },
    { name: 'Students', path: '/admin/students', icon: FiUsers },
    { name: 'Hostels', path: '/admin/hostels', icon: FiHome },
    { name: 'Branches', path: '/admin/branches', icon: FiGitCommit },
    { name: 'Categories', path: '/admin/categories', icon: FiLayers },
    { name: 'Seat Config', path: '/admin/seat-configuration', icon: FiSliders },
    { name: 'Merit List', path: '/admin/merit-list', icon: FiAward },
    { name: 'Reports', path: '/admin/reports', icon: FiFileText },
    { name: 'Settings', path: '/admin/settings', icon: FiSettings },
  ];

  return (
    <motion.aside
      animate={{ width: isOpen ? '260px' : '80px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed inset-y-0 left-0 z-30 flex flex-col h-screen bg-slate-900 text-white shadow-2xl overflow-x-hidden select-none"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-violet-600/30">
            A
          </div>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-bold text-xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent"
            >
              AutoAllot
            </motion.span>
          )}
        </Link>
        {isOpen && (
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors duration-150 text-slate-400 hover:text-white"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium"
              >
                {item.name}
              </motion.span>
            )}
            {!isOpen && (
              <div className="absolute left-16 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-md">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-850 bg-slate-950/40">
        {isOpen && admin && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-3 bg-slate-800/40 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-violet-600/10 flex items-center justify-center font-semibold text-violet-400">
              {(admin.name || admin.username || 'Admin').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-xs font-semibold truncate">{admin.name || admin.username || 'Admin'}</h4>
              <p className="text-[10px] text-slate-500 truncate">{admin.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all duration-200 relative group font-medium"
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span className="text-sm">Logout</span>}
          {!isOpen && (
            <div className="absolute left-16 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-md">
              Logout
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
