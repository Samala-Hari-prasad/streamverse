const MultiEmbedProvider = {
  getMovieEmbed: (tmdbId) => {
    return tmdbId ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1` : null;
  },
  getTvEmbed: (tmdbId, season, episode) => {
    return tmdbId ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}` : null;
  }
};
