import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const RedirectAuth = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (token) {
    // Redirigir al home si está autenticado
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return children;
};

export default RedirectAuth;
