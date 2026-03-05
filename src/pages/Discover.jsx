import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { discoverMovies, getGenres, IMAGE_BASE } from "../services/api";

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Newest First" },
  { value: "primary_release_date.asc", label: "Oldest First" },
  { value: "revenue.desc", label: "Highest Grossing" },
  { value: "vote_count.desc", label: "Most Voted" },
];

const YEAR_MIN = 1920;
const YEAR_MAX = new Date().getFullYear() + 1;

export default function DiscoverPage({ watchlist, onToggleWatchlist }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef();

  // Filters from URL
  const selectedGenres = searchParams.get("genre")?.split(",").filter(Boolean).map(Number) || [];
  const sortBy = searchParams.get("sort") || "popularity.desc";
  const yearFrom = searchParams.get("from") || "";
  const yearTo = searchParams.get("to") || "";
  const ratingMin = searchParams.get("rating") || "";

  // Load genres once
  useEffect(() => {
    getGenres().then(setGenres).catch(console.error);
  }, []);

  // Fetch movies when filters change
  useEffect(() => {
    setLoading(true);
    const params = {
      sort_by: sortBy,
      page: 1,
      "vote_count.gte": sortBy === "vote_average.desc" ? 100 : undefined,
    };
    if (selectedGenres.length) params.with_genres = selectedGenres.join(",");
    if (yearFrom) params["primary_release_date.gte"] = `${yearFrom}-01-01`;
    if (yearTo) params["primary_release_date.lte"] = `${yearTo}-12-31`;
    if (ratingMin) params["vote_average.gte"] = ratingMin;

    discoverMovies(params)
      .then((data) => {
        setMovies(data.results || []);
        setTotalPages(Math.min(data.total_pages, 500));
        setPage(1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sortBy, selectedGenres.join(","), yearFrom, yearTo, ratingMin]);

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    const params = {
      sort_by: sortBy,
      page: page + 1,
      "vote_count.gte": sortBy === "vote_average.desc" ? 100 : undefined,
    };
    if (selectedGenres.length) params.with_genres = selectedGenres.join(",");
    if (yearFrom) params["primary_release_date.gte"] = `${yearFrom}-01-01`;
    if (yearTo) params["primary_release_date.lte"] = `${yearTo}-12-31`;
    if (ratingMin) params["vote_average.gte"] = ratingMin;

    discoverMovies(params).then((data) => {
      setMovies((prev) => [...prev, ...data.results]);
      setPage((p) => p + 1);
      setLoadingMore(false);
    });
  }, [page, totalPages, loadingMore, sortBy, selectedGenres.join(","), yearFrom, yearTo, ratingMin]);

  const sentinelRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) loadMore(); },
        { rootMargin: "400px" }
      );
      observerRef.current.observe(node);
    },
    [loadMore]
  );

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  };

  const toggleGenre = (genreId) => {
    const current = new Set(selectedGenres);
    if (current.has(genreId)) current.delete(genreId);
    else current.add(genreId);
    updateParam("genre", [...current].join(","));
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasFilters = selectedGenres.length > 0 || yearFrom || yearTo || ratingMin || sortBy !== "popularity.desc";

  return (
    <div className="pt-20 pb-16 min-h-screen bg-[#06060b] page-enter">
      <div className="px-4 md:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl md:text-5xl tracking-wider uppercase">Discover</h1>
          <p className="text-sm text-gray-500 mt-1">Find your next favorite movie</p>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-8">
          {/* Genre pills */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGenre(g.id)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-all ${
                    selectedGenres.includes(g.id)
                      ? "bg-red-600 text-white"
                      : "glass text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort + Year + Rating row */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Sort */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono block mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => updateParam("sort", e.target.value)}
                className="bg-[#0d0d14] border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Year from */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono block mb-1">Year From</label>
              <input
                type="number"
                min={YEAR_MIN}
                max={YEAR_MAX}
                value={yearFrom}
                onChange={(e) => updateParam("from", e.target.value)}
                placeholder="1920"
                className="w-24 bg-[#0d0d14] border border-white/10 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-red-500/50"
              />
            </div>

            {/* Year to */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono block mb-1">Year To</label>
              <input
                type="number"
                min={YEAR_MIN}
                max={YEAR_MAX}
                value={yearTo}
                onChange={(e) => updateParam("to", e.target.value)}
                placeholder={`${YEAR_MAX}`}
                className="w-24 bg-[#0d0d14] border border-white/10 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-red-500/50"
              />
            </div>

            {/* Min rating */}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono block mb-1">Min Rating</label>
              <select
                value={ratingMin}
                onChange={(e) => updateParam("rating", e.target.value)}
                className="bg-[#0d0d14] border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50"
              >
                <option value="">Any</option>
                {[9, 8, 7, 6, 5, 4].map((n) => (
                  <option key={n} value={n}>{n}+ ★</option>
                ))}
              </select>
            </div>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-500/30 rounded hover:bg-red-600/10 transition-all"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="skeleton aspect-video rounded-lg" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg font-serif">No movies match your filters.</p>
            <button onClick={clearFilters} className="mt-3 text-red-400 hover:text-red-300 text-sm underline">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600 mb-3">{movies.length}+ results</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {movies.map((movie) => {
                const img = movie.backdrop_path
                  ? `${IMAGE_BASE}/w780${movie.backdrop_path}`
                  : movie.poster_path
                    ? `${IMAGE_BASE}/w500${movie.poster_path}`
                    : null;
                if (!img) return null;
                return (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="group relative overflow-hidden rounded-lg aspect-video bg-gray-900 card-hover"
                  >
                    <img
                      src={img}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <p className="text-sm font-display tracking-wide line-clamp-1 uppercase">{movie.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">{movie.release_date?.split("-")[0]}</span>
                        {movie.vote_average > 0 && (
                          <span className="text-[11px] text-yellow-400 font-semibold flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {movie.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {loadingMore && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="skeleton aspect-video rounded-lg" />
                ))}
              </div>
            )}
            {page < totalPages && !loadingMore && <div ref={sentinelRef} className="h-10" />}
          </>
        )}
      </div>
    </div>
  );
}
