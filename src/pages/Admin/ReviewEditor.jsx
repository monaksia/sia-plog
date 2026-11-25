import { useState, useEffect } from 'react';
import { ReviewArticle } from '../ReviewDetail';

/**
 * 通用的影评/书评编辑器
 * @param {'movie' | 'book'} type
 * @param {object|null} initial - 编辑时传入已有数据
 * @param {function} onSave - 保存回调 (data) => Promise
 * @param {function} onDelete - 删除回调 () => Promise（仅编辑模式）
 */
function ReviewEditor({ type, initial, status, coverUrl, busy, onSave, onDelete }) {
  const isMovie = type === 'movie';
  const [form, setForm] = useState(initial || getEmpty(isMovie));
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setForm({ ...getEmpty(isMovie), ...(initial || {}) });
  }, [initial, isMovie]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (busy) return;
    const nextStatus = e.nativeEvent.submitter?.value === 'publish' ? 'published' : status;
    onSave({
      ...form,
      rating: Number(form.rating),
      year: String(form.year ?? '').trim() === '' ? null : Number(form.year),
      status: nextStatus,
    });
  };

  const fields = isMovie
    ? ['title', 'title_en', 'director', 'cast', 'year', 'genre', 'rating']
    : ['title', 'title_en', 'author', 'publisher', 'year', 'genre', 'rating'];

  return (
    <form className="admin-editor" onSubmit={handleSubmit}>
      <div className="admin-editor-grid">
        {fields.map((f) => (
          <label key={f}>
            <span>{fieldLabel(f, isMovie)}</span>
            <input value={form[f] ?? ''} onChange={set(f)} required={f === 'title'} />
          </label>
        ))}
        <label className="admin-editor-wide">
          <span>网址标识{!initial && '（留空时按标题生成）'}</span>
          <input value={form.slug || ''} onChange={set('slug')} readOnly={Boolean(initial)} />
        </label>
        <label className="admin-editor-wide">
          <span>tags（逗号分隔）</span>
          <input
            value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags || ''}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </label>
        <label className="admin-editor-wide">
          <span id="review-excerpt-label">摘要</span>
          <textarea aria-labelledby="review-excerpt-label" rows={2} value={form.excerpt || ''} onChange={set('excerpt')} />
        </label>
        <label className="admin-editor-wide">
          <span id="review-text-label">正文（Markdown）</span>
          <textarea aria-labelledby="review-text-label" rows={12} value={form.review || ''} onChange={set('review')} />
        </label>
      </div>
      <div className="admin-editor-actions">
        <button type="submit" className="admin-btn" disabled={busy}>
          {status === 'draft' ? '保存草稿' : '保存修改'}
        </button>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowPreview(open => !open)} aria-expanded={showPreview} aria-controls="review-preview">
          {showPreview ? '收起预览' : '预览'}
        </button>
        {initial && status === 'draft' && (
          <button type="submit" value="publish" className="admin-btn" disabled={busy}>发布</button>
        )}
        {onDelete && (
          <button type="button" className="admin-btn danger" onClick={onDelete} disabled={busy}>
            删除
          </button>
        )}
      </div>
      <section id="review-preview" className="admin-review-preview" hidden={!showPreview} aria-labelledby="review-preview-heading">
        {showPreview && <>
          <h2 id="review-preview-heading">文章预览</h2>
          <ReviewArticle type={type} preview item={{
            ...form,
            title: form.title.trim() || '未填写标题',
            [isMovie ? 'poster' : 'cover']: coverUrl,
            cast: form.cast?.split(',').map(value => value.trim()).filter(Boolean),
            genre: form.genre?.split(',').map(value => value.trim()).filter(Boolean),
            tags: form.tags?.split(',').map(value => value.trim()).filter(Boolean),
            rating: Number(form.rating) || 0,
          }} />
        </>}
      </section>
    </form>
  );
}

function getEmpty(isMovie) {
  return {
    slug: '', title: '', title_en: '', year: '', rating: '', genre: '', tags: '', excerpt: '', review: '',
    ...(isMovie
      ? { director: '', cast: '', poster: '' }
      : { author: '', publisher: '', cover: '' }),
  };
}

function fieldLabel(f, isMovie) {
  const map = {
    title: '标题', title_en: '英文标题', year: '年份', rating: '评分 (0-5)', genre: '类型', tags: '标签',
    ...(isMovie
      ? { director: '导演', cast: '主演（逗号分隔）' }
      : { author: '作者', publisher: '出版社' }),
  };
  return map[f] || f;
}

export default ReviewEditor;
