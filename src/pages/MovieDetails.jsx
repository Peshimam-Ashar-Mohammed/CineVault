import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getMovieDetails, getMovieVideos, getMovieCredits,
  getMovieReviews, getReleaseDates, getSimilarMovies, getWatchProviders, IMAGE_BASE,
} from "../services/api";
import RatingRing from "../components/RatingRing";
import { useScrollReveal } from "../hooks/useScrollReveal";

/* ── Helper: extract US certification ──────── */
function getCertification(releaseDates) {
  const us = releaseDates?.results?.find((r) => r.iso_3166_1 === "US");
  if (!us) {
    const first = releaseDates?.results?.[0];
    return first?.release_dates?.[0]?.certification || null;
  }
  return us.release_dates?.find((d) => d.certification)?.certification || null;
}

/* ── Rating descriptions by country ──────── */
const RATING_INFO = {
  US: {
    label: "United States (MPAA)",
    flag: "🇺🇸",
    ratings: {
      "G": { color: "bg-green-600", desc: "General Audiences — All ages admitted. Nothing that would offend parents for viewing by children." },
      "PG": { color: "bg-yellow-600", desc: "Parental Guidance Suggested — Some material may not be suitable for children. Parents urged to give guidance." },
      "PG-13": { color: "bg-orange-500", desc: "Parents Strongly Cautioned — Some material may be inappropriate for children under 13." },
      "R": { color: "bg-red-600", desc: "Restricted — Under 17 requires accompanying parent or adult guardian. Contains adult material." },
      "NC-17": { color: "bg-red-800", desc: "Adults Only — No one 17 and under admitted. Clearly adult content." },
      "NR": { color: "bg-gray-600", desc: "Not Rated — This film has not been submitted for a rating." },
    },
  },
  GB: {
    label: "United Kingdom (BBFC)",
    flag: "🇬🇧",
    ratings: {
      "U": { color: "bg-green-600", desc: "Universal — Suitable for all ages." },
      "PG": { color: "bg-yellow-600", desc: "Parental Guidance — General viewing, but some scenes may be unsuitable for young children." },
      "12A": { color: "bg-orange-500", desc: "Suitable for 12 years and over. Under 12s must be accompanied by an adult." },
      "12": { color: "bg-orange-500", desc: "Suitable for 12 years and over." },
      "15": { color: "bg-red-500", desc: "Suitable only for 15 years and over." },
      "18": { color: "bg-red-700", desc: "Suitable only for adults. No one under 18 admitted." },
      "R18": { color: "bg-red-900", desc: "Restricted 18 — Adults only, restricted distribution." },
    },
  },
  DE: {
    label: "Germany (FSK)",
    flag: "🇩🇪",
    ratings: {
      "0": { color: "bg-green-600", desc: "Approved without age restriction." },
      "6": { color: "bg-yellow-600", desc: "Approved for children 6 and older." },
      "12": { color: "bg-orange-500", desc: "Approved for children 12 and older." },
      "16": { color: "bg-red-500", desc: "Approved for teens 16 and older." },
      "18": { color: "bg-red-700", desc: "Not approved for young people." },
    },
  },
  AU: {
    label: "Australia",
    flag: "🇦🇺",
    ratings: {
      "G": { color: "bg-green-600", desc: "General — Suitable for all ages." },
      "PG": { color: "bg-yellow-600", desc: "Parental Guidance recommended for persons under 15." },
      "M": { color: "bg-orange-500", desc: "Mature — Recommended for audiences 15 and older." },
      "MA15+": { color: "bg-red-500", desc: "Mature Accompanied — Restricted to 15 and over." },
      "R18+": { color: "bg-red-700", desc: "Restricted to adults 18 and over." },
    },
  },
  BR: {
    label: "Brazil",
    flag: "🇧🇷",
    ratings: {
      "L": { color: "bg-green-600", desc: "General Audiences — Suitable for all ages." },
      "10": { color: "bg-yellow-600", desc: "Not recommended for under 10." },
      "12": { color: "bg-orange-500", desc: "Not recommended for under 12." },
      "14": { color: "bg-orange-600", desc: "Not recommended for under 14." },
      "16": { color: "bg-red-500", desc: "Not recommended for under 16." },
      "18": { color: "bg-red-700", desc: "Not recommended for under 18." },
    },
  },
  FR: {
    label: "France",
    flag: "🇫🇷",
    ratings: {
      "U": { color: "bg-green-600", desc: "Tous publics — Suitable for all audiences." },
      "10": { color: "bg-yellow-600", desc: "Not recommended for under 10." },
      "12": { color: "bg-orange-500", desc: "Not recommended for under 12." },
      "16": { color: "bg-red-500", desc: "Not recommended for under 16." },
      "18": { color: "bg-red-700", desc: "Restricted to adults." },
    },
  },
  IN: {
    label: "India (CBFC)",
    flag: "🇮🇳",
    ratings: {
      "U": { color: "bg-green-600", desc: "Unrestricted Public Exhibition — Suitable for all." },
      "UA": { color: "bg-yellow-600", desc: "Parental Guidance for children below 12." },
      "U/A": { color: "bg-yellow-600", desc: "Parental Guidance for children below 12." },
      "A": { color: "bg-red-600", desc: "Restricted to adult audiences." },
      "S": { color: "bg-red-800", desc: "Restricted to specialized audiences." },
    },
  },
  CA: {
    label: "Canada",
    flag: "🇨🇦",
    ratings: {
      "G": { color: "bg-green-600", desc: "General — Suitable for all ages." },
      "PG": { color: "bg-yellow-600", desc: "Parental Guidance advised." },
      "14A": { color: "bg-orange-500", desc: "Persons under 14 must be accompanied by an adult." },
      "18A": { color: "bg-red-500", desc: "Persons under 18 must be accompanied by an adult." },
      "R": { color: "bg-red-700", desc: "Restricted to 18 years and over." },
    },
  },
};

