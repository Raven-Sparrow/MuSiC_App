import { useRef, useState, type ChangeEvent } from 'react';
import { Music, FolderOpen, ListMusic, Cloud, Search } from 'lucide-react';
import { parseAudioFile } from '../utils/audio';
import type { Track } from '../types';

interface SidebarProps {
  onTracksLoaded: (tracks: Track[]) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export function Sidebar({ onTracksLoaded, isLoading, setIsLoading }: SidebarProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFolderSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || 
      file.name.endsWith('.mp3') || 
      file.name.endsWith('.wav') ||
      file.name.endsWith('.m4a') ||
      file.name.endsWith('.flac')
    );

    const tracks: Track[] = [];
    for (const file of audioFiles) {
      const track = await parseAudioFile(file);
      tracks.push(track);
    }
    
    onTracksLoaded(tracks);
    setIsLoading(false);
  };

  const handleFetchCloud = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/tracks');
      const data = await res.json();
      const mapped = data.map((t: any) => ({
        ...t, album: 'Cloud Library', url: `http://localhost:3001/api/stream/${t.id}`
      }));
      onTracksLoaded(mapped);
    } catch(e) {
      console.error(e);
      alert('Could not connect to Cloud Server');
    }
    setIsLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      const mapped = data.map((t: any) => ({
        ...t, album: 'Online Search', isOnlineSearch: true
      }));
      onTracksLoaded(mapped);
    } catch(e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  return (
    <div className="sidebar">
      <div className="logo text-gradient">
        <Music size={28} />
        Aura Player
      </div>

      <nav style={{ marginTop: '20px' }}>
        <button className="nav-button" onClick={handleFetchCloud}>
          <Cloud size={20} />
          Cloud Library
        </button>
        <button className="nav-button active" onClick={() => folderInputRef.current?.click()}>
          <ListMusic size={20} />
          Local Files
        </button>
      </nav>

      <form onSubmit={handleSearch} style={{ marginTop: '24px', position: 'relative' }}>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search online..." 
          style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
        />
        <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-secondary)' }} />
      </form>

      {/* Invisible file input that accepts directories */}
      <input 
        type="file" 
        ref={folderInputRef}
        onChange={handleFolderSelect}
        style={{ display: 'none' }}
        {...{ webkitdirectory: "true", directory: "true" } as any}
      />

      {/* Invisible file input for mobile fallback (multiple files) */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFolderSelect}
        multiple
        accept="audio/*,.mp3,.wav,.flac,.m4a"
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
        <button 
          className="folder-select-btn" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex-center">Loading...</span>
          ) : (
            <>
              <Music size={20} />
              Add Files
            </>
          )}
        </button>

        <button 
          className="folder-select-btn" 
          style={{ background: 'var(--bg-surface-hover)', boxShadow: 'none' }}
          onClick={() => folderInputRef.current?.click()}
          disabled={isLoading}
        >
          <FolderOpen size={20} />
          Add Folder (PC)
        </button>
      </div>
    </div>
  );
}
