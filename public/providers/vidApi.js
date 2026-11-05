const VidApiProvider = {
  getMovieEmbed: (imdbId) => {
    return imdbId ? `https://vidapi.co/embed/movie/${imdbId}` : null;
  },
  getTvEmbed: (imdbId, season, episode) => {
    return imdbId ? `https://vidapi.co/embed/tv/${imdbId}/${season}/${episode}` : null;
  }
};
