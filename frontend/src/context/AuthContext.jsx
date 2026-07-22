import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize Axios Auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    // Listen for auth state changes natively via Supabase client
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setToken(session.access_token);
        try {
          const res = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Session syncing failed:', err.message);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        try {
          const res = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.error('Initial session fetch failed:', err.message);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    return data;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  // admin equals the active user profile
  const admin = user;

  return (
    <AuthContext.Provider value={{ user, admin, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
