$(document).ready(function() {
    // --- State Management ---
    const State = {
        currentTrack: null,
        queue: [],
        isPlaying: false,
        activeView: 'home', // 'home' or 'search'
        audio: document.getElementById('main-audio-engine'),
        API_BASE: 'http://localhost:3001/api'
    };

    // --- UI Selectors ---
    const UI = {
        homeView: $('#view-home'),
        searchView: $('#view-search'),
        searchTab: $('#nav-search-btn'),
        homeTab: $('#nav-home-btn'),
        searchContainer: $('#search-bar-container'),
        searchInput: $('#search-input'),
        homeList: $('#cloud-library-container'),
        searchList: $('#search-results-container'),
        loading: $('#loading-overlay'),
        
        // Player UI
        playerArt: $('#p-art'),
        playerTitle: $('#p-title'),
        playerArtist: $('#p-artist'),
        playerTextContainer: $('#p-text'),
        btnPlay: $('#btn-play'),
        btnPrev: $('#btn-prev'),
        btnNext: $('#btn-next'),
        seekProgress: $('#seek-progress'),
        seekContainer: $('#seek-container'),
        timeCur: $('#time-cur'),
        timeTotal: $('#time-total')
    };

    // --- Core Functions ---

    /**
     * Toggles between Home and Search modes
     */
    function switchView(view) {
        State.activeView = view;
        
        // Update Sidebar UI
        $('.navigation-btn').removeClass('active');
        
        if (view === 'home') {
            UI.homeTab.addClass('active');
            UI.homeView.show();
            UI.searchView.hide();
            UI.searchContainer.fadeOut();
            loadHomeData();
        } else if (view === 'search') {
            UI.searchTab.addClass('active');
            UI.homeView.hide();
            UI.searchView.show();
            UI.searchContainer.fadeIn();
            UI.searchInput.focus();
        }
    }

    /**
     * Loads the "Cloud Library" tracks from the backend
     */
    function loadHomeData() {
        UI.loading.show();
        UI.homeList.empty();
        
        $.get(`${State.API_BASE}/tracks`)
            .done(data => {
                State.queue = data;
                renderTracks(data, UI.homeList, false);
            })
            .fail(err => console.error("Home Load Error:", err))
            .always(() => UI.loading.hide());
    }

    /**
     * Performs a music search
     */
    function executeSearch(query) {
        if (!query) return;
        UI.loading.show();
        UI.searchList.empty();

        $.get(`${State.API_BASE}/search?q=${encodeURIComponent(query)}`)
            .done(data => {
                renderTracks(data, UI.searchList, true);
            })
            .fail(err => alert("Search failed. Check if server is running."))
            .always(() => UI.loading.hide());
    }

    /**
     * Renders a list of tracks as Spotify Cards
     */
    function renderTracks(tracks, container, isOnline) {
        container.empty();
        if (tracks.length === 0) {
            container.append('<div class="col-12 text-secondary px-3">No tracks found.</div>');
            return;
        }

        tracks.forEach((track, index) => {
            const artUrl = track.coverArt || 'https://via.placeholder.com/200';
            const $card = $(`
                <div class="col-6 col-md-4 col-lg-2">
                    <div class="track-card">
                        <img src="${artUrl}" alt="${track.title}">
                        <div class="play-btn-overlay">
                            <span style="color: black; font-size: 20px;">▶</span>
                        </div>
                        <h6>${track.title}</h6>
                        <p>${track.artist}</p>
                    </div>
                </div>
            `);

            $card.on('click', function() {
                if (isOnline) {
                    downloadAndPlay(track);
                } else {
                    State.queue = tracks; // Update queue to current context
                    playTrack(track, index);
                }
            });

            container.append($card);
        });
    }

    /**
     * Downloads an online track then plays it
     */
    function downloadAndPlay(track) {
        UI.loading.show();
        $.ajax({
            url: `${State.API_BASE}/download`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ videoInfo: track }),
            success: function(savedTrack) {
                // Flash message
                console.log("Downloaded:", savedTrack.title);
                playTrack(savedTrack, -1);
            },
            error: function() {
                alert("Playback Engine Error: Could not stream this track.");
            },
            always: () => UI.loading.hide()
        });
    }

    /**
     * Initiates audio playback
     */
    function playTrack(track, index) {
        State.currentTrack = track;
        State.currentTrackIndex = index;
        
        // Update Player UI
        UI.playerArt.attr('src', track.coverArt || '').css('visibility', 'visible');
        UI.playerTitle.text(track.title);
        UI.playerArtist.text(track.artist);
        UI.playerTextContainer.css('visibility', 'visible');
        
        // Set Source
        State.audio.src = `${State.API_BASE}/stream/${track.id}`;
        State.audio.play().then(() => {
            State.isPlaying = true;
            UI.btnPlay.html('⏸');
        }).catch(e => console.error("Playback Blocked:", e));
    }

    // --- Audio Event Listeners ---
    
    State.audio.addEventListener('timeupdate', () => {
        if (!State.audio.duration) return;
        const perc = (State.audio.currentTime / State.audio.duration) * 100;
        UI.seekProgress.css('width', `${perc}%`);
        
        const formatTime = (s) => {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${m}:${sec.toString().padStart(2, '0')}`;
        };
        UI.timeCur.text(formatTime(State.audio.currentTime));
        UI.timeTotal.text(formatTime(State.audio.duration));
    });

    State.audio.addEventListener('ended', () => {
        if (State.currentTrackIndex >= 0 && State.currentTrackIndex < State.queue.length - 1) {
            playTrack(State.queue[State.currentTrackIndex + 1], State.currentTrackIndex + 1);
        } else {
            State.isPlaying = false;
            UI.btnPlay.html('▶');
        }
    });

    // --- Button Event Bindings ---

    UI.btnPlay.click(() => {
        if (!State.currentTrack) return;
        if (State.isPlaying) {
            State.audio.pause();
            State.isPlaying = false;
            UI.btnPlay.html('▶');
        } else {
            State.audio.play();
            State.isPlaying = true;
            UI.btnPlay.html('⏸');
        }
    });

    UI.btnNext.click(() => {
        if (State.currentTrackIndex !== -1 && State.currentTrackIndex < State.queue.length - 1) {
            playTrack(State.queue[State.currentTrackIndex + 1], State.currentTrackIndex + 1);
        }
    });

    UI.btnPrev.click(() => {
        if (State.audio.currentTime > 3) {
            State.audio.currentTime = 0;
        } else if (State.currentTrackIndex > 0) {
            playTrack(State.queue[State.currentTrackIndex - 1], State.currentTrackIndex - 1);
        }
    });

    UI.seekContainer.click(function(e) {
        if (!State.audio.duration) return;
        const offset = e.pageX - $(this).offset().left;
        const perc = offset / $(this).width();
        State.audio.currentTime = perc * State.audio.duration;
    });

    // --- Tab Bindings ---
    UI.homeTab.click(e => { e.preventDefault(); switchView('home'); });
    UI.searchTab.click(e => { e.preventDefault(); switchView('search'); });

    UI.searchInput.on('keypress', function(e) {
        if (e.which === 13) {
            executeSearch($(this).val());
        }
    });

    // --- Initialization ---
    switchView('home');
});
