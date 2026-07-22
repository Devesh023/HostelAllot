import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import AdminLayout from './layout/AdminLayout';
import LandingPage from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Admin/Dashboard';
import Students from './pages/Admin/Students';
import Hostels from './pages/Admin/Hostels';
import Branches from './pages/Admin/Branches';
import Categories from './pages/Admin/Categories';
import SeatConfiguration from './pages/Admin/SeatConfiguration';
import MeritList from './pages/Admin/MeritList';
import Reports from './pages/Admin/Reports';
import Settings from './pages/Admin/Settings';

// Protected Route filter wrapping both Session verification and Admin checks
function ProtectedRoute({ children }) {
  const { token, admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-650"></div>
          <span className="text-sm font-semibold text-slate-400">Verifying session clearance...</span>
        </div>
      </div>
    );
  }

  if (!token || !admin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Access Portals */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Admin Desk Area */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="hostels" element={<Hostels />} />
              <Route path="branches" element={<Branches />} />
              <Route path="categories" element={<Categories />} />
              <Route path="seat-configuration" element={<SeatConfiguration />} />
              <Route path="merit-list" element={<MeritList />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Redirection fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            duration: 3500,
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              borderRadius: '12px',
              fontSize: '14px',
            }
          }} 
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
