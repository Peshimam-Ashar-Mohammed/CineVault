import axios from "axios";

const API_KEY = "9ff029ede699ebff267a9c6dc6ffe10b";
const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE = "https://image.tmdb.org/t/p";

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY },
});

// ── Trending ───────────────────────────────────────────────
export const getTrending = (page = 1) =>
  tmdb.get("/trending/movie/day", { params: { page } }).then((r) => r.data);

// ── Popular ────────────────────────────────────────────────
export const getPopular = (page = 1) =>
  tmdb.get("/movie/popular", { params: { page } }).then((r) => r.data);

// ── Top Rated ──────────────────────────────────────────────
export const getTopRated = (page = 1) =>
  tmdb.get("/movie/top_rated", { params: { page } }).then((r) => r.data);

// ── Search ─────────────────────────────────────────────────
export const searchMovies = (query, page = 1) =>
  tmdb
    .get("/search/movie", { params: { query, page } })
    .then((r) => r.data);

// ── Multi Search (movies + people) ─────────────────────────
export const searchMulti = (query, page = 1) =>
  tmdb
    .get("/search/multi", { params: { query, page } })
    .then((r) => r.data);

// ── Search People ──────────────────────────────────────────
export const searchPeople = (query, page = 1) =>
  tmdb
    .get("/search/person", { params: { query, page } })
    .then((r) => r.data);

// ── Person Details ─────────────────────────────────────────
export const getPersonDetails = (id) =>
  tmdb.get(`/person/${id}`).then((r) => r.data);

// ── Person Movie Credits ───────────────────────────────────
export const getPersonMovieCredits = (id) =>
  tmdb.get(`/person/${id}/movie_credits`).then((r) => r.data);

// ── Person Images ──────────────────────────────────────────
export const getPersonImages = (id) =>
  tmdb.get(`/person/${id}/images`).then((r) => r.data);

// ── Person External IDs ────────────────────────────────────
export const getPersonExternalIds = (id) =>
  tmdb.get(`/person/${id}/external_ids`).then((r) => r.data);

// ── Now Playing ────────────────────────────────────────────
export const getNowPlaying = (page = 1) =>
  tmdb.get("/movie/now_playing", { params: { page } }).then((r) => r.data);

// ── Upcoming ───────────────────────────────────────────────
export const getUpcoming = (page = 1) =>
  tmdb.get("/movie/upcoming", { params: { page } }).then((r) => r.data);

// ── Trending People ────────────────────────────────────────
export const getTrendingPeople = () =>
  tmdb.get("/trending/person/week").then((r) => r.data);

// ── Movie Details ──────────────────────────────────────────
export const getMovieDetails = (id) =>
  tmdb.get(`/movie/${id}`).then((r) => r.data);

// ── Movie Videos (trailers) ────────────────────────────────
export const getMovieVideos = (id) =>
  tmdb.get(`/movie/${id}/videos`).then((r) => r.data);

// ── Movie Credits (cast & crew) ────────────────────────────
export const getMovieCredits = (id) =>
  tmdb.get(`/movie/${id}/credits`).then((r) => r.data);

// ── Movie Reviews ──────────────────────────────────────────
export const getMovieReviews = (id, page = 1) =>
  tmdb.get(`/movie/${id}/reviews`, { params: { page } }).then((r) => r.data);

// ── Content Ratings / Release Dates ────────────────────────
export const getReleaseDates = (id) =>
  tmdb.get(`/movie/${id}/release_dates`).then((r) => r.data);

// ── Similar Movies ──────────────────────────────────────────
export const getSimilarMovies = (id) =>
  tmdb.get(`/movie/${id}/similar`).then((r) => r.data);

// ── Genre List ─────────────────────────────────────────────
export const getGenres = () =>
  tmdb.get("/genre/movie/list").then((r) => r.data.genres);

// ── Discover by Genre ──────────────────────────────────────
export const discoverByGenre = (genreId, page = 1) =>
  tmdb
    .get("/discover/movie", { params: { with_genres: genreId, page } })
    .then((r) => r.data);

// ── Discover Movies (advanced) ─────────────────────────────
export const discoverMovies = (params = {}) =>
  tmdb.get("/discover/movie", { params }).then((r) => r.data);

// ── Search Companies ───────────────────────────────────────
export const searchCompanies = (query, page = 1) =>
  tmdb.get("/search/company", { params: { query, page } }).then((r) => r.data);

// ── Company Details ────────────────────────────────────────
export const getCompanyDetails = (id) =>
  tmdb.get(`/company/${id}`).then((r) => r.data);

// ── Discover by Company ────────────────────────────────────
export const discoverByCompany = (companyId, page = 1) =>
  tmdb
    .get("/discover/movie", { params: { with_companies: companyId, page, sort_by: "popularity.desc" } })
    .then((r) => r.data);

// ── Watch Providers ────────────────────────────────────────
export const getWatchProviders = (id) =>
  tmdb.get(`/movie/${id}/watch/providers`).then((r) => r.data);

// ── Search Keywords ────────────────────────────────────────
export const searchKeywords = (query) =>
  tmdb.get("/search/keyword", { params: { query } }).then((r) => r.data);

// ── Discover by Keyword ────────────────────────────────────
export const discoverByKeyword = (keywordId, page = 1) =>
  tmdb
    .get("/discover/movie", { params: { with_keywords: keywordId, page, sort_by: "popularity.desc" } })
    .then((r) => r.data);
