import axios from 'axios';

// Dynamically set the API base URL depending on the environment.
// The `REACT_APP_API_URL` will be set in Netlify's environment variables for production.
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: baseURL,
  withCredentials: true, // This is crucial for sending cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attaches the access token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handles token refresh logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Intercept 401 Unauthorized errors to refresh the token.
    // We also check for `error.response` to guard against network errors where no response is received.
    // We also exclude the login and refresh-token routes to prevent an infinite loop.
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh-token') {
      originalRequest._retry = true; // Mark it as a retry to prevent infinite loops

      try {
        const { data } = await apiClient.post('/auth/refresh-token');
        localStorage.setItem('token', data.token); // Store the new token

        // The request interceptor will automatically add the new token to the retried request.
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Avoid redirect loop if already on login page
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;