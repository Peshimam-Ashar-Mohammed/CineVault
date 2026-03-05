import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import MovieDetailsPage from "./pages/MovieDetails";
import ShowDetailsPage from "./pages/ShowDetails";
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

  const toggleWatchlist = (item) => {
    setWatchlist((prev) => {
      const mediaType = item.media_type || "movie";
      const exists = prev.some((m) => m.id === item.id && (m.media_type || "movie") === mediaType);
      return exists
        ? prev.filter((m) => !(m.id === item.id && (m.media_type || "movie") === mediaType))
        : [
            ...prev,
            {
              id: item.id,
              media_type: mediaType,
              title: item.title || item.name,
              name: item.name || item.title,
              poster_path: item.poster_path,
              backdrop_path: item.backdrop_path,
              vote_average: item.vote_average,
              release_date: item.release_date,
              first_air_date: item.first_air_date,
              overview: item.overview,
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
          path="/show/:id"
          element={
            <ShowDetailsPage
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
