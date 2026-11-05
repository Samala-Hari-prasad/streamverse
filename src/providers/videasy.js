const VideoEasyProvider = {
  getMovieEmbed: (tmdbId) => {
    return tmdbId ? `https://player.videasy.net/movie/${tmdbId}` : null;
  },
  getTvEmbed: (tmdbId, season, episode) => {
    return tmdbId ? `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}` : null;
  }
};
