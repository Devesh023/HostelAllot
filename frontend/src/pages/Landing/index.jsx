import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  FiAward, FiLayers, FiFileText, FiGrid, FiArrowRight, 
  FiMoon, FiSun, FiHome, FiChevronRight 
} from 'react-icons/fi';

export default function LandingPage() {
  const { token, admin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Redirect to admin dashboard if logged in
  useEffect(() => {
    if (token && admin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [token, admin, navigate]);

  const features = [
    { title: 'Automatic Merit Generation', desc: 'Ranks and groups students based on academic percentages and tie-breaker parameters.', icon: FiAward, color: 'text-violet-500 bg-violet-500/10' },
    { title: 'Hostel Seat Allocation', desc: 'Configures and distributes hostel rooms branch-wise and category-wise automatically.', icon: FiHome, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Reservation Management', desc: 'Set up reservation quotas for OPEN/OBC/SC/ST/EWS candidate classes.', icon: FiLayers, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Printable Reports', desc: 'Download official tabular PDF and Excel reports for allotments, merits, and waitlists.', icon: FiFileText, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Interactive Dashboard', desc: 'Monitor hostel occupancies, branches, and activity logs from a single panel.', icon: FiGrid, color: 'text-cyan-500 bg-cyan-500/10' }
  ];

  const steps = [
    { label: 'Offline Forms', desc: 'Candidates submit paper hostel admission applications.' },
    { label: 'Admin Entry', desc: 'College staff enters student records into the database.' },
    { label: 'Merit Generation', desc: 'Ranks candidates sorting by academic percentages.' },
    { label: 'Automatic Allotment', desc: 'Assigns hostels and rooms matching gender quotas.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 font-sans flex flex-col justify-between">
      
      {/* Top Navbar */}
      <header className="px-6 py-4 glass-panel bg-white/70 dark:bg-slate-900/60 sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-650 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-violet-600/20">
            A
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800 dark:text-white">AutoAllot</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
          >
            {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
          </button>
          
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-550 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-violet-600/10"
          >
            Admin Signup
          </Link>
        </div>
      </header>

      {/* Main Sections */}
      <main className="flex-1 space-y-24 py-16 px-6 max-w-6xl mx-auto w-full">
        
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-3.5 py-1 bg-violet-600/10 text-violet-500 font-extrabold text-xs rounded-full border border-violet-500/10 uppercase tracking-wider mb-2"
          >
            College Administrative Desk
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-white leading-tight">
            AutoAllot Portal
          </h2>
          
          <p className="text-lg sm:text-xl font-medium text-slate-500 dark:text-slate-400">
            Smart Hostel Merit & Automatic Hostel Allotment System
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-555 text-white text-base font-bold rounded-2xl shadow-xl shadow-violet-600/20 transition-all"
            >
              Access Admin Panel <FiArrowRight />
            </Link>
            <Link
              to="/signup"
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-base font-bold rounded-2xl transition-all"
            >
              Admin Signup
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Core System Features</h3>
            <p className="text-sm text-slate-400">Automated allocation algorithms and quota filters built for staff administration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={feat.title}
                className="p-6 glass-card space-y-4 hover:border-violet-500/20 transition-all duration-200"
              >
                <div className={`p-3 rounded-xl w-fit ${feat.color}`}>
                  <feat.icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-855 dark:text-white">{feat.title}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-450 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Workflow diagram */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">How AutoAllot Works</h3>
            <p className="text-sm text-slate-400">The lifecycle of academic merits and rooms distribution.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className="p-5 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex flex-col justify-between space-y-3 relative"
              >
                {idx < 3 && (
                  <div className="absolute top-1/2 -translate-y-1/2 -right-3.5 z-10 hidden lg:block text-slate-300 dark:text-slate-700">
                    <FiChevronRight className="w-6 h-6" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-600/10 text-violet-500 flex items-center justify-center font-extrabold text-xs">
                    0{idx + 1}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{step.label}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 border-t border-slate-250/20 dark:border-slate-850/20 mt-16 bg-slate-100/35 dark:bg-slate-950/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-450 uppercase tracking-wider">
          <span>© 2026 AutoAllot Engineering College</span>
          <span>Smart Allocation System • Built with React & Supabase</span>
        </div>
      </footer>

    </div>
  );
}
