import React, { useState, useRef } from 'react';
import { MicFill } from 'react-bootstrap-icons';
import axios from 'axios';
import socket from '../Socket';

const AudioRecorderButtonSingle = ({ userId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
      formData.append('id_usuario', userId);

      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/upload-audio-single`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        const backendAudioUrl = response.data.audioUrl;
        socket.emit('new-audio', { audioUrl: backendAudioUrl, id_usuario: userId });
      } catch (error) {
        console.error('Error uploading audio:', error);
      }
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <MicFill
      onClick={handleButtonClick}
      style={{ cursor: 'pointer', marginRight: '10px', color: isRecording ? 'blue' : 'black' }}
    />
  );
};

export default AudioRecorderButtonSingle;
