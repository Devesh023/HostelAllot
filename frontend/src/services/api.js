import axios from 'axios';

const api = axios.create({
  baseURL: '', // Uses relative paths, which route dynamically to Vercel Serverless or Vite proxy
});

// Automatically inject JWT token into header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
