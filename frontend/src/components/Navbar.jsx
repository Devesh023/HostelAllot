import React from 'react';
import { FiMenu, FiSun, FiMoon, FiSearch, FiUser, FiChevronDown, FiLock, FiLogOut } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ toggleSidebar, isSidebarOpen }) {
  const { theme, toggleTheme } = useTheme();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [searchVal, setSearchVal] = React.useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/students?search=${encodeURIComponent(searchVal)}`);
      setSearchVal('');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 glass-panel bg-white/70 dark:bg-slate-900/60 shadow-sm border-b border-slate-200/50 dark:border-slate-800/50">
      {/* Left controls */}
      <div className="flex items-center gap-4">
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800/55 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150"
          >
            <FiMenu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white hidden sm:block">
          AutoAllot Control Center
        </h1>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full mx-4 hidden md:block">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Global Student Search..."
          className="w-full pl-11 pr-4 py-2 bg-slate-100 dark:bg-slate-800/60 border border-transparent hover:border-slate-200 focus:border-violet-500 rounded-xl outline-none text-sm transition-all duration-200 dark:text-white"
        />
      </form>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-200"
          aria-label="Toggle theme mode"
        >
          {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
        </button>

        {/* User profile dropdown */}
        {admin && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-850 transition-all duration-150 text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-250/20"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white shadow-md">
                {(admin.name || admin.username || 'Admin').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold hidden md:inline-block max-w-[100px] truncate">
                {admin.name || admin.username || 'Admin'}
              </span>
              <FiChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-30" />
                <div className="absolute right-0 mt-2.5 w-52 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl z-40 overflow-hidden py-1">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Logged in as</p>
                    <p className="text-sm font-semibold truncate dark:text-white">{admin.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <FiLock className="w-4 h-4 text-slate-400" />
                    Change Password
                  </button>
                  <button
                    onClick={async () => {
                      setDropdownOpen(false);
                      await logout();
                      navigate('/');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-slate-100 dark:border-slate-800"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
