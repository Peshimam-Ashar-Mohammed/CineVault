import { Link } from "react-router-dom";
import { IMAGE_BASE } from "../services/api";

export default function ShowCard({ show, onToggleWatchlist, isInWatchlist }) {
  const backdrop = show.backdrop_path
    ? `${IMAGE_BASE}/w780${show.backdrop_path}`
    : show.poster_path
      ? `${IMAGE_BASE}/w500${show.poster_path}`
      : null;

  const rating = show.vote_average?.toFixed(1);
  const year = (show.first_air_date || show.release_date)?.split("-")[0];
  const title = show.name || show.title;

  if (!backdrop) return null;

  return (
    <div className="group/card relative w-[320px] sm:w-[380px] md:w-[420px] lg:w-[480px] card-hover">
      <Link to={`/show/${show.id}`} className="block relative overflow-hidden rounded-md aspect-video">
        <img
          src={backdrop}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
        />

        {/* TV badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-purple-600/40 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
            TV
          </span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 group-hover/card:opacity-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-y-2 group-hover/card:translate-y-0">
          <h3 className="text-base sm:text-lg font-display text-white leading-tight line-clamp-2 tracking-wide uppercase drop-shadow-lg">
            {title}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {rating && (
              <span className="flex items-center gap-1 text-xs font-semibold">
                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-yellow-100">{rating}</span>
              </span>
            )}
            {year && (
              <span className="text-xs text-gray-300 border border-gray-600 rounded px-1.5 py-0.5">{year}</span>
            )}
          </div>

          {show.overview && (
            <p className="text-[11px] sm:text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
              {show.overview}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <span className="flex items-center gap-1.5 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-sm">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </span>
            <span className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-500 text-gray-300 hover:border-white hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
            </span>
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggleWatchlist?.({ ...show, media_type: "tv", title: title });
        }}
        className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full transition-all duration-200 ${
          isInWatchlist
            ? "bg-red-600 text-white"
            : "bg-black/50 text-gray-400 opacity-0 group-hover/card:opacity-100 hover:bg-red-600 hover:text-white"
        }`}
        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        <svg
          className="w-4 h-4"
          fill={isInWatchlist ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    </div>
  );
}
