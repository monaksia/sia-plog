import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { getBooks } from '../api';
import './Reviews.css';

function BookReviews() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooks()
      .then(setBooks)
      .catch(() => {
        import('../data/books').then((b) => setBooks(b.default));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>Books</h1>
      <p className="home-subtitle">阅读 · 思考 · 笔记</p>
      <hr />

      <div className="review-grid">
        {books.map((book) => (
          <Link to={`/books/${book.slug || book.id}`} key={book.slug || book.id} className="review-card">
            <div className="review-card-poster book-cover">
              <img src={book.cover || '/covers/book-placeholder.svg'} alt={book.title} loading="lazy" />
            </div>
            <div className="review-card-info">
              <h3 className="review-card-title">{book.title}</h3>
              <div className="review-card-meta">
                <span>{book.author}</span>
                <span className="meta-divider">|</span>
                <span>{book.year}</span>
              </div>
              <StarRating value={book.rating} size="sm" />
              <p className="review-card-excerpt">{book.excerpt}</p>
            </div>
          </Link>
        ))}
        {books.length === 0 && <p>还没有书评。</p>}
      </div>
    </div>
  );
}

export default BookReviews;
