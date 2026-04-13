
import { Play } from 'lucide-react';
import type { Track } from '../types';
import { formatDuration } from '../utils/audio';

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, index: number) => void;
  isLoading: boolean;
}

export function TrackList({ tracks, currentTrack, isPlaying, onPlayTrack, isLoading }: TrackListProps) {
  if (isLoading) {
    return (
      <div className="main-content flex-center" style={{ flexDirection: 'column', gap: '20px' }}>
        <div className="text-gradient" style={{ fontSize: '24px', fontWeight: 600 }}>Loading Tracks...</div>
        <div style={{ color: 'var(--text-secondary)' }}>Parsing metadata (this might take a moment based on folder size)</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="main-content flex-center" style={{ flexDirection: 'column', gap: '20px' }}>
        <div className="text-gradient" style={{ fontSize: '32px', fontWeight: 700 }}>Welcome to Aura Player</div>
        <div style={{ color: 'var(--text-secondary)' }}>Select a folder from the sidebar to load your music library.</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <h1 className="text-gradient" style={{ marginBottom: '32px', fontSize: '36px', fontWeight: 800 }}>Local Library</h1>
      
      <div className="track-list">
        <div className="track-row track-header">
          <div>#</div>
          <div>Title</div>
          <div>Album</div>
          <div>Time</div>
        </div>

        {tracks.map((track, i) => {
          const isActive = currentTrack?.id === track.id;
          return (
            <div 
              key={track.id} 
              className={`track-row ${isActive ? 'active' : ''}`}
              onDoubleClick={() => onPlayTrack(track, i)}
              onClick={() => onPlayTrack(track, i)}
            >
              <div>
                {isActive && isPlaying ? (
                  <Play size={16} fill="currentColor" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              
              <div className="track-info-cell">
                {track.coverArt ? (
                  <img src={track.coverArt} className="track-cover-small" alt="" />
                ) : (
                  <div className="track-cover-small flex-center" style={{ fontSize: '18px' }}>🎵</div>
                )}
                <div>
                  <span className="track-title">{track.title}</span>
                  <span className="track-artist">{track.artist}</span>
                </div>
              </div>

              <div>{track.album}</div>
              <div>{formatDuration(track.duration)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
