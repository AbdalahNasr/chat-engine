import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';

const AudioPlayer = ({ audioUrl, onDelete, isRecording = false, recordingTime = 0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isVolumeSliderVisible, setVolumeSliderVisible] = useState(false);
  const audioRef = useRef(null);

  const speeds = [1, 1.25, 1.5, 2];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedClick = () => {
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getWaveStyle = (i) => {
    const isAnimating = isPlaying || isRecording;
    const baseHeight = isAnimating ? Math.random() * 25 + 8 : 6;
    const animationDuration = isAnimating ? 0.6 + Math.random() * 0.4 : 1.5;
    const style = {
      height: `${baseHeight}px`,
      animationDelay: `${i * 0.05}s`,
      animationDuration: `${animationDuration}s`
    };

    if (isRecording) {
      style.animationName = 'wavePulse';
    }
    
    return style;
  }

  // Voice wave animation
  const renderVoiceWaves = () => {
    const waves = [];
    const numWaves = isRecording ? 120 : 20;
    for (let i = 0; i < numWaves; i++) {
      waves.push(
        <div
          key={i}
          className="voice-wave"
          style={getWaveStyle(i)}
        />
      );
    }
    return waves;
  };

  if (isRecording) {
    return (
      <div className="custom-audio-player playing is-recording">
        <div className="audio-controls">
          <div className="time-display">
            <span>{formatTime(recordingTime)}</span>
          </div>
          <div className="audio-info">
            <div className="voice-waves-container">
              {renderVoiceWaves()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`custom-audio-player ${isPlaying ? 'playing' : ''}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="audio-controls">
        <button 
          className="play-button" 
          onClick={togglePlay}
          style={{ color: isPlaying ? '#03e9f4' : '#fff' }}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        
        <div className="audio-info">
          <div className="voice-waves-container">
            {renderVoiceWaves()}
          </div>
          
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="audio-settings">
          <button 
            className="speed-button"
            onClick={handleSpeedClick}
            title={`Playback Speed: ${playbackSpeed}x`}
          >
            {playbackSpeed}x
          </button>
          
          <div className="volume-control">
            <FaVolumeUp 
              style={{ color: '#03e9f4', cursor: 'pointer' }}
              onClick={() => setVolumeSliderVisible(prev => !prev)}
            />
            {isVolumeSliderVisible && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  audioRef.current.volume = newVolume;
                }}
                className="volume-slider"
              />
            )}
          </div>
        </div>
        
        {onDelete && (
          <button className="delete-button" onClick={onDelete}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

AudioPlayer.propTypes = {
  audioUrl: PropTypes.string,
  onDelete: PropTypes.func,
  isRecording: PropTypes.bool,
  recordingTime: PropTypes.number
};

export default AudioPlayer; 