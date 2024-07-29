import React, { useState, useRef, useEffect } from 'react';
import { MicFill, Filter } from 'react-bootstrap-icons';
import axios from 'axios';
import socket from '../Socket';

const AudioRecorderButton = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimeoutRef = useRef(null); // Ref para el timeout

  useEffect(() => {
    // Fetch user list from backend
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/drivers`);
        setDrivers(response.data);
        setSelectedDrivers(response.data.map(driver => driver.id_usuario)); // Inicializar todos los conductores seleccionados
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleDriverChange = (userId) => {
    setSelectedDrivers((prevSelectedDrivers) =>
      prevSelectedDrivers.includes(userId)
        ? prevSelectedDrivers.filter((id) => id !== userId)
        : [...prevSelectedDrivers, userId]
    );
  };  

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      audioChunksRef.current = [];

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('filteredDrivers', JSON.stringify(selectedDrivers));

      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/upload-audio`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        const backendAudioUrl = response.data.audioUrl;
        socket.emit('new-audio', { audioUrl: backendAudioUrl, users: selectedDrivers });
        // Alerta eliminada
      } catch (error) {
        console.error('Error uploading audio:', error);
      }
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);

    // Detener la grabación automáticamente después de 15 segundos
    recordingTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, 15000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
  };

  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleFilterClick = () => {
    setShowUserList((prevShowUserList) => !prevShowUserList);
  };

  return (
    <div>
      <button
        onClick={handleButtonClick}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'white',
          color: 'black',
          border: '2px solid white',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
        }}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        <MicFill size={30} fill={isRecording ? 'blue' : 'black'} />
      </button>

      <button
        onClick={handleFilterClick}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          backgroundColor: 'white',
          color: 'black',
          border: '2px solid white',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
        }}
        title="Filter Users"
      >
        <Filter size={30} fill={showUserList ? 'blue' : 'black'} />
      </button>

      {showUserList && (
        <div
          style={{
            position: 'fixed',
            bottom: '160px',
            right: '20px',
            backgroundColor: 'white',
            border: '2px solid white',
            borderRadius: '10px',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            padding: '10px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          <h6>Conductores:</h6>
          {drivers.map((driver) => (
            <div key={driver.id_usuario}>
              <label>
                <input
                  type="checkbox"
                  value={driver.id_usuario}
                  checked={selectedDrivers.includes(driver.id_usuario)}
                  onChange={() => handleDriverChange(driver.id_usuario)}
                  className='mr-1'
                />
                (#{driver.movil}) {driver.nombre}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AudioRecorderButton;
