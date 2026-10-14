export default function LoadError({ error, retry }) {
  return <div role="alert" className="load-error">
    <p>{error?.message || '加载失败，请稍后重试。'}</p>
    <button type="button" className="admin-btn" onClick={retry}>重新加载</button>
  </div>;
}
