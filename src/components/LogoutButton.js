import React from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../Socket';
import axios from 'axios';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const id_usuario = localStorage.getItem('id_usuario');

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/logout`, { id_usuario });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('tipo_usuario');
    socket.disconnect();
    navigate('/');
  };

  return (
    <button onClick={handleLogout} className="btn btn-warning">
      Cerrar sesión
    </button>
  );
};

export default LogoutButton;
