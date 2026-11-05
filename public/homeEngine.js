/**
 * HomeEngine — Infinite content discovery platform
 * Drives the StreamVerse homepage with lazily-loaded, personalized content rails.
 */
const HomeEngine = (() => {
  const TMDB_KEY  = 'a86a4b74b161d18c36145fc882b7284b';
  const BASE      = 'https://api.themoviedb.org/3';
  const IMG       = 'https://image.tmdb.org/t/p/';
  const BEH_KEY   = 'streamverse_behavior';

  // ── Behavior tracking ───────────────────────────────────────────────────────
  function getBehavior() {
    try { return JSON.parse(localStorage.getItem(BEH_KEY)) || { watched: [], genres: {} }; }
    catch (_) { return { watched: [], genres: {} }; }
  }

  function trackView(item) {
    if (!item || !item.id) return;
    const b = getBehavior();
    const genres = item.genre_ids || (item.genres || []).map(g => g.id) || [];
    genres.forEach(gId => { b.genres[String(gId)] = (b.genres[String(gId)] || 0) + 1; });
    const entry = {
      id: item.id,
      title: item.title || item.name,
      type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
      genre_ids: genres
    };
    b.watched = [entry, ...b.watched.filter(w => w.id !== item.id)].slice(0, 50);
    localStorage.setItem(BEH_KEY, JSON.stringify(b));
  }

  function getTopGenres() {
    const b = getBehavior();
    return Object.entries(b.genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
  }

  // ── TMDB helper ─────────────────────────────────────────────────────────────
  async function tmdb(endpoint, params = {}) {
    const qs = new URLSearchParams({ api_key: TMDB_KEY, language: 'en-US', ...params });
    try {
      const res  = await fetch(`${BASE}${endpoint}?${qs}`);
      const data = await res.json();
      return data.results || [];
    } catch (_) { return []; }
  }

  function norm(items, mtype) {
    return (items || []).map(item => ({
      ...item,
      title:        item.title    || item.name,
      name:         item.name     || item.title,
      release_date: item.release_date  || item.first_air_date,
      first_air_date: item.first_air_date || item.release_date,
      media_type:   item.media_type || mtype || (item.first_air_date ? 'tv' : 'movie'),
      vote_average: typeof item.vote_average === 'string'
        ? parseFloat(item.vote_average)
        : (item.vote_average || 0)
    }));
  }

  // ── Rail catalogue ──────────────────────────────────────────────────────────
  const GENRE_NAMES = {
    '28':'Action','12':'Adventure','16':'Animation','35':'Comedy',
    '80':'Crime','99':'Documentary','18':'Drama','10751':'Family',
    '14':'Fantasy','36':'History','27':'Horror','10402':'Music',
    '9648':'Mystery','10749':'Romance','878':'Sci-Fi','10770':'TV Movie',
    '53':'Thriller','10752':'War','37':'Western','10759':'Action & Adventure',
    '10762':'Kids','10763':'News','10764':'Reality','10765':'Sci-Fi & Fantasy',
    '10766':'Soap','10767':'Talk','10768':'War & Politics'
  };

  function buildQueue() {
    const b            = getBehavior();
    const topGenres    = getTopGenres();
    const recentWatched = b.watched.slice(0, 8);
    const lastWatched  = b.watched[0] || null;

    const base = [
      {
        id: 'trending',
        title: '🔥 Trending Now',
        fetch: async () => norm(await tmdb('/trending/all/week'), null),
        type: 'backdrop'
      },
      {
        id: 'popular-movies',
        title: '🎬 Popular Movies',
        fetch: async () => norm(await tmdb('/movie/popular'), 'movie'),
        type: 'poster'
      },
      {
        id: 'popular-tv',
        title: '📺 Popular TV Shows',
        fetch: async () => norm(await tmdb('/tv/popular'), 'tv'),
        type: 'poster'
      },
      {
        id: 'new-releases',
        title: '🆕 New Releases',
        fetch: async () => norm(await tmdb('/movie/now_playing'), 'movie'),
        type: 'backdrop'
      },
      {
        id: 'top-rated-movies',
        title: '⭐ Top Rated Movies',
        fetch: async () => norm(await tmdb('/movie/top_rated'), 'movie'),
        type: 'poster'
      },
      {
        id: 'anime',
        title: '⚡ Popular Anime',
        fetch: async () => norm(await tmdb('/discover/tv', { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' }), 'tv'),
        type: 'poster'
      },
      {
        id: 'top-rated-tv',
        title: '🏆 Top Rated TV Shows',
        fetch: async () => norm(await tmdb('/tv/top_rated'), 'tv'),
        type: 'poster'
      },
      {
        id: 'action',
        title: '💥 Popular in Action',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '28', sort_by: 'popularity.desc' }), 'movie'),
        type: 'backdrop'
      },
      {
        id: 'scifi',
        title: '🚀 Popular in Sci-Fi',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '878', sort_by: 'popularity.desc' }), 'movie'),
        type: 'backdrop'
      },
      {
        id: 'thriller',
        title: '🎭 Popular in Thriller',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '53', sort_by: 'popularity.desc' }), 'movie'),
        type: 'poster'
      },
      {
        id: 'horror',
        title: '👻 Popular in Horror',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '27', sort_by: 'popularity.desc' }), 'movie'),
        type: 'poster'
      },
      {
        id: 'comedy',
        title: '😂 Popular in Comedy',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '35', sort_by: 'popularity.desc' }), 'movie'),
        type: 'poster'
      },
      {
        id: 'romance',
        title: '❤️ Popular in Romance',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '10749', sort_by: 'popularity.desc' }), 'movie'),
        type: 'poster'
      },
      {
        id: 'kdrama',
        title: '🇰🇷 Popular K-Dramas',
        fetch: async () => norm(await tmdb('/discover/tv', { with_original_language: 'ko', sort_by: 'popularity.desc' }), 'tv'),
        type: 'poster'
      },
      {
        id: 'hidden-gems',
        title: '💎 Hidden Gems',
        fetch: async () => norm(await tmdb('/discover/movie', {
          'vote_average.gte': '7.5',
          'vote_count.gte': '200',
          'vote_count.lte': '8000',
          sort_by: 'vote_average.desc',
          page: String(Math.floor(Math.random() * 5) + 1)
        }), 'movie'),
        type: 'poster'
      },
      {
        id: 'crime-drama',
        title: '🔍 Crime & Mystery',
        fetch: async () => norm(await tmdb('/discover/tv', { with_genres: '80,9648', sort_by: 'popularity.desc' }), 'tv'),
        type: 'backdrop'
      },
      {
        id: 'most-watched-month',
        title: '📈 Most Watched This Month',
        fetch: async () => norm(await tmdb('/trending/all/month'), null),
        type: 'backdrop'
      },
      {
        id: 'upcoming',
        title: '🗓️ Coming Soon',
        fetch: async () => norm(await tmdb('/movie/upcoming'), 'movie'),
        type: 'backdrop'
      },
      {
        id: 'scifi-tv',
        title: '🌌 Sci-Fi TV Series',
        fetch: async () => norm(await tmdb('/discover/tv', { with_genres: '10765', sort_by: 'popularity.desc' }), 'tv'),
        type: 'backdrop'
      },
      {
        id: 'family',
        title: '👨‍👩‍👧 Family & Animation',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '16,10751', sort_by: 'popularity.desc' }), 'movie'),
        type: 'poster'
      },
      {
        id: 'documentary',
        title: '🎥 Documentaries',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '99', sort_by: 'popularity.desc' }), 'movie'),
        type: 'backdrop'
      },
      {
        id: 'action-tv',
        title: '⚔️ Action TV Series',
        fetch: async () => norm(await tmdb('/discover/tv', { with_genres: '10759', sort_by: 'popularity.desc' }), 'tv'),
        type: 'poster'
      },
      {
        id: 'global-picks',
        title: '🌍 Global Picks',
        fetch: async () => norm(await tmdb('/trending/movie/week', { page: '2' }), 'movie'),
        type: 'backdrop'
      },
      {
        id: 'recently-added',
        title: '🆙 Recently Added',
        fetch: async () => norm(await tmdb('/discover/movie', { sort_by: 'release_date.desc', 'primary_release_date.gte': new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10) }), 'movie'),
        type: 'backdrop'
      },
      {
        id: 'community-favorites',
        title: '🌟 Community Favorites',
        fetch: async () => norm(await tmdb('/movie/popular', { page: '3' }), 'movie'),
        type: 'poster'
      },
      {
        id: 'drama-tv',
        title: '🎪 Drama Series',
        fetch: async () => norm(await tmdb('/discover/tv', { with_genres: '18', sort_by: 'vote_average.desc', 'vote_count.gte': '500' }), 'tv'),
        type: 'poster'
      },
      {
        id: 'trending-p2',
        title: '💫 Also Trending',
        fetch: async () => norm(await tmdb('/trending/all/week', { page: '2' }), null),
        type: 'backdrop'
      },
      {
        id: 'classic-cinema',
        title: '🎞️ Classic Cinema',
        fetch: async () => norm(await tmdb('/discover/movie', { sort_by: 'vote_average.desc', 'vote_count.gte': '3000', 'primary_release_date.lte': '2000-01-01' }), 'movie'),
        type: 'poster'
      },
      {
        id: 'fantasy',
        title: '🧙 Fantasy & Magic',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '14', sort_by: 'popularity.desc' }), 'movie'),
        type: 'backdrop'
      },
      {
        id: 'anime-films',
        title: '🎌 Anime Films',
        fetch: async () => norm(await tmdb('/discover/movie', { with_genres: '16', with_original_language: 'ja', sort_by: 'vote_average.desc', 'vote_count.gte': '300' }), 'movie'),
        type: 'poster'
      },
    ];

    const personalized = [];

    // "Because You Watched" — based on most recent view
    if (lastWatched) {
      personalized.push({
        id: 'because-you-watched',
        title: `💡 Because You Watched "${lastWatched.title}"`,
        fetch: async () => {
          const ep = lastWatched.type === 'tv'
            ? `/tv/${lastWatched.id}/similar`
            : `/movie/${lastWatched.id}/similar`;
          const items = await tmdb(ep);
          return items.length ? norm(items, lastWatched.type) : norm(await tmdb('/trending/all/week'), null);
        },
        type: 'poster'
      });
    }

    // Genre-based AI picks
    topGenres.forEach((gId, i) => {
      const name = GENRE_NAMES[gId] || 'Your Favorites';
      personalized.push({
        id: `ai-picks-${gId}`,
        title: `✨ AI Picks For You — ${name}`,
        fetch: async () => norm(await tmdb('/discover/movie', {
          with_genres: gId,
          sort_by: 'vote_average.desc',
          'vote_count.gte': '300'
        }), 'movie'),
        type: 'poster'
      });
    });

    // "People Also Watched" / "Similar to"
    recentWatched.slice(1, 5).forEach(w => {
      personalized.push({
        id: `similar-${w.id}`,
        title: `🎯 Similar to "${w.title}"`,
        fetch: async () => {
          const ep = w.type === 'tv'
            ? `/tv/${w.id}/recommendations`
            : `/movie/${w.id}/recommendations`;
          const items = await tmdb(ep);
          return items.length ? norm(items, w.type) : [];
        },
        type: 'poster'
      });
    });

    // Interleave personalized rails near the top
    const final = [...base];
    if (personalized.length > 0) {
      final.splice(1, 0, personalized[0]); // insert "Because You Watched" early
      personalized.slice(1).forEach((r, i) => {
        final.splice(5 + i * 3, 0, r); // spread AI picks throughout
      });
    }

    return final;
  }

  // ── Card renderers ──────────────────────────────────────────────────────────
  function _safeItem(item) {
    return JSON.stringify({ ...item, _type: item.media_type || (item.first_air_date ? 'tv' : 'movie') })
      .replace(/"/g, '&quot;');
  }

  function _backdropCard(item) {
    const title   = item.title || item.name;
    const type    = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const year    = (item.release_date || item.first_air_date || '').slice(0, 4);
    const rating  = item.vote_average > 0 ? item.vote_average.toFixed(1) : '';
    const imgUrl  = item.backdrop_path
      ? `${IMG}w500${item.backdrop_path}`
      : (item.poster_path ? `${IMG}w342${item.poster_path}` : '');

    return `
      <div class="rail-card rail-card-backdrop" onclick="navigate('detail',${_safeItem(item)})">
        ${imgUrl
          ? `<img src="${imgUrl}" alt="${title}" loading="lazy" decoding="async"/>`
          : `<div class="rail-card-placeholder">🎬</div>`}
        <div class="rail-card-gradient"></div>
        <div class="rail-card-info">
          <span class="rail-type-badge">${type === 'tv' ? 'SERIES' : 'MOVIE'}</span>
          <div class="rail-card-title">${title}</div>
          <div class="rail-card-meta">${year}${rating ? ` &nbsp;⭐&nbsp;${rating}` : ''}</div>
        </div>
      </div>`;
  }

  function _posterCard(item) {
    const title  = item.title || item.name;
    const type   = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : '';
    const imgUrl = item.poster_path
      ? `${IMG}w342${item.poster_path}`
      : (item.backdrop_path ? `${IMG}w300${item.backdrop_path}` : '');

    return `
      <div class="rail-card rail-card-poster" onclick="navigate('detail',${_safeItem(item)})">
        ${imgUrl
          ? `<img src="${imgUrl}" alt="${title}" loading="lazy" decoding="async"/>`
          : `<div class="rail-card-poster-placeholder">🎬<br/><small>${title}</small></div>`}
        <div class="rail-card-poster-overlay">
          <div class="rail-card-title">${title}</div>
          ${rating ? `<div class="rail-card-rating">⭐ ${rating}</div>` : ''}
        </div>
        <span class="rail-type-pip">${type === 'tv' ? 'TV' : 'MV'}</span>
      </div>`;
  }

  function _resumeCard(item) {
    const title   = item.title || item.name;
    const type    = item._type || (item.first_air_date ? 'tv' : 'movie');
    const progress = item._progress || 30;
    const epInfo  = type === 'tv' && item._season ? `S${item._season} E${item._episode || 1}` : '';
    const imgUrl  = item.backdrop_path
      ? `${IMG}w500${item.backdrop_path}`
      : (item.poster_path ? `${IMG}w342${item.poster_path}` : '');

    return `
      <div class="rail-card rail-card-backdrop rail-card-resume" onclick="navigate('detail',${_safeItem(item)})">
        ${imgUrl
          ? `<img src="${imgUrl}" alt="${title}" loading="lazy" decoding="async"/>`
          : `<div class="rail-card-placeholder">🎬</div>`}
        <div class="rail-card-gradient"></div>
        <div class="rail-card-info">
          <span class="rail-type-badge rail-badge-resume">▶ ${epInfo || 'Resume'}</span>
          <div class="rail-card-title">${title}</div>
          <div class="rail-progress-bar"><div class="rail-progress-fill" style="width:${progress}%"></div></div>
        </div>
      </div>`;
  }

  // ── Rail shell ──────────────────────────────────────────────────────────────
  function _createShell(rail) {
    const sec = document.createElement('section');
    sec.className = 'home-rail';
    sec.id = `rail-${rail.id}`;
    sec.innerHTML = `
      <div class="rail-header">
        <h2 class="rail-title">${rail.title}</h2>
        <div class="rail-arrows">
          <button class="rail-arrow" aria-label="Scroll left"
            onclick="HomeEngine._scroll('${rail.id}',-1)">&#8249;</button>
          <button class="rail-arrow" aria-label="Scroll right"
            onclick="HomeEngine._scroll('${rail.id}',1)">&#8250;</button>
        </div>
      </div>
      <div class="rail-track" id="track-${rail.id}">
        <div class="rail-skeleton-row">${Array(8).fill('<div class="rail-skeleton-card"></div>').join('')}</div>
      </div>`;
    return sec;
  }

  async function _mountRail(rail, container) {
    const sec = _createShell(rail);
    container.appendChild(sec);
    const track = sec.querySelector('.rail-track');

    try {
      // ── Continue watching ─────────────────────────────────────────────────
      if (rail.id === 'continue-watching') {
        const list = (() => {
          try { return JSON.parse(localStorage.getItem('streamverse_continue')) || []; }
          catch { return []; }
        })();
        if (list.length === 0) { sec.style.display = 'none'; return; }
        track.innerHTML = list.map(_resumeCard).join('');
        return;
      }

      // ── My Watchlist ──────────────────────────────────────────────────────
      if (rail.id === 'watchlist') {
        const list = (() => {
          try { return JSON.parse(localStorage.getItem('streamverse_watchlist')) || []; }
          catch { return []; }
        })();
        if (list.length === 0) { sec.style.display = 'none'; return; }
        const cardFn = rail.type === 'backdrop' ? _backdropCard : _posterCard;
        track.innerHTML = list.map(cardFn).join('');
        return;
      }

      // ── Fetched rails ─────────────────────────────────────────────────────
      const items = await rail.fetch();
      if (!items || items.length === 0) { sec.style.display = 'none'; return; }
      const cardFn = rail.type === 'backdrop' ? _backdropCard : _posterCard;
      track.innerHTML = items.map(cardFn).join('');
    } catch (e) {
      console.error(`HomeEngine: rail "${rail.id}" failed`, e);
      sec.style.display = 'none';
    }
  }

  // ── Scroll rail ─────────────────────────────────────────────────────────────
  function _scroll(railId, dir) {
    const track = document.getElementById(`track-${railId}`);
    if (!track) return;
    const cardW = (track.querySelector('.rail-card') || {}).offsetWidth || 300;
    track.scrollBy({ left: dir * (cardW + 12) * 3, behavior: 'smooth' });
  }

  // ── Infinite scroll engine ──────────────────────────────────────────────────
  let _queue    = [];
  let _busy     = false;
  let _obs      = null;
  let _sentinel = null;
  let _root     = null;

  function _nextBatch(n = 3) {
    if (_busy || _queue.length === 0) return;
    _busy = true;
    const batch = _queue.splice(0, n);
    Promise.all(batch.map(r => _mountRail(r, _root))).finally(() => {
      _busy = false;
      if (_sentinel && _root) _root.appendChild(_sentinel);
    });
  }

  // ── Hero spotlight ──────────────────────────────────────────────────────────
  async function _setupHero() {
    try {
      const items = norm(await tmdb('/trending/all/week'), null);
      if (!items || items.length === 0) return;
      // Pick a random item from the top 5
      const item = items[Math.floor(Math.random() * Math.min(5, items.length))];
      if (typeof setupHeroSpotlight === 'function') setupHeroSpotlight(item);
    } catch (_) {}
  }

  // ── Public init ─────────────────────────────────────────────────────────────
  function init(containerId) {
    _root = document.getElementById(containerId);
    if (!_root) return;
    _root.innerHTML = '';

    // Hero
    _setupHero();

    // Build full queue
    _queue = [
      { id: 'continue-watching', title: '▶ Continue Watching', type: 'backdrop' },
      { id: 'watchlist',         title: '📋 My Watchlist',      type: 'poster'   },
      ...buildQueue()
    ];

    // First 4 rails immediately (above the fold)
    _nextBatch(4);

    // Sentinel for IntersectionObserver
    _sentinel = document.createElement('div');
    _sentinel.className = 'home-sentinel';
    _root.appendChild(_sentinel);

    if (_obs) _obs.disconnect();
    _obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) _nextBatch(3);
    }, { rootMargin: '600px' });
    _obs.observe(_sentinel);
  }

  // Refresh continue-watching rail if visible
  function refreshContinue() {
    const track = document.getElementById('track-continue-watching');
    const rail  = document.getElementById('rail-continue-watching');
    if (!track) return;
    const list = (() => {
      try { return JSON.parse(localStorage.getItem('streamverse_continue')) || []; }
      catch { return []; }
    })();
    if (list.length === 0) { if (rail) rail.style.display = 'none'; return; }
    if (rail) rail.style.display = '';
    track.innerHTML = list.map(_resumeCard).join('');
  }

  return { init, trackView, refreshContinue, _scroll };
})();
