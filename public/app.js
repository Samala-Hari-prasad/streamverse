const TMDB_KEY = 'a86a4b74b161d18c36145fc882b7284b';
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/';

// State management
let currentDetailItem = null;
let activeTeaserId = null;
let logTimeout = null;
let currentTvSeasons = [];
let activeProviderKey = null;

const PROVIDERS = {
  '2embed': { 
    name: '2EMBED', 
    desc: 'High-performance cinematic streaming mirror node.', 
    getUrl: (id, isTv, season = 1, episode = 1) => isTv ? `https://www.2embed.cc/embedtv/${id}?s=${season}&e=${episode}` : `https://www.2embed.cc/embed/${id}` 
  },
  'streamimdb': {
    name: 'STREAMIMDB',
    desc: 'Cinematic gateway matching IMDb metadata registries.',
    getUrl: (id, isTv, season = 1, episode = 1, imdbId = null) => {
      const targetId = imdbId || id;
      return isTv 
        ? `https://streamimdb.ru/embed/tv/${targetId}/${season}/${episode}` 
        : `https://streamimdb.ru/embed/movie/${targetId}`;
    }
  },
  'vidApi': {
    name: 'VIDAPI',
    desc: 'Premium high-speed cinematic gateway provider.',
    getUrl: (id, isTv, season = 1, episode = 1, imdbId = null) => {
      const targetId = imdbId || id;
      return isTv 
        ? `https://vidapi.co/embed/tv/${targetId}/${season}/${episode}` 
        : `https://vidapi.co/embed/movie/${targetId}`;
    }
  },
  'vidKing': {
    name: 'VIDKING',
    desc: 'Cinematic streaming node with advanced routing.',
    getUrl: (id, isTv, season = 1, episode = 1, imdbId = null) => {
      const targetId = imdbId || id;
      return isTv 
        ? `https://vidking.link/embed/tv/${targetId}/${season}/${episode}` 
        : `https://vidking.link/embed/movie/${targetId}`;
    }
  },
  'multiembed': {
    name: 'MULTIEMBED',
    desc: 'High-speed multi-source embed gateway.',
    getUrl: (id, isTv, season = 1, episode = 1) => isTv ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}` : `https://multiembed.mov/?video_id=${id}&tmdb=1`
  },
  'videasy': {
    name: 'VIDEOEASY',
    desc: 'Premium ad-free cinematic mirror player.',
    getUrl: (id, isTv, season = 1, episode = 1) => isTv ? `https://player.videasy.net/tv/${id}/${season}/${episode}` : `https://player.videasy.net/movie/${id}`
  },
  'vidcore': {
    name: 'VIDCORE',
    desc: 'High-availability streaming platform using TMDB indexes.',
    getUrl: (id, isTv, season = 1, episode = 1) => isTv ? `https://www.vidcore.org/embed/tv/${id}/${season}/${episode}` : `https://www.vidcore.org/embed/movie/${id}`
  },
  'twoembed': {
    name: '2EMBED (NEW)',
    desc: 'Secondary mirror gateway using IMDb registries.',
    getUrl: (id, isTv, season = 1, episode = 1, imdbId = null) => {
      const targetId = imdbId || id;
      return isTv ? `https://www.2embed.cc/embedtv/${targetId}?s=${season}&e=${episode}` : `https://www.2embed.cc/embed/${targetId}`
    }
  }
};

// Database local storage utilities
const KEY_WATCHLIST = 'streamverse_watchlist';
const KEY_CONTINUE = 'streamverse_continue';

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});

function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(KEY_WATCHLIST)) || [];
  } catch (e) { return []; }
}

function saveWatchlist(list) {
  localStorage.setItem(KEY_WATCHLIST, JSON.stringify(list));
  renderWatchlistGrid();
}

function toggleWatchlist() {
  if (!currentDetailItem) return;
  const list = getWatchlist();
  const index = list.findIndex(item => item.id.toString() === currentDetailItem.id.toString());
  const btn = document.getElementById('btnWatchlist');
  
  if (index >= 0) {
    list.splice(index, 1);
    btn.textContent = 'Add to Watchlist';
    btn.classList.remove('active');
  } else {
    list.unshift(currentDetailItem);
    btn.textContent = 'Remove from Watchlist';
    btn.classList.add('active');
  }
  saveWatchlist(list);
}

function checkWatchlistStatus(id) {
  const list = getWatchlist();
  const exists = list.some(item => item.id.toString() === id.toString());
  const btn = document.getElementById('btnWatchlist');
  if (btn) {
    if (exists) {
      btn.textContent = 'Remove from Watchlist';
      btn.classList.add('active');
    } else {
      btn.textContent = 'Add to Watchlist';
      btn.classList.remove('active');
    }
  }
}

function getContinueWatching() {
  try {
    return JSON.parse(localStorage.getItem(KEY_CONTINUE)) || [];
  } catch (e) { return []; }
}

