import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Preferences } from '@capacitor/preferences';
import './login.css';
import socket from './Socket';

const Login = () => {
  const [id_usuario, setIdUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    if (!id_usuario || !password) {
      setError("Por favor, complete todos los campos.");
      return;
    }
  
    const payload = {
      id_usuario,
      password,
    };
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, payload);
      setNombreUsuario(response.data.nombre);
      setShowModal(true);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("id_usuario", id_usuario);
      localStorage.setItem("tipo_usuario", response.data.tipo);
  
      // Guardar ID de usuario y token en Preferences de Capacitor
      await Preferences.set({ key: "id_usuario", value: id_usuario });
      await Preferences.set({ key: "token", value: response.data.token });
  
      // Conectar y registrar el socket
      socket.connect();
      socket.emit('registerUser', id_usuario);
  
      // Redirección a la página principal después de un pequeño retraso
      setTimeout(() => {
        setShowModal(false);
        navigate('/home');
      }, 2000);
    } catch (error) {
      const errorMsg = error.response ? error.response.data : "Error de red o respuesta no recibida.";
      setError(errorMsg);
    }
  };
  

  return (
    <div className="login-body">
      <div className="login-form">
        <div className="icon-circle">
          <img src="/RTIcon.png" alt="App Icon" />
        </div>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="ID de usuario"
            value={id_usuario}
            onChange={(e) => setIdUsuario(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input type="submit" value="Iniciar sesión" className="btn btn-primary" />
        </form>
      </div>

      {showModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          role="dialog" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            zIndex: 10001 // Asegúrate de que el modal esté por encima de otros componentes
          }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header justify-content-center">
                <h5 className="modal-title text-center">¡Hola {nombreUsuario}!</h5>
              </div>
              <div className="modal-body text-center">
                <p>Te damos la bienvenida a Radio Taxi Ipiales</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
