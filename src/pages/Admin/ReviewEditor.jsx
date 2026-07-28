import { useState, useEffect } from 'react';

/**
 * 通用的影评/书评编辑器
 * @param {'movie' | 'book'} type
 * @param {object|null} initial - 编辑时传入已有数据
 * @param {function} onSave - 保存回调 (data) => Promise
 * @param {function} onDelete - 删除回调 () => Promise（仅编辑模式）
 */
function ReviewEditor({ type, initial, onSave, onDelete }) {
  const isMovie = type === 'movie';
  const [form, setForm] = useState(initial || getEmpty(isMovie));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm({ ...getEmpty(isMovie), ...initial });
  }, [initial, isMovie]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        rating: parseFloat(form.rating) || 0,
        year: parseInt(form.year) || null,
      });
    } finally {
      setSaving(false);
    }
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
            <input value={form[f] || ''} onChange={set(f)} />
          </label>
        ))}
        <label className="admin-editor-wide">
          <span>slug（URL 标识）</span>
          <input value={form.slug || ''} onChange={set('slug')} />
        </label>
        <label className="admin-editor-wide">
          <span>tags（逗号分隔）</span>
          <input
            value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags || ''}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </label>
        <label className="admin-editor-wide">
          <span>摘要</span>
          <textarea rows={2} value={form.excerpt || ''} onChange={set('excerpt')} />
        </label>
        <label className="admin-editor-wide">
          <span>正文（Markdown）</span>
          <textarea rows={12} value={form.review || ''} onChange={set('review')} />
        </label>
      </div>
      <div className="admin-editor-actions">
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? '保存中...' : 'Save'}
        </button>
        {onDelete && (
          <button type="button" className="admin-btn danger" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
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
