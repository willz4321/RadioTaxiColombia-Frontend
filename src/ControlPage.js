import React from 'react';
import UsersMap from './components/UsersMap';
import TaxiRequestButton from './components/TaxiRequestButton';

const HomePage = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <TaxiRequestButton /> {/* Botón para solicitar el taxi */}
      <UsersMap /> {/* Componente para mostrar el mapa */}
    </div>
  );
};

export default HomePage;
