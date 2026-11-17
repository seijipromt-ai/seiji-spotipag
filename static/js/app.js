const audio = document.getElementById('audioPlayer');
const playIcon = document.getElementById('playIcon');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const playerCover = document.getElementById('playerCover');

let currentTrack = null;
let isPlaying = false;

async function doSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if(!query) return;

  const grid = document.getElementById('resultsGrid');
  document.getElementById('mainTitle').innerText = `Search results for "${query}"`;
  grid.innerHTML = '<div style="color:var(--dim); grid-column: 1/-1;">Searching YouTube...</div>';

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    
    if(!data.ok) throw new Error(data.err);

    if(data.data.length === 0) {
      grid.innerHTML = '<div style="color:var(--dim); grid-column: 1/-1;">No results found.</div>';
      return;
    }

    grid.innerHTML = data.data.map((track) => `
      <div class="card" onclick='playTrack(${JSON.stringify(track).replace(/'/g, "&#39;")})'>
        <div class="play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
        <img src="${track.cover}" class="card-img" onerror="this.src='https://via.placeholder.com/300?text=No+Cover'">
        <div class="card-title">${track.title}</div>
        <div class="card-desc">${track.artist}</div>
      </div>
    `).join('');
  } catch(e) {
    grid.innerHTML = `<div style="color:#ef4444; grid-column: 1/-1;">Error: ${e.message}</div>`;
  }
}

function playTrack(track) {
  if (currentTrack && currentTrack.id === track.id) {
     togglePlay();
     return;
  }

  currentTrack = track;
  
  playerCover.src = track.cover;
  document.getElementById('playerTitle').innerText = track.title;
  document.getElementById('playerArtist').innerText = track.artist;
  
  // Fetch stream from backend proxy
  audio.src = `/api/stream/${track.id}`;
  audio.play();
  
  isPlaying = true;
  updatePlayBtn();
}

function togglePlay() {
  if(!currentTrack) return;
  if(isPlaying) {
    audio.pause();
  } else {
    audio.play();
  }
  isPlaying = !isPlaying;
  updatePlayBtn();
}

function updatePlayBtn() {
  if(isPlaying) {
    playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    playerCover.classList.add('playing');
  } else {
    playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    playerCover.classList.remove('playing');
  }
}

audio.addEventListener('timeupdate', () => {
  if(audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${percent}%`;
    currentTimeEl.innerText = formatTime(audio.currentTime);
    if(!isNaN(audio.duration)) totalTimeEl.innerText = formatTime(audio.duration);
  }
});

audio.addEventListener('ended', () => {
  isPlaying = false;
  updatePlayBtn();
  progressFill.style.width = '0%';
  currentTimeEl.innerText = '0:00';
});

function seek(e) {
  if(!audio.duration) return;
  const bar = e.currentTarget;
  const rect = bar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audio.currentTime = percent * audio.duration;
}

function formatTime(seconds) {
  if(isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
