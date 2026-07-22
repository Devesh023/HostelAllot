import { supabase } from '../config/supabase.js';

// Logs admin activity to Supabase database activity_logs table
export const logActivity = async (admin, action) => {
  try {
    const { error } = await supabase.from('activity_logs').insert([
      {
        admin: admin || 'System/Admin',
        action: action
      }
    ]);
    if (error) throw error;
  } catch (err) {
    console.error('Logging Error:', err.message);
  }
};

// Middleware wrapper for logging API endpoints (if needed for all requests)
export const apiLogger = (actionText) => {
  return async (req, res, next) => {
    if (req.admin) {
      await logActivity(req.admin.name, `${actionText} by ${req.admin.name}`);
    }
    next();
  };
};
