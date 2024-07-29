import axios from 'axios';

export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // en metros
  return d;
};

export const snapToRoad = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://router.project-osrm.org/nearest/v1/driving/${longitude},${latitude}`);
    if (response.data && response.data.waypoints.length > 0) {
      const { location } = response.data.waypoints[0];
      return { lat: location[1], lng: location[0] };
    }
    return { lat: latitude, lng: longitude };
  } catch (error) {
    console.error("Error al ajustar a la vía:", error);
    return { lat: latitude, lng: longitude };
  }
};

export const animateMarker = (from, to, duration, setPosition) => {
  const start = Date.now();
  const step = () => {
    const now = Date.now();
    const progress = Math.min((now - start) / duration, 1);
    const lat = from.lat + (to.lat - from.lat) * progress;
    const lng = from.lng + (to.lng - from.lng) * progress;
    setPosition({ lat, lng });
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
};
