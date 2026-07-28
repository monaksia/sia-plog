import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMovies, createMovie, deleteMovie } from '../../api';

function MoviesManager() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => getMovies().then(setMovies).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const handleDelete = async (slug) => {
    if (!confirm(`确定删除？`)) return;
    await deleteMovie(slug);
    fetch();
  };

  if (loading) return <p>加载中...</p>;

  return (
    <div>
      <h1>🎬 Movies</h1>
      <hr />
      <div className="admin-toolbar">
        <Link to="/admin/movies/new" className="admin-btn">+ 新建影评</Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>海报</th><th>标题</th><th>评分</th><th>操作</th></tr>
        </thead>
        <tbody>
          {movies.map((m) => (
            <tr key={m.id}>
              <td><img src={m.poster || '/covers/movie-placeholder.svg'} alt="" className="admin-thumb" /></td>
              <td>{m.title}</td>
              <td>{'★'.repeat(Math.round(m.rating))}</td>
              <td className="admin-actions">
                <Link to={`/admin/movies/${m.slug}`}>编辑</Link>
                <button className="danger" onClick={() => handleDelete(m.slug)}>删除</button>
              </td>
            </tr>
          ))}
          {movies.length === 0 && (
            <tr><td colSpan={4} className="empty-hint">还没有影评</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default MoviesManager;
