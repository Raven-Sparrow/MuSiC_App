import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TrackList } from './components/TrackList';
import { Player } from './components/Player';
import type { Track } from './types';
import './App.css';

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTracksLoaded = (newTracks: Track[]) => {
    setTracks(newTracks);
  };

  const handlePlayTrack = async (track: Track, _index: number) => {
    if (track.isOnlineSearch) {
      // Download to cloud first!
      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:3001/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoInfo: track })
        });
        const savedTrack = await res.json();
        
        // Refresh cloud library and play
        const libRes = await fetch('http://localhost:3001/api/tracks');
        const libData = await libRes.json();
        const mapped = libData.map((t: any) => ({
          ...t, album: 'Cloud Library', url: `http://localhost:3001/api/stream/${t.id}`
        }));
        
        setTracks(mapped);
        const newlySaved = mapped.find((t: any) => t.id === savedTrack.id);
        setCurrentTrack(newlySaved || null);
        setIsPlaying(true);
      } catch(e) {
        console.error("Failed to download:", e);
      }
      setIsLoading(false);
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const playNext = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < tracks.length - 1) {
      setCurrentTrack(tracks[currentIndex + 1]);
      setIsPlaying(true);
    } else {
      // Loop or stop
      setIsPlaying(false);
    }
  };

  const playPrev = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(tracks[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        onTracksLoaded={handleTracksLoaded} 
        isLoading={isLoading} 
        setIsLoading={setIsLoading} 
      />
      
      <TrackList 
        tracks={tracks}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayTrack={handlePlayTrack}
        isLoading={isLoading}
      />
      
      <Player 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onNext={playNext}
        onPrev={playPrev}
      />
    </div>
  );
}

export default App;
