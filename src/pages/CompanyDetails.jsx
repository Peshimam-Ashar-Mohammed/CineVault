import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getCompanyDetails, discoverByCompany, IMAGE_BASE } from "../services/api";

export default function CompanyDetailsPage({ watchlist, onToggleWatchlist }) {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef();

  useEffect(() => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    Promise.all([getCompanyDetails(id), discoverByCompany(id, 1)])
      .then(([details, disc]) => {
        setCompany(details);
        setMovies(disc.results || []);
        setTotalPages(disc.total_pages);
        setPage(1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    discoverByCompany(id, page + 1).then((data) => {
      setMovies((prev) => [...prev, ...data.results]);
      setPage((p) => p + 1);
      setLoadingMore(false);
    });
  }, [id, page, totalPages, loadingMore]);

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

  if (loading) {
    return (
      <div className="pt-20 pb-16 min-h-screen bg-[#06060b] page-enter">
        <div className="px-4 md:px-12 max-w-7xl mx-auto">
          <div className="skeleton h-16 w-64 rounded mb-4" />
          <div className="skeleton h-5 w-48 rounded mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="skeleton aspect-video rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return <div className="pt-24 text-center text-gray-500 font-serif text-lg">Company not found.</div>;
  }

  return (
    <div className="pt-20 pb-16 min-h-screen bg-[#06060b] page-enter">
      <div className="px-4 md:px-12 max-w-7xl mx-auto">
        {/* Company header */}
        <div className="flex items-center gap-5 mb-8">
          {company.logo_path ? (
            <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-xl p-3 flex items-center justify-center shrink-0">
              <img
                src={`${IMAGE_BASE}/w300${company.logo_path}`}
                alt={company.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl md:text-5xl tracking-wider uppercase">
              {company.name}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {company.origin_country && <span>{company.origin_country}</span>}
              {company.homepage && (
                <>
                  <span className="text-gray-700">•</span>
                  <a href={company.homepage} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 transition-colors">
                    Website ↗
                  </a>
                </>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">{movies.length > 0 && `${totalPages > 1 ? "100+" : movies.length} movies`}</p>
          </div>
        </div>

        {/* Movie grid */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-2 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
      </div>
    </div>
  );
}