function saveContinueWatching(id, isTv, item, providerKey, season = 1, episode = 1, progress = 45) {
  let list = getContinueWatching();
  // Filter out duplicates
  list = list.filter(i => i.id.toString() !== item.id.toString());

  const sessionItem = {
    ...item,
    _type: isTv ? 'tv' : 'movie',
    _isTv: isTv,
    _providerKey: providerKey,
    _season: season,
    _episode: episode,
    _progress: progress,
    _timestamp: Date.now()
  };
  list.unshift(sessionItem);

  // Limit to 20 items
  if (list.length > 20) list = list.slice(0, 20);
  localStorage.setItem(KEY_CONTINUE, JSON.stringify(list));

  // Also store per-episode progress in EpisodeEngine
  if (isTv && typeof EpisodeEngine !== 'undefined') {
    EpisodeEngine.setProgress(String(item.id), season, episode, progress, providerKey);
  }

  renderContinueGrid();
  // Refresh the inline continue-watching rail on the homepage
  if (typeof HomeEngine !== 'undefined') HomeEngine.refreshContinue();
}

function renderWatchlistGrid() {
  const container = document.getElementById('watchlistGrid');
  const section = document.getElementById('watchlistSection');
  const items = getWatchlist();
  
  if (items.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  renderGrid(container, items);
}

function renderContinueGrid() {
  const container = document.getElementById('continueGrid');
  const section = document.getElementById('continueWatchingSection');
  const items = getContinueWatching();
  
  if (items.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  container.innerHTML = items.map(item => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').slice(0,4);
    const type = item._type || (item.first_air_date ? 'tv' : 'movie');
    const provName = PROVIDERS[item._providerKey] ? PROVIDERS[item._providerKey].name : 'Primary Server';
    const progressWidth = item._progress || 30;

    let epLabel = '';
    if (type === 'tv' && item._season) {
      epLabel = `<div class="resume-ep-info">S${item._season} E${item._episode || 1}</div>`;
    }

    const posterHtml = item.poster_path 
      ? `<img class="card-poster" src="${IMG}w342${item.poster_path}" alt="${title}" loading="lazy"/>`
      : `<div class="card-poster-placeholder"><div class="placeholder-icon">🎬</div><div class="placeholder-title">${title}</div></div>`;
         
    return `
      <div class="movie-card resume-card" onclick="navigate('detail', ${JSON.stringify(item).replace(/"/g,'&quot;')})">
        ${posterHtml}
        <div class="card-overlay" style="opacity:1;background:linear-gradient(to top,rgba(10,10,10,0.95) 0%,rgba(10,10,10,0.6) 40%,transparent 80%);">
          <div class="card-overlay-content">
            <span class="card-badge resume-badge">Resume • ${provName}</span>
            <div class="card-title">${title}</div>
            <div class="card-meta">
              <span>${type.toUpperCase()}</span>
              <span>${year}</span>
            </div>
            ${epLabel}
            <div class="resume-progress-bar"><div class="resume-progress-fill" style="width:${progressWidth}%"></div></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Visual Connection Logs
function addTerminalLog(container, text, type = 'success', delay = 0) {
  return new Promise((resolve) => {
    logTimeout = setTimeout(() => {
      const line = document.createElement('div');
      line.className = 'terminal-log-line';
      if (type === 'accent') line.classList.add('accent');
      if (type === 'warn') line.classList.add('warn');
      
      const promptSymbol = document.createElement('span');
      promptSymbol.textContent = '•';
      promptSymbol.style.marginRight = '0.5rem';
      promptSymbol.style.opacity = '0.5';
      
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      
      line.appendChild(promptSymbol);
      line.appendChild(textSpan);
      container.appendChild(line);
      container.scrollTop = container.scrollHeight;
      resolve();
    }, delay);
  });
}

async function loadEmbed(btn, pKey, id, isTv) {
  if (logTimeout) clearTimeout(logTimeout);
  
  activeProviderKey = pKey;
  
  let season = 1;
  let episode = 1;
  if (isTv) {
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    if (seasonSelect && episodeSelect) {
      season = parseInt(seasonSelect.value, 10) || 1;
      episode = parseInt(episodeSelect.value, 10) || 1;
    }
  }

  document.querySelectorAll('.stream-node').forEach(n => {
    n.classList.remove('active');
    n.querySelector('.node-action').textContent = 'Connect Node';
  });

  const provider = PROVIDERS[pKey];
  let url = provider.getUrl(id, isTv, season, episode, currentDetailItem ? currentDetailItem.imdb_id : null);
  
  const playerCont = document.getElementById('playerContainer');
  const player = document.getElementById('videoPlayer');
  const decOverlay = document.getElementById('decryptionOverlay');
  const termLogs = document.getElementById('terminalLogs');
  const loaderStatus = document.getElementById('loaderStatus');
  
  playerCont.classList.add('active');
  decOverlay.classList.remove('hidden');
  termLogs.innerHTML = '';
  player.src = ''; 
  
  playerCont.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (btn) {
    btn.classList.add('active');
    btn.querySelector('.node-action').textContent = 'Uplink Established';
  }

  loaderStatus.textContent = "Reaching network gateway mirror...";
  await addTerminalLog(termLogs, `Initiating mirror aggregation path...`, 'accent', 0);
  loaderStatus.textContent = "Verifying node integrity...";
  await addTerminalLog(termLogs, `Connecting: Contacting high-availability node [${provider.name}]...`, 'success', 150);
  await addTerminalLog(termLogs, `Ping: Mirror response received. Status: Stable`, 'success', 150);
  loaderStatus.textContent = "Bypassing secure handshakes...";
  await addTerminalLog(termLogs, `Securing SSL connection handshake...`, 'success', 200);
  await addTerminalLog(termLogs, `Decrypting video resource location corridor...`, 'warn', 200);
  loaderStatus.textContent = "Decrypting media stream tracks...";
  await addTerminalLog(termLogs, `Resolving media streams and track indexes...`, 'success', 200);
  await addTerminalLog(termLogs, `Connection corridor established. Transferring stream...`, 'accent', 200);
  
  logTimeout = setTimeout(() => {
    decOverlay.classList.add('hidden');
    player.src = url;

    if (currentDetailItem) {
      saveContinueWatching(id, isTv, currentDetailItem, pKey, season, episode, Math.floor(Math.random() * 55) + 30);
    }

    // Highlight active episode card in episode panel
    if (isTv && typeof EpisodeEngine !== 'undefined') {
      document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('ep-playing'));
      const card = document.getElementById(`ep-card-${season}-${episode}`);
      if (card) {
        card.classList.add('ep-playing');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, 300);
}

function getProviders(type) {
  return Object.keys(PROVIDERS);
}

function normalizeMovieItem(item) {
  if (!item) return item;
  item.vote_average = item.vote_average || item.rating || 0;
  if (typeof item.vote_average === 'string') {
    item.vote_average = parseFloat(item.vote_average);
  }
  item.title = item.title || item.name;
  item.name = item.name || item.title;
  item.release_date = item.release_date || item.first_air_date;
  item.first_air_date = item.first_air_date || item.release_date;
  return item;
}

async function apiFetch(path, params = {}) {
  const tmdbGet = async (endpoint, extra = {}) => {
    const p = { api_key: TMDB_KEY, ...extra };
    const qs = Object.entries(p).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const res = await fetch(`${BASE}${endpoint}?${qs}`);
    return res.json();
  };

  if (path.startsWith('/trending/all/')) {
    try {
      const [moviesRes, tvsRes] = await Promise.all([
        fetch('https://api.2embed.cc/trending?time_window=week').then(r => r.json()),
        fetch('https://api.2embed.cc/trendingtv?time_window=week').then(r => r.json())
      ]);
      const movies = (moviesRes.results || []).map(m => ({ ...m, media_type: 'movie' }));
      const tvs   = (tvsRes.results   || []).map(t => ({ ...t, media_type: 'tv'    }));
      if (movies.length || tvs.length) {
        const combined = [];
        const len = Math.max(movies.length, tvs.length);
        for (let i = 0; i < len; i++) {
          if (movies[i]) combined.push(movies[i]);
          if (tvs[i])   combined.push(tvs[i]);
        }
        return { results: combined.map(normalizeMovieItem) };
      }
    } catch(_) {}
    try {
      const data = await tmdbGet('/trending/all/week');
      return { results: (data.results || []).map(normalizeMovieItem) };
    } catch(e) {
      console.error('Trending fetch failed entirely:', e);
      return { results: [] };
    }
  }

  if (path.startsWith('/discover/movie') || path.startsWith('/trending/movie/')) {
    try {
      const urlStr = `https://api.2embed.cc/trending?time_window=week${params.page ? '&page='+params.page : ''}`;
      const data = await fetch(urlStr).then(r => r.json());
      if (data.results && data.results.length) {
        return { results: data.results.map(m => ({ ...normalizeMovieItem(m), media_type: 'movie' })) };
      }
    } catch(_) {}
    try {
      const extra = { sort_by: 'popularity.desc' };
      if (params.with_genres) extra.with_genres = params.with_genres;
      if (params.page) extra.page = params.page;
      const data = await tmdbGet('/discover/movie', extra);
      return { results: (data.results || []).map(m => ({ ...normalizeMovieItem(m), media_type: 'movie' })) };
    } catch(e) {
      return { results: [] };
    }
  }

  if (path.startsWith('/discover/tv') || path.startsWith('/trending/tv/')) {
    try {
      const urlStr = `https://api.2embed.cc/trendingtv?time_window=week${params.page ? '&page='+params.page : ''}`;
      const data = await fetch(urlStr).then(r => r.json());
      if (data.results && data.results.length) {
        return { results: data.results.map(t => ({ ...normalizeMovieItem(t), media_type: 'tv' })) };
      }
    } catch(_) {}
    try {
      const extra = { sort_by: 'popularity.desc' };
      if (params.with_genres) extra.with_genres = params.with_genres;
      if (params.with_original_language) extra.with_original_language = params.with_original_language;
      if (params.page) extra.page = params.page;
      const data = await tmdbGet('/discover/tv', extra);
      return { results: (data.results || []).map(t => ({ ...normalizeMovieItem(t), media_type: 'tv' })) };
    } catch(e) {
      return { results: [] };
    }
  }

  if (path.startsWith('/search/multi')) {
    const q = params.query || '';
    try {
      const [moviesRes, tvsRes] = await Promise.all([
        fetch(`https://api.2embed.cc/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
        fetch(`https://api.2embed.cc/searchtv?q=${encodeURIComponent(q)}`).then(r => r.json())
      ]);
      const movies = (moviesRes.results || []).map(m => ({ ...m, media_type: 'movie' }));
      const tvs   = (tvsRes.results   || []).map(t => ({ ...t, media_type: 'tv'    }));
      const combined = [...movies, ...tvs].map(normalizeMovieItem);
      if (combined.length > 0) return { results: combined };
    } catch(_) {}
    try {
      const data = await tmdbGet('/search/multi', { query: q, include_adult: false });
      const results = (data.results || [])
        .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
        .map(normalizeMovieItem);
      return { results };
    } catch(e) {
      console.error('Search completely failed:', e);
      return { results: [] };
    }
  }

  if (path.match(/^\/movie\/([^\/]+)$/)) {
    const id = path.split('/')[2];
    try {
      const data = await fetch(`https://api.2embed.cc/movie?tmdb_id=${id}`).then(r => r.json());
      if (data && data.id) return normalizeMovieItem(data);
    } catch(_) {}
    try {
      const data = await tmdbGet(`/movie/${id}`);
      return normalizeMovieItem(data);
    } catch(e) { return {}; }
  }

  if (path.match(/^\/tv\/([^\/]+)$/)) {
    const id = path.split('/')[2];
    try {
      const data = await fetch(`https://api.2embed.cc/tv?tmdb_id=${id}`).then(r => r.json());
      if (data && data.id) return normalizeMovieItem(data);
    } catch(_) {}
    try {
      const data = await tmdbGet(`/tv/${id}`);
      return normalizeMovieItem(data);
    } catch(e) { return {}; }
  }

  if (path.match(/^\/tv\/([^\/]+)\/external_ids$/)) {
    const id = path.split('/')[2];
    try {
      const detail = await fetch(`https://api.2embed.cc/tv?tmdb_id=${id}`).then(r => r.json());
      if (detail.imdb_id) return { imdb_id: detail.imdb_id };
    } catch(_) {}
    try {
      const data = await tmdbGet(`/tv/${id}/external_ids`);
      return { imdb_id: data.imdb_id || null };
    } catch(e) { return { imdb_id: null }; }
  }

  if (path.match(/^\/(tv|movie)\/([^\/]+)\/videos$/)) {
    const parts = path.split('/');
    const type = parts[1];
    const id   = parts[2];
    try {
      const data = await tmdbGet(`/${type}/${id}/videos`);
      return data;
    } catch(e) { return { results: [] }; }
  }

  return {};
}


function navigate(pageId, item=null) {
  if (pageId === 'detail' && item) {
      window.location.hash = `detail:${item.id}`;
  } else {
      window.location.hash = pageId;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const dropMenu = document.getElementById('browseDropdownMenu');
  if (dropMenu) dropMenu.classList.remove('show');

  let targetPageId = pageId;
  const isCategoryRoute = [
    'movies', 'anime', 'tv', 'kdrama', 
    'genre-action', 'genre-scifi', 'genre-comedy', 'genre-romance'
  ].includes(pageId);
  
  if (isCategoryRoute) targetPageId = 'category';
  
  const targetPage = document.getElementById('page-' + targetPageId);
  if (targetPage) targetPage.classList.add('active');
  
  if(pageId !== 'detail') {
    document.getElementById('videoPlayer').src = '';
    document.getElementById('playerContainer').classList.remove('active');
    document.getElementById('decryptionOverlay').classList.add('hidden');
    if (logTimeout) clearTimeout(logTimeout);
  }

  if (pageId === 'detail' && item) {
    // Track user behavior for personalization
    if (typeof HomeEngine !== 'undefined') HomeEngine.trackView(item);
    loadDetail(item);
  } else if (pageId === 'home') {
    if (typeof HomeEngine !== 'undefined') {
      HomeEngine.init('homeRailsContainer');
    } else {
      initHome();
    }
  } else if (pageId === 'discover') {
    initDiscoverPage();
  } else if (pageId === 'movies') {
    loadCategory('movie', 'Cinematic Movies');
  } else if (pageId === 'anime') {
    loadCategory('tv', 'Anime Showcase', { with_genres: '16', with_original_language: 'ja' });
  } else if (pageId === 'tv') {
    loadCategory('tv', 'TV Series Directory');
  } else if (pageId === 'kdrama') {
    loadCategory('tv', 'K-Drama Database', { with_original_language: 'ko' });
  } else if (pageId === 'genre-action') {
    loadCategory('movie', 'Action & Adventure', { with_genres: '28' });
  } else if (pageId === 'genre-scifi') {
    loadCategory('movie', 'Sci-Fi & Fantasy', { with_genres: '878' });
  } else if (pageId === 'genre-comedy') {
    loadCategory('movie', 'Comedy Showcase', { with_genres: '35' });
  } else if (pageId === 'genre-romance') {
    loadCategory('movie', 'Romance & Drama', { with_genres: '10749' });
  }

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navEl = document.getElementById('nav-' + pageId);
  if (navEl) navEl.classList.add('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupHeroSpotlight(item) {
  const backdropUrl = item.backdrop_path ? IMG + 'w1280' + item.backdrop_path : '';
  const title = item.title || item.name;
  const overview = item.overview || 'Explore details and streams for this popular title.';
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  
  const heroBackdrop = document.getElementById('heroBackdrop');
  if (heroBackdrop) {
    heroBackdrop.style.backgroundImage = `url(${backdropUrl})`;
  }
  
  const heroBadge = document.getElementById('heroBadge');
  if (heroBadge) {
    heroBadge.textContent = type === 'tv' ? `Trending Series • ${year}` : `Trending Movie • ${year}`;
  }
  
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    heroTitle.textContent = title;
  }
  
  const heroOverview = document.getElementById('heroOverview');
  if (heroOverview) {
    heroOverview.textContent = overview.length > 200 ? overview.slice(0, 200) + '...' : overview;
  }
  
  const playBtn = document.getElementById('heroPlayBtn');
  if (playBtn) {
    playBtn.onclick = () => navigate('detail', { ...item, _type: type });
  }
  
  const infoBtn = document.getElementById('heroInfoBtn');
  if (infoBtn) {
    infoBtn.onclick = () => navigate('detail', { ...item, _type: type });
  }
}

async function initHome() {
  if (typeof HomeEngine !== 'undefined') {
    HomeEngine.init('homeRailsContainer');
    return;
  }
  // Fallback (HomeEngine not loaded)
  const grid = document.getElementById('homeRailsContainer') || document.getElementById('homeGrid');
  if (!grid) return;
  try {
    const data = await apiFetch('/trending/all/week');
    if (data && data.results && data.results.length > 0) {
      setupHeroSpotlight(data.results[0]);
      renderGrid(grid, data.results.slice(1, 13));
    }
  } catch (e) { /* silent */ }
  renderContinueGrid();
  renderWatchlistGrid();
}


async function initDiscoverPage() {
  const grid = document.getElementById('discoverTrendingGrid');
  grid.innerHTML = `
    <div class="loading-container" style="grid-column: 1/-1;">
      <div class="spinner"></div>
    </div>
  `;
  try {
    const data = await apiFetch('/trending/all/week');
    if (data && data.results) {
      renderGrid(grid, data.results.slice(0, 12));
    }
  } catch (e) {
    grid.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1;">Failed to load discover page stream.</p>';
  }
}

async function loadCategory(type, title, extraParams = {}) {
  document.getElementById('page-home').classList.remove('active');
  document.getElementById('page-category').classList.add('active');
  document.getElementById('catTitle').textContent = title;
  const grid = document.getElementById('catGrid');
  
  grid.innerHTML = `
    <div class="loading-container" style="grid-column: 1/-1;">
      <div class="spinner"></div>
      <p>Querying movie database...</p>
    </div>
  `;
  
  const params = { sort_by: 'popularity.desc' };
  if (typeof extraParams === 'string') {
    params.with_genres = extraParams;
  } else if (typeof extraParams === 'object') {
    Object.assign(params, extraParams);
  }
  
  try {
    const data = await apiFetch(`/discover/${type}`, params);
    if (data && data.results && data.results.length > 0) {
      let results = data.results;
      
      if (params.with_original_language) {
        results = results.filter(item => item.original_language === params.with_original_language);
      }
      if (params.with_genres) {
        const genreId = parseInt(params.with_genres, 10);
        results = results.filter(item => 
          (item.genre_ids && item.genre_ids.includes(genreId)) || 
          (item.genres && item.genres.some(g => g.id === genreId))
        );
      }
      
      if (results.length === 0) results = data.results;
      
      renderGrid(grid, results);
    } else {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>No titles found in this category.</p></div>`;
    }
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>Failed to query category titles. Check connection.</p></div>`;
  }
}

function renderGrid(container, items) {
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No items found.</p></div>`;
    return;
  }
  
  container.innerHTML = items.map(item => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').slice(0,4);
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    
    const posterHtml = item.poster_path 
      ? `<img class="card-poster" src="${IMG}w342${item.poster_path}" alt="${title}" loading="lazy"/>`
      : `<div class="card-poster-placeholder">
           <div class="placeholder-icon">🎬</div>
           <div class="placeholder-title">${title}</div>
         </div>`;
         
    return `
      <div class="movie-card" onclick="navigate('detail', ${JSON.stringify({...item, _type:type}).replace(/"/g,'&quot;')})">
        ${posterHtml}
        <div class="card-overlay">
          <div class="card-overlay-content">
            <span class="card-badge">${type.toUpperCase()}</span>
            <div class="card-title">${title}</div>
            <div class="card-meta">
              <span>${year}</span>
              <span>⭐ ${rating}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleNavSearch() {
  const bar = document.getElementById('navSearchBar');
  bar.classList.toggle('expanded');
  const input = document.getElementById('navSearchInput');
  if (bar.classList.contains('expanded')) {
    input.focus();
  }
}

function triggerNavSearch() {
  const q = document.getElementById('navSearchInput').value;
  if (!q) return;
  performSearch(q);
}

function triggerHomeMood() {
  const q = document.getElementById('homeMoodInput').value;
  if (!q) return;
  doMoodRecommend(q);
}

function triggerDiscoverMood() {
  const q = document.getElementById('discoverMoodInput').value;
  if (!q) return;
  doMoodRecommend(q);
}

async function performSearch(query) {
  document.getElementById('page-home').classList.remove('active');
  document.getElementById('page-category').classList.add('active');
  document.getElementById('catTitle').textContent = `Search Results: "${query}"`;
  
  const grid = document.getElementById('catGrid');
  grid.innerHTML = `
    <div class="loading-container" style="grid-column: 1/-1;">
      <div class="spinner"></div>
      <p>Searching movie database...</p>
    </div>
  `;
  
  try {
    const data = await apiFetch('/search/multi', { query: query });
    if (data && data.results && data.results.length > 0) {
      renderGrid(grid, data.results.filter(r => r.media_type !== 'person'));
    } else {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>No results found for "${query}".</p></div>`;
    }
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>Search failed. Server connection offline.</p></div>`;
  }
}

async function doMoodRecommend(moodQuery) {
  document.getElementById('page-home').classList.remove('active');
  document.getElementById('page-category').classList.add('active');
  document.getElementById('catTitle').textContent = `AI Discovery: "${moodQuery}"`;
  
  const grid = document.getElementById('catGrid');
  grid.innerHTML = `
    <div class="loading-container" style="grid-column: 1/-1;">
      <div class="spinner"></div>
      <p>Consulting AI discovery matrix...</p>
    </div>
  `;
  
  try {
    const res = await fetch('/api/mood-recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood: moodQuery, tmdbKey: TMDB_KEY })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        renderGrid(grid, data.results);
      } else {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <p>No titles matched that description. Try writing in other words!</p>
          </div>
        `;
      }
    } else {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>AI engine is overloaded. Please try again shortly.</p></div>`;
    }
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>Connection failed: Unable to connect to AI discovery networks.</p></div>`;
  }
}

async function playTeaser() {
  if (!activeTeaserId) return;
  const isTv = document.getElementById('btnTrailer').getAttribute('data-is-tv') === 'true';
  const type = isTv ? 'tv' : 'movie';
  
  const modal = document.getElementById('teaserModal');
  const player = document.getElementById('teaserPlayer');
  const title = document.getElementById('teaserTitle');
  
  title.textContent = `Loading Teaser Signal...`;
  modal.classList.add('active');
  
  try {
    const data = await apiFetch(`/${type}/${activeTeaserId}/videos`);
    const trailers = (data.results || []).filter(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    
    if (trailers.length > 0) {
      const key = trailers[0].key;
      player.src = `https://www.youtube.com/embed/${key}?autoplay=1`;
      title.textContent = `Teaser Playback: ${document.getElementById('detailTitle').textContent}`;
    } else {
      title.textContent = `Teaser offline: No teaser media found.`;
      player.src = '';
    }
  } catch (err) {
    title.textContent = `Connection failure: Teaser link unavailable.`;
    player.src = '';
  }
}

function closeTeaser(e) {
  const modal = document.getElementById('teaserModal');
  const player = document.getElementById('teaserPlayer');
  player.src = '';
  modal.classList.remove('active');
}

async function loadDetail(item) {
  currentDetailItem = item;
  activeTeaserId = item.id;

  let imdbId = null;
  let detail = null;
  const isTVItem = item._type === 'tv' || item.first_air_date;
  
  try {
    detail = await apiFetch(`/${isTVItem ? 'tv' : 'movie'}/${item.id}`);
    if (isTVItem) {
      const extIds = await apiFetch(`/tv/${item.id}/external_ids`);
      imdbId = extIds ? extIds.imdb_id : null;
    } else {
      imdbId = detail.imdb_id;
    }
  } catch(e) {}

  if (currentDetailItem) {
    currentDetailItem.imdb_id = imdbId;
  }

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').slice(0,4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '0.0';
  
  const detailBg = document.getElementById('detailBg');
  if (detailBg) {
    detailBg.style.backgroundImage = `url(${IMG}w1280${item.backdrop_path})`;
  }
  
  const detailPoster = document.getElementById('detailPoster');
  if (detailPoster) {
    detailPoster.src = item.poster_path ? IMG + 'w500' + item.poster_path : '';
  }
  
  document.getElementById('detailTitle').textContent = title;
  
  const detailMeta = document.getElementById('detailMeta');
  if (detailMeta) {
    let ratingsHtml = `
      <span>${year}</span>
      <span class="rating-badge tmdb-badge">TMDB: ⭐ ${rating}</span>
    `;
    
    if (imdbId) {
      ratingsHtml += `
        <span class="rating-badge imdb-badge" id="imdbRatingBadge">
          IMDb: ⭐ <span id="imdbRatingVal">...</span>
        </span>
      `;
      detailMeta.innerHTML = ratingsHtml;
      
      fetch(`/api/imdb-rating/${imdbId}`)
        .then(res => res.json())
        .then(data => {
          const valEl = document.getElementById('imdbRatingVal');
          if (valEl) valEl.textContent = data.rating || 'N/A';
        })
        .catch(() => {
          const valEl = document.getElementById('imdbRatingVal');
          if (valEl) valEl.textContent = 'N/A';
        });
    } else {
      detailMeta.innerHTML = ratingsHtml;
    }
  }
  
  document.getElementById('detailOverview').textContent = item.overview || 'Overview not available.';

  const tvTracker = document.getElementById('tvTracker');
  if (tvTracker) {
    if (isTVItem) {
      tvTracker.style.display = 'block';

      // Build a usable show object for EpisodeEngine (fallback if detail is null)
      const showObj = detail || {
        id: item.id,
        name: item.name || item.title,
        seasons: [{ season_number: 1, episode_count: 24, name: 'Season 1' }]
      };
      // Ensure seasons array exists
      if (!showObj.seasons || showObj.seasons.length === 0) {
        showObj.seasons = [{ season_number: 1, episode_count: 24, name: 'Season 1' }];
      }

      // Pre-populate hidden selects for backward compat
      currentTvSeasons = showObj.seasons;
      const seasonSelect  = document.getElementById('seasonSelect');
      const episodeSelect = document.getElementById('episodeSelect');
      if (seasonSelect) {
        const validSeasons = showObj.seasons.filter(s => s.season_number > 0);
        seasonSelect.innerHTML = (validSeasons.length ? validSeasons : showObj.seasons)
          .map(s => `<option value="${s.season_number}">${s.name || 'Season ' + s.season_number}</option>`)
          .join('');
        if (item._season) seasonSelect.value = item._season;
      }
      if (episodeSelect) {
        let opts = '';
        for (let i = 1; i <= 100; i++) opts += `<option value="${i}">Episode ${i}</option>`;
        episodeSelect.innerHTML = opts;
        if (item._episode) episodeSelect.value = item._episode;
      }

      if (typeof EpisodeEngine !== 'undefined') {
        EpisodeEngine.renderEpisodePanel(showObj, (season, episode) => {
          playNowClick();
        });
      }
    } else {
      tvTracker.style.display = 'none';
    }
  }


  const trailerBtn = document.getElementById('btnTrailer');
  if (trailerBtn) {
    trailerBtn.setAttribute('data-is-tv', isTVItem ? 'true' : 'false');
  }
  
  checkWatchlistStatus(item.id);

  let providerType = 'movies';
  if (detail) {
    const isTV = detail.media_type === 'tv' || detail.first_air_date;
    if (isTV) {
      const isAnime = (detail.genres || []).some(g => g.id === 16 || g.name === 'Animation') && (detail.origin_country || []).includes('JP');
      const isDrama = (detail.origin_country || []).some(c => ['KR', 'CN', 'TH', 'TW'].includes(c)) && !isAnime;
      providerType = isAnime ? 'anime' : (isDrama ? 'drama' : 'series');
    }
  } else {
    providerType = item._type === 'tv' ? 'series' : 'movies';
  }

  const isTV = detail ? (detail.media_type === 'tv' || detail.first_air_date) : (item._type === 'tv');
  const pKeys = getProviders(providerType);
  
  const detailProviders = document.getElementById('detailProviders');
  if (detailProviders) {
    detailProviders.innerHTML = pKeys.map(k => {
      const p = PROVIDERS[k];
      return `
        <div class="stream-node" id="node-${k}" data-status="online" onclick="loadEmbed(this, '${k}', '${item.id}', ${!!isTV})">
          <div class="node-title">${p.name}</div>
          <div class="node-status" id="status-${k}">ONLINE // Available Gateway</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.4;">${p.desc}</div>
          <div class="node-action">Connect Node</div>
        </div>
      `;
    }).join('');

    const hideOffline = localStorage.getItem('hideOffline') === 'true';
    const toggleBtn = document.getElementById('btnToggleOffline');
    if (toggleBtn) {
      toggleBtn.textContent = hideOffline ? 'Show Offline Nodes' : 'Hide Offline Nodes';
    }

    fetch('/api/gateways-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: pKeys })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.results) {
          data.results.forEach(res => {
            const nodeEl = document.getElementById(`node-${res.key}`);
            const statusEl = document.getElementById(`status-${res.key}`);
            if (nodeEl && statusEl) {
              nodeEl.setAttribute('data-status', res.status);
              if (res.status === 'online') {
                statusEl.textContent = `ONLINE // Ping: ${res.ping || 0}ms`;
                statusEl.style.color = 'var(--success)';
              } else {
                statusEl.textContent = `OFFLINE // Gateway Latency Timeout`;
                statusEl.style.color = 'var(--accent)';
                if (hideOffline) {
                  nodeEl.style.display = 'none';
                }
              }
            }
          });
        }
      })
      .catch(err => console.error('Error fetching gateways health:', err));
  }
}

