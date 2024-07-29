import React from 'react';
import { Link } from 'react-router-dom';
import { Person, People, ChatDots, Globe } from 'react-bootstrap-icons';
import LogoutButton from './LogoutButton'; // Asegúrate de tener este componente

const Layout = ({ children }) => {
  return (
    <div className="container-fluid">
      <div className="row align-items-center justify-content-between" style={{ padding: '20px' }}>
        <div className="col-auto">
          <Link to="/home">
            <img src={"/imagenes/Logo.jpg"} alt="Logo" style={{ width: '250px', marginRight: '20px' }} />
          </Link>
        </div>
        <div className="col-auto d-flex align-items-center">
          <Link to="/user" className="btn btn-link text-dark">
            <Person size={30} />
          </Link>
          <Link to="/users-list" className="btn btn-link text-dark ml-2">
            <People size={30} />
          </Link>
          <Link to="/chat" className="btn btn-link text-dark ml-2">
            <ChatDots size={30} />
          </Link>
          <LogoutButton className="btn btn-warning ml-2" />
        </div>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};

export default Layout;
