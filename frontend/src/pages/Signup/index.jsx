import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export default function Signup() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const passwordVal = watch('password');

  const onSignupSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await axios.post('/api/auth/signup', {
        name: data.name,
        email: data.email,
        password: data.password
      });

      if (res.data.success) {
        toast.success('Administrator account registered successfully!');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,58,237,0.2),rgba(255,255,255,0))] px-6">
      <div className="w-full max-w-md p-8 glass-card border border-white/10 shadow-2xl rounded-3xl bg-slate-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-32 h-32 rounded-full bg-violet-650/15 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-violet-600/30 mb-4">
            A
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white">Admin Registration</h2>
          <p className="text-sm text-slate-400 mt-1.5">Sign up to manage hostel seat configurations</p>
        </div>

        <form onSubmit={handleSubmit(onSignupSubmit)} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">FULL NAME</label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="John Doe"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl outline-none text-sm text-white focus:border-violet-500 transition-all duration-200"
                {...register('name', { required: 'Full Name is required' })}
              />
            </div>
            {errors.name && (
              <span className="text-[11px] text-red-400 flex items-center gap-1">
                <FiAlertCircle className="w-3.5 h-3.5" /> {errors.name.message}
              </span>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">EMAIL ADDRESS</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="email"
                placeholder="admin@college.edu"
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

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">PASSWORD</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl outline-none text-sm text-white focus:border-violet-500 transition-all duration-200"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
              />
            </div>
            {errors.password && (
              <span className="text-[11px] text-red-400 flex items-center gap-1">
                <FiAlertCircle className="w-3.5 h-3.5" /> {errors.password.message}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">CONFIRM PASSWORD</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl outline-none text-sm text-white focus:border-violet-500 transition-all duration-200"
                {...register('confirmPassword', { 
                  required: 'Confirm password is required',
                  validate: (val) => val === passwordVal || 'Passwords do not match'
                })}
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-[11px] text-red-400 flex items-center gap-1">
                <FiAlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-550 disabled:bg-violet-850 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-600/20 active:translate-y-[1px] transition-all flex justify-center items-center"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Create Account'
            )}
          </button>
          
          <div className="text-center text-xs text-slate-400 mt-4">
            <Link to="/login" className="font-semibold text-slate-450 hover:text-white flex items-center justify-center gap-2">
              <FiArrowLeft /> Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
