import { useState, useEffect } from 'react';
import { getPhotos, uploadPhoto, updatePhoto, deletePhoto } from '../../api';

const INITIAL_EDIT = { alt: '', camera: '', location: '', date_taken: '', notes: '' };

function PhotosManager() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null); // { id, ...fields }
  const [editForm, setEditForm] = useState(INITIAL_EDIT);

  const fetch = () => getPhotos().then(setPhotos).finally(() => setLoading(false));

  useEffect(() => { fetch(); }, []);

  // Upload with optional metadata
  const [uploadError, setUploadError] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('alt', file.name.replace(/\.[^.]+$/, ''));
      await uploadPhoto(fd);
      fetch();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Open edit panel
  const startEdit = (p) => {
    setEditing(p.id);
    setEditForm({
      alt: p.alt || '',
      camera: p.camera || '',
      location: p.location || '',
      date_taken: p.date_taken || '',
      notes: p.notes || '',
    });
  };

  // Save edit
  const saveEdit = async () => {
    await updatePhoto(editing, editForm);
    setEditing(null);
    setEditForm(INITIAL_EDIT);
    fetch();
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return;
    await deletePhoto(id);
    fetch();
  };

  const setField = (key) => (e) => setEditForm({ ...editForm, [key]: e.target.value });

  if (loading) return <p>加载中...</p>;

  return (
    <div>
      <h1>Photos</h1>
      <hr />
      <div className="admin-toolbar">
        <label className="admin-btn">
          {uploading ? '上传中...' : '+ 上传照片'}
          <input type="file" accept="image/*" onChange={handleUpload} hidden />
        </label>
        {uploadError && <span className="admin-upload-error">{uploadError}</span>}
      </div>

      <div className="admin-photo-grid">
        {photos.map((p) => (
          <div key={p.id} className="admin-photo-item">
            <img src={p.thumb || p.src} alt={p.alt} loading="lazy" />
            {/* Metadata preview */}
            {(p.location || p.date_taken) && (
              <div className="photo-meta-preview">
                {p.date_taken && <span className="meta-date">{p.date_taken}</span>}
                {p.location && <span className="meta-loc">{p.location}</span>}
              </div>
            )}
            <div className="admin-photo-actions">
              <button onClick={() => startEdit(p)}>编辑</button>
              <button className="danger" onClick={() => handleDelete(p.id)}>删除</button>
            </div>
          </div>
        ))}
        {photos.length === 0 && <p className="empty-hint">还没有照片，点击上方按钮上传</p>}
      </div>

      {/* Edit modal */}
      {editing !== null && (
        <div className="photo-edit-overlay" onClick={() => setEditing(null)}>
          <div className="photo-edit-panel" onClick={(e) => e.stopPropagation()}>
            <h3>编辑照片信息</h3>
            <div className="photo-edit-grid">
              <label>
                <span>标题/描述</span>
                <input value={editForm.alt} onChange={setField('alt')} placeholder="例如：雨后的涩谷路口" />
              </label>
              <label>
                <span>相机</span>
                <input value={editForm.camera} onChange={setField('camera')} placeholder="例如：iPhone 15 Pro" />
              </label>
              <label>
                <span>拍摄地点</span>
                <input value={editForm.location} onChange={setField('location')} placeholder="例如：东京 · 涩谷" />
              </label>
              <label>
                <span>拍摄时间</span>
                <input value={editForm.date_taken} onChange={setField('date_taken')} placeholder="例如：2025.03.14" />
              </label>
              <label className="photo-edit-wide">
                <span>备注/感想</span>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={setField('notes')}
                  placeholder="简短的拍摄感想或故事..."
                />
              </label>
            </div>
            <div className="photo-edit-actions">
              <button className="admin-btn" onClick={saveEdit}>保存</button>
              <button className="admin-btn" onClick={() => setEditing(null)} style={{ background: 'transparent', color: 'var(--color-text-dim)', border: 'var(--border-thin)' }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotosManager;
