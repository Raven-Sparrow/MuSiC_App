import { useRef, useEffect, useState, type ChangeEvent } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { Track } from '../types';
import { formatDuration } from '../utils/audio';

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Player({ currentTrack, isPlaying, setIsPlaying, onNext, onPrev }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => console.error("Playback error:", e));
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      if (total) {
        setDuration(total);
        setProgress((current / total) * 100);
      }
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setProgress(value);
    if (audioRef.current) {
      audioRef.current.currentTime = (value / 100) * (audioRef.current.duration || 0);
    }
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
      audioRef.current.muted = value === 0;
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (isMuted && volume === 0) {
        setVolume(1);
        audioRef.current.volume = 1;
      }
    }
  };

  if (!currentTrack) {
    return (
      <div className="player-bar flex-center" style={{ color: 'var(--text-tertiary)' }}>
        Select a track to start playing
      </div>
    );
  }

  return (
    <div className="player-bar">
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
      />
      
      {/* Current Track Info */}
      <div className="track-info-cell" style={{ width: '30%', minWidth: '200px' }}>
        {currentTrack.coverArt ? (
          <img src={currentTrack.coverArt} className="track-cover-small" style={{ width: 56, height: 56, borderRadius: 8 }} alt="" />
        ) : (
          <div className="track-cover-small flex-center" style={{ width: 56, height: 56, fontSize: 24, borderRadius: 8 }}>🎵</div>
        )}
        <div>
          <strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
            {currentTrack.title}
          </strong>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {currentTrack.artist}
          </span>
        </div>
      </div>

      {/* Controls & Progress */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '8px' }}>
          <button onClick={onPrev} style={{ color: 'var(--text-secondary)' }}>
            <SkipBack size={20} />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ 
              background: 'var(--text-primary)', 
              color: 'var(--bg-color)', 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>
          
          <button onClick={onNext} style={{ color: 'var(--text-secondary)' }}>
            <SkipForward size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px', fontSize: 12, color: 'var(--text-secondary)' }}>
          <span>{formatDuration(currentTime)}</span>
          <div style={{ flex: 1, position: 'relative', height: 4, background: 'var(--bg-surface-hover)', borderRadius: 2 }}>
            <div 
              style={{ 
                position: 'absolute', 
                top: 0, left: 0, height: '100%', 
                background: 'var(--accent-color)', 
                width: `${progress}%`,
                borderRadius: 2
              }} 
            />
            <input 
              type="range" 
              min="0" max="100" 
              step="0.1"
              value={progress} 
              onChange={handleSeek}
              style={{ position: 'absolute', top: -8, left: 0, width: '100%', height: 20, opacity: 0, cursor: 'pointer' }}
            />
          </div>
          <span>{formatDuration(duration || currentTrack.duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div style={{ width: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
        <button onClick={toggleMute} style={{ color: 'var(--text-secondary)' }}>
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <div style={{ width: '100px', position: 'relative', height: 4, background: 'var(--bg-surface-hover)', borderRadius: 2 }}>
          <div 
            style={{ 
              position: 'absolute', 
              top: 0, left: 0, height: '100%', 
              background: 'var(--text-secondary)', 
              width: `${isMuted ? 0 : volume * 100}%`,
              borderRadius: 2
            }} 
          />
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={isMuted ? 0 : volume} 
            onChange={handleVolumeChange}
            style={{ position: 'absolute', top: -8, left: 0, width: '100%', height: 20, opacity: 0, cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}
