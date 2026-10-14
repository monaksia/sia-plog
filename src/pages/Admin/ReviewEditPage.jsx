import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewEditor from './ReviewEditor';
import LoadError from '../../components/LoadError';
import useResource from '../../hooks/useResource';
import { getMovie, getBook, createMovie, createBook, updateMovie, updateBook,
  deleteMovie, deleteBook, uploadMoviePoster, uploadBookCover } from '../../api';

function ReviewEditPage({ type }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isNew = slug === 'new';
  const isMovie = type === 'movie';
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const load = useCallback(options => isNew ? Promise.resolve(null) : (isMovie ? getMovie : getBook)(slug, options), [slug, isNew, isMovie]);
  const { data, loading, error, retry } = useResource(load);
  const item = useMemo(() => data ? { ...data,
    genre: Array.isArray(data.genre) ? data.genre.join(', ') : data.genre || '',
    tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '',
    cast: Array.isArray(data.cast) ? data.cast.join(', ') : data.cast || '',
  } : null, [data]);
  useEffect(() => { setCoverUrl(data?.[isMovie ? 'poster' : 'cover'] || ''); setSaveError(''); setNotice(''); }, [data, isMovie]);
  const handleSave = async form => {
    setSaveError(''); setNotice('');
    try {
      // Cover uploads have their own endpoint; metadata saves must not restore an old cover URL.
      const { poster: _poster, cover: _cover, ...editable } = form;
      if (isNew) {
        const result = await (isMovie ? createMovie : createBook)(editable);
        navigate(`/admin/${type}s/${result.slug}`, { replace: true });
      } else { await (isMovie ? updateMovie : updateBook)(slug, editable); setNotice('已保存'); }
    } catch (err) { setSaveError(err.message); }
  };
  const handleDelete = async () => {
    if (!confirm('确定删除？此操作不可恢复。')) return;
    try { await (isMovie ? deleteMovie : deleteBook)(slug); navigate(`/admin/${type}s`); }
    catch (err) { setSaveError(err.message); }
  };
  const handleUploadCover = async e => {
    const input = e.target, file = input.files[0];
    if (!file) return;
    setUploading(true); setSaveError(''); setNotice('');
    try {
      const fd = new FormData(); fd.append('image', file);
      const result = await (isMovie ? uploadMoviePoster : uploadBookCover)(slug, fd);
      setCoverUrl(result.src); setNotice('封面已更新');
    } catch (err) { setSaveError(err.message); }
    finally { setUploading(false); input.value = ''; }
  };
  if (loading) return <p>加载中…</p>;
  if (error) return <LoadError error={error} retry={retry} />;
  return <div>
    <h1>{isNew ? (isMovie ? '新建影评' : '新建书评') : '编辑'}</h1><hr />
    {!isNew && <div className="admin-toolbar">
      <label className="admin-btn admin-btn-sm">{uploading ? '上传中…' : `上传${isMovie ? '海报' : '封面'}`}
        <input type="file" accept="image/*" onChange={handleUploadCover} disabled={uploading} hidden />
      </label>
      {coverUrl && <img src={coverUrl} alt="封面预览" className="admin-thumb" />}
    </div>}
    {saveError && <p role="alert" className="admin-error">{saveError}</p>}
    {notice && <p role="status">{notice}</p>}
    <ReviewEditor key={`${type}/${slug}`} type={type} initial={item} onSave={handleSave} onDelete={isNew ? null : handleDelete} />
  </div>;
}
export default ReviewEditPage;