const PRIORITY_COUNTRIES = ["US", "GB", "CA", "AU", "DE", "FR", "BR", "IN"];

/* ── Content advisory based on genres & rating ── */
const GENRE_CONTENT = {
  28:  { category: "Violence & Gore", icon: "⚔️", note: "May contain intense action sequences and violence." },
  12:  { category: "Violence & Gore", icon: "⚔️", note: "May contain adventure peril and mild action violence." },
  16:  { category: "General", icon: "✨", note: "Animated content, typically suitable for broader audiences." },
  35:  { category: "Profanity", icon: "💬", note: "May contain crude humor and some language." },
  80:  { category: "Violence & Gore", icon: "🔪", note: "May contain criminal violence and mature themes." },
  99:  { category: "General", icon: "📖", note: "Documentary content — may include real-world disturbing footage." },
  18:  { category: "Frightening & Intense", icon: "😰", note: "May contain mature emotional themes and intense drama." },
  10751: { category: "General", icon: "👨‍👩‍👧‍👦", note: "Intended for family viewing." },
  14:  { category: "Frightening & Intense", icon: "🧙", note: "May contain fantasy violence and frightening creatures." },
  36:  { category: "Violence & Gore", icon: "📜", note: "May depict historical violence and war." },
  27:  { category: "Frightening & Intense", icon: "👻", note: "Likely contains horror elements, jump scares, and disturbing imagery." },
  10402: { category: "General", icon: "🎵", note: "Musical content, may contain suggestive performances." },
  9648: { category: "Frightening & Intense", icon: "🔍", note: "May contain suspenseful and psychologically tense scenes." },
  10749: { category: "Sex & Nudity", icon: "💕", note: "May contain romantic and sexual content." },
  878: { category: "Violence & Gore", icon: "🚀", note: "May contain sci-fi violence and intense imagery." },
  53:  { category: "Frightening & Intense", icon: "😱", note: "Likely contains intense suspense and potentially disturbing scenes." },
  10752: { category: "Violence & Gore", icon: "💣", note: "Likely contains graphic war violence and disturbing combat imagery." },
  37:  { category: "Violence & Gore", icon: "🤠", note: "May contain gun violence and Old West action." },
};

