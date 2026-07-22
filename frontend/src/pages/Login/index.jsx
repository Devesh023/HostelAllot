import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export default function Login() {
  const { login, token, admin, student } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // Redirect if session is already active
  useEffect(() => {
    if (token) {
      if (admin) {
        navigate('/admin/dashboard', { replace: true });
      } else if (student) {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [token, admin, student, navigate]);

  const onLoginSubmit = async (data) => {
    setSubmitting(true);
    try {
      const authData = await login(data.email, data.password);
      if (authData.session) {
        toast.success('Successfully authenticated!');
        // Redirection will be handled by the useEffect above when user state loads
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,58,237,0.2),rgba(255,255,255,0))] px-6">
      <div className="w-full max-w-md p-8 glass-card border border-white/10 shadow-2xl rounded-3xl bg-slate-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-32 h-32 rounded-full bg-violet-650/15 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-violet-600/30 mb-4">
            A
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-1.5">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">EMAIL ADDRESS</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="email"
                placeholder="name@college.edu"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl outline-none text-sm text-white focus:border-violet-500 transition-all duration-200"
                {...register('email', { 
                  required: 'Email address is required',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                })}
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-red-400 flex items-center gap-1">
                <FiAlertCircle className="w-3.5 h-3.5" /> {errors.email.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">PASSWORD</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl outline-none text-sm text-white focus:border-violet-500 transition-all duration-200"
                {...register('password', { required: 'Password is required' })}
              />
            </div>
            {errors.password && (
              <span className="text-[11px] text-red-400 flex items-center gap-1">
                <FiAlertCircle className="w-3.5 h-3.5" /> {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-550 disabled:bg-violet-850 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-600/20 transition-all duration-150 flex justify-center items-center"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Dedicated Back to Dashboard Button below Login */}
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 flex justify-center items-center gap-2 cursor-pointer group"
          >
            <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="text-center text-xs text-slate-400 mt-4">
            Need an account?{' '}
            <Link to="/signup" className="font-bold text-violet-400 hover:text-violet-300">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
