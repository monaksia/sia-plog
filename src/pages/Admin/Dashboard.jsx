import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPhotos, getMovies, getBooks } from '../../api';

function Dashboard() {
  const [counts, setCounts] = useState({ photos: '...', movies: '...', books: '...' });

  useEffect(() => {
    Promise.all([getPhotos(), getMovies(), getBooks()])
      .then(([p, m, b]) => setCounts({ photos: p.length, movies: m.length, books: b.length }))
      .catch(() => setCounts({ photos: '?', movies: '?', books: '?' }));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <hr />
      <div className="admin-stats">
        <Link to="/admin/photos" className="admin-stat-card">
          <span className="stat-icon">■</span>
          <span className="stat-num">{counts.photos}</span>
          <span className="stat-label">Photos</span>
        </Link>
        <Link to="/admin/movies" className="admin-stat-card">
          <span className="stat-icon">▶</span>
          <span className="stat-num">{counts.movies}</span>
          <span className="stat-label">Movies</span>
        </Link>
        <Link to="/admin/books" className="admin-stat-card">
          <span className="stat-icon">◆</span>
          <span className="stat-num">{counts.books}</span>
          <span className="stat-label">Books</span>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
