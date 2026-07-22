import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { FiLock, FiAlertCircle } from 'react-icons/fi';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      
      toast.success('Password updated successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,58,237,0.2),rgba(255,255,255,0))] px-6">
      <div className="w-full max-w-md p-8 glass-card border border-white/10 shadow-2xl rounded-3xl bg-slate-950/40 relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-violet-600/30 mb-4">
            A
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white">Enter New Password</h2>
          <p className="text-sm text-slate-400 mt-1.5">Choose a secure password for your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">NEW PASSWORD</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl outline-none text-sm text-white focus:border-violet-500 transition-all duration-200"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters required' } })}
              />
            </div>
            {errors.password && (
              <span className="text-[11px] text-red-400 flex items-center gap-1">
                <FiAlertCircle className="w-3.5 h-3.5" /> {errors.password.message}
              </span>
            )}
          </div>

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

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-550 disabled:bg-violet-850 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-600/20 active:translate-y-[1px] transition-all flex justify-center items-center"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Save New Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
