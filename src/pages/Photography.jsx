import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPhotos } from '../api';
import './Photography.css';

function extractFilters(photos) {
  const set = new Set();
  set.add('all');
  photos.forEach((p) => {
    if (p.camera) {
      const brand = p.camera.split(' ')[0];
      if (brand && brand.length < 20) set.add(brand);
    }
    if (p.location) set.add(p.location);
    if (p.date_taken) {
      const year = p.date_taken.slice(0, 4);
      if (/^\d{4}$/.test(year)) set.add(year);
    }
  });
  return [...set];
}

function Photography() {
  const [photos, setPhotos] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getPhotos()
      .then(setPhotos)
      .catch(() => {
        import('../data/photos').then((p) => setPhotos(p.default));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && photos.length > 0) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [loading, photos.length]);

  const filters = useMemo(() => extractFilters(photos), [photos]);

  const filteredPhotos = useMemo(() => {
    if (filter === 'all') return photos;
    return photos.filter((p) => {
      const brand = p.camera ? p.camera.split(' ')[0] : '';
      return (
        brand === filter ||
        p.location === filter ||
        (p.date_taken && p.date_taken.slice(0, 4) === filter)
      );
    });
  }, [photos, filter]);

  const openLightbox = useCallback((index) => setLightbox(index), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const prev = useCallback((e) => {
    e.stopPropagation();
    setLightbox((p) => (p - 1 + filteredPhotos.length) % filteredPhotos.length);
  }, [filteredPhotos.length]);

  const next = useCallback((e) => {
    e.stopPropagation();
    setLightbox((p) => (p + 1) % filteredPhotos.length);
  }, [filteredPhotos.length]);

  // Keyboard + swipe
  useEffect(() => {
    if (lightbox === null) return;
    let touchStartX = 0;
    const onTouchStart = (e) => { touchStartX = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? next(e) : prev(e);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev(e);
      if (e.key === 'ArrowRight') next(e);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [lightbox, prev, next, closeLightbox]);

  if (loading) {
    return (
      <div className="photo-wall-container">
        <h1>Photography</h1>
        <p className="photo-subtitle">A visual journal</p>
        <p className="photo-loading">Loading&hellip;</p>
      </div>
    );
  }

  const hero = filteredPhotos[0];
  const spread = filteredPhotos.slice(1, 3);
  const grid = filteredPhotos.slice(3);

  return (
    <div className="photo-wall-container">
      <h1>Photography</h1>
      <p className="photo-subtitle">A visual journal</p>

      {/* Filter bar */}
      {filters.length > 1 && (
        <div className="photo-filter-bar">
          {filters.map((f) => (
            <button
              key={f}
              className={`photo-filter-pill${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      )}

      {filteredPhotos.length > 0 ? (
        <div className={`photo-magazine${visible ? ' visible' : ''}`}>
          {/* Hero — full-width cover image */}
          {hero && (
            <figure
              className="photo-hero reveal reveal-up"
              onClick={() => openLightbox(0)}
            >
              <img src={hero.src} alt={hero.alt || ''} loading="lazy" />
              <figcaption className="photo-figcaption">
                <span className="photo-fig-num">FIG. 01</span>
                {hero.alt && <span className="photo-fig-title">{hero.alt}</span>}
                <span className="photo-fig-meta">
                  {[hero.date_taken, hero.location, hero.camera].filter(Boolean).join(' · ')}
                </span>
              </figcaption>
            </figure>
          )}

          {/* Spread pair — side by side like a magazine spread */}
          {spread.length > 0 && (
            <div className="photo-spread">
              {spread.map((photo, i) => (
                <figure
                  key={photo.id || i}
                  className="photo-spread-item reveal reveal-up"
                  style={{ transitionDelay: `${(i + 1) * 100}ms` }}
                  onClick={() => openLightbox(i + 1)}
                >
                  <img src={photo.src} alt={photo.alt || ''} loading="lazy" />
                  <figcaption className="photo-figcaption">
                    <span className="photo-fig-num">FIG. {String(i + 2).padStart(2, '0')}</span>
                    {photo.alt && <span className="photo-fig-title">{photo.alt}</span>}
                    <span className="photo-fig-meta">
                      {[photo.date_taken, photo.location, photo.camera].filter(Boolean).join(' · ')}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {/* Grid — smaller photos in a gallery grid */}
          {grid.length > 0 && (
            <div className="photo-grid">
              {grid.map((photo, i) => (
                <figure
                  key={photo.id || i}
                  className="photo-grid-item reveal reveal-up"
                  style={{ transitionDelay: `${(i % 3) * 80}ms` }}
                  onClick={() => openLightbox(i + 3)}
                >
                  <img src={photo.thumb || photo.src} alt={photo.alt || ''} loading="lazy" />
                  <figcaption className="photo-figcaption">
                    <span className="photo-fig-num">FIG. {String(i + 4).padStart(2, '0')}</span>
                    {photo.alt && <span className="photo-fig-title">{photo.alt}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="photo-loading">还没有照片。</p>
      )}

      {/* Lightbox — enhanced with filmstrip */}
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="16,4 8,12 16,20" />
          </svg>
        </button>

        <button className="lightbox-next" onClick={next} aria-label="Next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="8,4 16,12 8,20" />
          </svg>
        </button>

        {lightbox !== null && filteredPhotos[lightbox] && (
          <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
            <img
              src={filteredPhotos[lightbox].src}
              alt={filteredPhotos[lightbox].alt || ''}
              className="lightbox-img"
            />

            {/* Editorial caption panel */}
            <div className="lightbox-caption">
              <div className="caption-line" />
              {filteredPhotos[lightbox].alt && (
                <p className="caption-title">{filteredPhotos[lightbox].alt}</p>
              )}
              <p className="caption-meta">
                {[
                  filteredPhotos[lightbox].date_taken,
                  filteredPhotos[lightbox].location,
                  filteredPhotos[lightbox].camera,
                ].filter(Boolean).join('  ·  ')}
              </p>
              {filteredPhotos[lightbox].notes && (
                <p className="caption-notes">{filteredPhotos[lightbox].notes}</p>
              )}
              <p className="caption-counter">
                FIG. {String(lightbox + 1).padStart(2, '0')} / {filteredPhotos.length}
              </p>
            </div>

            {/* Filmstrip thumbnails */}
            {filteredPhotos.length > 1 && (
              <div className="lightbox-filmstrip">
                {filteredPhotos.map((p, i) => (
                  <button
                    key={p.id || i}
                    className={`filmstrip-thumb${i === lightbox ? ' active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                  >
                    <img src={p.thumb || p.src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Photography;
