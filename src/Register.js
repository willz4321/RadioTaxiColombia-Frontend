import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import axios from "axios";

const Register = () => {
  const [id_usuario, setIdUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setpassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // <- Mover useHistory aquí, al principio del componente.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpiar errores anteriores

    if (!id_usuario || !nombre || !password) {
      setError("Por favor, complete todos los campos.");
      return;
    }

    const payload = {
      id_usuario,
      nombre,
      password,
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, payload);
      alert(`Usuario creado: ${response.data.nombre}`);
      navigate('/login'); // <- Usar history aquí después de la respuesta exitosa
    } catch (error) {
      if (error.response) {
        setError(error.response.data);
      } else {
        setError("Error de red o respuesta no recibida");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p>{error}</p>}
      <label>
        ID de usuario:
        <input type="text" value={id_usuario} onChange={(e) => setIdUsuario(e.target.value)} />
      </label>
      <label>
        Nombre:
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </label>
      <label>
        password:
        <input type="password" value={password} onChange={(e) => setpassword(e.target.value)} />
      </label>
      <input type="submit" value="Registrarse" />
      <Link to="/">¿Ya tienes cuenta? Inicia sesión</Link>
    </form>
  );
};

export default Register;
