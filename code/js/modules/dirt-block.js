/* ========================================
   Dirt Block — 像素粒子背景装饰
   ======================================== */

/**
 * 初始化背景像素粒子（模拟 MC 下界灰烬，克制版）
 * @param {string} selector - 粒子容器选择器
 * @param {Object} options
 * @param {number} options.count - 粒子数量，默认 10
 * @param {number} options.minSize - 最小尺寸 px，默认 3
 * @param {number} options.maxSize - 最大尺寸 px，默认 6
 */
export function initParticles(selector, options = {}) {
  const {
    count = 10,
    minSize = 3,
    maxSize = 6,
  } = options;

  const container = document.querySelector(selector);
  if (!container) return;

  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'dirt-particle';

    const size = minSize + Math.random() * (maxSize - minSize);
    const left = Math.random() * 100;
    const delay = Math.random() * 10;          // 错开启动
    const duration = 12 + Math.random() * 18;   // 12–30s 缓慢上升

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
}
