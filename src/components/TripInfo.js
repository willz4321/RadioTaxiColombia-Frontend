import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { icon, divIcon } from 'leaflet';
import { Button, Collapse, Container, Row, Col, Modal, Card } from 'react-bootstrap';
import { CarFront, Person, GeoAlt, Flag, BoxSeam, Calendar, Clock, ChevronUp, ChevronDown, Check, XCircle, Telephone, Chat, ArrowsFullscreen, PersonFill, GeoAltFill, FlagFill, TelephoneFill, XCircleFill, ChatFill, CaretLeftFill, CheckCircleFill } from 'react-bootstrap-icons';
import axios from 'axios';
import socket from '../Socket';
import { snapToRoad, getDistance, animateMarker } from '../geoUtils';
import PanicButton from './PanicButton';
import { AppContext } from '../context';

const taxiIcon = icon({
  iconUrl: '/imagenes/car_topview.svg',
  iconSize: [40, 40]
});

const clientStartIcon = divIcon({
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-person-arms-up" viewBox="0 0 16 16"><path d="M8 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/><path d="m5.93 6.704-.846 8.451a.768.768 0 0 0 1.523.203l.81-4.865a.59.59 0 0 1 1.165 0l.81 4.865a.768.768 0 0 0 1.523-.203l-.845-8.451A1.5 1.5 0 0 1 10.5 5.5L13 2.284a.796.796 0 0 0-1.239-.998L9.634 3.84a.7.7 0 0 1-.33.235c-.23.074-.665.176-1.304.176-.64 0-1.074-.102-1.305-.176a.7.7 0 0 1-.329-.235L4.239 1.286a.796.796 0 0 0-1.24.998l2.5 3.216c.317.316.475.758.43 1.204Z"/></svg>',
  className: 'custom-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const clientEndIcon = divIcon({
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-flag-fill" viewBox="0 0 16 16"><path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12 12 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A20 20 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a20 20 0 0 0 1.349-.476l.019-.007.004-.002h.001"/></svg>',
  className: 'custom-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const TripInfo = ({ trip, onBack, handleCancel, handleFinish, handleArrive, handleBoarding, taxiLocation, handleAcceptRequest, id_usuario, formatTime }) => {
  const [route, setRoute] = useState([]);
  const [showMap, setShowMap] = useState(true);
  const [open, setOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [currentTaxiLocation, setCurrentTaxiLocation] = useState(taxiLocation);
  const [lastKnownLocation, setLastKnownLocation] = useState(null);
  const [driverInfo, setDriverInfo] = useState({});
  const [estadoViaje, setEstadoViaje] = useState(trip.estado);
  const [showModal, setShowModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  const {state} = useContext(AppContext)
  const viaje = state.viaje
  
  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  const getRoute = async (origin, destination) => {
    try {
      const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`);
      if (response.data && response.data.routes.length > 0) {
        const route = response.data.routes[0].geometry.coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));
        setRoute(route);
      }
    } catch (error) {
      console.error('Error al obtener la ruta:', error);
    }
  };

  const fetchDriverInfo = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/driver-info/${trip.id_viaje}`);
      setDriverInfo(response.data);
    } catch (error) {
      console.error('Error al obtener la información del conductor:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/pending-reservations`);
      const requestsWithTimers = response.data.map(request => {
        const reservationDateTime = new Date(request.fecha_reserva);
        const [hours, minutes, seconds] = request.hora_reserva.split(':');
        reservationDateTime.setHours(hours, minutes, seconds.split('-')[0]);
        const twoHoursBefore = new Date(reservationDateTime.getTime() - 2 * 60 * 60 * 1000);
        const now = new Date();
        const remainingTime = Math.max((twoHoursBefore - now) / 1000, 0);
        return { ...request, timer: remainingTime, nombre: request.nombre };
      });
      setPendingRequests(requestsWithTimers.filter(request => request.tipo === 'taxi' || request.tipo === 'delivery'));
    } catch (error) {
      console.error('Error al obtener los viajes pendientes:', error);
    }
  };

  useEffect(() => {
    fetchDriverInfo();
    fetchPendingRequests();

    socket.on('taxiRequest', handleTaxiRequest);
    socket.on('deliveryRequest', handleDeliveryRequest);

    return () => {
      socket.off('taxiRequest', handleTaxiRequest);
      socket.off('deliveryRequest', handleDeliveryRequest);
    };
  }, [trip.id_viaje]);

  useEffect(() => {
    if (trip.latitud && trip.longitud && trip.latitud_fin && trip.longitud_fin) {
      getRoute({ lat: trip.latitud, lng: trip.longitud }, { lat: trip.latitud_fin, lng: trip.longitud_fin });
    }
  }, [trip]);

  useEffect(() => {
    if (taxiLocation) {
      animateMarker(currentTaxiLocation, taxiLocation, 1000, setCurrentTaxiLocation);
    }
  }, [taxiLocation]);

  const navigateTo = (destination) => {
    const start = `${currentTaxiLocation.lat},${currentTaxiLocation.lng}`;
    const url = driverInfo.navegacion === 'Waze' 
      ? `https://waze.com/ul?ll=${destination}&navigate=yes&from=${start}` 
      : `https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${destination}`;
    window.open(url, '_blank');
  };

  const navigateToClient = () => {
    const destination = `${trip.latitud},${trip.longitud}`;
    navigateTo(destination);
  };

  const navigateToDestination = () => {
    const destination = `${trip.latitud_fin},${trip.longitud_fin}`;
    navigateTo(destination);
  };

  const sendLocationToServer = async (latitude, longitude) => {
    const payload = { id_usuario, latitude, longitude };
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/update-location`, payload);
      console.log("Respuesta del servidor:", response.data);
    } catch (error) {
      console.error("Error al enviar la ubicación:", error);
    }
  };

  const updateTaxiLocation = async (forceUpdate = false) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const snappedPosition = await snapToRoad(latitude, longitude);
          const distance = lastKnownLocation ? getDistance(lastKnownLocation.lat, lastKnownLocation.lng, snappedPosition.lat, snappedPosition.lng) : 21;

          if (forceUpdate || distance > 20) {
            setCurrentTaxiLocation(snappedPosition);
            setLastKnownLocation(snappedPosition);
            await sendLocationToServer(snappedPosition.lat, snappedPosition.lng);
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

  const handleCheck = async (id_viaje) => {
    let newEstado = '';
    if (estadoViaje === 'aceptado') {
      handleArrive(trip.id_viaje);
      newEstado = 'esperando';
    } else if (estadoViaje === 'esperando') {
      handleBoarding(trip.id_viaje);
      newEstado = 'en viaje';
    } else if (estadoViaje === 'en viaje') {
      handleFinish(trip.id_viaje);
      onBack();
    }

    setEstadoViaje(newEstado);
  };

  const handleAccept = (request, index) =>{
    handleAcceptRequest(request, index);
    setShowModal(false);
  }

  const handleTaxiRequest = (request) => {
    setPendingRequests((prevRequests) => [
      ...prevRequests,
      { ...request, timer: 10, tipo: 'taxi' }
    ]);
    setShowModal(true);
  };

  const handleDeliveryRequest = (request) => {
    setPendingRequests((prevRequests) => [
      ...prevRequests,
      { ...request, timer: 10, tipo: 'delivery' }
    ]);
    setShowModal(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPendingRequests(prevRequests =>
        prevRequests
          .map(req => ({ ...req, timer: req.timer - 1 }))
          .filter(req => req.timer > 0)
      );
      if (pendingRequests.length === 0) {
        setShowModal(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingRequests]);

  useEffect(() => {
    updateTaxiLocation(true);
    const intervalId = setInterval(() => updateTaxiLocation(), 5000);

    return () => clearInterval(intervalId);
  }, [id_usuario]);

  const getCheckButtonLabel = () => {
    if (estadoViaje === 'aceptado') {
      return 'Llegué a la Ubicación';
    } else if (estadoViaje === 'esperando') {
      return 'Pasajero Abordo';
    } else if (estadoViaje === 'en viaje') {
      return 'Viaje Finalizado';
    } else if (estadoViaje === 'finalizado') {
      return 'Viaje Finalizado';
    }
  };

  return (
    <>
      <div className="mt-3 informacionViaje">
        <h5 style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setOpen(!open)} aria-controls="collapse-info" aria-expanded={open}>
          Información del viaje {open ? <ChevronUp /> : <ChevronDown />}
        </h5>
        <Collapse in={open}>
          <div id="collapse-info" style={{ textAlign: 'left', padding: '10px', fontSize: '16px', position: 'absolute', backgroundColor: 'white', zIndex: 9999, width: '95%' }}>
            <p style={{ margin: '5px 8px' }}><CarFront /> <strong>Viaje:</strong> {trip.id_viaje}</p>
            <p style={{ margin: '5px 8px' }}><Person /> <strong>Cliente:</strong> {trip.nombre}</p>
            <p style={{ margin: '5px 8px' }}><GeoAlt /> <strong>De:</strong> {trip.direccion}</p>
            <p style={{ margin: '5px 8px' }}><Flag /> <strong>Hasta:</strong> {trip.direccion_fin}</p>
            {trip.descripcion && <p style={{ margin: '5px 8px' }}><BoxSeam /> <strong>Descripción:</strong> {trip.descripcion}</p>}
            {trip.fecha_reserva && trip.hora_reserva && (
              <>
                <p style={{ margin: '5px 8px' }}><Calendar /> <strong>Fecha de reserva:</strong> {trip.fecha_reserva}</p>
                <p style={{ margin: '5px 8px' }}><Clock /> <strong>Hora de reserva:</strong> {trip.hora_reserva}</p>
              </>
            )}
          </div>
        </Collapse>
      </div>

      {showMap && trip.latitud && trip.longitud && trip.latitud_fin && trip.longitud_fin && (
        <div className={`position-relative ${fullScreen ? 'full-screen-map' : ''}`} style={{ height: fullScreen ? '100%' : '40em' }}>
          <MapContainer
            center={[trip.latitud, trip.longitud]}
            zoom={15}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {currentTaxiLocation && (
              <Marker position={[currentTaxiLocation.lat, currentTaxiLocation.lng]} icon={taxiIcon}>
                <Popup>
                  <strong>Taxi</strong><br />
                  <strong>Nombre:</strong> {driverInfo.nombre}<br />
                  <strong>Placa:</strong> {driverInfo.placa}<br />
                  <strong>Teléfono:</strong> {driverInfo.telefono}<br />
                  <strong>Navegación:</strong> {driverInfo.navegacion}
                </Popup>
              </Marker>
            )}
            <Marker position={[trip.latitud, trip.longitud]} icon={clientStartIcon}>
              <Popup>
                <PersonFill /> {trip.nombre}<br />
                <GeoAltFill /> {trip.direccion}
              </Popup>
            </Marker>
            <Marker position={[trip.latitud_fin, trip.longitud_fin]} icon={clientEndIcon}>
              <Popup>
                <FlagFill /> {trip.direccion_fin}
              </Popup>
            </Marker>
            {route.length > 0 && <Polyline positions={route} color="blue" />}
          </MapContainer>
          <Button
            variant="light"
            onClick={toggleFullScreen}
            className="position-absolute"
            style={{ top: 10, right: 10, zIndex: 1000 }}
          >
            <ArrowsFullscreen />
          </Button>
        </div>
      )}

      <Container fluid className="fixed-bottom bg-light" style={{ zIndex: 1000 }}>
        <Row>
          <Col className="d-flex flex-column">
          { !viaje && (
            <>
              <Button variant="warning" className="mb-2 w-100" onClick={estadoViaje === 'aceptado' ? navigateToClient : navigateToDestination}>
                {estadoViaje === 'aceptado' ? "Navegar al Cliente" : "Navegar al Destino"}
              </Button>
    
              <Button variant="outline-success" className="mb-2 w-100" onClick={() => handleCheck(trip.id_viaje)}>
                <CheckCircleFill /> {getCheckButtonLabel()}
              </Button>
            </>
             )}
          </Col>
        </Row>
        <Row className="mt-2">
         {  !viaje && ( <>
                <Col>
                  <Button variant="outline-black" className="w-100" onClick={onBack}>
                  <CaretLeftFill />
                  </Button>
                </Col>
                <Col>
                  <Button variant="outline-black" className="w-100" onClick={() => window.location.href = `tel:${trip.telefono}`}>
                    <TelephoneFill />
                  </Button>
                </Col>
                <Col>
                  <Button variant="outline-black" className="w-100" onClick={() => window.open(`https://wa.me/${trip.telefono}`, '_blank')}>
                    <ChatFill />
                  </Button>
                </Col>
                </> )}
          <Col>
            <Button variant="outline-danger" className="w-100" onClick={() => { handleCancel(trip.id_viaje); onBack(); }}>
              <XCircleFill />
            </Button>
          </Col>
        </Row>
        <PanicButton />
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Solicitudes Pendientes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pendingRequests.map((request, index) => (
            <Card key={index} className="mb-3">
              <Card.Body>
                <Card.Title>
                  {request.tipo === 'taxi' ? <CarFront /> : request.tipo === 'delivery' ? <BoxSeam /> : <Calendar />}   {request.nombre}
                </Card.Title>
                <Card.Text>De: {request.address}</Card.Text>
                <Card.Text>Hasta: {request.endAddress}{}</Card.Text>
                {request.tipo === 'delivery' && <Card.Text>Descripción: {request.descripcion}</Card.Text>}
                <Card.Text>Tiempo restante: {formatTime(request.timer)}</Card.Text>
                <Button variant="warning" onClick={() => handleAccept(request, index)}>
                  Aceptar {request.tipo === 'taxi' ? 'Viaje' : 'Domicilio'}
                </Button>
              </Card.Body>
            </Card>
          ))}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TripInfo;
