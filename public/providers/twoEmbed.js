const TwoEmbedProvider = {
  getMovieEmbed: (imdbId) => {
    return imdbId ? `https://www.2embed.cc/embed/${imdbId}` : null;
  },
  getTvEmbed: (imdbId, season, episode) => {
    return imdbId ? `https://www.2embed.cc/embedtv/${imdbId}?s=${season}&e=${episode}` : null;
  }
};
