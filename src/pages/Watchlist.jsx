import { Link } from "react-router-dom";
import { IMAGE_BASE } from "../services/api";

export default function Watchlist({ watchlist, onToggleWatchlist }) {
  return (
    <div className="pt-20 pb-16 min-h-screen bg-[#06060b] page-enter">
      <div className="px-4 md:px-12">
        <h1 className="font-display text-3xl md:text-4xl tracking-wider uppercase mb-1">My List</h1>
        <p className="text-sm text-gray-500 mb-8">
          {watchlist.length
            ? `${watchlist.length} title${watchlist.length > 1 ? "s" : ""}`
            : "Your list is empty."}
        </p>

        {watchlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {watchlist.map((movie) => {
              const img = movie.backdrop_path
                ? `${IMAGE_BASE}/w780${movie.backdrop_path}`
                : movie.poster_path
                  ? `${IMAGE_BASE}/w500${movie.poster_path}`
                  : null;
              return (
                <div key={movie.id} className="group relative overflow-hidden rounded-lg aspect-video bg-gray-900 card-hover">
                  <Link to={`/movie/${movie.id}`} className="block w-full h-full">
                    {img && (
                      <img
                        src={img}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-10">
                      <p className="text-sm font-display tracking-wide line-clamp-1 uppercase">{movie.title}</p>
                      <p className="text-[11px] text-gray-400">{movie.release_date?.split("-")[0]}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => onToggleWatchlist(movie)}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-black/60 backdrop-blur-md text-red-400 hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from list"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-gray-600">
            <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="font-serif italic text-lg text-gray-500">Your list is empty</p>
            <p className="text-sm text-gray-600 mt-1">
              Movies you save will appear here.
            </p>
            <Link to="/" className="mt-6 px-5 py-2.5 btn-glow bg-white text-black rounded text-sm font-semibold hover:bg-gray-200 transition-colors">
              Browse Movies
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