function openWatchlistSidebar() {
  document.getElementById('watchlistSidebarModal').classList.add('active');
  renderWatchlistSidebar();
}

function renderWatchlistSidebar() {
  const container = document.getElementById('watchlistSidebarItems');
  const items = getWatchlist();
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="sidebar-empty">
        <p>Your watchlist is empty.</p>
        <button class="btn-browse-watchlist" onclick="document.getElementById('watchlistSidebarModal').classList.remove('active'); navigate('discover');">Find Content</button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = items.map(item => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').slice(0,4);
    const poster = item.poster_path ? IMG + 'w92' + item.poster_path : '';
    const type = item._type || (item.first_air_date ? 'tv' : 'movie');
    
    return `
      <div class="watchlist-item" onclick="document.getElementById('watchlistSidebarModal').classList.remove('active'); navigate('detail', ${JSON.stringify(item).replace(/"/g,'&quot;')})">
        ${poster ? `<img src="${poster}" alt="${title}"/>` : `<div style="width: 50px; height: 75px; background: #222; display: flex; align-items: center; justify-content: center; font-size: 0.5rem;">🎬</div>`}
        <div class="watchlist-item-info">
          <div class="watchlist-item-title">${title}</div>
          <div class="watchlist-item-meta">${type.toUpperCase()} • ${year}</div>
        </div>
        <button class="watchlist-item-remove" onclick="event.stopPropagation(); removeFromWatchlistSidebar('${item.id}')">✕</button>
      </div>
    `;
  }).join('');
}

