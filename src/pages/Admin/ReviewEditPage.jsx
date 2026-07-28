import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewEditor from './ReviewEditor';
import {
  getMovie, getBook,
  createMovie, createBook,
  updateMovie, updateBook,
  deleteMovie, deleteBook,
  uploadMoviePoster, uploadBookCover,
} from '../../api';

/**
 * 编辑或新建影评/书评
 * URL: /admin/movies/:slug 或 /admin/books/:slug
 * 当 slug === 'new' 时为新建
 */
function ReviewEditPage({ type }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isNew = slug === 'new';
  const isMovie = type === 'movie';

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (isNew) { setItem(null); setLoading(false); return; }
    const fetcher = isMovie ? getMovie : getBook;
    fetcher(slug)
      .then((data) => {
        setItem({
          ...data,
          genre: Array.isArray(data.genre) ? data.genre.join(', ') : (data.genre || ''),
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
          cast: Array.isArray(data.cast) ? data.cast.join(', ') : (data.cast || ''),
        });
      })
      .catch(() => navigate(`/admin/${type}s`))
      .finally(() => setLoading(false));
  }, [slug, isNew, isMovie, navigate, type]);

  const handleSave = async (formData) => {
    setSaveError('');
    try {
      if (isNew) {
        const creator = isMovie ? createMovie : createBook;
        const result = await creator(formData);
        navigate(`/admin/${type}s/${result.slug}`, { replace: true });
      } else {
        const updater = isMovie ? updateMovie : updateBook;
        await updater(slug, formData);
        alert('已保存');
      }
    } catch (err) {
      setSaveError(err.message || '保存失败，请检查网络或重新登录');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除？此操作不可恢复。')) return;
    const deleter = isMovie ? deleteMovie : deleteBook;
    await deleter(slug);
    navigate(`/admin/${type}s`);
  };

  const handleUploadCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploader = isMovie ? uploadMoviePoster : uploadBookCover;
    const fd = new FormData();
    fd.append('image', file);
    const uploadResult = await uploader(slug, fd);
    setItem({ ...item, [isMovie ? 'poster' : 'cover']: uploadResult.src });
  };

  if (loading) return <div className="admin-container"><p>加载中...</p></div>;

  return (
    <div>
      <h1>{isNew ? (isMovie ? '新建影评' : '新建书评') : '编辑'}</h1>
      <hr />
      {!isNew && (
        <div className="admin-toolbar">
          <label className="admin-btn admin-btn-sm">
            上传{isMovie ? '海报' : '封面'}
            <input type="file" accept="image/*" onChange={handleUploadCover} hidden />
          </label>
          {item && <img src={item[isMovie ? 'poster' : 'cover'] || ''} alt="" className="admin-thumb" />}
        </div>
      )}
      {saveError && <p className="admin-error" style={{marginBottom: 'var(--space-md)'}}>{saveError}</p>}
      <ReviewEditor
        type={type}
        initial={item}
        onSave={handleSave}
        onDelete={isNew ? null : handleDelete}
      />
    </div>
  );
}

export default ReviewEditPage;
