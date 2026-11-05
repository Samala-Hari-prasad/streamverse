const VidKingProvider = {
  getMovieEmbed: (imdbId) => {
    return imdbId ? `https://vidking.link/embed/movie/${imdbId}` : null;
  },
  getTvEmbed: (imdbId, season, episode) => {
    return imdbId ? `https://vidking.link/embed/tv/${imdbId}/${season}/${episode}` : null;
  }
};
