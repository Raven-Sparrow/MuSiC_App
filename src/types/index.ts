export interface Track {
  id: string;
  file?: File;
  title: string;
  artist: string;
  album: string;
  duration?: number;
  coverArt?: string; // base64 or URL
  url: string; // Object URL or backend stream URL
  isOnlineSearch?: boolean; // True if from yt-search
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  queue: Track[];
  queueIndex: number;
}
