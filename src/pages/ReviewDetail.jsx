import { useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import StarRating from '../components/StarRating';
import { getMovie, getBook } from '../api';
import useResource from '../hooks/useResource';
import LoadError from '../components/LoadError';

function ReviewDetail({ type }) {
  const { id } = useParams();
  const isMovie = type === 'movie';
  const load = useCallback(options => (isMovie ? getMovie : getBook)(id, options), [id, isMovie]);
  const { data: item, loading, error, retry } = useResource(load);
  useEffect(() => {
    const original = document.title;
    if (item) {
      document.title = `${item.title} — Sia Plog`;
      const description = document.querySelector('meta[name="description"]');
      const previous = description?.content;
      if (description) description.content = item.excerpt || item.title;
      return () => { document.title = original; if (description) description.content = previous; };
    }
  }, [item]);

  if (loading) return <div className="container"><p>Loading&hellip;</p></div>;

  if (error && error.status !== 404) return <div className="container"><LoadError error={error} retry={retry} /></div>;

  if (!item) {
    return (
      <div className="container">
        <h1>Not Found</h1>
        <p>Review not found.</p>
        <Link to={`/${isMovie ? 'movies' : 'books'}`} className="review-detail-back">
          &larr; {isMovie ? 'Movies' : 'Books'}
        </Link>
      </div>
    );
  }

  const genreText = Array.isArray(item.genre) ? item.genre.join(' · ') : item.genre;
  const tags = Array.isArray(item.tags) ? item.tags : [];

  return (
    <div className="container">
      {/* Editorial breadcrumb */}
      <Link to={`/${isMovie ? 'movies' : 'books'}`} className="review-detail-back">
        &larr; {isMovie ? 'Movies' : 'Books'}
      </Link>

      {/* Magazine article header */}
      <div className="review-detail-header">
        <div className={`review-detail-poster${isMovie ? '' : ' book-cover'}`}>
          <img
            src={
              isMovie
                ? (item.poster || '/covers/movie-placeholder.svg')
                : (item.cover || '/covers/book-placeholder.svg')
            }
            alt={item.title}
            loading="lazy"
          />
        </div>

        <div className="review-detail-meta">
          <h1>{item.title}</h1>
          {(item.titleEn || item.title_en) && (
            <p className="review-detail-title-en">{item.titleEn || item.title_en}</p>
          )}

          <StarRating value={item.rating} size="md" />

          {/* Editorial byline */}
          <div className="review-detail-info">
            {isMovie ? (
              <>
                {item.director && <p><strong>Director</strong> {item.director}</p>}
                {item.year && <p><strong>Year</strong> {item.year}</p>}
                {genreText && <p><strong>Genre</strong> {genreText}</p>}
                {item.cast?.length > 0 && (
                  <p><strong>Cast</strong> {Array.isArray(item.cast) ? item.cast.join(' · ') : item.cast}</p>
                )}
              </>
            ) : (
              <>
                {item.author && <p><strong>Author</strong> {item.author}</p>}
                {item.year && <p><strong>Year</strong> {item.year}</p>}
                {item.publisher && <p><strong>Publisher</strong> {item.publisher}</p>}
                {genreText && <p><strong>Genre</strong> {genreText}</p>}
              </>
            )}
          </div>

          {tags.length > 0 && (
            <div className="review-tags">
              {tags.map((tag) => (
                <span key={tag} className="review-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <hr />

      {/* Magazine article body */}
      <div className="review-detail-body">
        <ReactMarkdown>{item.review || ''}</ReactMarkdown>
      </div>
    </div>
  );
}

export default ReviewDetail;
