const VidCoreProvider = {
  getMovieEmbed: (tmdbId) => {
    return tmdbId ? `https://www.vidcore.org/embed/movie/${tmdbId}` : null;
  },
  getTvEmbed: (tmdbId, season, episode) => {
    return tmdbId ? `https://www.vidcore.org/embed/tv/${tmdbId}/${season}/${episode}` : null;
  }
};
