import React from 'react';
import { Link } from 'react-router-dom';
import { Person, People, ChatDots, Calendar, FileText } from 'react-bootstrap-icons';
import HomePageContentTipo1 from './components/HomePageContentTipo1';
import HomePageContentTipo2 from './components/HomePageContentTipo2';
import LogoutButton from './components/LogoutButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import './home.css';
import Navbar from './components/Navbar'

const HomePage = () => {
  const tipoUsuario = localStorage.getItem('tipo_usuario');

  return (
    <div>
      <Navbar />
      <div className="container contenido">
        {tipoUsuario === 'tipo1' ? <HomePageContentTipo1 /> : <HomePageContentTipo2 />}
      </div>
    </div>
  );
};

export default HomePage;
