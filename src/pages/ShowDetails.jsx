import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getTVDetails, getTVVideos, getTVCredits,
  getTVReviews, getTVContentRatings, getSimilarTV,
  getTVWatchProviders, getSeasonDetails, IMAGE_BASE,
} from "../services/api";
import RatingRing from "../components/RatingRing";
import TrailerModal from "../components/TrailerModal";
import { useScrollReveal } from "../hooks/useScrollReveal";

/* ── Helper: format date ────────────────── */
function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

/* ── Helper: runtime to text ────────────── */
function fmtRuntime(mins) {
  if (!mins || mins.length === 0) return null;
  const m = Array.isArray(mins) ? mins[0] : mins;
  if (!m) return null;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h > 0 ? `${h}h ${r}m` : `${r}m`;
}

export default function ShowDetailsPage({ watchlist, onToggleWatchlist }) {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [providers, setProviders] = useState(null);
  const [contentRatings, setContentRatings] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);

  const revealRef = useScrollReveal([show, credits]);

  useEffect(() => {
    setLoading(true);
    setShow(null);
    setSelectedSeason(null);
    setSeasonData(null);
    window.scrollTo({ top: 0, behavior: "instant" });
    Promise.all([
      getTVDetails(id),
      getTVCredits(id),
      getTVReviews(id),
      getSimilarTV(id),
      getTVWatchProviders(id),
      getTVContentRatings(id),
    ])
      .then(([s, creds, revs, sim, wp, cr]) => {
        setShow(s);
        setCredits({ cast: creds.cast?.slice(0, 30) || [], crew: creds.crew?.slice(0, 10) || [] });
        setReviews(revs.results?.slice(0, 5) || []);
        setSimilar(sim.results?.slice(0, 12) || []);
        const usProviders = wp.results?.US;
        setProviders(usProviders || null);
        setContentRatings(cr.results || []);
        if (s.seasons?.length > 0) {
          const firstReal = s.seasons.find(se => se.season_number > 0) || s.seasons[0];
          setSelectedSeason(firstReal.season_number);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Load season episodes
  useEffect(() => {
    if (selectedSeason === null || !id) return;
    setSeasonLoading(true);
    getSeasonDetails(id, selectedSeason)
      .then(setSeasonData)
      .catch(console.error)
      .finally(() => setSeasonLoading(false));
  }, [id, selectedSeason]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060b] page-enter">
        <div className="skeleton w-full h-[50vh]" />
        <div className="max-w-6xl mx-auto px-4 md:px-12 -mt-32 relative z-10 space-y-4">
          <div className="skeleton h-12 w-2/3 rounded" />
          <div className="skeleton h-6 w-1/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-full rounded" />
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="pt-24 text-center text-gray-500 font-serif text-lg">
        Show not found.
      </div>
    );
  }

  const backdrop = show.backdrop_path
    ? `${IMAGE_BASE}/original${show.backdrop_path}`
    : null;
  const poster = show.poster_path
    ? `${IMAGE_BASE}/w500${show.poster_path}`
    : null;
  const usRating = contentRatings.find(r => r.iso_3166_1 === "US")?.rating ||
    contentRatings[0]?.rating || null;
  const isInWatchlist = watchlist?.some((m) => m.id === show.id && m.media_type === "tv");
  const title = show.name;
  const year = show.first_air_date?.split("-")[0];
  const endYear = show.status === "Ended" || show.status === "Canceled"
    ? show.last_air_date?.split("-")[0] : null;
  const yearRange = endYear && endYear !== year ? `${year}–${endYear}` : year;
  const runtime = fmtRuntime(show.episode_run_time);
  const creators = show.created_by?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-[#06060b] film-grain page-enter" ref={revealRef}>
      {/* ── BACKDROP ─────────────────────────── */}
      {backdrop && (
        <div className="relative h-[50vh] md:h-[70vh] overflow-hidden">
          <img src={backdrop} alt={title} className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060b] via-[#06060b]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06060b]/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#06060b] to-transparent" />
        </div>
      )}

      <div className={`relative z-10 ${backdrop ? "-mt-48 md:-mt-64" : "pt-20"} pb-20 max-w-6xl mx-auto px-4 md:px-12`}>
        {/* ── HERO ────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-8 reveal">
          {poster && (
            <div className="shrink-0 mx-auto md:mx-0">
              <img
                src={poster}
                alt={title}
                className="w-48 md:w-64 rounded-xl shadow-2xl shadow-black/70 border border-white/5"
              />
            </div>
          )}

          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-3">
              <h1 className="font-display text-3xl md:text-5xl tracking-wider leading-none uppercase flex-1">
                {title}
              </h1>
              {usRating && (
                <span className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-bold text-gray-300 shrink-0 mt-1">
                  {usRating}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <RatingRing rating={show.vote_average} size={42} strokeWidth={3} />
              {yearRange && <span className="font-mono text-xs">{yearRange}</span>}
              {show.number_of_seasons && (
                <>
                  <span className="text-gray-700">•</span>
                  <span>{show.number_of_seasons} Season{show.number_of_seasons > 1 ? "s" : ""}</span>
                </>
              )}
              {show.number_of_episodes && (
                <>
                  <span className="text-gray-700">•</span>
                  <span>{show.number_of_episodes} Episodes</span>
                </>
              )}
              {runtime && (
                <>
                  <span className="text-gray-700">•</span>
                  <span>{runtime}/ep</span>
                </>
              )}
              {show.status && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  show.status === "Returning Series" ? "bg-green-600/20 text-green-400 border border-green-500/30"
                    : show.status === "Ended" ? "bg-gray-600/20 text-gray-400 border border-gray-500/30"
                    : "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30"
                }`}>
                  {show.status}
                </span>
              )}
            </div>

            {/* Genres */}
            {show.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {show.genres.map((g) => (
                  <span key={g.id} className="px-2.5 py-0.5 glass rounded text-xs text-gray-300 font-medium">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Tagline */}
            {show.tagline && (
              <p className="text-gray-500 italic font-serif text-sm">{show.tagline}</p>
            )}

            {/* Overview */}
            {show.overview && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-1">Overview</h3>
                <p className="text-gray-300 text-sm leading-relaxed font-body">{show.overview}</p>
              </div>
            )}

            {/* Creators */}
            {creators.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-1">Created By</h3>
                <div className="flex flex-wrap gap-3">
                  {creators.map((c) => (
                    <Link key={c.id} to={`/person/${c.id}`} className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Networks */}
            {show.networks?.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono">Network</span>
                {show.networks.map((n) => (
                  <span key={n.id} className="flex items-center gap-2">
                    {n.logo_path && (
                      <img src={`${IMAGE_BASE}/w92${n.logo_path}`} alt={n.name} className="h-5 object-contain brightness-0 invert opacity-60" />
                    )}
                    <span className="text-xs text-gray-400">{n.name}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  getTVVideos(show.id).then((data) => {
                    const yt = data.results?.find((v) => v.site === "YouTube" && v.type === "Trailer");
                    if (yt) setTrailerKey(yt.key);
                  });
                }}
                className="btn-glow inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Play Trailer
              </button>
              <button
                onClick={() => onToggleWatchlist?.({ ...show, media_type: "tv", title })}
                className={`btn-glow inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-colors ${
                  isInWatchlist
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "glass text-white hover:bg-white/20"
                }`}
              >
                <svg className="w-4 h-4" fill={isInWatchlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isInWatchlist ? "In My List" : "Add to List"}
              </button>
            </div>
          </div>
        </div>

        {/* ── SEASONS & EPISODES ─────────────── */}
        {show.seasons?.length > 0 && (
          <section className="mt-14 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-4 uppercase">
              Seasons & Episodes
            </h2>

            {/* Season tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {show.seasons.filter(s => s.season_number > 0).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeason(s.season_number)}
                  className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedSeason === s.season_number
                      ? "bg-purple-600 text-white"
                      : "glass text-gray-400 hover:text-white"
                  }`}
                >
                  S{s.season_number}
                  <span className="ml-1 text-[10px] opacity-60">({s.episode_count}ep)</span>
                </button>
              ))}
            </div>

            {/* Episodes list */}
            {seasonLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-24 rounded-lg" />
                ))}
              </div>
            ) : seasonData?.episodes?.length > 0 ? (
              <div className="space-y-3 max-w-4xl">
                {seasonData.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex gap-4 rounded-lg hover:bg-white/3 transition-colors p-3 group"
                  >
                    {/* Episode still */}
                    <div className="shrink-0 w-40 md:w-52 aspect-video rounded-md overflow-hidden bg-gray-900 relative">
                      {ep.still_path ? (
                        <img
                          src={`${IMAGE_BASE}/w300${ep.still_path}`}
                          alt={ep.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1.5">
                        <span className="text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-gray-300">
                          E{ep.episode_number}
                        </span>
                      </div>
                      {ep.runtime && (
                        <div className="absolute bottom-1 right-1.5">
                          <span className="text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-gray-400">
                            {ep.runtime}m
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Episode info */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors line-clamp-1">
                          {ep.name}
                        </h4>
                        {ep.vote_average > 0 && (
                          <span className="shrink-0 flex items-center gap-1 text-xs text-yellow-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {ep.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">{fmtDate(ep.air_date)}</p>
                      {ep.overview && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{ep.overview}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )}

        {/* ── CAST ───────────────────────────── */}
        {credits.cast.length > 0 && (
          <section className="mt-14 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Cast</h2>
            <div className="carousel-row no-scrollbar gap-4 pb-2">
              {credits.cast.map((person) => {
                const roles = person.roles?.map(r => r.character).filter(Boolean).join(", ");
                return (
                  <Link
                    key={person.id}
                    to={`/person/${person.id}`}
                    className="shrink-0 w-28 md:w-36 group text-center card-hover"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full overflow-hidden bg-gray-900 border-2 border-transparent group-hover:border-purple-500/50 transition-all duration-300">
                      {person.profile_path ? (
                        <img
                          src={`${IMAGE_BASE}/w185${person.profile_path}`}
                          alt={person.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-300 mt-2 line-clamp-1 group-hover:text-white transition-colors">{person.name}</p>
                    {roles && <p className="text-[10px] text-gray-600 line-clamp-1">{roles}</p>}
                    {person.total_episode_count && (
                      <p className="text-[9px] text-gray-700">{person.total_episode_count} ep</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── WHERE TO WATCH ─────────────────── */}
        {providers && (
          <section className="mt-14 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Where to Watch</h2>
            <div className="space-y-4">
              {providers.flatrate?.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">Stream</h4>
                  <div className="flex flex-wrap gap-3">
                    {providers.flatrate.map((p) => (
                      <div key={p.provider_id} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <img src={`${IMAGE_BASE}/w45${p.logo_path}`} alt={p.provider_name} className="w-8 h-8 rounded" />
                        <span className="text-xs text-gray-300">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {providers.buy?.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-mono mb-2">Buy</h4>
                  <div className="flex flex-wrap gap-3">
                    {providers.buy.map((p) => (
                      <div key={p.provider_id} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <img src={`${IMAGE_BASE}/w45${p.logo_path}`} alt={p.provider_name} className="w-8 h-8 rounded" />
                        <span className="text-xs text-gray-300">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── REVIEWS ────────────────────────── */}
        {reviews.length > 0 && (
          <section className="mt-14 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Reviews</h2>
            <div className="space-y-4 max-w-3xl">
              {reviews.map((review) => {
                const avatar = review.author_details?.avatar_path;
                const avatarUrl = avatar?.startsWith("/https")
                  ? avatar.slice(1)
                  : avatar
                    ? `${IMAGE_BASE}/w45${avatar}`
                    : null;
                const authorRating = review.author_details?.rating;
                return (
                  <div key={review.id} className="glass rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-gray-800 overflow-hidden shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-sm">
                            {review.author?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-200">{review.author}</p>
                        <p className="text-[10px] text-gray-600">{fmtDate(review.created_at)}</p>
                      </div>
                      {authorRating && (
                        <div className="ml-auto">
                          <RatingRing rating={authorRating} size={30} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-4">
                      {review.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SIMILAR SHOWS ──────────────────── */}
        {similar.length > 0 && (
          <section className="mt-14 reveal">
            <h2 className="font-display text-2xl tracking-wider mb-5 uppercase">Similar Shows</h2>
            <div className="carousel-row no-scrollbar gap-4 pb-2">
              {similar.map((s) => (
                <Link
                  key={s.id}
                  to={`/show/${s.id}`}
                  className="shrink-0 w-[200px] md:w-[240px] group card-hover"
                >
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-900 mb-2 relative">
                    {s.backdrop_path ? (
                      <img
                        src={`${IMAGE_BASE}/w500${s.backdrop_path}`}
                        alt={s.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : s.poster_path ? (
                      <img
                        src={`${IMAGE_BASE}/w342${s.poster_path}`}
                        alt={s.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    {s.vote_average > 0 && (
                      <div className="absolute top-2 right-2">
                        <RatingRing rating={s.vote_average} size={32} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-display tracking-wide line-clamp-1 uppercase">{s.name}</p>
                  <p className="text-[11px] text-gray-500">{s.first_air_date?.split("-")[0]}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Trailer Modal */}
      {trailerKey && (
        <TrailerModal
          videoKey={trailerKey}
          title={title}
          onClose={() => setTrailerKey(null)}
        />
      )}
    </div>
  );
}
