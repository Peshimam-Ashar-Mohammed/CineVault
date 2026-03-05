import { useRef } from "react";
import MovieCard from "./MovieCard";

export default function MovieGrid({
  movies,
  watchlist,
  onToggleWatchlist,
  title,
}) {
  const rowRef = useRef(null);

  if (!movies?.length) return null;

  const scroll = (dir) => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="mb-8 relative group/section">
      {/* Section header */}
      {title && (
        <div className="flex items-center justify-between mb-3 px-4 md:px-12">
          <h2 className="font-display text-base md:text-lg text-gray-100 tracking-[0.15em] uppercase">
            {title}
          </h2>
          <span className="text-xs text-gray-500 group-hover/section:text-red-400 transition-colors cursor-default">
            Scroll →
          </span>
        </div>
      )}

      {/* Carousel wrapper */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-20 w-10 md:w-14 bg-gradient-to-r from-[#06060b] to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300"
        >
          <svg className="w-6 h-6 text-white/80 hover:text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scrollable row */}
        <div
          ref={rowRef}
          className="carousel-row no-scrollbar px-4 md:px-12"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isInWatchlist={watchlist?.some((m) => m.id === movie.id)}
              onToggleWatchlist={onToggleWatchlist}
            />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-20 w-10 md:w-14 bg-gradient-to-l from-[#06060b] to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300"
        >
          <svg className="w-6 h-6 text-white/80 hover:text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
