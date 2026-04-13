import * as mm from 'music-metadata';
import type { Track } from '../types';

function arrayBufferToBase64(buffer: Uint8Array) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function parseAudioFile(file: File): Promise<Track> {
  const url = URL.createObjectURL(file);
  try {
    const metadata = await mm.parseBlob(file);
    let coverArt: string | undefined = undefined;
    
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      const base64String = arrayBufferToBase64(picture.data);
      coverArt = `data:${picture.format};base64,${base64String}`;
    }

    return {
      id: crypto.randomUUID(),
      file,
      url,
      title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      duration: metadata.format.duration,
      coverArt
    };
  } catch (error) {
    console.warn("Could not parse metadata for " + file.name, error);
    return {
      id: crypto.randomUUID(),
      file,
      url,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
    };
  }
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
