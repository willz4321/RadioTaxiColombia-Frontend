import React, { useEffect, useState } from 'react'; 
import MapComponent from './MapComponent';
import socket from '../Socket';
import PanicButton from '../components/PanicButton';
import AudioRecorderButtonTipo2 from '../components/AudioRecorderButtonTipo2';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const HomePageContentTipo2 = () => {
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

    socket.on('new-audio', handleNewAudio);
    socket.on('new-audio-single', handleNewAudio);

    return () => {
      socket.off('new-audio', handleNewAudio);
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

  return (
    <div style={{ position: 'relative' }}>
      <MapComponent id_usuario={id_usuario} />
      <PanicButton />
      <AudioRecorderButtonTipo2 />

      {modalIsOpen && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          role="dialog" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            zIndex: 10001 
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

export default HomePageContentTipo2;
