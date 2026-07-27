/* ========================================
   Audio Player — 自定义像素风格音频控件
   ======================================== */

/**
 * 初始化自定义音频播放器
 * @param {string} audioSelector - <audio> 元素选择器
 */
export function initAudioPlayer(audioSelector) {
  const audio = document.querySelector(audioSelector);
  if (!audio) return;

  // 找到或创建播放器容器
  let wrapper = audio.closest('.audio-player');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'audio-player';
    audio.parentNode.insertBefore(wrapper, audio);
    wrapper.appendChild(audio);
  }

  // 提取文件名
  const src = audio.querySelector('source')?.getAttribute('src') || audio.src;
  const filename = src ? src.split('/').pop().replace(/\.[^.]+$/, '') : 'Unknown Track';

  // 构建控件 HTML
  const controlsHTML = `
    <div class="audio-controls">
      <button class="audio-btn" id="audio-play-btn">▶ PLAY</button>
      <span class="audio-label">${escapeHTML(filename)}</span>
    </div>
    <div class="progress-bar" id="audio-progress">
      <div class="progress-fill" id="audio-progress-fill"></div>
    </div>
  `;

  wrapper.insertAdjacentHTML('beforeend', controlsHTML);

  const playBtn  = wrapper.querySelector('#audio-play-btn');
  const progress = wrapper.querySelector('#audio-progress');
  const fill     = wrapper.querySelector('#audio-progress-fill');

  // 播放 / 暂停
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => {
    playBtn.textContent = '⏸ PAUSE';
    fill.classList.add('playing');
  });

  audio.addEventListener('pause', () => {
    playBtn.textContent = '▶ PLAY';
    fill.classList.remove('playing');
  });

  audio.addEventListener('ended', () => {
    playBtn.textContent = '↺ REPLAY';
    fill.classList.remove('playing');
  });

  // 进度条更新
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      fill.style.width = `${pct}%`;
    }
  });

  // 点击进度条跳转
  progress.addEventListener('click', (e) => {
    const rect = progress.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  });

  // 键盘空格控制
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      audio.paused ? audio.play() : audio.pause();
    }
  });
}

function escapeHTML(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}
