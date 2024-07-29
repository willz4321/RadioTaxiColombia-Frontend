import  React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import socket from '../Socket';
import { XCircle } from 'react-bootstrap-icons'; // Importa el icono de XCircle

let markers = {}; // Almacenar los marcadores
let pendingRequests = {}; // Almacenar las solicitudes pendientes

const UsersMap = () => {
    const mapRef = useRef();
    const mapInstance = useRef(null);
    const [runningAnimations, setRunningAnimations] = useState({}); // Para almacenar el estado de las animaciones
    const [panicAudio] = useState(new Audio(`${process.env.REACT_APP_API_URL}/media/notifications/beep-warning-6387.mp3`));

    const playPanicSound = () => {
        panicAudio.play().catch((error) => console.error('Error al reproducir el sonido:', error));
    };

    useEffect(() => {
        const initializeSocketListeners = () => {
            socket.on('connect', () => {
                console.log('Conexión Socket.IO establecida');
            });

            socket.on('connect_error', (error) => {
                console.error('Error al conectar a Socket.IO:', error);
            });

            socket.on('locationUpdated', (updatedLocation) => {
                console.log('Ubicaciones actualizadas:', updatedLocation);
                if (Array.isArray(updatedLocation)) {
                    updatedLocation.forEach(location => updateMarkers(location));
                } else {
                    updateMarkers(updatedLocation);
                }
            });

            socket.on('panic_event', ({ id_usuario }) => {
                console.log('Panic event received for user:', id_usuario);
                playPanicSound();
                showPanicMarker(id_usuario);
            });

            socket.on('taxiRequestPending', ({ latitude, longitude, range, viajeId }) => {
                console.log('solicitud en curso', latitude, longitude);
                clearPendingRequestAnimation(viajeId); // Limpiar cualquier animación previa
                showPendingRequestAnimation(latitude, longitude, range, viajeId, 'taxi');
            });

            socket.on('taxiRequestAccepted', ({ latitude, longitude, id_viaje }) => {
                console.log(`solicitud ${id_viaje} aceptada`);
                changeRequestAnimationColor(id_viaje, 'green', '#0f0'); // Cambiar color a verde
                showAcceptedRequestMarker(latitude, longitude, id_viaje);
                setTimeout(() => clearPendingRequestAnimation(id_viaje), 1000); // Mantener la animación 1 segundo adicional
            });

            socket.on('taxiRequestRejected', ({ id_viaje, latitude, longitude }) => {
                console.log('solicitud rechazada');
                changeRequestAnimationColor(id_viaje, 'red', '#f00'); // Cambiar color a rojo
                showRejectedRequestMarker(latitude, longitude, id_viaje);
                setTimeout(() => clearPendingRequestAnimation(id_viaje), 1000); // Mantener la animación 1 segundo adicional
            });

            socket.on('deliveryRequestPending', ({ latitude, longitude, range, viajeId }) => {
                console.log('solicitud de delivery en curso', latitude, longitude);
                clearPendingRequestAnimation(viajeId); // Limpiar cualquier animación previa
                showPendingRequestAnimation(latitude, longitude, range, viajeId, 'delivery');
            });

            socket.on('deliveryRequestAccepted', ({ latitude, longitude, id_viaje }) => {
                console.log('solicitud de delivery aceptada');
                changeRequestAnimationColor(id_viaje, 'green', '#0f0'); // Cambiar color a verde
                showAcceptedRequestMarker(latitude, longitude, id_viaje);
                setTimeout(() => clearPendingRequestAnimation(id_viaje), 1000); // Mantener la animación 1 segundo adicional
            });

            socket.on('deliveryRequestRejected', ({ id_viaje, latitude, longitude }) => {
                console.log('solicitud de delivery rechazada');
                changeRequestAnimationColor(id_viaje, 'red', '#f00'); // Cambiar color a rojo
                showRejectedRequestMarker(latitude, longitude, id_viaje);
                setTimeout(() => clearPendingRequestAnimation(id_viaje), 1000); // Mantener la animación 1 segundo adicional
            });

            socket.on('reservationRequestPending', ({ latitude, longitude, range, viajeId }) => {
                console.log('solicitud de reserva en curso', latitude, longitude);
                clearPendingRequestAnimation(viajeId); // Limpiar cualquier animación previa
                showPendingRequestAnimation(latitude, longitude, range, viajeId, 'reserva');
            });

            socket.on('reservationRequestAccepted', ({ latitude, longitude, id_viaje }) => {
                console.log('solicitud de reserva aceptada');
                changeRequestAnimationColor(id_viaje, 'green', '#0f0'); // Cambiar color a verde
                showAcceptedRequestMarker(latitude, longitude, id_viaje);
                setTimeout(() => clearPendingRequestAnimation(id_viaje), 1000); // Mantener la animación 1 segundo adicional
            });

            socket.on('reservationRequestRejected', ({ id_viaje, latitude, longitude }) => {
                console.log('solicitud de reserva rechazada');
                changeRequestAnimationColor(id_viaje, 'red', '#f00'); // Cambiar color a rojo
                showRejectedRequestMarker(latitude, longitude, id_viaje);
                setTimeout(() => clearPendingRequestAnimation(id_viaje), 1000); // Mantener la animación 1 segundo adicional
            });
        };

        const removeSocketListeners = () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.off('locationUpdated');
            socket.off('panic_event');
            socket.off('taxiRequestPending');
            socket.off('taxiRequestAccepted');
            socket.off('taxiRequestRejected');
            socket.off('deliveryRequestPending');
            socket.off('deliveryRequestAccepted');
            socket.off('deliveryRequestRejected');
            socket.off('reservationRequestPending');
            socket.off('reservationRequestAccepted');
            socket.off('reservationRequestRejected');
        };

        initializeSocketListeners();

        // Inicializar el mapa solo si aún no ha sido inicializado
        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([0.8287887653825872, -77.64242518449842], 15); // Centrar el mapa en la ubicación deseada

            // Añadir capa de OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);
        }

        fetchUserLocations(); // Fetch user locations every time component mounts

        return () => {
            removeSocketListeners();
        };
    }, []);

    const fetchUserLocations = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/users`);
            response.data.forEach(location => updateMarkers(location));
        } catch (error) {
            console.error("Error fetching user locations: ", error);
        }
    };

    const fetchDriverInfo = async (id_usuario) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/driver-data/${id_usuario}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching driver info: ", error);
            return {};
        }
    };

    const fetchTripInfo = async (id_viaje) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/trip-info/${id_viaje}`);
            console.log(response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching trip info: ", error);
            return {};
        }
    };

    const updateMarkers = async (location) => {
        const { id_usuario, latitude, longitude } = location;
        console.log('Actualizando marcador para:', id_usuario, latitude, longitude);

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            console.error('Latitud o longitud no son números:', latitude, longitude);
            return;
        }

        const driverInfo = await fetchDriverInfo(id_usuario);

        if (markers[id_usuario]) {
            markers[id_usuario].setLatLng([latitude, longitude]).bindPopup(`
                <strong>Taxi</strong> ${driverInfo.movil || 'N/A'}<br />
                <strong>Nombre:</strong> ${driverInfo.nombre || 'N/A'}<br />
                <strong>Placa:</strong> ${driverInfo.placa || 'N/A'}<br />
                <strong>Teléfono:</strong> ${driverInfo.telefono || 'N/A'}<br />
                <strong>Navegación:</strong> ${driverInfo.navegacion || 'N/A'}
            `);
        } else {
            const marker = L.marker([latitude, longitude], {
                icon: L.icon({
                    iconUrl: '/imagenes/car_topview.svg',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                })
            }).addTo(mapInstance.current);

            marker.bindPopup(`
                <strong>Taxi</strong> ${driverInfo.movil || 'N/A'}<br />
                <strong>Nombre:</strong> ${driverInfo.nombre || 'N/A'}<br />
                <strong>Placa:</strong> ${driverInfo.placa || 'N/A'}<br />
                <strong>Teléfono:</strong> ${driverInfo.telefono || 'N/A'}<br />
                <strong>Navegación:</strong> ${driverInfo.navegacion || 'N/A'}
            `);

            markers[id_usuario] = marker;
        }
    };

    const clearPendingRequestAnimation = (viajeId) => {
        if (pendingRequests[viajeId]) {
            if (pendingRequests[viajeId].interval) {
                clearInterval(pendingRequests[viajeId].interval);
            }
            mapInstance.current.removeLayer(pendingRequests[viajeId].circle);
            delete pendingRequests[viajeId];
            setRunningAnimations(prev => ({ ...prev, [viajeId]: false }));
        }
    };

    const changeRequestAnimationColor = (viajeId, color, fillColor) => {
        if (pendingRequests[viajeId]) {
            pendingRequests[viajeId].circle.setStyle({
                color: fillColor,
                fillColor: fillColor
            });
        }
    };

    const rejectRequest = async (viajeId) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/reject-taxi-request`, { id_viaje: viajeId });
            clearPendingRequestAnimation(viajeId);
        } catch (error) {
            console.error("Error rejecting trip: ", error);
        }
    };

    const showPendingRequestAnimation = (latitude, longitude, range, viajeId, tipo) => {
        clearPendingRequestAnimation(viajeId);

        const animationRange = tipo === 'reserva' ? 100 : range; // Ajustar el rango de la animación para reservas

        const circle = L.circle([latitude, longitude], {
            color: tipo === 'reserva' ? '#ffa500' : '#30f',
            fillColor: tipo === 'reserva' ? '#ffa500' : '#30f',
            fillOpacity: 0.5,
            radius: 0
        }).addTo(mapInstance.current);

        fetchTripInfo(viajeId).then(tripInfo => {
            circle.bindPopup(`
                <strong>Solicitud Pendiente</strong><br />
                <strong>Nombre del Cliente:</strong> ${tripInfo.nombre_cliente || 'N/A'}<br />
                <strong>Teléfono:</strong> ${tripInfo.telefono_cliente || 'N/A'}<br />
                <strong>Dirección de Inicio:</strong> ${tripInfo.direccion || 'N/A'}<br />
                <strong>Dirección de Fin:</strong> ${tripInfo.direccion_fin || 'N/A'}<br />
                <!-- <button onclick="window.rejectRequest('${viajeId}')" class="btn btn-outline-danger btn-sm mt-2"><XCircle /> Rechazar</button> -->
            `).openPopup();
        });

        const interval = setInterval(async () => {
            let currentRadius = 0;
            const animation = setInterval(() => {
                currentRadius += animationRange / 10; // Hacer la animación más grande para reservas
                if (currentRadius >= animationRange) {
                    currentRadius = 0;
                }
                circle.setRadius(currentRadius);
            }, 50);

            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/check-status/${viajeId}`);
                if (response.data.estado !== 'pendiente') {
                    clearInterval(animation);
                    clearPendingRequestAnimation(viajeId);
                }
            } catch (error) {
                console.error("Error checking request status: ", error);
            }
        }, tipo === 'reserva' ? 5 * 60 * 1000 : 1000);

        pendingRequests[viajeId] = { circle, interval };
        setRunningAnimations(prev => ({ ...prev, [viajeId]: true }));
    };

    const showAcceptedRequestMarker = async (latitude, longitude, viajeId) => {
        console.log(`viaje ${viajeId} aceptado`)
        const tripInfo = await fetchTripInfo(viajeId);

        const marker = L.circleMarker([latitude, longitude], {
            color: '#0f0',
            fillColor: '#0f0',
            fillOpacity: 0.5,
            radius: 20
        }).addTo(mapInstance.current);

        marker.bindPopup(`
            <strong>Viaje Aceptado</strong><br />
            <strong>Nombre del Cliente:</strong> ${tripInfo.nombre_cliente || 'N/A'}<br />
            <strong>Teléfono:</strong> ${tripInfo.telefono_cliente || 'N/A'}<br />
            <strong>Dirección de Inicio:</strong> ${tripInfo.direccion || 'N/A'}<br />
            <strong>Dirección de Fin:</strong> ${tripInfo.direccion_fin || 'N/A'}
        `).openPopup();

        setTimeout(() => {
            mapInstance.current.removeLayer(marker);
        }, 3000);
    };

    const showRejectedRequestMarker = async (latitude, longitude, viajeId) => {
        const tripInfo = await fetchTripInfo(viajeId);

        const marker = L.circleMarker([latitude, longitude], {
            color: '#f00',
            fillColor: '#f00',
            fillOpacity: 0.5,
            radius: 20
        }).addTo(mapInstance.current);

        marker.bindPopup(`
            <strong>Viaje Rechazado</strong><br />
            <strong>Nombre del Cliente:</strong> ${tripInfo.nombre_cliente || 'N/A'}<br />
            <strong>Teléfono:</strong> ${tripInfo.telefono_cliente || 'N/A'}<br />
            <strong>Dirección de Inicio:</strong> ${tripInfo.direccion || 'N/A'}<br />
            <strong>Dirección de Fin:</strong> ${tripInfo.direccion_fin || 'N/A'}
        `).openPopup();

        setTimeout(() => {
            mapInstance.current.removeLayer(marker);
        }, 3000);
    };

    const showPanicMarker = async (id_usuario) => {
        const driverInfo = await fetchDriverInfo(id_usuario);

        if (markers[id_usuario]) {
            const panicIcon = L.divIcon({
                html: `
                    <div style="position: relative;">
                        <img src="/imagenes/car_topview.svg" style="width: 40px; height: 40px;" />
                        <div style="position: absolute; top: 0; right: 0; background-color: red; border-radius: 50%; padding: 5px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM7.002 11a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm.93-4.481-.082.38-.287 1.373-.008.042c-.07.34-.107.466-.154.54a.522.522 0 0 1-.212.21c-.098.057-.19.074-.492.074-.304 0-.397-.02-.498-.077a.517.517 0 0 1-.209-.2c-.051-.08-.084-.193-.159-.546l-.295-1.377-.076-.366C6.437 6.151 6.352 6 6 6c-.294 0-.529.216-.6.51l-.283 1.333-.08.376-.287 1.373-.076.366C5.352 10 5.437 10.151 6 10c.294 0 .529-.216.6-.51l.283-1.333.08-.376.287-1.373.076-.366c.071-.294.355-.51.65-.51.292 0 .55.216.63.51l.283 1.333.08.376.287 1.373.076.366c.071.294.355.51.65.51.292 0 .55-.216.63-.51l.283-1.333.08-.376.287-1.373.076-.366C9.563 6.151 9.478 6 9 6c-.294 0-.529.216-.6.51l-.283 1.333-.08.376-.287 1.373-.076-.366z"/>
                            </svg>
                        </div>
                    </div>
                `,
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });

            markers[id_usuario].setIcon(panicIcon).bindPopup(`
                <strong>Taxi (¡ALERTA!)</strong><br />
                <strong>Nombre:</strong> ${driverInfo.nombre || 'N/A'}<br />
                <strong>Placa:</strong> ${driverInfo.placa || 'N/A'}<br />
                <strong>Teléfono:</strong> ${driverInfo.telefono || 'N/A'}<br />
                <strong>Navegación:</strong> ${driverInfo.navegacion || 'N/A'}
            `).openPopup();
        }
    };

    // Exponer la función de rechazo para su uso en el popup
    window.rejectRequest = rejectRequest;

    return <div ref={mapRef} style={{ height: '500px', width: '100%' }} />;
};

export default UsersMap;
