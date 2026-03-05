import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchMulti, searchCompanies, getGenres, IMAGE_BASE } from "../services/api";

// Genre aliases for text search
const GENRE_ALIASES = {
  animated: 16, animation: 16, cartoon: 16,
  action: 28, adventure: 12,
  comedy: 35, funny: 35, humor: 35,
  horror: 27, scary: 27, creepy: 27,
  "sci-fi": 878, scifi: 878, "science fiction": 878, space: 878,
  romance: 10749, romantic: 10749, love: 10749,
  thriller: 53, suspense: 53,
  drama: 18,
  fantasy: 14, magic: 14,
  documentary: 99, docs: 99,
  crime: 80, mystery: 9648,
  war: 10752, western: 37, musical: 10402, music: 10402,
  family: 10751, kids: 10751,
  history: 36, historical: 36,
};

export default function SearchResults({ watchlist, onToggleWatchlist }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [genreMatch, setGenreMatch] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all | movie | person | company
  const observerRef = useRef();

  // Reset on new query
  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setResults([]);
    setCompanies([]);
    setPage(1);
    setFilter("all");

    // Check genre alias
    const lower = query.toLowerCase().trim();
    const genreId = GENRE_ALIASES[lower];
    setGenreMatch(genreId ? { id: genreId, name: lower.charAt(0).toUpperCase() + lower.slice(1) } : null);

    Promise.all([
      searchMulti(query, 1),
      searchCompanies(query, 1),
    ]).then(([multiData, companyData]) => {
      setResults(multiData.results?.filter((r) => r.media_type === "movie" || r.media_type === "person") || []);
      setTotalPages(multiData.total_pages);
      setCompanies(companyData.results?.slice(0, 10) || []);
      setLoading(false);
    });
  }, [query]);

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    searchMulti(query, page + 1).then((data) => {
      setResults((prev) => [...prev, ...(data.results?.filter((r) => r.media_type === "movie" || r.media_type === "person") || [])]);
      setPage((p) => p + 1);
      setLoading(false);
    });
  }, [query, page, totalPages, loading]);

  const sentinelRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) loadMore();
        },
        { rootMargin: "400px" }
      );
      observerRef.current.observe(node);
    },
    [loadMore]
  );

  const filtered = filter === "all"
    ? results
    : results.filter((r) => r.media_type === filter);

  const movieCount = results.filter((r) => r.media_type === "movie").length;
  const personCount = results.filter((r) => r.media_type === "person").length;

  return (
    <div className="pt-20 pb-16 min-h-screen bg-[#06060b] page-enter">
      <div className="px-4 md:px-12">
        <h1 className="font-display text-2xl md:text-3xl tracking-wider uppercase mb-1">
          Results for "<span className="text-gray-400">{query}</span>"
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {results.length
            ? `${results.length} result${results.length > 1 ? "s" : ""} found`
            : loading
              ? "Searching…"
              : "No results found."}
        </p>

        {/* Genre match banner */}
        {genreMatch && (
          <Link
            to={`/discover?genre=${genreMatch.id}`}
            className="flex items-center gap-3 mb-5 glass rounded-lg px-4 py-3 hover:bg-white/10 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2m10 2V2M1 10h22M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Browse {genreMatch.name} Movies</p>
              <p className="text-xs text-gray-500">Discover all {genreMatch.name.toLowerCase()} movies →</p>
            </div>
          </Link>
        )}

        {/* Company results */}
        {companies.length > 0 && (filter === "all" || filter === "company") && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-3">Studios & Companies</h3>
            <div className="flex flex-wrap gap-3">
              {companies.map((c) => (
                <Link
                  key={c.id}
                  to={`/company/${c.id}`}
                  className="flex items-center gap-2.5 glass rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
                >
                  {c.logo_path ? (
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center p-1">
                      <img src={`${IMAGE_BASE}/w92${c.logo_path}`} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-200">{c.name}</p>
                    {c.origin_country && <p className="text-[10px] text-gray-600">{c.origin_country}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {results.length > 0 && (
          <div className="flex gap-2 mb-6">
            {[
              { key: "all", label: "All", count: results.length },
              { key: "movie", label: "Movies", count: movieCount },
              { key: "person", label: "People", count: personCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === tab.key
                    ? "bg-red-600 text-white"
                    : "glass text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((item) => {
            if (item.media_type === "movie") {
              const img = item.backdrop_path
                ? `${IMAGE_BASE}/w780${item.backdrop_path}`
                : item.poster_path
                  ? `${IMAGE_BASE}/w500${item.poster_path}`
                  : null;
              if (!img) return null;
              return (
                <Link
                  key={`movie-${item.id}`}
                  to={`/movie/${item.id}`}
                  className="group relative overflow-hidden rounded-lg aspect-video bg-gray-900 card-hover"
                >
                  <img
                    src={img}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/20">Movie</span>
                  </div>
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-sm font-display tracking-wide line-clamp-1 uppercase">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{item.release_date?.split("-")[0]}</span>
                      {item.vote_average > 0 && (
                        <span className="text-[11px] text-yellow-400 font-semibold flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {item.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            }

            // Person card
            if (item.media_type === "person") {
              return (
                <Link
                  key={`person-${item.id}`}
                  to={`/person/${item.id}`}
                  className="group relative overflow-hidden rounded-lg aspect-video bg-gray-900 card-hover"
                >
                  {item.profile_path ? (
                    <img
                      src={`${IMAGE_BASE}/w500${item.profile_path}`}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <svg className="w-12 h-12 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/20">Person</span>
                  </div>
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-sm font-display tracking-wide line-clamp-1 uppercase">{item.name}</p>
                    <p className="text-[11px] text-gray-400">{item.known_for_department}</p>
                  </div>
                </Link>
              );
            }
            return null;
          })}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton aspect-video rounded-lg" />
            ))}
          </div>
        )}
        {page < totalPages && !loading && (
          <div ref={sentinelRef} className="h-10" />
        )}
      </div>
    </div>
  );
}
