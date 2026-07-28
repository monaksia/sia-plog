import { useState, useEffect } from 'react';
import PhotoAlbum from 'react-photo-album';
import { getPhotos } from '../api';
import './Photography.css';

function Photography() {
  const [photos, setPhotos] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPhotos()
      .then(setPhotos)
      .catch(() => {
        // 后端不可用时回退到静态数据
        import('../data/photos').then((p) => setPhotos(p.default));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h1>📷 Photography</h1>
      <hr />
      <p>街拍 · 风光 · 日常碎片</p>

      {photos.length > 0 ? (
        <div className="photo-gallery">
          <PhotoAlbum
            photos={photos}
            layout="rows"
            targetRowHeight={300}
            spacing={8}
            onClick={({ index }) => setLightbox(index)}
          />
        </div>
      ) : (
        <p className="empty-hint">还没有照片。</p>
      )}

      {lightbox !== null && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)} role="dialog" aria-label="Image preview">
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
          <button className="lightbox-prev" onClick={(e) => {
            e.stopPropagation();
            setLightbox((lightbox - 1 + photos.length) % photos.length);
          }}>◀</button>
          <img
            src={photos[lightbox].src}
            alt={photos[lightbox].alt}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-next" onClick={(e) => {
            e.stopPropagation();
            setLightbox((lightbox + 1) % photos.length);
          }}>▶</button>
          <p className="lightbox-info">
            {photos[lightbox].alt}
            {photos[lightbox].camera && ` — ${photos[lightbox].camera}`}
          </p>
        </div>
      )}
    </div>
  );
}

export default Photography;
