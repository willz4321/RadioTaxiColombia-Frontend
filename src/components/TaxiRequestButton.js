import React from 'react';
import axios from 'axios';

const TaxiRequestButton = () => {
    const handleRequestTaxi = async () => {
      // Datos del cliente que solicita el taxi
      const taxiRequestData = {
        clientId: '3201823721',
        name: 'Fulano',
        latitude: 1.2186961776995207, // La latitud actual del cliente
        longitude: -77.27944568643332 , // La longitud actual del cliente
        address: 'Calle x',
        endLatitude: 1.2286228566102266, // la latitud de destino proporcionada por el cliente
        endLongitude: -77.28339116070457, // la longitud de destino proporcionada por el cliente
        endAddress: 'calle z' // la dirección de destino proporcionada por el cliente
      };
  
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/taxi-request`, taxiRequestData);

        console.log('Respuesta de la solicitud de taxi:', response.data);
      } catch (error) {
        console.error('Error al solicitar el taxi:', error);
      }
    };
  
    return (
      <button onClick={handleRequestTaxi}>Solicitar Taxi</button>
    );
  };

  export default TaxiRequestButton;