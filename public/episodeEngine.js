/**
 * EpisodeEngine — TMDB-powered season & episode loader
 * Handles: fetch, render, progress tracking, resume detection
 */
const EpisodeEngine = (() => {
  const TMDB_KEY = 'a86a4b74b161d18c36145fc882b7284b';
  const BASE     = 'https://api.themoviedb.org/3';
  const IMG      = 'https://image.tmdb.org/t/p/';
  const PROG_KEY = 'streamverse_ep_progress';

  // ── Cache ──────────────────────────────────────────────────────────────────
  const _seasonCache = new Map(); // "tmdbId_seasonN" → episodes[]

  // ── Progress helpers ───────────────────────────────────────────────────────
  function _allProgress() {
    try { return JSON.parse(localStorage.getItem(PROG_KEY)) || {}; }
    catch (_) { return {}; }
  }

  function getProgress(showId, season, episode) {
    const all = _allProgress();
    return (all[String(showId)] || {})[`${season}_${episode}`] || null;
  }

  function setProgress(showId, season, episode, progress, providerKey) {
    const all = _allProgress();
    if (!all[String(showId)]) all[String(showId)] = {};
    all[String(showId)][`${season}_${episode}`] = {
      progress: Math.min(100, Math.max(0, progress || 0)),
      providerKey: providerKey || 'multiembed',
      timestamp: Date.now()
    };
    localStorage.setItem(PROG_KEY, JSON.stringify(all));
  }

  function getLastWatched(showId) {
    const all = _allProgress();
    const show = all[String(showId)];
    if (!show) return null;
    let best = null, bestTs = 0;
    for (const [key, val] of Object.entries(show)) {
      if (val.timestamp > bestTs) {
        bestTs = val.timestamp;
        const parts = key.split('_');
        best = {
          season: parseInt(parts[0], 10),
          episode: parseInt(parts[1], 10),
          progress: val.progress,
          providerKey: val.providerKey
        };
      }
    }
    return best;
  }

  // ── TMDB fetch ─────────────────────────────────────────────────────────────
  async function fetchSeasonEpisodes(tmdbId, seasonNumber) {
    const cacheKey = `${tmdbId}_${seasonNumber}`;
    if (_seasonCache.has(cacheKey)) return _seasonCache.get(cacheKey);
    try {
      const res = await fetch(
        `${BASE}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_KEY}&language=en-US`
      );
      const data = await res.json();
      const episodes = data.episodes || [];
      _seasonCache.set(cacheKey, episodes);
      return episodes;
    } catch (e) {
      console.error('EpisodeEngine: fetchSeasonEpisodes failed', e);
      return [];
    }
  }

  // ── Sync hidden selects (backward compat) ──────────────────────────────────
  function _syncSelects(season, episode) {
    const seasonSel  = document.getElementById('seasonSelect');
    const episodeSel = document.getElementById('episodeSelect');

    if (seasonSel) {
      // Make sure the option exists
      if (!seasonSel.querySelector(`option[value="${season}"]`)) {
        seasonSel.innerHTML += `<option value="${season}">Season ${season}</option>`;
      }
      seasonSel.value = season;
    }

    if (episodeSel) {
      // Ensure episode options go high enough
      const current = episodeSel.options.length;
      if (episode > current) {
        let extra = '';
        for (let i = current + 1; i <= Math.max(episode + 10, 50); i++) {
          extra += `<option value="${i}">Episode ${i}</option>`;
        }
        episodeSel.innerHTML += extra;
      }
      episodeSel.value = episode;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  async function renderEpisodePanel(show, onPlay) {
    const mount = document.getElementById('episodePanelMount');
    if (!mount) return;

    const seasons = (show.seasons || []).filter(s => s.season_number > 0);
    if (seasons.length === 0) {
      mount.innerHTML = `<p class="ep-empty">No season data available.</p>`;
      return;
    }

    const lastWatched = getLastWatched(String(show.id));
    let activeSeason = lastWatched
      ? lastWatched.season
      : seasons[0].season_number;

    // Make sure activeSeason is valid
    if (!seasons.find(s => s.season_number === activeSeason)) {
      activeSeason = seasons[0].season_number;
    }

    // Build season tabs
    const tabsHtml = seasons.map(s => `
      <button
        class="season-tab${s.season_number === activeSeason ? ' active' : ''}"
        data-season="${s.season_number}"
        onclick="EpisodeEngine._switchSeason('${show.id}', ${s.season_number}, this)"
      >${s.name || 'Season ' + s.season_number}</button>
    `).join('');

    mount.innerHTML = `
      <div class="episode-panel">
        <div class="season-tabs" id="seasonTabs">${tabsHtml}</div>
        <div class="episode-list" id="episodeList">
          <div class="ep-loading"><div class="spinner"></div><p>Loading episodes…</p></div>
        </div>
      </div>
    `;

    // Store callback on the mount element
    mount._onPlay  = onPlay;
    mount._showId  = show.id;

    // Sync hidden select to active season
    _syncSelects(activeSeason, lastWatched ? lastWatched.episode : 1);

    // Load initial episode list
    await _loadSeasonEpisodes(show.id, activeSeason, lastWatched);
  }

  // ── Load episodes for a season ─────────────────────────────────────────────
  async function _loadSeasonEpisodes(showId, seasonNumber, lastWatched) {
    const listEl = document.getElementById('episodeList');
    if (!listEl) return;

    listEl.innerHTML = `<div class="ep-loading"><div class="spinner"></div><p>Loading episodes…</p></div>`;

    const episodes = await fetchSeasonEpisodes(showId, seasonNumber);

    if (episodes.length === 0) {
      listEl.innerHTML = `<p class="ep-empty">No episodes found for this season.</p>`;
      return;
    }

    const mount = document.getElementById('episodePanelMount');
    // (onPlay stored on mount)

    listEl.innerHTML = episodes.map(ep => {
      const epNum   = ep.episode_number;
      const title   = ep.name    || `Episode ${epNum}`;
      const overview = ep.overview || 'No description available.';
      const runtime  = ep.runtime   ? `${ep.runtime}min` : '';
      const rating   = ep.vote_average && ep.vote_average > 0
        ? ep.vote_average.toFixed(1)
        : '';
      const airDate  = ep.air_date ? ep.air_date.slice(0, 4) : '';
      const stillUrl = ep.still_path ? `${IMG}w300${ep.still_path}` : '';

      const prog = getProgress(String(showId), seasonNumber, epNum);
      const isLast = lastWatched &&
        lastWatched.season === seasonNumber &&
        lastWatched.episode === epNum;

      const progressBar = prog
        ? `<div class="ep-prog-bar"><div class="ep-prog-fill" style="width:${Math.round(prog.progress)}%"></div></div>`
        : '';
      const resumeBadge = isLast
        ? `<span class="ep-resume-badge">Resume${prog ? ' ' + Math.round(prog.progress) + '%' : ''}</span>`
        : '';

      const shortOverview = overview.length > 130
        ? overview.slice(0, 130) + '…'
        : overview;

      return `
        <div class="episode-card${isLast ? ' ep-last-watched' : ''}"
             id="ep-card-${seasonNumber}-${epNum}"
             onclick="EpisodeEngine._playEpisode('${showId}', ${seasonNumber}, ${epNum})">
          <div class="episode-still-wrap">
            ${stillUrl
              ? `<img class="episode-still" src="${stillUrl}" alt="E${epNum}" loading="lazy"/>`
              : `<div class="episode-still-placeholder"><span>E${epNum}</span></div>`}
            <div class="episode-play-overlay">▶</div>
          </div>
          <div class="episode-card-info">
            <div class="ep-header">
              <span class="ep-num">E${String(epNum).padStart(2,'0')}</span>
              <span class="ep-title">${title}</span>
              ${resumeBadge}
            </div>
            <div class="ep-meta">
              ${runtime  ? `<span>${runtime}</span>`  : ''}
              ${rating   ? `<span>⭐ ${rating}</span>` : ''}
              ${airDate  ? `<span>${airDate}</span>`  : ''}
            </div>
            <p class="ep-overview">${shortOverview}</p>
            ${progressBar}
          </div>
        </div>
      `;
    }).join('');

    // Scroll last-watched episode into view
    if (lastWatched && lastWatched.season === seasonNumber) {
      const card = document.getElementById(`ep-card-${seasonNumber}-${lastWatched.episode}`);
      if (card) {
        setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
      }
    }
  }

  // ── Season tab click ───────────────────────────────────────────────────────
  function _switchSeason(showId, seasonNumber, tabEl) {
    document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');

    _syncSelects(seasonNumber, 1);

    const lastWatched = getLastWatched(String(showId));
    _loadSeasonEpisodes(showId, seasonNumber, lastWatched);
  }

  // ── Episode card click ─────────────────────────────────────────────────────
  function _playEpisode(showId, season, episode) {
    // Sync hidden selects so playNowClick reads correct values
    _syncSelects(season, episode);

    // Highlight active card
    document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('ep-playing'));
    const card = document.getElementById(`ep-card-${season}-${episode}`);
    if (card) card.classList.add('ep-playing');

    // Fire onPlay callback
    const mount = document.getElementById('episodePanelMount');
    if (mount && typeof mount._onPlay === 'function') {
      mount._onPlay(season, episode);
    } else if (typeof playNowClick === 'function') {
      playNowClick();
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    fetchSeasonEpisodes,
    renderEpisodePanel,
    getProgress,
    setProgress,
    getLastWatched,
    _switchSeason,
    _playEpisode,
    _loadSeasonEpisodes
  };
})();
