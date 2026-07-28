import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { getMovies } from '../api';
import './Reviews.css';

function MovieReviews() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMovies()
      .then(setMovies)
      .catch(() => {
        // 后端不可用时回退到静态数据
        import('../data/movies').then((m) => setMovies(m.default));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>🎬 Movie Reviews</h1>
      <hr />
      <p>电影 · 剧集 · 纪录片</p>

      <div className="review-grid">
        {movies.map((movie) => (
          <Link to={`/movies/${movie.slug || movie.id}`} key={movie.slug || movie.id} className="review-card">
            <div className="review-card-poster">
              <img src={movie.poster || '/covers/movie-placeholder.svg'} alt={movie.title} loading="lazy" />
            </div>
            <div className="review-card-info">
              <h3 className="review-card-title">{movie.title}</h3>
              <div className="review-card-meta">
                <span>{movie.year}</span>
                <span className="meta-divider">|</span>
                <span>{movie.director}</span>
              </div>
              <StarRating value={movie.rating} size="sm" />
              <p className="review-card-excerpt">{movie.excerpt}</p>
            </div>
          </Link>
        ))}
        {movies.length === 0 && <p>还没有影评。</p>}
      </div>
    </div>
  );
}

export default MovieReviews;
