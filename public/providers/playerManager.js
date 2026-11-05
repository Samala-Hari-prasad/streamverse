const PlayerManager = (() => {
  // ── Health check cache (60 second TTL) ────────────────────────────────────
  const _cache = new Map(); // key → { status: bool, ts: number }
  const CACHE_TTL = 60_000; // 60 seconds

  async function checkReachability(providerKey) {
    const now = Date.now();
    const cached = _cache.get(providerKey);
    if (cached && (now - cached.ts) < CACHE_TTL) {
      return cached.status;
    }

    try {
      const res = await fetch('/api/gateways-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: [providerKey] })
      });
      if (res.ok) {
        const data = await res.json();
        const result = data.results && data.results.find(r => r.key === providerKey);
        const online = result ? result.status === 'online' : true;
        _cache.set(providerKey, { status: online, ts: now });
        return online;
      }
    } catch (_) { /* network error — assume online */ }

    _cache.set(providerKey, { status: true, ts: now });
    return true;
  }

  // ── Provider priority list (enforced order) ────────────────────────────────
  function _getMovieProviders(movie) {
    const tmdbId = movie.id || movie.tmdbId;
    const imdbId = movie.imdb_id || movie.imdbId;
    return [
      { key: 'multiembed', name: 'MultiEmbed',  fn: MultiEmbedProvider,  id: tmdbId },
      { key: 'videasy',    name: 'VideoEasy',   fn: VideoEasyProvider,   id: tmdbId },
      { key: 'vidcore',    name: 'VidCore',     fn: VidCoreProvider,     id: tmdbId },
      { key: 'twoembed',   name: '2Embed',      fn: TwoEmbedProvider,    id: imdbId || tmdbId }
    ];
  }

  function _getTvProviders(show) {
    const tmdbId = show.id || show.tmdbId;
    const imdbId = show.imdb_id || show.imdbId;
    return [
      { key: 'multiembed', name: 'MultiEmbed',  fn: MultiEmbedProvider,  id: tmdbId },
      { key: 'videasy',    name: 'VideoEasy',   fn: VideoEasyProvider,   id: tmdbId },
      { key: 'vidcore',    name: 'VidCore',     fn: VidCoreProvider,     id: tmdbId },
      { key: 'twoembed',   name: '2Embed',      fn: TwoEmbedProvider,    id: imdbId || tmdbId }
    ];
  }

  // ── getBestMoviePlayer ─────────────────────────────────────────────────────
  async function getBestMoviePlayer(movie) {
    if (!movie) return null;
    for (const prov of _getMovieProviders(movie)) {
      if (!prov.id) continue;
      const embedUrl = prov.fn.getMovieEmbed(prov.id);
      if (!embedUrl) continue;
      const isReachable = await checkReachability(prov.key);
      if (isReachable) {
        return { provider: prov.name, providerKey: prov.key, embedUrl };
      }
    }
    return null;
  }

  // ── getBestTvPlayer ────────────────────────────────────────────────────────
  async function getBestTvPlayer(show, season = 1, episode = 1) {
    if (!show) return null;
    for (const prov of _getTvProviders(show)) {
      if (!prov.id) continue;
      const embedUrl = prov.fn.getTvEmbed(prov.id, season, episode);
      if (!embedUrl) continue;
      const isReachable = await checkReachability(prov.key);
      if (isReachable) {
        return { provider: prov.name, providerKey: prov.key, embedUrl };
      }
    }
    return null;
  }

  // ── Generic helper (used by older code paths) ──────────────────────────────
  async function getBestProvider(idOrTmdb, isTv, season = 1, episode = 1) {
    const pseudoItem = { id: idOrTmdb, imdb_id: idOrTmdb };
    if (isTv) {
      const r = await getBestTvPlayer(pseudoItem, season, episode);
      if (r) return { key: r.providerKey, name: r.provider, url: r.embedUrl };
    } else {
      const r = await getBestMoviePlayer(pseudoItem);
      if (r) return { key: r.providerKey, name: r.provider, url: r.embedUrl };
    }
    return null;
  }

  // ── Invalidate cache entry (e.g. after provider manually selected) ─────────
  function invalidateCache(providerKey) {
    _cache.delete(providerKey);
  }

  return { getBestMoviePlayer, getBestTvPlayer, getBestProvider, checkReachability, invalidateCache };
})();
