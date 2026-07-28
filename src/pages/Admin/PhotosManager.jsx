import { useState, useEffect } from 'react';
import { getPhotos, uploadPhoto, updatePhoto, deletePhoto } from '../../api';

function PhotosManager() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetch = () => getPhotos().then(setPhotos).finally(() => setLoading(false));

  useEffect(() => { fetch(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('alt', file.name.replace(/\.[^.]+$/, ''));
    await uploadPhoto(fd);
    setUploading(false);
    fetch();
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return;
    await deletePhoto(id);
    fetch();
  };

  if (loading) return <p>加载中...</p>;

  return (
    <div>
      <h1>📷 Photos</h1>
      <hr />
      <div className="admin-toolbar">
        <label className="admin-btn">
          {uploading ? '上传中...' : '+ 上传照片'}
          <input type="file" accept="image/*" onChange={handleUpload} hidden />
        </label>
      </div>
      <div className="admin-photo-grid">
        {photos.map((p) => (
          <div key={p.id} className="admin-photo-item">
            <img src={p.src} alt={p.alt} />
            <div className="admin-photo-actions">
              <button onClick={async () => {
                const alt = prompt('描述', p.alt);
                if (alt !== null) { await updatePhoto(p.id, { alt }); fetch(); }
              }}>编辑</button>
              <button className="danger" onClick={() => handleDelete(p.id)}>删除</button>
            </div>
          </div>
        ))}
        {photos.length === 0 && <p className="empty-hint">还没有照片，点击上方按钮上传</p>}
      </div>
    </div>
  );
}

export default PhotosManager;
