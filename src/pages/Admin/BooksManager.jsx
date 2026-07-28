import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBooks, createBook, deleteBook } from '../../api';

function BooksManager() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => getBooks().then(setBooks).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const handleDelete = async (slug) => {
    if (!confirm(`确定删除？`)) return;
    await deleteBook(slug);
    fetch();
  };

  if (loading) return <p>加载中...</p>;

  return (
    <div>
      <h1>Books</h1>
      <hr />
      <div className="admin-toolbar">
        <Link to="/admin/books/new" className="admin-btn">+ 新建书评</Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>封面</th><th>标题</th><th>评分</th><th>操作</th></tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id}>
              <td><img src={b.cover || '/covers/book-placeholder.svg'} alt="" className="admin-thumb book" /></td>
              <td>{b.title}</td>
              <td>{'★'.repeat(Math.round(b.rating))}</td>
              <td className="admin-actions">
                <Link to={`/admin/books/${b.slug}`}>编辑</Link>
                <button className="danger" onClick={() => handleDelete(b.slug)}>删除</button>
              </td>
            </tr>
          ))}
          {books.length === 0 && (
            <tr><td colSpan={4} className="empty-hint">还没有书评</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BooksManager;