function getRatingLevel(cert) {
  const restrictedUS = ["R", "NC-17"];
  const cautionUS = ["PG-13"];
  const mildUS = ["PG"];
  if (!cert) return "unknown";
  if (restrictedUS.includes(cert)) return "severe";
  if (cautionUS.includes(cert)) return "moderate";
  if (mildUS.includes(cert)) return "mild";
  return "none";
}

function buildContentAdvisories(genres, cert) {
  const level = getRatingLevel(cert);
  const advisories = [
    { category: "Sex & Nudity", icon: "💋", items: [] },
    { category: "Violence & Gore", icon: "⚔️", items: [] },
    { category: "Profanity", icon: "🤬", items: [] },
    { category: "Alcohol, Drugs & Smoking", icon: "🍺", items: [] },
    { category: "Frightening & Intense", icon: "😨", items: [] },
  ];

  // Add genre-based advisories
  genres?.forEach((g) => {
    const info = GENRE_CONTENT[g.id];
    if (info) {
      const cat = advisories.find((a) => a.category === info.category);
      if (cat) cat.items.push(info.note);
      else advisories.find((a) => a.category === "Frightening & Intense")?.items.push(info.note);
    }
  });

  // Add rating-based general advisories
  if (level === "severe") {
    advisories[0].items.push("May contain explicit sexual content or strong nudity.");
    advisories[1].items.push("May contain strong bloody violence.");
    advisories[2].items.push("Likely contains pervasive strong language throughout.");
    advisories[3].items.push("May depict drug use.");
    advisories[4].items.push("May contain very intense and disturbing scenes.");
  } else if (level === "moderate") {
    advisories[0].items.push("May contain some sexual references or brief nudity.");
    advisories[1].items.push("May contain moderate intense violence.");
    advisories[2].items.push("May contain some strong language.");
    advisories[3].items.push("May contain some references to alcohol or drugs.");
  } else if (level === "mild") {
    advisories[0].items.push("May contain mild romantic content.");
    advisories[1].items.push("May contain some mild action or peril.");
    advisories[2].items.push("May contain some mild language.");
  }

  return advisories.filter((a) => a.items.length > 0);
}

