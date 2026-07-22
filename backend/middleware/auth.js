import { authClient, adminClient } from '../config/supabase.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }

  try {
    // Validate session token with Supabase Auth using authClient (Anon Key)
    const { data: { user }, error } = await authClient.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Session expired or invalid authentication token.' });
    }

    // Retrieve staff profile details from admins table using adminClient (Service Role Key)
    const { data: adminProfile, error: dbError } = await adminClient
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbError || !adminProfile) {
      return res.status(401).json({ success: false, message: 'Administrative access profile not found.' });
    }

    req.user = {
      id: adminProfile.id,
      name: adminProfile.username || adminProfile.name,
      email: adminProfile.email,
      role: adminProfile.role
    };
    req.admin = req.user;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: `Authentication Failed: ${err.message}` });
  }
};

// Authorization filter for admin-only operations
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Administrative clearance required.' });
    }
    next();
  };
};
