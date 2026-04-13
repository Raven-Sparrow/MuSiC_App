const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data.json');

// Interface representation
// { id: string, title: string, artist: string, duration: string, coverArt: string, url: string }

function getTracks() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([]));
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

function saveTrack(track) {
    const tracks = getTracks();
    tracks.push(track);
    fs.writeFileSync(DB_PATH, JSON.stringify(tracks, null, 2));
    return track;
}

function deleteTrack(id) {
    let tracks = getTracks();
    tracks = tracks.filter(t => t.id !== id);
    fs.writeFileSync(DB_PATH, JSON.stringify(tracks, null, 2));
}

module.exports = { getTracks, saveTrack, deleteTrack };
