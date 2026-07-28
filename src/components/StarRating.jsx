/**
 * 像素风格星级评分组件
 * @param {number} value - 评分 1-5（支持小数如 4.5）
 * @param {number} max - 最高分，默认 5
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
function StarRating({ value = 0, max = 5, size = 'md' }) {
  const sizeClass = `star-rating-${size}`;

  return (
    <span className={`star-rating ${sizeClass}`} aria-label={`${value} / ${max} 星`}>
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} className="star" aria-hidden="true">
            <span className="star-bg">★</span>
            <span className="star-fill" style={{ width: `${fill * 100}%` }}>
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default StarRating;
