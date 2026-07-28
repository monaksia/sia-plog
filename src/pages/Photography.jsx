import { useState, useEffect, useCallback } from 'react';
import { getPhotos } from '../api';
import './Photography.css';

function Photography() {
  const [photos, setPhotos] = useState([]);
  const [lightbox, setLightbox] = useState(null); // index or null
  const [visible, setVisible] = useState(false);   // animation trigger
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPhotos()
      .then(setPhotos)
      .catch(() => {
        import('../data/photos').then((p) => setPhotos(p.default));
      })
      .finally(() => setLoading(false));
  }, []);

  // Staggered entrance after mount
  useEffect(() => {
    if (!loading && photos.length > 0) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [loading, photos.length]);

  const openLightbox = useCallback((index) => {
    setLightbox(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  const prev = useCallback((e) => {
    e.stopPropagation();
    setLightbox((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback((e) => {
    e.stopPropagation();
    setLightbox((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  // Keyboard nav
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') setLightbox((p) => (p - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') setLightbox((p) => (p + 1) % photos.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, photos.length, closeLightbox]);

  if (loading) {
    return (
      <div className="photo-wall-container">
        <h1>Photography</h1>
        <p className="photo-subtitle">街拍 · 风光 · 日常碎片</p>
        <p className="photo-loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="photo-wall-container">
      <h1>Photography</h1>
      <p className="photo-subtitle">街拍 · 风光 · 日常碎片</p>

      {photos.length > 0 ? (
        <div className={`photo-wall${visible ? ' visible' : ''}`}>
          {photos.map((photo, i) => (
            <figure
              key={photo.id || i}
              className="photo-wall-item"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => openLightbox(i)}
            >
              <img
                src={photo.src}
                alt={photo.alt || ''}
                loading="lazy"
              />
              {(photo.alt || photo.camera) && (
                <figcaption className="photo-wall-caption">
                  <span className="caption-title">{photo.alt}</span>
                  {photo.camera && <span className="caption-cam">{photo.camera}</span>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <p className="photo-loading">还没有照片。</p>
      )}

      {/* Lightbox */}
      <div
        className={`lightbox${lightbox !== null ? ' open' : ''}`}
        onClick={closeLightbox}
        role="dialog"
        aria-label="Image preview"
      >
        <button className="lightbox-close" onClick={closeLightbox} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button className="lightbox-prev" onClick={prev} aria-label="Previous">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="15,4 7,12 15,20" />
          </svg>
        </button>

        <button className="lightbox-next" onClick={next} aria-label="Next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="9,4 17,12 9,20" />
          </svg>
        </button>

        {lightbox !== null && photos[lightbox] && (
          <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[lightbox].src}
              alt={photos[lightbox].alt || ''}
              className="lightbox-img"
            />

            {/* Magnum-style info panel */}
            {(photos[lightbox].alt || photos[lightbox].location || photos[lightbox].date_taken || photos[lightbox].camera || photos[lightbox].notes) && (
              <div className="lightbox-caption">
                <div className="caption-line" />

                {photos[lightbox].alt && (
                  <p className="caption-title">{photos[lightbox].alt}</p>
                )}

                <p className="caption-meta">
                  {[
                    photos[lightbox].date_taken,
                    photos[lightbox].location,
                    photos[lightbox].camera,
                  ].filter(Boolean).join('  ·  ')}
                  {!photos[lightbox].date_taken && !photos[lightbox].location && !photos[lightbox].camera && ''}
                </p>

                {photos[lightbox].notes && (
                  <p className="caption-notes">{photos[lightbox].notes}</p>
                )}

                <p className="caption-counter">{lightbox + 1} / {photos.length}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Photography;
