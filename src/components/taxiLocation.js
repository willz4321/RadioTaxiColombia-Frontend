import { calculateDistance, snapToRoad } from '../geoUtils';
import axios from 'axios';

export const updateTaxiLocation = async (setTaxiLocation, taxiLocation, id_usuario) => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const snappedPosition = await snapToRoad(latitude, longitude);

        const distanceMoved = taxiLocation
          ? calculateDistance(snappedPosition.lat, snappedPosition.lng, taxiLocation.lat, taxiLocation.lng)
          : 0;

        if (distanceMoved >= 30 || !taxiLocation) {
          setTaxiLocation(snappedPosition);
          localStorage.setItem('taxiLocation', JSON.stringify(snappedPosition));

          // Emitir la ubicación al servidor
          axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/update-location`, {
            id_usuario,
            latitude: snappedPosition.lat,
            longitude: snappedPosition.lng
          });
        }
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  } else {
    console.log('La geolocalización no está disponible en este navegador.');
  }
};
