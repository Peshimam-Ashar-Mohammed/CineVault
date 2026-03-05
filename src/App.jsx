import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import MovieDetailsPage from "./pages/MovieDetails";
import Watchlist from "./pages/Watchlist";
import SearchResults from "./pages/SearchResults";
import PersonDetailsPage from "./pages/PersonDetails";
import CompanyDetailsPage from "./pages/CompanyDetails";
import DiscoverPage from "./pages/Discover";

const WATCHLIST_KEY = "cinevault_watchlist";

function getStoredWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

export default function App() {
  const [watchlist, setWatchlist] = useState(getStoredWatchlist);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (movie) => {
    setWatchlist((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      return exists
        ? prev.filter((m) => m.id !== movie.id)
        : [
            ...prev,
            {
              id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path,
              vote_average: movie.vote_average,
              release_date: movie.release_date,
              overview: movie.overview,
            },
          ];
    });
  };

  return (
    <div className="bg-[#06060b] text-white min-h-screen">
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <Home watchlist={watchlist} onToggleWatchlist={toggleWatchlist} />
          }
        />
        <Route
          path="/movie/:id"
          element={
            <MovieDetailsPage
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
            />
          }
        />
        <Route
          path="/person/:id"
          element={<PersonDetailsPage />}
        />
        <Route
          path="/watchlist"
          element={
            <Watchlist
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchResults
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
            />
          }
        />
        <Route
          path="/company/:id"
          element={
            <CompanyDetailsPage
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
            />
          }
        />
        <Route
          path="/discover"
          element={
            <DiscoverPage
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
            />
          }
        />
      </Routes>
    </div>
  );
}
