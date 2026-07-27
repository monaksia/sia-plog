import { useEffect, useRef } from 'react';

/**
 * 像素粒子背景组件（模拟 MC 下界灰烬）
 * @param {number} count - 粒子数量
 * @param {number} minSize - 最小尺寸 px
 * @param {number} maxSize - 最大尺寸 px
 */
function ParticleBackground({ count = 10, minSize = 3, maxSize = 6 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'dirt-particle';

      const size = minSize + Math.random() * (maxSize - minSize);
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = 12 + Math.random() * 18;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        bottom: -${size + 2}px;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
      `;

      frag.appendChild(particle);
    }

    container.appendChild(frag);

    // 清理：组件卸载时移除所有粒子
    return () => {
      container.innerHTML = '';
    };
  }, [count, minSize, maxSize]);

  return <div id="particles" ref={containerRef} />;
}

export default ParticleBackground;
