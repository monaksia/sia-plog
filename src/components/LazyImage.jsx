import { useState, useRef, useEffect } from 'react';

/**
 * 响应式懒加载图片组件，带模糊占位符过渡效果
 *
 * @param {string} srcSm   - 400w WebP
 * @param {string} srcMd   - 800w WebP
 * @param {string} srcLg   - 1200w WebP
 * @param {string} placeholder - 10px 模糊占位符
 * @param {string} fallback - 原始 PNG（WebP 不兼容时的回退）
 * @param {string} alt
 * @param {number} width   - 原始宽度
 * @param {string} title
 */
function LazyImage({
  srcSm,
  srcMd,
  srcLg,
  placeholder,
  fallback,
  alt = '',
  width,
  title,
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // 如果图片已在缓存中（instant load），直接跳过过渡
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete) {
      setLoaded(true);
    }
  }, []);

  return (
    <div className="lazy-image-wrapper">
      {/* 模糊占位符（微小图片拉伸 + CSS blur） */}
      <img
        className={`lazy-image-placeholder${loaded ? ' hidden' : ''}`}
        src={placeholder}
        alt=""
        aria-hidden="true"
        width={width}
      />

      <picture
        className={`lazy-image-picture${loaded ? ' loaded' : ''}`}
        onLoad={() => setLoaded(true)}
      >
        <source
          type="image/webp"
          srcSet={`${srcSm} 400w, ${srcMd} 800w, ${srcLg} 1200w`}
          sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
        />
        <img
          ref={imgRef}
          src={fallback}
          srcSet={`${fallback} 1200w`}
          sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
          alt={alt}
          title={title}
          loading="lazy"
          decoding="async"
          width={width}
          onLoad={() => setLoaded(true)}
        />
      </picture>
    </div>
  );
}

export default LazyImage;
