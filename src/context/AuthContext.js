import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/axios';
import { googleLogout } from '@react-oauth/google';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    // This function runs once when the app loads to check for a valid token.
    const verifyStoredToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          // Check if the token is still valid by fetching the user profile
          const { data } = await apiClient.get('/auth/me');
          setUser(data);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid or expired, clear it
          localStorage.removeItem('token');
          apiClient.defaults.headers.common['Authorization'] = null;
        }
      }
      setLoading(false); // Finished loading
    }
    verifyStoredToken();
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed on server:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // This is the most important part for the user experience.
      setToken(null);
      setUser(null);
      // Also sign out from Google to allow the user to choose a different account next time.
      googleLogout();
    }
  };

  const updateUser = (updatedUserData) => {
    // Also update localStorage when the user profile changes
    localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUserData }));
    setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  };

  // Don't render the app until we've checked for a token
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};