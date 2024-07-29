import React, { useEffect, useState } from 'react';
import UsersMap from './UsersMap';
import socket from '../Socket';
import TaxiRequestForm from './TaxiRequestForm';
import ReservationRequestForm from './ReservationRequestForm';
import DeliveryRequestForm from './DeliveryRequestForm';
import { CarFront, CalendarCheck, BoxSeam } from 'react-bootstrap-icons';
import AudioRecorderButton from './AudioRecorderButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const HomePageContentTipo1 = () => {
  const [activeForm, setActiveForm] = useState('taxi'); // Estado para gestionar el formulario activo
  const [modalIsOpen, setModalIsOpen] = useState(!window.audioPlaybackAllowed);
  const id_usuario = localStorage.getItem('id_usuario');

  useEffect(() => {
    console.log('Socket conectado en HomePage:', socket.connected);

    socket.emit('join', { id_usuario });

    const handleNewAudio = ({ audioUrl }) => {
      const fullAudioUrl = `${process.env.REACT_APP_API_URL}${audioUrl}`;
      console.log(fullAudioUrl);
      if (window.audioPlaybackAllowed) {
        const audio = new Audio(fullAudioUrl);
        audio.play();
      }
    };
    
    socket.on('new-audio-tipo2', handleNewAudio);
    socket.on('new-audio-single', handleNewAudio);

    return () => {
      socket.off('new-audio-tipo2', handleNewAudio);
      socket.off('new-audio-single', handleNewAudio);
    };
  }, []);

  const enableAudioPlayback = () => {
    window.audioPlaybackAllowed = true;
    setModalIsOpen(false);
    document.body.removeEventListener('click', enableAudioPlayback);
  };

  useEffect(() => {
    if (!window.audioPlaybackAllowed) {
      document.body.addEventListener('click', enableAudioPlayback);
    }

    return () => {
      document.body.removeEventListener('click', enableAudioPlayback);
    };
  }, []);

  const renderForm = () => {
    switch (activeForm) {
      case 'taxi':
        return <TaxiRequestForm />;
      case 'reservation':
        return <ReservationRequestForm />;
      case 'delivery':
        return <DeliveryRequestForm />;
      default:
        return <TaxiRequestForm />;
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-5">
          <div className="d-flex justify-content-around mb-3">
            <CarFront 
              onClick={() => setActiveForm('taxi')} 
              size={30} 
              style={{ cursor: 'pointer' }} 
              title="Solicitud de Taxi"
            />
            <CalendarCheck 
              onClick={() => setActiveForm('reservation')} 
              size={30} 
              style={{ cursor: 'pointer' }} 
              title="Reserva"
            />
            <BoxSeam 
              onClick={() => setActiveForm('delivery')} 
              size={30} 
              style={{ cursor: 'pointer' }} 
              title="Domicilio"
            />
          </div>
          {renderForm()}
        </div>
        <div className="col-md-7">
          <UsersMap />
          <br></br>
          <br></br>
        </div>
      </div>
      <AudioRecorderButton />

      {modalIsOpen && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          role="dialog" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            zIndex: 10001 // Asegúrate de que el modal esté por encima de otros componentes
          }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header justify-content-center">
                <h5 className="modal-title text-center">Habilitar Reproducción de Audio</h5>
              </div>
              <div className="modal-body text-center">
                <p>Por favor, haz clic en cualquier lugar para habilitar la reproducción de audio en esta aplicación.</p>
              </div>
              <div className="modal-footer d-flex justify-content-center">
                <button onClick={enableAudioPlayback} type="button" className="btn btn-warning">
                  Habilitar Audio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePageContentTipo1;
