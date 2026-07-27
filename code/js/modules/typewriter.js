/* ========================================
   Typewriter — 打字机效果模块
   ======================================== */

/**
 * 初始化打字机效果
 * @param {string} selector - 目标元素选择器
 * @param {Object} options
 * @param {number} options.speed - 每个字符间隔 (ms)，默认 80
 * @param {boolean} options.cursor - 是否显示光标，默认 true
 * @param {boolean} options.loop - 是否循环，默认 false
 */
export function initTypewriter(selector, options = {}) {
  const {
    speed = 80,
    cursor = true,
    loop = false,
  } = options;

  const el = document.querySelector(selector);
  if (!el) return;

  const fullText = el.textContent.trim();
  el.textContent = '';

  let charIndex = 0;
  let cursorEl = null;

  if (cursor) {
    cursorEl = document.createElement('span');
    cursorEl.className = 'typewriter-cursor';
    el.parentNode.insertBefore(cursorEl, el.nextSibling);
  }

  function type() {
    if (charIndex < fullText.length) {
      el.textContent += fullText.charAt(charIndex);
      charIndex++;
      setTimeout(type, speed + Math.random() * 40);
    } else if (loop) {
      setTimeout(() => {
        el.textContent = '';
        charIndex = 0;
        type();
      }, 2000);
    }
  }

  type();
}
