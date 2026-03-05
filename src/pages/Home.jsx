import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getTrending,
  getPopular,
  getTopRated,
  getNowPlaying,
  getUpcoming,
  getTrendingPeople,
  getGenres,
  getMovieVideos,
  discoverByGenre,
  IMAGE_BASE,
} from "../services/api";
import MovieGrid from "../components/MovieGrid";
import GenreFilter from "../components/GenreFilter";
import Loader from "../components/Loader";
import ParticleField from "../components/ParticleField";
import RatingRing from "../components/RatingRing";
import TrailerModal from "../components/TrailerModal";
import { useScrollReveal } from "../hooks/useScrollReveal";

export default function Home({ watchlist, onToggleWatchlist }) {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [trendingPeople, setTrendingPeople] = useState([]);
  const [genreRows, setGenreRows] = useState([]); // { genre, movies }[]
  const [genres, setGenres] = useState([]);
  const [activeGenre, setActiveGenre] = useState(null);
  const [genreMovies, setGenreMovies] = useState([]);
  const [genrePage, setGenrePage] = useState(1);
  const [genreTotalPages, setGenreTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [genreLoading, setGenreLoading] = useState(false);
  const [genreRowsLoaded, setGenreRowsLoaded] = useState(false);
  const [hero, setHero] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const observerRef = useRef();
  const genreRowTriggerRef = useRef();
  const revealRef = useScrollReveal([trending, popular, topRated, nowPlaying, upcoming, genreMovies, genreRows]);

  // Genre-specific row IDs
  const genreIds = useMemo(() => [
    { id: 28, name: "Action" },
    { id: 35, name: "Comedy" },
    { id: 27, name: "Horror" },
    { id: 878, name: "Sci-Fi" },
    { id: 10749, name: "Romance" },
    { id: 53, name: "Thriller" },
    { id: 16, name: "Animation" },
    { id: 99, name: "Documentary" },
  ], []);

  // Initial fetch — no genre rows, load them lazily
  useEffect(() => {
    const load = async () => {
      try {
        const [t, p, r, np, up, tp, g] = await Promise.all([
          getTrending(),
          getPopular(),
          getTopRated(),
          getNowPlaying(),
          getUpcoming(),
          getTrendingPeople(),
          getGenres(),
        ]);
        setTrending(t.results);
        setPopular(p.results);
        setTopRated(r.results);
        setNowPlaying(np.results);
        setUpcoming(up.results);
        setTrendingPeople(tp.results?.slice(0, 20) || []);
        setGenres(g);

        // Hero: pick a high-rated trending movie with backdrop
        const heroPool = t.results.filter(
          (m) => m.backdrop_path && m.vote_average > 6
        );
        if (heroPool.length)
          setHero(heroPool[Math.floor(Math.random() * heroPool.length)]);
      } catch (err) {
        console.error("Failed to fetch movies:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Lazy-load genre rows when user scrolls near them
  useEffect(() => {
    if (genreRowsLoaded || loading) return;
    const el = genreRowTriggerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          Promise.all(
            genreIds.map((gi) =>
              discoverByGenre(gi.id, 1).then((d) => ({ genre: gi, movies: d.results }))
            )
          ).then((results) => {
            setGenreRows(results.filter((gr) => gr.movies?.length > 0));
            setGenreRowsLoaded(true);
          });
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [genreRowsLoaded, loading, genreIds]);

  // Genre filtering
  useEffect(() => {
    if (!activeGenre) {
      setGenreMovies([]);
      return;
    }
    setGenreLoading(true);
    setGenrePage(1);
    discoverByGenre(activeGenre, 1).then((data) => {
      setGenreMovies(data.results);
      setGenreTotalPages(data.total_pages);
      setGenreLoading(false);
    });
  }, [activeGenre]);

  // Infinite scroll for genre results
  const loadMoreGenre = useCallback(() => {
    if (genreLoading || genrePage >= genreTotalPages) return;
    setGenreLoading(true);
    discoverByGenre(activeGenre, genrePage + 1).then((data) => {
      setGenreMovies((prev) => [...prev, ...data.results]);
      setGenrePage((p) => p + 1);
      setGenreLoading(false);
    });
  }, [activeGenre, genrePage, genreTotalPages, genreLoading]);

  const sentinelRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) loadMoreGenre();
        },
        { rootMargin: "400px" }
      );
      observerRef.current.observe(node);
    },
    [loadMoreGenre]
  );

  if (loading) {
    return (
      <div className="pt-20">
        {/* Hero skeleton */}
        <div className="skeleton w-full h-[55vh] md:h-[70vh]" />
        <div className="mt-8">
          <Loader rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060b] film-grain page-enter" ref={revealRef}>
      <ParticleField />

      {/* ── HERO BANNER ─────────────────────────────────── */}
      {hero && (
        <div className="relative h-[55vh] md:h-[75vh] overflow-hidden">
          <img
            src={`${IMAGE_BASE}/original${hero.backdrop_path}`}
            alt={hero.title}
            className="w-full h-full object-cover object-top"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060b] via-[#06060b]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06060b]/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#06060b] to-transparent" />

          {/* Hero content */}
          <div className="absolute bottom-16 md:bottom-20 left-4 md:left-12 max-w-lg z-10">
            <h1 className="font-display text-4xl md:text-6xl tracking-wider mb-2 leading-[1] drop-shadow-2xl uppercase">
              {hero.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-300 mb-3">
              <RatingRing rating={hero.vote_average} size={36} strokeWidth={3} />
              <span className="text-gray-500">•</span>
              <span className="font-mono text-xs">{hero.release_date?.split("-")[0]}</span>
            </div>
            <p className="text-sm md:text-[15px] text-gray-300/90 line-clamp-3 mb-5 leading-relaxed font-body">
              {hero.overview}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  getMovieVideos(hero.id).then((data) => {
                    const yt = data.results?.find((v) => v.site === "YouTube" && v.type === "Trailer");
                    if (yt) setTrailerKey(yt.key);
                    else window.location.href = `/movie/${hero.id}`;
                  });
                }}
                className="btn-glow inline-flex items-center gap-2 px-7 py-3 bg-white text-black rounded font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play Trailer
              </button>
              <Link
                to={`/movie/${hero.id}`}
                className="btn-glow inline-flex items-center gap-2 px-6 py-3 glass text-white rounded font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                More Info
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ROWS ────────────────────────────────── */}
      <div className={`relative z-10 ${hero ? "-mt-12" : "pt-20"} pb-16 space-y-6`}>
        {/* Genre Filter */}
        {genres.length > 0 && (
          <div className="px-4 md:px-12 reveal">
            <GenreFilter
              genres={genres}
              activeGenre={activeGenre}
              onChange={setActiveGenre}
            />
          </div>
        )}

        {/* Genre Results or Default Carousel Sections */}
        {activeGenre ? (
          <div className="px-4 md:px-12 reveal">
            <h2 className="font-display text-lg md:text-xl tracking-wider text-gray-100 mb-4 uppercase">
              {genres.find((g) => g.id === activeGenre)?.name} Movies
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {genreMovies.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  className="group relative overflow-hidden rounded-lg aspect-video card-hover"
                >
                  {movie.backdrop_path && (
                    <img
                      src={`${IMAGE_BASE}/w780${movie.backdrop_path}`}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-display tracking-wide line-clamp-1 uppercase">{movie.title}</p>
                  </div>
                </Link>
              ))}
            </div>
            {genreLoading && (
              <div className="flex gap-3 overflow-hidden mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton aspect-video w-[300px] rounded-lg shrink-0" />
                ))}
              </div>
            )}
            {genrePage < genreTotalPages && <div ref={sentinelRef} className="h-10" />}
          </div>
        ) : (
          <>
            <div className="reveal">
              <MovieGrid
                movies={trending}
                title="Trending Now"
                watchlist={watchlist}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>
            <div className="reveal">
              <MovieGrid
                movies={nowPlaying}
                title="Now Playing in Theaters"
                watchlist={watchlist}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>
            <div className="reveal">
              <MovieGrid
                movies={popular}
                title="Popular on CineVault"
                watchlist={watchlist}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>

            {/* ── Trending People Row ─────────── */}
            {trendingPeople.length > 0 && (
              <section className="mb-8 reveal">
                <div className="flex items-center justify-between mb-3 px-4 md:px-12">
                  <h2 className="font-display text-base md:text-lg text-gray-100 tracking-[0.15em] uppercase">
                    Trending Stars
                  </h2>
                </div>
                <div className="carousel-row no-scrollbar gap-4 px-4 md:px-12">
                  {trendingPeople.map((person) => (
                    <Link
                      key={person.id}
                      to={`/person/${person.id}`}
                      className="shrink-0 w-28 md:w-36 group text-center"
                    >
                      <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full overflow-hidden bg-gray-900 border-2 border-transparent group-hover:border-red-500/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-600/20">
                        {person.profile_path ? (
                          <img
                            src={`${IMAGE_BASE}/w185${person.profile_path}`}
                            alt={person.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-300 mt-2 line-clamp-1 group-hover:text-white transition-colors">{person.name}</p>
                      <p className="text-[10px] text-gray-600">{person.known_for_department}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="reveal">
              <MovieGrid
                movies={upcoming}
                title="Coming Soon"
                watchlist={watchlist}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>
            <div className="reveal">
              <MovieGrid
                movies={topRated}
                title="Top Rated of All Time"
                watchlist={watchlist}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>

            {/* ── Genre-specific Rows (lazy-loaded) ─────────── */}
            <div ref={genreRowTriggerRef} />
            {genreRows.map((gr) => (
              <div className="reveal" key={gr.genre.id}>
                <MovieGrid
                  movies={gr.movies}
                  title={gr.genre.name}
                  watchlist={watchlist}
                  onToggleWatchlist={onToggleWatchlist}
                />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Trailer Modal */}
      {trailerKey && (
        <TrailerModal
          videoKey={trailerKey}
          title={hero?.title}
          onClose={() => setTrailerKey(null)}
        />
      )}
    </div>
  );
}
