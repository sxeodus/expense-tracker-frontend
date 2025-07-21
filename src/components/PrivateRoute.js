import React from 'react';
import { Navigate } from 'react-router-dom';
import { isTokenExpired } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token || isTokenExpired(token)) { // This check is still useful for the initial page load
    // If token doesn't exist or is expired, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;