function getSeverityLabel(cert) {
  const l = getRatingLevel(cert);
  if (l === "severe") return { text: "Severe", color: "text-red-400 bg-red-500/10 border-red-500/20" };
  if (l === "moderate") return { text: "Moderate", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" };
  if (l === "mild") return { text: "Mild", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };
  if (l === "none") return { text: "None", color: "text-green-400 bg-green-500/10 border-green-500/20" };
  return { text: "Unknown", color: "text-gray-400 bg-gray-500/10 border-gray-500/20" };
}

/* ── Helper: format date nicely ────────────── */
function fmtDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function MovieDetailsPage({ watchlist, onToggleWatchlist }) {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [certification, setCertification] = useState(null);
  const [allRatings, setAllRatings] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedReview, setExpandedReview] = useState(null);

  const revealRef = useScrollReveal([movie, cast, reviews, similar]);

  useEffect(() => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    Promise.all([
      getMovieDetails(id),
      getMovieVideos(id),
      getMovieCredits(id),
      getMovieReviews(id),
      getReleaseDates(id),
      getSimilarMovies(id),
      getWatchProviders(id),
    ])
      .then(([details, videos, credits, revs, releases, sim, wp]) => {
        setMovie(details);
        const yt = videos.results?.find(
          (v) => v.site === "YouTube" && v.type === "Trailer"
        );
        setTrailer(yt || videos.results?.[0] || null);
        setCast(credits.cast?.slice(0, 20) || []);
        setCrew(credits.crew?.filter(
          (c) => ["Director", "Writer", "Screenplay"].includes(c.job)
        )?.slice(0, 6) || []);
        setReviews(revs.results?.slice(0, 6) || []);
        setCertification(getCertification(releases));
        // Extract all country ratings for Parents Guide
        const ratings = [];
        for (const country of PRIORITY_COUNTRIES) {
          const entry = releases?.results?.find((r) => r.iso_3166_1 === country);
          if (entry) {
            const cert = entry.release_dates?.find((d) => d.certification)?.certification;
            if (cert) ratings.push({ country, cert });
          }
        }
        setAllRatings(ratings);
        setSimilar(sim.results?.slice(0, 12) || []);
        setProviders(wp.results?.US || wp.results?.GB || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Loading skeleton ────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060b] page-enter">
        <div className="skeleton w-full h-[55vh]" />
        <div className="max-w-6xl mx-auto px-4 md:px-12 -mt-32">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="skeleton w-48 md:w-64 aspect-[2/3] rounded-lg shrink-0" />
            <div className="flex-1 space-y-4 pt-4">
              <div className="skeleton h-10 w-3/4 rounded" />
              <div className="skeleton h-5 w-1/2 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="flex gap-3 pt-2">
                <div className="skeleton h-11 w-36 rounded" />
                <div className="skeleton h-11 w-28 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="pt-24 text-center text-gray-500 font-serif text-lg">
        Movie not found.
      </div>
    );
  }

  const poster = movie.poster_path ? `${IMAGE_BASE}/w780${movie.poster_path}` : null;
  const backdrop = movie.backdrop_path ? `${IMAGE_BASE}/original${movie.backdrop_path}` : null;
  const isInWatchlist = watchlist.some((m) => m.id === movie.id);
  const hours = Math.floor((movie.runtime || 0) / 60);
  const mins = (movie.runtime || 0) % 60;
  const director = crew.find((c) => c.job === "Director");

  return (
    <div className="min-h-screen bg-[#06060b] film-grain page-enter" ref={revealRef}>
      {/* ── BACKDROP HERO ────────────────────── */}
      {backdrop && (
        <div className="relative h-[55vh] md:h-[70vh] overflow-hidden">
          <img src={backdrop} alt="" className="w-full h-full object-cover object-top parallax-slow" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060b] via-[#06060b]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06060b]/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#06060b] to-transparent" />
        </div>
      )}

      <div className={`relative z-10 ${backdrop ? "-mt-52 md:-mt-72" : "pt-20"} pb-20 px-4 md:px-12 max-w-6xl mx-auto`}>
        {/* ── MAIN INFO ──────────────────────── */}
        <div className="flex flex-col md:flex-row gap-8 reveal">
          {/* Poster */}
          {poster && (
            <div className="shrink-0 mx-auto md:mx-0">
              <img
                src={poster}
                alt={movie.title}
                className="w-52 md:w-72 rounded-lg shadow-2xl shadow-black/70 border border-white/5 tilt-card"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 space-y-4 pt-2">
            {/* Title */}
            <h1 className="font-display text-4xl md:text-6xl tracking-wide leading-none uppercase">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="font-serif italic text-gray-500 text-sm md:text-base">
                "{movie.tagline}"
              </p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {certification && (
                <span className="px-2 py-0.5 border border-gray-500 text-gray-300 rounded text-xs font-bold tracking-wider">
                  {certification}
                </span>
              )}
              {movie.release_date && (
                <span className="text-gray-400">{movie.release_date.split("-")[0]}</span>
              )}
              {movie.runtime > 0 && (
                <>
                  <span className="text-gray-700">•</span>
                  <span className="text-gray-400">{hours}h {mins}m</span>
                </>
              )}
              {director && (
                <>
                  <span className="text-gray-700">•</span>
                  <span className="text-gray-400">Dir. <span className="text-gray-300 font-medium">{director.name}</span></span>
                </>
              )}
            </div>

            {/* Rating ring + vote count */}
            <div className="flex items-center gap-4">
              <RatingRing rating={movie.vote_average} size={60} strokeWidth={4} />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">User Score</p>
                <p className="text-sm text-gray-400">
                  {movie.vote_count?.toLocaleString()} votes
                </p>
              </div>
            </div>

            {/* Genres */}
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="glass rounded px-3 py-1 text-xs font-medium text-gray-300"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">Overview</h3>
              <p className="text-gray-300 text-sm md:text-[15px] leading-relaxed max-w-2xl font-body">
                {movie.overview}
              </p>
            </div>

            {/* Crew */}
            {crew.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 pt-1">
                {crew.map((c, i) => (
                  <div key={`${c.id}-${c.job}-${i}`}>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">{c.job}</p>
                    <p className="text-sm text-gray-300 font-medium">{c.name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {trailer && (
                <a
                  href="#trailer"
                  className="btn-glow inline-flex items-center gap-2 px-7 py-3 bg-white text-black rounded font-bold text-sm hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play Trailer
                </a>
              )}
              <button
                onClick={() => onToggleWatchlist(movie)}
                className={`btn-glow inline-flex items-center gap-2 px-6 py-3 rounded font-semibold text-sm transition-all border ${
                  isInWatchlist
                    ? "bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600/30"
                    : "glass text-gray-300 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill={isInWatchlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {isInWatchlist ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  )}
                </svg>
                {isInWatchlist ? "In My List" : "My List"}
              </button>
            </div>

            {/* Additional info chips */}
            <div className="flex flex-wrap gap-3 pt-2">
              {movie.budget > 0 && (
                <div className="glass rounded px-3 py-2 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Budget</p>
                  <p className="text-sm font-mono text-gray-300">${(movie.budget / 1_000_000).toFixed(0)}M</p>
                </div>
              )}
              {movie.revenue > 0 && (
                <div className="glass rounded px-3 py-2 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Revenue</p>
                  <p className="text-sm font-mono text-gray-300">${(movie.revenue / 1_000_000).toFixed(0)}M</p>
                </div>
              )}
              {movie.release_date && (
                <div className="glass rounded px-3 py-2 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Release</p>
                  <p className="text-sm font-mono text-gray-300">{fmtDate(movie.release_date)}</p>
                </div>
              )}
              {movie.original_language && (
                <div className="glass rounded px-3 py-2 text-center">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">Language</p>
                  <p className="text-sm font-mono text-gray-300 uppercase">{movie.original_language}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TRAILER ────────────────────────── */}
        {trailer && (
          <section className="mt-16 reveal" id="trailer">
            <h2 className="font-display text-2xl tracking-wider mb-4 uppercase">Trailer</h2>
            <div className="aspect-video max-w-4xl rounded-lg overflow-hidden bg-black border border-white/5 shadow-2xl shadow-black/40">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?rel=0`}
                title={trailer.name}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full"
              />
            </div>
          </section>
        )}

        {/* ── WHERE TO WATCH ─────────────────── */}
        {providers && (providers.flatrate?.length > 0 || providers.rent?.length > 0 || providers.buy?.length > 0) && (
          <section className="mt-16 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Where to Watch</h2>
            <div className="space-y-4 max-w-4xl">
              {providers.flatrate?.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">Stream</h3>
                  <div className="flex flex-wrap gap-3">
                    {providers.flatrate.map((p) => (
                      <div key={p.provider_id} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <img
                          src={`${IMAGE_BASE}/w45${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-8 h-8 rounded"
                        />
                        <span className="text-sm text-gray-300">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {providers.rent?.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">Rent</h3>
                  <div className="flex flex-wrap gap-3">
                    {providers.rent.map((p) => (
                      <div key={p.provider_id} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <img
                          src={`${IMAGE_BASE}/w45${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-8 h-8 rounded"
                        />
                        <span className="text-sm text-gray-300">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {providers.buy?.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">Buy</h3>
                  <div className="flex flex-wrap gap-3">
                    {providers.buy.map((p) => (
                      <div key={p.provider_id} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <img
                          src={`${IMAGE_BASE}/w45${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-8 h-8 rounded"
                        />
                        <span className="text-sm text-gray-300">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-600 mt-2">Data from JustWatch</p>
            </div>
          </section>
        )}

        {/* ── PARENTS GUIDE ──────────────────── */}
        {(allRatings.length > 0 || movie?.genres?.length > 0) && (
          <section className="mt-16 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Parents Guide</h2>
            <div className="max-w-4xl space-y-6">

              {/* Age Rating Overview */}
              {certification && (
                <div className="glass rounded-xl p-5 md:p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-display text-2xl tracking-wider ${
                      RATING_INFO.US?.ratings?.[certification]?.color || "bg-gray-600"
                    }`}>
                      {certification}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Rated {certification}</h3>
                      <p className="text-sm text-gray-400 mt-0.5 max-w-xl leading-relaxed">
                        {RATING_INFO.US?.ratings?.[certification]?.desc || "Rating information unavailable for this certification."}
                      </p>
                    </div>
                  </div>
                  {/* Severity Badge */}
                  {(() => {
                    const sev = getSeverityLabel(certification);
                    return (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sev.color}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        Overall Content Severity: {sev.text}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Certification by Country */}
              {allRatings.length > 1 && (
                <div>
                  <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-3">Certification by Country</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {allRatings.map(({ country, cert }) => {
                      const info = RATING_INFO[country];
                      const ratingInfo = info?.ratings?.[cert];
                      return (
                        <div
                          key={country}
                          className="glass rounded-lg px-3 py-3 group relative"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{info?.flag || "🏳️"}</span>
                            <span className="text-xs text-gray-500">{info?.label?.split("(")[0]?.trim() || country}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${ratingInfo?.color || "bg-gray-600"}`}>
                              {cert}
                            </span>
                          </div>
                          {/* Tooltip on hover */}
                          {ratingInfo?.desc && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 bg-[#0d0d14] border border-white/10 rounded-lg text-[11px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-xl leading-relaxed">
                              {ratingInfo.desc}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Content Advisories */}
              {(() => {
                const advisories = buildContentAdvisories(movie?.genres, certification);
                if (!advisories.length) return null;
                return (
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-3">Content Advisories</h3>
                    <div className="space-y-3">
                      {advisories.map((adv) => {
                        const level = getRatingLevel(certification);
                        const barColor = adv.category === "Sex & Nudity"
                          ? level === "severe" ? "bg-red-500" : level === "moderate" ? "bg-orange-400" : "bg-yellow-400"
                          : adv.category === "Violence & Gore"
                            ? level === "severe" ? "bg-red-500" : level === "moderate" ? "bg-orange-400" : "bg-yellow-400"
                            : adv.category === "Profanity"
                              ? level === "severe" ? "bg-red-500" : level === "moderate" ? "bg-orange-400" : "bg-yellow-400"
                              : adv.category === "Alcohol, Drugs & Smoking"
                                ? level === "severe" ? "bg-red-500" : "bg-orange-400"
                                : level === "severe" ? "bg-red-500" : level === "moderate" ? "bg-orange-400" : "bg-yellow-400";
                        const barWidth = level === "severe" ? "w-4/5" : level === "moderate" ? "w-3/5" : level === "mild" ? "w-2/5" : "w-1/5";

                        return (
                          <div key={adv.category} className="glass rounded-lg px-4 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{adv.icon}</span>
                                <span className="text-sm font-semibold text-gray-200">{adv.category}</span>
                              </div>
                              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${getSeverityLabel(certification).color}`}>
                                {getSeverityLabel(certification).text}
                              </span>
                            </div>
                            {/* Severity bar */}
                            <div className="w-full h-1.5 rounded-full bg-gray-800 mb-2.5 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${barColor} ${barWidth}`} />
                            </div>
                            <ul className="space-y-1">
                              {[...new Set(adv.items)].map((item, i) => (
                                <li key={i} className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                                  <span className="text-gray-600 mt-0.5">›</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <p className="text-[10px] text-gray-600">
                Content advisories are estimates based on the film's rating and genres. For official guidance, check your local ratings board.
              </p>
            </div>
          </section>
        )}

        {/* ── CAST ───────────────────────────── */}
        {cast.length > 0 && (
          <section className="mt-16 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Cast</h2>
            <div className="carousel-row no-scrollbar gap-4 pb-2">
              {cast.map((person) => (
                <Link
                  key={person.cast_id ?? person.credit_id}
                  to={`/person/${person.id}`}
                  className="shrink-0 w-28 md:w-32 tilt-card group"
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 mb-2 border-2 border-transparent group-hover:border-red-500/30 transition-all">
                    {person.profile_path ? (
                      <img
                        src={`${IMAGE_BASE}/w185${person.profile_path}`}
                        alt={person.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-200 line-clamp-1 group-hover:text-white transition-colors">{person.name}</p>
                  <p className="text-[11px] text-gray-500 line-clamp-1">{person.character}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── REVIEWS ────────────────────────── */}
        {reviews.length > 0 && (
          <section className="mt-16 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Reviews</h2>
            <div className="space-y-4 max-w-4xl">
              {reviews.map((review) => {
                const isExpanded = expandedReview === review.id;
                const avatar = review.author_details?.avatar_path
                  ? review.author_details.avatar_path.startsWith("/http")
                    ? review.author_details.avatar_path.slice(1)
                    : `${IMAGE_BASE}/w45${review.author_details.avatar_path}`
                  : null;
                const authorRating = review.author_details?.rating;

                return (
                  <div key={review.id} className="glass rounded-lg p-4 md:p-5">
                    {/* Author row */}
                    <div className="flex items-center gap-3 mb-3">
                      {avatar ? (
                        <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center text-xs font-bold uppercase">
                          {review.author?.[0] || "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">{review.author}</p>
                        <p className="text-[11px] text-gray-600">
                          {review.created_at ? fmtDate(review.created_at) : ""}
                        </p>
                      </div>
                      {authorRating && (
                        <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-0.5">
                          <svg className="w-3 h-3 text-yellow-400 star-sparkle" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-mono text-yellow-300">{authorRating}/10</span>
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <p className={`text-sm text-gray-400 leading-relaxed ${isExpanded ? "" : "line-clamp-4"}`}>
                      {review.content}
                    </p>
                    {review.content?.length > 300 && (
                      <button
                        onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                        className="text-xs text-red-400 hover:text-red-300 mt-2 font-medium transition-colors"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SIMILAR MOVIES ─────────────────── */}
        {similar.length > 0 && (
          <section className="mt-16 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">More Like This</h2>
            <div className="carousel-row no-scrollbar gap-3">
              {similar.filter((m) => m.backdrop_path).map((m) => (
                <Link
                  key={m.id}
                  to={`/movie/${m.id}`}
                  className="shrink-0 w-[260px] md:w-[320px] group relative overflow-hidden rounded-lg aspect-video card-hover"
                >
                  <img
                    src={`${IMAGE_BASE}/w780${m.backdrop_path}`}
                    alt={m.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-semibold line-clamp-1">{m.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{m.release_date?.split("-")[0]}</span>
                      {m.vote_average > 0 && (
                        <span className="text-[11px] text-yellow-400 flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {m.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
