import { authClient, adminClient } from '../config/supabase.js';
import { logActivity } from '../middleware/logger.js';
import bcrypt from 'bcryptjs';

// Signup Controller (Admin-only signup, writes to users and admins tables)
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full Name, email and password are required.' });
    }

    // 1. Create credentials in Supabase Auth using authClient (Anon Key)
    const { data: signUpData, error: authError } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (authError || !signUpData?.user) {
      const isDuplicate = authError?.message?.includes('already exists') || authError?.message?.includes('registered');
      return res.status(400).json({ 
        success: false, 
        message: isDuplicate ? 'Admin account with this email already exists.' : (authError?.message || 'Failed to create auth profile.')
      });
    }

    const userId = signUpData.user.id;

    // 2. Insert into users table (Optional: skip if table does not exist)
    const { error: userError } = await adminClient
      .from('users')
      .insert([
        {
          id: userId,
          name,
          email,
          role: 'admin'
        }
      ]);

    if (userError) {
      const isMissingTable = 
        userError.message?.includes('Could not find the table') || 
        userError.message?.includes('does not exist') ||
        userError.code === '42P01';

      if (!isMissingTable) {
        // Rollback Auth user using adminClient (Service Role Key)
        try {
          await adminClient.auth.admin.deleteUser(userId);
        } catch (e) {
          console.warn('Rollback user delete failed:', e.message);
        }
        return res.status(500).json({ success: false, message: `Failed to insert user profile: ${userError.message}` });
      } else {
        console.log('[AutoAllot Signup] Optional users table does not exist, skipping users insertion.');
      }
    }

    // Hash password for relation table admins insertion
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert into admins table using adminClient (Mandatory)
    const { error: adminError } = await adminClient
      .from('admins')
      .insert([
        {
          id: userId,
          username: name, // Map name input to username column
          email,
          password: hashedPassword, // Hash mapped
          role: 'admin'
        }
      ]);

    if (adminError) {
      // Rollback database and auth user
      try {
        await adminClient.from('users').delete().eq('id', userId);
      } catch (e) {
        // Ignore if table doesn't exist
      }
      try {
        await adminClient.auth.admin.deleteUser(userId);
      } catch (e) {
        console.warn('Rollback user delete failed:', e.message);
      }
      return res.status(500).json({ success: false, message: `Failed to insert admin profile: ${adminError.message}` });
    }

    await logActivity(name, 'New administrator signed up');

    res.status(201).json({
      success: true,
      message: 'Admin account registered successfully.',
      user: {
        id: userId,
        name,
        email,
        role: 'admin'
      }
    });
  } catch (err) {
    next(err);
  }
};

// Login Controller
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Authenticate user via authClient (Anon Key)
    const { data: authSession, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authSession?.session) {
      return res.status(401).json({ success: false, message: authError?.message || 'Invalid email or password.' });
    }

    const userId = authSession.user.id;
    const token = authSession.session.access_token;

    // Verify user exists in the admins table using adminClient
    const { data: adminProfile, error: dbError } = await adminClient
      .from('admins')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (dbError || !adminProfile) {
      // Log out session using authClient
      await authClient.auth.signOut();
      return res.status(403).json({ success: false, message: 'Unauthorized Access. Administrative credentials required.' });
    }

    await logActivity(adminProfile.username || adminProfile.name, 'Admin logged in');

    res.status(200).json({
      success: true,
      token,
      user: {
        id: adminProfile.id,
        name: adminProfile.username || adminProfile.name,
        email: adminProfile.email,
        role: adminProfile.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Logout Controller
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logActivity(req.user.name, 'Admin logged out');
    }
    // Sign out using authClient
    await authClient.auth.signOut();
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// Get Session Me
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication session not found.' });
    }
    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.username || req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Change Password
export const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required.' });
    }

    // Update using adminClient (Service Role Key)
    const { error } = await adminClient.auth.admin.updateUserById(req.user.id, {
      password: newPassword
    });

    if (error) throw error;

    await logActivity(req.user.name || req.user.username, 'Updated password');
    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// Reset Password Recovery
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    // Reset password using authClient
    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin || 'http://localhost:3000'}/reset-password`
    });

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    next(err);
  }
};
