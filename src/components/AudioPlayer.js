import React, { useState, useEffect, useRef } from 'react';
import '../App.css';

const AudioPlayer = ({ src, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    // Evento para actualizar el progreso del audio
    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    // Evento para cuando el audio finaliza
    const handleAudioEnd = () => {
      setIsPlaying(false);
      setProgress(0); // Reiniciar la barra de progreso
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleAudioEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleAudioEnd);
    };
  }, []);

  const startPlayback = () => {
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch((error) => console.error("Error al reproducir el archivo:", error));
  };

  const pausePlayback = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    isPlaying ? pausePlayback() : startPlayback();
  };

  // Formato de tiempo transcurrido para mostrar
  const formatElapsedTime = (time) => {
    // Asegúrate de que el formato de tiempo sea MM:SS
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="audio-player">
      <button onClick={togglePlayback} className="play-pause-btn">
        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
      </button>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      {/* Muestra el tiempo transcurrido o la duración total */}
      <div className="audio-duration">
        {isPlaying ? formatElapsedTime(audioRef.current.currentTime) : duration}
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default AudioPlayer;