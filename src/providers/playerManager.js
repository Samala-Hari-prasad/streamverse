const PlayerManager = {
  getBestMoviePlayer: async (movie) => {
    if (!movie) return null;
    
    const tmdbId = movie.id || movie.tmdbId;
    const imdbId = movie.imdb_id || movie.imdbId;
    
    const providers = [
      { key: 'multiembed', name: 'MultiEmbed', fn: MultiEmbedProvider, id: tmdbId },
      { key: 'videasy', name: 'VideoEasy', fn: VideoEasyProvider, id: tmdbId },
      { key: 'vidcore', name: 'VidCore', fn: VidCoreProvider, id: tmdbId },
      { key: 'twoembed', name: '2Embed', fn: TwoEmbedProvider, id: imdbId }
    ];
    
    for (const prov of providers) {
      if (!prov.id) continue;
      const embedUrl = prov.fn.getMovieEmbed(prov.id);
      if (!embedUrl) continue;
      
      const isReachable = await PlayerManager.checkReachability(prov.key);
      if (isReachable) {
        return {
          provider: prov.name,
          providerKey: prov.key,
          embedUrl
        };
      }
    }
    
    return null;
  },
  
  getBestTvPlayer: async (show, season = 1, episode = 1) => {
    if (!show) return null;
    
    const tmdbId = show.id || show.tmdbId;
    const imdbId = show.imdb_id || show.imdbId;
    
    const providers = [
      { key: 'multiembed', name: 'MultiEmbed', fn: MultiEmbedProvider, id: tmdbId },
      { key: 'videasy', name: 'VideoEasy', fn: VideoEasyProvider, id: tmdbId },
      { key: 'vidcore', name: 'VidCore', fn: VidCoreProvider, id: tmdbId },
      { key: 'twoembed', name: '2Embed', fn: TwoEmbedProvider, id: imdbId }
    ];
    
    for (const prov of providers) {
      if (!prov.id) continue;
      const embedUrl = prov.fn.getTvEmbed(prov.id, season, episode);
      if (!embedUrl) continue;
      
      const isReachable = await PlayerManager.checkReachability(prov.key);
      if (isReachable) {
        return {
          provider: prov.name,
          providerKey: prov.key,
          embedUrl
        };
      }
    }
    
    return null;
  },
  
  getBestProvider: async (imdbIdOrTmdbId, isTv, season = 1, episode = 1) => {
    const pseudoItem = { id: imdbIdOrTmdbId, imdb_id: imdbIdOrTmdbId };
    if (isTv) {
      const res = await PlayerManager.getBestTvPlayer(pseudoItem, season, episode);
      if (res) return { key: res.providerKey, name: res.provider, url: res.embedUrl };
    } else {
      const res = await PlayerManager.getBestMoviePlayer(pseudoItem);
      if (res) return { key: res.providerKey, name: res.provider, url: res.embedUrl };
    }
    return null;
  },
  
  checkReachability: async (providerKey) => {
    try {
      const res = await fetch('/api/gateways-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: [providerKey] })
      });
      if (res.ok) {
        const data = await res.json();
        const result = data.results && data.results.find(r => r.key === providerKey);
        return result ? result.status === 'online' : true;
      }
      return true;
    } catch (e) {
      return true;
    }
  }
};
