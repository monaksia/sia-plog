import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminMovies, deleteMovie } from '../../api';
import LoadError from '../../components/LoadError';
import useResource from '../../hooks/useResource';

function MoviesManager() {
  const { data: movies = [], loading, error, retry } = useResource(getAdminMovies);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async (slug) => {
    if (!confirm('确定删除？')) return;
    setDeleteError('');
    try { await deleteMovie(slug); retry(); }
    catch (err) { setDeleteError(err.message); }
  };

  if (loading) return <p>加载中...</p>;
  if (error) return <LoadError error={error} retry={retry} />;

  return (
    <div>
      <h1>Movies</h1>
      <hr />
      <div className="admin-toolbar">
        <Link to="/admin/movies/new" className="admin-btn">+ 新建影评</Link>
      </div>
      {deleteError && <p className="admin-error" role="alert">{deleteError}</p>}
      <table className="admin-table">
        <thead>
          <tr><th>海报</th><th>标题</th><th>评分</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody>
          {movies.map((m) => (
            <tr key={m.id}>
              <td><img src={m.poster || '/covers/movie-placeholder.svg'} alt="" className="admin-thumb" /></td>
              <td>{m.title}</td>
              <td>{'★'.repeat(Math.round(m.rating))}</td>
              <td className="admin-review-status">{m.status === 'draft' ? '草稿' : '已发布'}</td>
              <td className="admin-actions">
                <Link to={`/admin/movies/${encodeURIComponent(m.slug)}`}>编辑</Link>
                <button className="danger" onClick={() => handleDelete(m.slug)}>删除</button>
              </td>
            </tr>
          ))}
          {movies.length === 0 && (
            <tr><td colSpan={5} className="empty-hint">还没有影评</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default MoviesManager;
