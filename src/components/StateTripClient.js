import React, { useContext, useEffect, useState } from 'react'
import Navbar from './Navbar'
import TripInfo from './TripInfo'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { AppContext } from '../context'

export const StateTripClient = () => {
    const {setViaje} = useContext(AppContext)

   const [solicitud, setSolicitud] = useState()
   const [pendingRequests, setPendingRequests] = useState([]);
   const [acceptedRequests, setAcceptedRequests] = useState([]);
   const [taxiLocation, setTaxiLocation] = useState({ lat: 0, lng: 0 });
   const [successAudio] = useState(new Audio(`${process.env.REACT_APP_API_URL}/media/notifications/beep-6-96243.mp3`));
   const [errorAudio] = useState(new Audio(`${process.env.REACT_APP_API_URL}/media/notifications/error-126627.mp3`));
   const [showAssignedNotification, setShowAssignedNotification] = useState(false);
   const [showNotification, setShowNotification] = useState(false);
   const { cliente: telefono_cliente, id_viaje } = useParams();

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs > 0 ? `${hrs}h ` : ''}${mins > 0 ? `${mins}m ` : ''}${secs}s`;
      };

      const playSuccessSound = () => {
        successAudio.play().catch((error) => console.error('Error al reproducir el sonido de éxito:', error));
      };  
      const playErrorSound = () => {
        errorAudio.play().catch((error) => console.error('Error al reproducir el sonido de error:', error));
      };

      const fetchAcceptedRequests = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/accepted-trip`, { params: {telefono_cliente, id_viaje} });
          setSolicitud(response.data);
          setViaje(response.data)
        } catch (error) {
          console.error('Error al obtener los viajes aceptados:', error);
        }
      };
      useEffect(() => {

          fetchAcceptedRequests()
      }, [])

      const handleAccept = async (request, index) => {
        const acceptData = {
          id_viaje: request.viajeId,
          id_taxista: solicitud.id_taxista,
          tipo: request.tipo
        };
    
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/accept-taxi-request`, acceptData);
          console.log('Respuesta de la aceptación del taxi:', response.data);
          setShowNotification(true);
          playSuccessSound();
          setTimeout(() => {
            setShowNotification(false);
          }, 2000);
          setPendingRequests((prevRequests) => prevRequests.filter((_, i) => i !== index));
          fetchAcceptedRequests();
        } catch (error) {
          if (error.response && error.response.status === 409) {
            console.error('El viaje ya ha sido asignado a otro taxista.');
            setShowAssignedNotification(true);
            playErrorSound();
            setTimeout(() => {
              setShowAssignedNotification(false);
            }, 2000);
            setPendingRequests((prevRequests) => prevRequests.filter((_, i) => i !== index));
          } else {
            console.error('Error al aceptar el taxi:', error);
          }
        }
      };
      const handleArrive = async (id_viaje) => {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/update-status`, {
            id_viaje,
            estado: 'esperando'
          });
          console.log('Estado del viaje actualizado:', response.data);
          // Actualizar el estado en la lista de acceptedRequests
          setAcceptedRequests((prevRequests) =>
            prevRequests.map((request) =>
              request.id_viaje === id_viaje ? { ...request, estado: 'esperando' } : request
            )
          );
        } catch (error) {
          console.error('Error al actualizar el estado del viaje:', error);
        }
      };
    
      const handleBoarding = async (id_viaje) => {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/update-status`, {
            id_viaje,
            estado: 'en viaje'
          });
          console.log('Estado del viaje actualizado:', response.data);
          // Actualizar el estado en la lista de acceptedRequests
          setAcceptedRequests((prevRequests) =>
            prevRequests.map((request) =>
              request.id_viaje === id_viaje ? { ...request, estado: 'en viaje' } : request
            )
          );
        } catch (error) {
          console.error('Error al actualizar el estado del viaje:', error);
        }
      };
    
      const handleCancel = async (id_viaje) => {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/update-status`, {
            id_viaje,
            estado: 'cancelado'
          });
          setAcceptedRequests((prevRequests) => prevRequests.filter(request => request.id_viaje !== id_viaje));
          console.log('Estado del viaje actualizado:', response.data);
        } catch (error) {
          console.error('Error al actualizar el estado del viaje:', error);
        }
      };
    
      const handleFinish = async (id_viaje) => {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/update-status`, {
            id_viaje,
            estado: 'finalizado'
          });
          setAcceptedRequests((prevRequests) => prevRequests.filter(request => request.id_viaje !== id_viaje));
          console.log('Estado del viaje actualizado:', response.data);
        } catch (error) {
          console.error('Error al actualizar el estado del viaje:', error);
        }
      };
  
  return (
    <div>
    <Navbar />
    <div className="container contenido">
      
    {solicitud && (<TripInfo 
          trip={solicitud} 
          handleArrive={handleArrive} 
          handleBoarding={handleBoarding} 
          handleCancel={handleCancel} 
          handleFinish={handleFinish} 
          formatTime={formatTime}
          handleAcceptRequest={handleAccept}
          taxiLocation={taxiLocation} 
          id_usuario={solicitud?.id_taxista} 
        />)
     }
    </div>
  </div>
  )
}
