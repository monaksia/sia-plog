const BASE = '/api';
let token = localStorage.getItem('token');
export function setToken(value) {
  token = value;
  if (value) localStorage.setItem('token', value);
  else localStorage.removeItem('token');
}
export const getToken = () => token;
async function request(method, path, body, { signal } = {}) {
  const headers = {};
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, signal,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  const json = res.headers.get('Content-Type')?.includes('application/json');
  const data = json ? await res.json() : null;
  if (!res.ok || !json) {
    if (res.status === 401 && path !== '/auth/login') {
      setToken(null);
      window.dispatchEvent(new Event('auth-expired'));
    }
    const error = new Error(data?.error || '请求失败，请稍后重试');
    error.status = res.status;
    throw error;
  }
  return data;
}
export const login = (username, password) => request('POST', '/auth/login', { username, password });
export const checkAuth = () => request('GET', '/auth/me');
export const logout = () => request('POST', '/auth/logout');
export const getPhotos = options => request('GET', '/photos', undefined, options);
export const uploadPhoto = data => request('POST', '/photos', data);
export const updatePhoto = (id, data) => request('PUT', `/photos/${id}`, data);
export const deletePhoto = id => request('DELETE', `/photos/${id}`);
export const getMovies = options => request('GET', '/movies', undefined, options);
export const getMovie = (slug, options) => request('GET', `/movies/${encodeURIComponent(slug)}`, undefined, options);
export const createMovie = data => request('POST', '/movies', data);
export const updateMovie = (slug, data) => request('PUT', `/movies/${encodeURIComponent(slug)}`, data);
export const deleteMovie = slug => request('DELETE', `/movies/${encodeURIComponent(slug)}`);
export const uploadMoviePoster = (slug, data) => request('POST', `/movies/${encodeURIComponent(slug)}/poster`, data);
export const getBooks = options => request('GET', '/books', undefined, options);
export const getBook = (slug, options) => request('GET', `/books/${encodeURIComponent(slug)}`, undefined, options);
export const createBook = data => request('POST', '/books', data);
export const updateBook = (slug, data) => request('PUT', `/books/${encodeURIComponent(slug)}`, data);
export const deleteBook = slug => request('DELETE', `/books/${encodeURIComponent(slug)}`);
export const uploadBookCover = (slug, data) => request('POST', `/books/${encodeURIComponent(slug)}/cover`, data);
export const getLocalMusic = options => request('GET', '/music/local', undefined, options);