function removeFromWatchlistSidebar(id) {
  let list = getWatchlist();
  list = list.filter(item => item.id.toString() !== id.toString());
  saveWatchlist(list);
  renderWatchlistSidebar();
  if (currentDetailItem && currentDetailItem.id.toString() === id.toString()) {
    checkWatchlistStatus(currentDetailItem.id);
  }
}

function toggleDropdown(event) {
  event.stopPropagation();
  const menu = document.getElementById('browseDropdownMenu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

window.addEventListener('click', (e) => {
  const menu = document.getElementById('browseDropdownMenu');
  if (menu && menu.classList.contains('show')) {
    if (!e.target.closest('.nav-dropdown')) {
      menu.classList.remove('show');
    }
  }
});

function onSeasonChange() {}

function onEpisodeChange() {
  const playerCont = document.getElementById('playerContainer');
  if (playerCont && playerCont.classList.contains('active') && currentDetailItem) {
    if (activeProviderKey) {
      const nodeEl = document.getElementById(`node-${activeProviderKey}`);
      loadEmbed(nodeEl, activeProviderKey, currentDetailItem.id, true);
    } else {
      playNowClick();
    }
  }
}

async function playNowClick() {
  if (!currentDetailItem) return;
  
  const isTv = currentDetailItem._type === 'tv' || !!currentDetailItem.first_air_date;
  let season = 1;
  let episode = 1;
  
  if (isTv) {
    const seasonSelect  = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    if (seasonSelect)  season  = parseInt(seasonSelect.value,  10) || 1;
    if (episodeSelect) episode = parseInt(episodeSelect.value, 10) || 1;
  }
  
  const playerCont = document.getElementById('playerContainer');
  const player = document.getElementById('videoPlayer');
  const decOverlay = document.getElementById('decryptionOverlay');
  const termLogs = document.getElementById('terminalLogs');
  const loaderStatus = document.getElementById('loaderStatus');
  const errOverlay = document.getElementById('playbackErrorOverlay');
  
  playerCont.classList.add('active');
  decOverlay.classList.remove('hidden');
  errOverlay.style.display = 'none';
  termLogs.innerHTML = '';
  player.src = '';
  
  playerCont.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  try {
    loaderStatus.textContent = "Scanning active provider gateways...";
    await addTerminalLog(termLogs, "Contacting global playback proxy...", "accent", 0);
    
    document.querySelectorAll('.stream-node').forEach(n => {
      n.classList.remove('active');
      n.querySelector('.node-action').textContent = 'Connect Node';
    });
    activeProviderKey = null;
    
    loaderStatus.textContent = "Negotiating gateway latency parameters...";
    await addTerminalLog(termLogs, `Testing MULTIEMBED gateway node...`, "success", 150);
    
    const bestProv = isTv 
      ? await PlayerManager.getBestTvPlayer(currentDetailItem, season, episode)
      : await PlayerManager.getBestMoviePlayer(currentDetailItem);
    
    if (bestProv) {
      loaderStatus.textContent = "Decrypting media stream corridor...";
      await addTerminalLog(termLogs, `Selected optimal node: [${bestProv.provider}]`, "success", 150);
      await addTerminalLog(termLogs, `Bypassing geo-restrictions and CORS checks...`, "warn", 150);
      await addTerminalLog(termLogs, `Establishing streaming link...`, "success", 150);
      
      logTimeout = setTimeout(() => {
        decOverlay.classList.add('hidden');
        player.src = bestProv.embedUrl;
        
        const nodeEl = document.getElementById(`node-${bestProv.providerKey}`);
        if (nodeEl) {
          nodeEl.classList.add('active');
          nodeEl.querySelector('.node-action').textContent = 'Uplink Established';
          activeProviderKey = bestProv.providerKey;
        }
        
        if (currentDetailItem) {
          const prog = Math.floor(Math.random() * 40) + 10;
          saveContinueWatching(currentDetailItem.id, isTv, currentDetailItem, bestProv.providerKey, season, episode, prog);
          if (isTv && typeof EpisodeEngine !== 'undefined') {
            document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('ep-playing'));
            const card = document.getElementById(`ep-card-${season}-${episode}`);
            if (card) {
              card.classList.add('ep-playing');
              card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }
      }, 300);
    } else {
      loaderStatus.textContent = "No responsive providers detected.";
      await addTerminalLog(termLogs, `CRITICAL: MULTIEMBED connection handshake timed out.`, "warn", 100);
      await addTerminalLog(termLogs, `CRITICAL: VIDEOEASY gateway returned non-responsive status.`, "warn", 100);
      await addTerminalLog(termLogs, `CRITICAL: VIDCORE endpoint corridor rejected.`, "warn", 100);
      await addTerminalLog(termLogs, `CRITICAL: 2EMBED final fallback failed to respond.`, "warn", 100);
      
      logTimeout = setTimeout(() => {
        decOverlay.classList.add('hidden');
        errOverlay.style.display = 'flex';
      }, 500);
    }
  } catch (err) {
    console.error("Play Now error:", err);
    loaderStatus.textContent = "An error occurred during negotiation.";
    logTimeout = setTimeout(() => {
      decOverlay.classList.add('hidden');
      errOverlay.style.display = 'flex';
    }, 500);
  }
}

function retryBestProvider() {
  playNowClick();
}

function openExternalProvider() {
  if (!currentDetailItem) return;
  const isTv = currentDetailItem._type === 'tv' || !!currentDetailItem.first_air_date;
  let season = 1;
  let episode = 1;
  if (isTv) {
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    if (seasonSelect && episodeSelect) {
      season = parseInt(seasonSelect.value, 10) || 1;
      episode = parseInt(episodeSelect.value, 10) || 1;
    }
  }
  const targetId = currentDetailItem.imdb_id || currentDetailItem.id;
  const url = isTv
    ? `https://www.2embed.cc/embedtv/${targetId}?s=${season}&e=${episode}`
    : `https://www.2embed.cc/embed/${targetId}`;
  window.open(url, '_blank');
}

// Initialization
initHome();
