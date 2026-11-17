const audio = document.getElementById('audioPlayer');
const playIcon = document.getElementById('playIcon');
const playerCover = document.getElementById('playerCover');

let currentTrack = null;
let isPlaying = false;

async function doSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if(!query) return;

  const grid = document.getElementById('resultsGrid');
  document.getElementById('mainTitle').innerText = `Results for "${query}"`;
  grid.innerHTML = '<div style="color:var(--dim);">Searching...</div>';

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    
    if(!data.ok) throw new Error(data.err);

    grid.innerHTML = data.data.map((track) => `
      <div class="card">
        <img src="${track.cover}" class="card-img" onerror="this.src='https://via.placeholder.com/300?text=No+Cover'">
        <div class="card-title">${track.title}</div>
        <div class="card-desc">${track.artist}</div>
        <div class="card-actions">
          <button class="btn-play-card" onclick='playTrack(${JSON.stringify(track).replace(/'/g, "&#39;")})'>Play</button>
          <a href="/api/download/${track.id}?dl=1" class="btn-dl-card">Download</a>
        </div>
      </div>
    `).join('');
  } catch(e) {
    grid.innerHTML = `<div style="color:#ef4444;">Error: ${e.message}</div>`;
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
  
  // Use the download route without dl=1 to stream it via the server
  audio.src = `/api/download/${track.id}`;
  
  // Show loading state
  document.getElementById('playerTitle').innerText = "Loading...";
  
  audio.play().then(() => {
    document.getElementById('playerTitle').innerText = track.title;
    isPlaying = true;
    updatePlayBtn();
  }).catch(err => {
    alert("Playback failed: " + err.message);
    document.getElementById('playerTitle').innerText = track.title;
  });
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
  } else {
    playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }
}

audio.addEventListener('ended', () => {
  isPlaying = false;
  updatePlayBtn();
});
