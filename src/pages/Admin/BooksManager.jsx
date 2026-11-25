import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminBooks, deleteBook } from '../../api';
import LoadError from '../../components/LoadError';
import useResource from '../../hooks/useResource';

function BooksManager() {
  const { data: books = [], loading, error, retry } = useResource(getAdminBooks);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async (slug) => {
    if (!confirm('确定删除？')) return;
    setDeleteError('');
    try { await deleteBook(slug); retry(); }
    catch (err) { setDeleteError(err.message); }
  };

  if (loading) return <p>加载中...</p>;
  if (error) return <LoadError error={error} retry={retry} />;

  return (
    <div>
      <h1>Books</h1>
      <hr />
      <div className="admin-toolbar">
        <Link to="/admin/books/new" className="admin-btn">+ 新建书评</Link>
      </div>
      {deleteError && <p className="admin-error" role="alert">{deleteError}</p>}
      <table className="admin-table">
        <thead>
          <tr><th>封面</th><th>标题</th><th>评分</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id}>
              <td><img src={b.cover || '/covers/book-placeholder.svg'} alt="" className="admin-thumb book" /></td>
              <td>{b.title}</td>
              <td>{'★'.repeat(Math.round(b.rating))}</td>
              <td className="admin-review-status">{b.status === 'draft' ? '草稿' : '已发布'}</td>
              <td className="admin-actions">
                <Link to={`/admin/books/${encodeURIComponent(b.slug)}`}>编辑</Link>
                <button className="danger" onClick={() => handleDelete(b.slug)}>删除</button>
              </td>
            </tr>
          ))}
          {books.length === 0 && (
            <tr><td colSpan={5} className="empty-hint">还没有书评</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BooksManager;
