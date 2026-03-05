import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getPersonDetails, getPersonMovieCredits, getPersonImages,
  getPersonExternalIds, getPersonTVCredits, IMAGE_BASE,
} from "../services/api";
import RatingRing from "../components/RatingRing";
import { useScrollReveal } from "../hooks/useScrollReveal";

/* ── Helper: calc age ─────────────────────── */
function calcAge(birthday, deathday) {
  if (!birthday) return null;
  const end = deathday ? new Date(deathday) : new Date();
  const birth = new Date(birthday);
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age;
}

/* ── Helper: format date ──────────────────── */
function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function PersonDetailsPage() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [tvCredits, setTVCredits] = useState({ cast: [], crew: [] });
  const [images, setImages] = useState([]);
  const [externals, setExternals] = useState({});
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const revealRef = useScrollReveal([person, credits]);

  useEffect(() => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    Promise.all([
      getPersonDetails(id),
      getPersonMovieCredits(id),
      getPersonImages(id),
      getPersonExternalIds(id),
      getPersonTVCredits(id),
    ])
      .then(([p, creds, imgs, ext, tvCreds]) => {
        setPerson(p);
        const sortedCast = [...(creds.cast || [])].sort(
          (a, b) => (b.popularity || 0) - (a.popularity || 0)
        );
        const sortedCrew = [...(creds.crew || [])].sort(
          (a, b) => (b.popularity || 0) - (a.popularity || 0)
        );
        setCredits({ cast: sortedCast, crew: sortedCrew });
        const sortedTVCast = [...(tvCreds.cast || [])].sort(
          (a, b) => (b.popularity || 0) - (a.popularity || 0)
        );
        const sortedTVCrew = [...(tvCreds.crew || [])].sort(
          (a, b) => (b.popularity || 0) - (a.popularity || 0)
        );
        setTVCredits({ cast: sortedTVCast, crew: sortedTVCrew });
        setImages(imgs.profiles?.slice(0, 12) || []);
        setExternals(ext);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Loading skeleton ──────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060b] page-enter pt-20">
        <div className="max-w-6xl mx-auto px-4 md:px-12">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="skeleton w-52 md:w-72 aspect-[2/3] rounded-2xl shrink-0 mx-auto md:mx-0" />
            <div className="flex-1 space-y-4 pt-4">
              <div className="skeleton h-10 w-2/3 rounded" />
              <div className="skeleton h-5 w-1/3 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="pt-24 text-center text-gray-500 font-serif text-lg">
        Person not found.
      </div>
    );
  }

  const photo = person.profile_path
    ? `${IMAGE_BASE}/h632${person.profile_path}`
    : null;
  const age = calcAge(person.birthday, person.deathday);
  const bestKnownFor = credits.cast.slice(0, 5);
  const bestKnownTVFor = tvCredits.cast.slice(0, 5);
  const totalMovies = credits.cast.length + credits.crew.length;
  const totalTV = tvCredits.cast.length + tvCredits.crew.length;

  // Tag credits with media_type
  const movieCast = credits.cast.map(c => ({ ...c, _type: "movie" }));
  const movieCrew = credits.crew.map(c => ({ ...c, _type: "movie" }));
  const tvCast = tvCredits.cast.map(c => ({ ...c, _type: "tv" }));
  const tvCrew = tvCredits.crew.map(c => ({ ...c, _type: "tv" }));

  // Group filmography by tab
  const allCastFiltered = activeTab === "all"
    ? [...movieCast, ...tvCast]
    : activeTab === "acting"
      ? [...movieCast, ...tvCast]
      : activeTab === "tv"
        ? tvCast
        : [];
  const allCrewFiltered = activeTab === "all"
    ? [...movieCrew, ...tvCrew]
    : activeTab === "directing"
      ? [...movieCrew, ...tvCrew].filter((c) => c.job === "Director")
      : activeTab === "writing"
        ? [...movieCrew, ...tvCrew].filter((c) => c.department === "Writing")
        : activeTab === "producing"
          ? [...movieCrew, ...tvCrew].filter((c) => c.department === "Production")
          : [];

  const combinedFilmography = activeTab === "acting"
    ? allCastFiltered
    : activeTab === "tv"
      ? [...tvCast, ...tvCrew]
      : activeTab === "all"
        ? [...allCastFiltered, ...allCrewFiltered]
        : allCrewFiltered;

  // Deduplicate by id + type
  const seen = new Set();
  const dedupedFilmography = combinedFilmography.filter(item => {
    const key = `${item.id}-${item._type}-${item.credit_id || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date descending
  dedupedFilmography.sort((a, b) => {
    const dateA = a.release_date || a.first_air_date || '';
    const dateB = b.release_date || b.first_air_date || '';
    return dateB.localeCompare(dateA);
  });

  // Unique departments for tabs
  const departments = new Set();
  departments.add("all");
  if (credits.cast.length > 0 || tvCredits.cast.length > 0) departments.add("acting");
  if (tvCredits.cast.length + tvCredits.crew.length > 0) departments.add("tv");
  if ([...movieCrew, ...tvCrew].some((c) => c.job === "Director")) departments.add("directing");
  if ([...movieCrew, ...tvCrew].some((c) => c.department === "Writing")) departments.add("writing");
  if ([...movieCrew, ...tvCrew].some((c) => c.department === "Production")) departments.add("producing");

  // Highest rated movies
  const highestRated = [...credits.cast]
    .filter((m) => m.vote_count > 50 && m.vote_average > 0)
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#06060b] film-grain page-enter" ref={revealRef}>
      {/* ── BG Ambient ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="ambient-blob w-[500px] h-[500px] bg-red-600 top-[-200px] left-[-100px]" style={{ animationDelay: "0s" }} />
        <div className="ambient-blob w-[400px] h-[400px] bg-blue-600 bottom-[-200px] right-[-100px]" style={{ animationDelay: "5s" }} />
      </div>

      <div className="relative z-10 pt-20 pb-20 px-4 md:px-12 max-w-6xl mx-auto">
        {/* ── HERO ────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 reveal">
          {/* Photo */}
          <div className="shrink-0 mx-auto md:mx-0">
            {photo ? (
              <img
                src={photo}
                alt={person.name}
                className="w-52 md:w-72 rounded-2xl shadow-2xl shadow-black/70 border border-white/5 tilt-card"
              />
            ) : (
              <div className="w-52 md:w-72 aspect-[2/3] rounded-2xl bg-gray-900 flex items-center justify-center">
                <svg className="w-20 h-20 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <h1 className="font-display text-4xl md:text-6xl tracking-wider leading-none uppercase">
              {person.name}
            </h1>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {person.known_for_department && (
                <span className="px-2.5 py-0.5 bg-red-600/20 border border-red-500/30 text-red-400 rounded text-xs font-bold tracking-wider uppercase">
                  {person.known_for_department}
                </span>
              )}
              {age && (
                <span className="text-gray-400">
                  {person.deathday ? `${age} (deceased)` : `${age} years old`}
                </span>
              )}
              {person.place_of_birth && (
                <>
                  <span className="text-gray-700">•</span>
                  <span className="text-gray-500 text-xs">{person.place_of_birth}</span>
                </>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              <div className="glass rounded-lg px-4 py-2.5 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Movies</p>
                <p className="text-lg font-display tracking-wider text-white">{totalMovies}</p>
              </div>
              {totalTV > 0 && (
                <div className="glass rounded-lg px-4 py-2.5 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">TV Shows</p>
                  <p className="text-lg font-display tracking-wider text-white">{totalTV}</p>
                </div>
              )}
              {person.popularity && (
                <div className="glass rounded-lg px-4 py-2.5 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Popularity</p>
                  <p className="text-lg font-display tracking-wider text-white">{person.popularity.toFixed(0)}</p>
                </div>
              )}
              {person.birthday && (
                <div className="glass rounded-lg px-4 py-2.5 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Born</p>
                  <p className="text-xs font-mono text-gray-300">{fmtDate(person.birthday)}</p>
                </div>
              )}
              {person.deathday && (
                <div className="glass rounded-lg px-4 py-2.5 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Died</p>
                  <p className="text-xs font-mono text-gray-300">{fmtDate(person.deathday)}</p>
                </div>
              )}
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {externals.imdb_id && (
                <a href={`https://www.imdb.com/name/${externals.imdb_id}`} target="_blank" rel="noreferrer"
                   className="glass rounded px-3 py-1.5 text-xs font-bold text-yellow-400 hover:bg-yellow-400/10 transition-colors">
                  IMDb
                </a>
              )}
              {externals.instagram_id && (
                <a href={`https://instagram.com/${externals.instagram_id}`} target="_blank" rel="noreferrer"
                   className="glass rounded px-3 py-1.5 text-xs font-bold text-pink-400 hover:bg-pink-400/10 transition-colors">
                  Instagram
                </a>
              )}
              {externals.twitter_id && (
                <a href={`https://twitter.com/${externals.twitter_id}`} target="_blank" rel="noreferrer"
                   className="glass rounded px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-400/10 transition-colors">
                  Twitter/X
                </a>
              )}
            </div>

            {/* Biography */}
            {person.biography && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">Biography</h3>
                <p className={`text-gray-300 text-sm leading-relaxed font-body ${bioExpanded ? "" : "line-clamp-5"}`}>
                  {person.biography}
                </p>
                {person.biography.length > 500 && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="text-xs text-red-400 hover:text-red-300 mt-1.5 font-medium transition-colors"
                  >
                    {bioExpanded ? "Show less" : "Read full biography"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── BEST KNOWN FOR ─────────────────── */}
        {bestKnownFor.length > 0 && (
          <section className="mt-14 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Best Known For</h2>
            <div className="carousel-row no-scrollbar gap-4 pb-2">
              {bestKnownFor.map((movie) => (
                <Link
                  key={movie.id + "-known"}
                  to={`/movie/${movie.id}`}
                  className="shrink-0 w-[200px] md:w-[240px] group card-hover"
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 mb-2 relative">
                    {movie.poster_path ? (
                      <img
                        src={`${IMAGE_BASE}/w342${movie.poster_path}`}
                        alt={movie.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {movie.vote_average > 0 && (
                      <div className="absolute top-2 right-2">
                        <RatingRing rating={movie.vote_average} size={36} strokeWidth={3} />
                      </div>
                    )}
                    {movie.character && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[11px] text-gray-400 truncate">as {movie.character}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-display tracking-wide line-clamp-1 uppercase">{movie.title}</p>
                  <p className="text-[11px] text-gray-500">{movie.release_date?.split("-")[0]}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── BEST KNOWN FOR (TV) ────────────── */}
        {bestKnownTVFor.length > 0 && (
          <section className="mt-14 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">
              Known For
              <span className="text-purple-400 text-lg ml-2">TV Shows</span>
            </h2>
            <div className="carousel-row no-scrollbar gap-4 pb-2">
              {bestKnownTVFor.map((show) => (
                <Link
                  key={show.id + "-tv-known"}
                  to={`/show/${show.id}`}
                  className="shrink-0 w-[200px] md:w-[240px] group card-hover"
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 mb-2 relative">
                    {show.poster_path ? (
                      <img
                        src={`${IMAGE_BASE}/w342${show.poster_path}`}
                        alt={show.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/20">TV</span>
                    </div>
                    {show.vote_average > 0 && (
                      <div className="absolute top-2 right-2">
                        <RatingRing rating={show.vote_average} size={36} strokeWidth={3} />
                      </div>
                    )}
                    {show.character && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[11px] text-gray-400 truncate">as {show.character}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-display tracking-wide line-clamp-1 uppercase">{show.name}</p>
                  <p className="text-[11px] text-gray-500">{show.first_air_date?.split("-")[0]}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── HIGHEST RATED PERFORMANCES ──────── */}
        {highestRated.length > 0 && (
          <section className="mt-14 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">
              Highest Rated
              <span className="text-gray-600 text-lg ml-2">Performances</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {highestRated.map((movie) => (
                <Link
                  key={movie.id + "-rated"}
                  to={`/movie/${movie.id}`}
                  className="group card-hover"
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 mb-2 relative">
                    {movie.poster_path ? (
                      <img
                        src={`${IMAGE_BASE}/w342${movie.poster_path}`}
                        alt={movie.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-700">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-2 right-2">
                      <RatingRing rating={movie.vote_average} size={34} strokeWidth={3} />
                    </div>
                  </div>
                  <p className="text-xs font-display tracking-wide line-clamp-1 uppercase">{movie.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── PHOTOS ─────────────────────────── */}
        {images.length > 1 && (
          <section className="mt-14 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Photos</h2>
            <div className="carousel-row no-scrollbar gap-3 pb-2">
              {images.map((img, i) => (
                <div key={i} className="shrink-0 w-36 md:w-44 tilt-card">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
                    <img
                      src={`${IMAGE_BASE}/w342${img.file_path}`}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FULL FILMOGRAPHY ───────────────── */}
        <section className="mt-14 reveal">
          <h2 className="font-display text-2xl tracking-wider mb-4 uppercase">Filmography</h2>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[...departments].map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveTab(dept)}
                className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === dept
                    ? "bg-red-600 text-white"
                    : "glass text-gray-400 hover:text-white"
                }`}
              >
                {dept}
                <span className="ml-1.5 text-[10px] opacity-60">
                  ({dept === "all" ? credits.cast.length + credits.crew.length + tvCredits.cast.length + tvCredits.crew.length
                    : dept === "acting" ? credits.cast.length + tvCredits.cast.length
                    : dept === "tv" ? tvCredits.cast.length + tvCredits.crew.length
                    : dept === "directing" ? [...credits.crew, ...tvCredits.crew].filter(c => c.job === "Director").length
                    : dept === "writing" ? [...credits.crew, ...tvCredits.crew].filter(c => c.department === "Writing").length
                    : [...credits.crew, ...tvCredits.crew].filter(c => c.department === "Production").length})
                </span>
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="space-y-2 max-w-4xl">
            {dedupedFilmography.slice(0, 50).map((item, i) => {
              const isTV = item._type === "tv";
              const year = (isTV ? item.first_air_date : item.release_date)?.split("-")[0] || "TBA";
              const title = isTV ? (item.name || item.original_name) : (item.title || item.original_title);
              const role = item.character || item.job || "";
              return (
                <Link
                  key={`${item.id}-${item._type}-${item.credit_id || i}`}
                  to={isTV ? `/show/${item.id}` : `/movie/${item.id}`}
                  className="group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/3 transition-colors"
                >
                  {/* Year */}
                  <span className="text-sm font-mono text-gray-600 w-12 shrink-0">{year}</span>

                  {/* Poster thumb */}
                  <div className="w-10 h-14 rounded bg-gray-900 overflow-hidden shrink-0">
                    {item.poster_path ? (
                      <img
                        src={`${IMAGE_BASE}/w92${item.poster_path}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium group-hover:text-white transition-colors truncate">
                      {isTV && <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-purple-600/30 text-purple-400 rounded mr-2 align-middle">TV</span>}
                      {title}
                    </p>
                    {role && (
                      <p className="text-xs text-gray-500 truncate">
                        {item.character ? `as ${role}` : role}
                      </p>
                    )}
                  </div>

                  {/* Rating */}
                  {item.vote_average > 0 && (
                    <div className="shrink-0 flex items-center gap-1 text-xs">
                      <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-gray-400 font-mono">{item.vote_average.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Arrow */}
                  <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
            {dedupedFilmography.length > 50 && (
              <p className="text-xs text-gray-600 text-center pt-2">
                + {dedupedFilmography.length - 50} more credits
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
