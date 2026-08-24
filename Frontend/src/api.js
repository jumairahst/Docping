import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL:
   process.env.API_BASE_URL ||
   'http://localhost:5000/api',
});

// Every request automatically gets the Firebase token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken();

        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Unable to get Firebase token:', error);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;