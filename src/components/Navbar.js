// components/Navbar.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Person, People, ChatDots, Calendar, FileText } from 'react-bootstrap-icons';
import LogoutButton from './LogoutButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AppContext } from '../context/';

const Navbar = () => {
  const tipoUsuario = localStorage.getItem('tipo_usuario');
  const {state} = useContext(AppContext)
  const viaje = state.viaje
  
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
      <div className="container-fluid">
       { viaje ? (
         <Link to={`/Mi-viaje/${viaje.telefono_cliente}/${viaje?.id_viaje}`} className="navbar-brand">
            <img src="/imagenes/Logo.png" alt="Logo" style={{ width: '200px' }} />
          </Link>
         )
         : ( <Link to="/home" className="navbar-brand">
                <img src="/imagenes/Logo.png" alt="Logo" style={{ width: '200px' }} />
              </Link>
            )
        }
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ml-auto">
            {
              !viaje && (
                <li className="nav-item">
                    <Link to="/user" className="nav-link">
                      <Person size={30} />
                      <span className="d-lg-none">Perfil</span>
                    </Link>
                 </li>
              )
            }
           
            {tipoUsuario === 'tipo1' && viaje == null && (
              <>
                <li className="nav-item">
                  <Link to="/users-list" className="nav-link">
                    <People size={30} />
                    <span className="d-lg-none">Usuarios</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/chat" className="nav-link">
                    <ChatDots size={30} />
                    <span className="d-lg-none">Chat</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to={viaje ? `/Mis-viajes/:${viaje.telefono_cliente}` :"/historial-viajes"} className="nav-link">
                    <Calendar size={30} />
                    <span className="d-lg-none">Historial de Viajes</span>
                  </Link>
                </li>
              </>
            )}
            {tipoUsuario === 'tipo2' && viaje == null && (
              <li className="nav-item">
                <Link to="/historial-mis-viajes" className="nav-link">
                  <FileText size={30} />
                  <span className="d-lg-none">Mis Viajes</span>
                </Link>
              </li>
            )}
            {
              viaje && (
                <Link to={viaje ? `/Mis-viajes/${viaje?.telefono_cliente}` : null} className="nav-link">
                <FileText size={30} />
                <span className="d-lg-none">Historial de Viajes</span>
              </Link>
              )
            }
            {
              !viaje && (
                <li className="nav-item logout-btn">
                  <LogoutButton className="btn btn-warning" />
               </li>
              )
            }

          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
