import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchMulti, searchCompanies, getGenres, IMAGE_BASE } from "../services/api";

// ── Genre name map for fuzzy matching ──────────────
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

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef();
  const dropdownRef = useRef();
  const debounceRef = useRef();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close dropdown on outside click ────── */
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Debounced multi-search (movies, people, companies, genres) ── */
  const fetchSuggestions = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const items = [];

        // Check for genre alias match first
        const lower = q.toLowerCase().trim();
        const genreId = GENRE_ALIASES[lower];
        if (genreId) {
          items.push({ _type: "genre", id: genreId, name: lower.charAt(0).toUpperCase() + lower.slice(1) });
        }

        // Multi search (movies + people)
        const [multiData, companyData] = await Promise.all([
          searchMulti(q, 1),
          searchCompanies(q, 1),
        ]);

        const multiFiltered = multiData.results
          ?.filter((r) => r.media_type === "movie" || r.media_type === "person" || r.media_type === "tv")
          .slice(0, 6)
          .map((r) => ({ ...r, _type: r.media_type })) || [];
        items.push(...multiFiltered);

        // Company results
        const companies = companyData.results?.slice(0, 3).map((c) => ({
          ...c, _type: "company",
        })) || [];
        items.push(...companies);

        setSuggestions(items.slice(0, 10));
        setShowSuggestions(items.length > 0);
        setActiveIdx(-1);
      } catch { /* ignore */ }
    }, 280);
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
    fetchSuggestions(e.target.value.trim());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setSearchOpen(false);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      goToSuggestion(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const goToSuggestion = (item) => {
    if (item._type === "movie") {
      navigate(`/movie/${item.id}`);
    } else if (item._type === "tv") {
      navigate(`/show/${item.id}`);
    } else if (item._type === "person") {
      navigate(`/person/${item.id}`);
    } else if (item._type === "company") {
      navigate(`/company/${item.id}`);
    } else if (item._type === "genre") {
      navigate(`/discover?genre=${item.id}`);
    }
    setQuery("");
    setSearchOpen(false);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#06060b]/95 backdrop-blur-lg shadow-xl shadow-black/20"
          : "bg-gradient-to-b from-black/80 via-black/30 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-red-600 font-display text-2xl md:text-3xl tracking-[0.15em]">
            CINEVAULT
          </span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium">
          <Link to="/" className="text-white hover:text-gray-300 transition-colors">
            Home
          </Link>
          <Link to="/discover" className="text-gray-400 hover:text-white transition-colors">
            Discover
          </Link>
          <Link to="/watchlist" className="text-gray-400 hover:text-white transition-colors">
            My List
          </Link>
        </div>

        {/* Right side: search + mobile watchlist */}
        <div className="flex items-center gap-3">
          {/* Search with autocomplete */}
          <div className="relative" ref={dropdownRef}>
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <div
                className={`flex items-center overflow-hidden transition-all duration-300 ${
                  searchOpen
                    ? "w-56 sm:w-72 border border-white/20 bg-black/90 backdrop-blur-lg rounded"
                    : "w-0"
                }`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Movies, shows, actors…"
                  className="w-full bg-transparent px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((o) => !o);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* ── Suggestion dropdown ────────── */}
            {showSuggestions && searchOpen && (
              <div className="absolute top-full right-0 mt-1 w-72 sm:w-80 bg-[#0d0d14]/98 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl shadow-black/60 overflow-hidden z-[100] animate-[pageIn_0.2s_ease]">
                {suggestions.map((item, i) => {
                  const isMovie = item._type === "movie";
                  const isTV = item._type === "tv";
                  const isPerson = item._type === "person";
                  const isCompany = item._type === "company";
                  const isGenre = item._type === "genre";
                  const title = isMovie ? item.title : item.name;
                  const img = isMovie || isTV
                    ? (item.poster_path && `${IMAGE_BASE}/w92${item.poster_path}`)
                    : isPerson
                      ? item.profile_path && `${IMAGE_BASE}/w92${item.profile_path}`
                      : isCompany && item.logo_path
                        ? `${IMAGE_BASE}/w92${item.logo_path}`
                        : null;
                  const sub = isMovie
                    ? item.release_date?.split("-")[0] || "Movie"
                    : isTV
                      ? item.first_air_date?.split("-")[0] || "TV Show"
                      : isPerson
                        ? item.known_for_department || "Actor"
                        : isCompany
                          ? item.origin_country || "Studio"
                          : "Genre";
                  const badgeColor = isMovie
                    ? "bg-red-600/20 text-red-400"
                    : isTV
                      ? "bg-purple-600/20 text-purple-400"
                      : isPerson
                        ? "bg-blue-600/20 text-blue-400"
                        : isCompany
                          ? "bg-amber-600/20 text-amber-400"
                          : "bg-green-600/20 text-green-400";
                  const badgeLabel = isMovie ? "Movie" : isTV ? "TV" : isPerson ? "Person" : isCompany ? "Studio" : "Genre";

                  return (
                    <button
                      key={`${item._type}-${item.id}`}
                      type="button"
                      onClick={() => goToSuggestion(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${
                        activeIdx === i ? "bg-white/8" : ""
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className={`shrink-0 ${isMovie || isTV ? "w-10 h-14 rounded" : isPerson ? "w-10 h-10 rounded-full" : "w-10 h-10 rounded"} overflow-hidden bg-gray-800 flex items-center justify-center`}>
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : isGenre ? (
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2m10 2V2M1 10h22M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
                        ) : isTV ? (
                          <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>
                        ) : isCompany ? (
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            {isMovie ? (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
                            ) : (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 font-medium truncate">{title}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                          <span className="text-[11px] text-gray-500 truncate">{sub}</span>
                        </div>
                      </div>
                      {/* Arrow */}
                      <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
                {/* Search all footer */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full px-3 py-2.5 text-left text-xs text-gray-400 hover:text-white hover:bg-white/5 border-t border-white/5 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search all results for "<span className="text-white font-medium">{query}</span>"
                </button>
              </div>
            )}
          </div>

          {/* Mobile watchlist */}
          <Link
            to="/watchlist"
            className="md:hidden p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
