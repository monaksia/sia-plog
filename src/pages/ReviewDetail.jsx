import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import StarRating from '../components/StarRating';
import { getMovie, getBook } from '../api';
import staticMovies from '../data/movies';
import staticBooks from '../data/books';

function ReviewDetail({ type }) {
  const { id } = useParams();
  const isMovie = type === 'movie';
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetcher = isMovie ? getMovie : getBook;
    fetcher(id)
      .then(setItem)
      .catch(() => {
        // 后端不可用时回退到静态数据
        const found = (isMovie ? staticMovies : staticBooks).find((i) => i.id === id);
        setItem(found || null);
      })
      .finally(() => setLoading(false));
  }, [id, isMovie]);

  if (loading) return <div className="container"><p>Loading...</p></div>;

  if (!item) {
    return (
      <div className="container">
        <h1>Not Found</h1>
        <p>Review not found.</p>
        <Link to={`/${isMovie ? 'movies' : 'books'}`} className="review-detail-back">← Back</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to={`/${isMovie ? 'movies' : 'books'}`} className="review-detail-back">
        ← Back to {isMovie ? 'Movies' : 'Books'}
      </Link>

      <div className="review-detail-header">
        <div className={`review-detail-poster${isMovie ? '' : ' book-cover'}`}>
          <img
            src={isMovie ? (item.poster || '/covers/movie-placeholder.svg') : (item.cover || '/covers/book-placeholder.svg')}
            alt={item.title}
            loading="lazy"
          />
        </div>

        <div className="review-detail-meta">
          <h1>{item.title}</h1>
          {item.titleEn && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-dim)' }}>{item.titleEn}</p>
          )}
          <StarRating value={item.rating} size="md" />

          <div className="review-detail-info">
            {isMovie ? (
              <>
                {item.director && <p><strong>导演</strong> {item.director}</p>}
                {item.year && <p><strong>年份</strong> {item.year}</p>}
                {item.genre?.length > 0 && <p><strong>类型</strong> {Array.isArray(item.genre) ? item.genre.join(' / ') : item.genre}</p>}
                {item.cast?.length > 0 && <p><strong>主演</strong> {Array.isArray(item.cast) ? item.cast.join('、') : item.cast}</p>}
              </>
            ) : (
              <>
                {item.author && <p><strong>作者</strong> {item.author}</p>}
                {item.year && <p><strong>出版年</strong> {item.year}</p>}
                {item.publisher && <p><strong>出版社</strong> {item.publisher}</p>}
                {item.genre?.length > 0 && <p><strong>类型</strong> {Array.isArray(item.genre) ? item.genre.join(' / ') : item.genre}</p>}
              </>
            )}
          </div>

          {item.tags?.length > 0 && (
            <div className="review-tags">
              {(Array.isArray(item.tags) ? item.tags : []).map((tag) => (
                <span key={tag} className="review-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <hr />
      <div className="review-detail-body">
        <ReactMarkdown>{item.review || ''}</ReactMarkdown>
      </div>
    </div>
  );
}

export default ReviewDetail;
