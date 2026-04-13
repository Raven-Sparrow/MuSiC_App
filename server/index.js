const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

app.get('/api/tracks', (req, res) => {
    res.json(db.getTracks());
});

app.get('/api/search', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.status(400).json({error: 'Query missing'});
    try {
        const results = await ytSearch(q);
        const videos = results.videos.slice(0, 15).map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author?.name || 'Unknown',
            duration: v.seconds,
            coverArt: v.thumbnail,
            url: v.url
        }));
        res.json(videos);
    } catch (e) {
        console.error(e);
        res.status(500).json({error: e.message});
    }
});

app.post('/api/download', async (req, res) => {
    const { videoInfo } = req.body;
    if (!videoInfo || !videoInfo.url) return res.status(400).json({error: 'Missing track metadata'});
    
    try {
        const fileId = uuidv4();
        const filePath = path.join(UPLOADS_DIR, `${fileId}.webm`);
        
        const writeStream = fs.createWriteStream(filePath);
        
        const ytProcess = spawn(path.join(__dirname, 'yt-dlp.exe'), ['-f', 'bestaudio', '-o', '-', videoInfo.url]);
        
        ytProcess.stdout.pipe(writeStream);
        
        ytProcess.stderr.on('data', (data) => console.log(`yt-dlp info: ${data}`));
        
        ytProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp exited with code ${code}`);
                if (!res.headersSent) res.status(500).json({error: 'Failed to download stream'});
            }
        });
        
        writeStream.on('finish', () => {
            const track = db.saveTrack({
                id: fileId,
                title: videoInfo.title,
                artist: videoInfo.artist,
                duration: videoInfo.duration,
                coverArt: videoInfo.coverArt,
                filename: `${fileId}.webm`
            });
            res.json(track);
        });
        
    } catch (e) {
        console.error("Download failed:", e);
        res.status(500).json({error: e.message});
    }
});

// Stream audio endpoint
app.get('/api/stream/:fileId', (req, res) => {
    const { fileId } = req.params;
    const filePath = path.join(UPLOADS_DIR, `${fileId}.webm`);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Audio file not found');
    }
    
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
        'Content-Type': 'audio/webm',
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes'
    });
    
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Cloud Server running on port ${PORT}`);
});
