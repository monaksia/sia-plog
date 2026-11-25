import useResource from '../hooks/useResource';
import LoadError from '../components/LoadError';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const { data, loading, error, retry } = useResource(getPhotos);
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedPhoto = searchParams.get('photo');
  const photos = data || [];
  const [lightbox, setLightbox] = useState(null);
  const [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState('all');
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const openerId = useRef('');
  const touchStartX = useRef(null);

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

  useEffect(() => {
    if (!linkedPhoto || !data) return;
    const index = data.findIndex(photo => String(photo.id) === linkedPhoto);
    if (index < 0) return;
    openerId.current = `photo-${linkedPhoto}`;
    setFilter('all');
    setLightbox(index);
  }, [linkedPhoto, data]);

  const selectedPhoto = lightbox === null ? null : filteredPhotos[lightbox];
  const isOpen = Boolean(selectedPhoto);
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    closeRef.current.focus();
    return () => {
      dialog.close();
      document.getElementById(openerId.current)?.focus();
      touchStartX.current = null;
    };
  }, [isOpen]);

  const openLightbox = (index, event) => {
    openerId.current = event.currentTarget.id;
    setLightbox(index);
  };

  const closeLightbox = () => {
    setLightbox(null);
    if (linkedPhoto) {
      const params = new URLSearchParams(searchParams);
      params.delete('photo');
      setSearchParams(params, { replace: true, preventScrollReset: true });
    }
  };

  const moveLightbox = direction => {
    setLightbox(index => (index + direction + filteredPhotos.length) % filteredPhotos.length);
  };

  const handleLightboxKey = event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveLightbox(event.key === 'ArrowRight' ? 1 : -1);
  };

  const handleTouchEnd = event => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - event.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) > 50) moveLightbox(diff > 0 ? 1 : -1);
  };

  if (loading) {
    return (
      <div className="photo-wall-container">
        <h1>Photography</h1>
        <p className="photo-subtitle">A visual journal</p>
        <p className="photo-loading">Loading&hellip;</p>
      </div>
    );
  }

  if (error) return <div className="photo-wall-container"><h1>Photography</h1><LoadError error={error} retry={retry} /></div>;

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
              onClick={() => { setFilter(f); setLightbox(null); }}
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
            >
              <PhotoButton photo={hero} index={0} onOpen={openLightbox} sizes="(max-width: 640px) 100vw, 1200px" priority />
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
                >
                  <PhotoButton photo={photo} index={i + 1} onOpen={openLightbox} sizes="(max-width: 640px) 100vw, 50vw" />
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
                >
                  <PhotoButton photo={photo} index={i + 3} onOpen={openLightbox} sizes="(max-width: 640px) 100vw, 33vw" thumbnail />
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
      <dialog
        ref={dialogRef}
        className="lightbox"
        onClick={event => { if (event.target === event.currentTarget) closeLightbox(); }}
        onCancel={event => { event.preventDefault(); closeLightbox(); }}
        onKeyDown={handleLightboxKey}
        onTouchStart={event => { touchStartX.current = event.touches[0].clientX; }}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStartX.current = null; }}
        aria-label="Image preview"
      >
        <button ref={closeRef} type="button" className="lightbox-close" onClick={closeLightbox} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button type="button" className="lightbox-prev" onClick={() => moveLightbox(-1)} aria-label="Previous">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="16,4 8,12 16,20" />
          </svg>
        </button>

        <button type="button" className="lightbox-next" onClick={() => moveLightbox(1)} aria-label="Next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="8,4 16,12 8,20" />
          </svg>
        </button>

        {selectedPhoto && (
          <div className="lightbox-stage">
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.alt || ''}
              className="lightbox-img"
            />

            {/* Editorial caption panel */}
            <div className="lightbox-caption">
              <div className="caption-line" />
              {selectedPhoto.alt && (
                <p className="caption-title">{selectedPhoto.alt}</p>
              )}
              <p className="caption-meta">
                {[
                  selectedPhoto.date_taken,
                  selectedPhoto.location,
                  selectedPhoto.camera,
                ].filter(Boolean).join('  ·  ')}
              </p>
              {selectedPhoto.notes && (
                <p className="caption-notes">{selectedPhoto.notes}</p>
              )}
              <p className="caption-counter" aria-live="polite">
                FIG. {String(lightbox + 1).padStart(2, '0')} / {filteredPhotos.length}
              </p>
            </div>

            {/* Filmstrip thumbnails */}
            {filteredPhotos.length > 1 && (
              <div className="lightbox-filmstrip">
                {filteredPhotos.map((p, i) => (
                  <button
                    key={p.id || i}
                    type="button"
                    className={`filmstrip-thumb${i === lightbox ? ' active' : ''}`}
                    aria-label={p.alt || `Photo ${i + 1}`}
                    aria-current={i === lightbox ? 'true' : undefined}
                    onClick={() => setLightbox(i)}
                  >
                    <img src={p.thumb || p.src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}

function PhotoButton({ photo, index, onOpen, sizes, priority = false, thumbnail = false }) {
  const src = (thumbnail ? photo.thumb : photo.medium) || photo.src;
  const srcSet = photo.medium ? `${photo.thumb || photo.src} ${Math.min(photo.width || 2000, 400)}w, ${photo.medium} ${Math.min(photo.width || 2000, 1000)}w, ${photo.src} ${photo.width || 2000}w` : undefined;
  return (
    <button type="button" id={`photo-${photo.id}`} className="photo-open" aria-haspopup="dialog"
      aria-label={`View photo ${index + 1}${photo.alt ? `: ${photo.alt}` : ''}`}
      onClick={event => onOpen(index, event)}>
      <img src={src} srcSet={srcSet} sizes={sizes} alt="" width={photo.width} height={photo.height}
        loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />
    </button>
  );
}

export default Photography;
