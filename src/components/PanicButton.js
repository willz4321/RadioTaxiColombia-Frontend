import React, { useEffect } from 'react';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const PanicButton = () => {
  const id_usuario = localStorage.getItem('id_usuario');

  const handlePanicButtonClick = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/panic`, { id_usuario });
      console.log('Panic button clicked, event sent with id_usuario:', id_usuario);
    } catch (error) {
      console.error('Error sending panic event:', error);
    }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      App.addListener('dispatchEvent', (event) => {
        if (event.detail === 'panicButtonPressed') {
          handlePanicButtonClick();
        }
      });
    }

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return (
    <button 
      onClick={handlePanicButtonClick} 
      style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        padding: '30px',
        backgroundColor: 'transparent', // Fondo transparente
        border: '1px solid rgba(0, 0, 0, 0.1)', // Borde muy sutil
        borderRadius: '50%',
        fontSize: '16px',
        cursor: 'pointer',
        zIndex: '10000',
      }}
    >
    </button>
  );
};

export default PanicButton;
