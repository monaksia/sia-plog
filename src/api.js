const BASE = '/api';

let token = localStorage.getItem('token');

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}

export function getToken() {
  return token;
}

async function request(method, path, body) {
  const headers = {};
  if (body && body instanceof FormData) {
    // FormData 不设 Content-Type，浏览器自行拼接
  } else if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

// Auth
export const login = (username, password) => request('POST', '/auth/login', { username, password });
export const checkAuth = () => request('GET', '/auth/me');

// Photos
export const getPhotos = () => request('GET', '/photos');
export const uploadPhoto = (formData) => request('POST', '/photos', formData);
export const updatePhoto = (id, data) => request('PUT', `/photos/${id}`, data);
export const deletePhoto = (id) => request('DELETE', `/photos/${id}`);

// Movies
export const getMovies = () => request('GET', '/movies');
export const getMovie = (slug) => request('GET', `/movies/${slug}`);
export const createMovie = (data) => request('POST', '/movies', data);
export const updateMovie = (slug, data) => request('PUT', `/movies/${slug}`, data);
export const deleteMovie = (slug) => request('DELETE', `/movies/${slug}`);
export const uploadMoviePoster = (slug, formData) => request('POST', `/movies/${slug}/poster`, formData);

// Books
export const getBooks = () => request('GET', '/books');
export const getBook = (slug) => request('GET', `/books/${slug}`);
export const createBook = (data) => request('POST', '/books', data);
export const updateBook = (slug, data) => request('PUT', `/books/${slug}`, data);
export const deleteBook = (slug) => request('DELETE', `/books/${slug}`);
export const uploadBookCover = (slug, formData) => request('POST', `/books/${slug}/cover`, formData);
