/* ========================================
   Main — Siablog 入口（兼容 file:// 无需服务器）
   源模块文件位于 ./modules/ 供开发参考
   ======================================== */
;(function () {
  'use strict';

  /* ========================================
     Module: typewriter.js — 打字机效果
     ======================================== */

  function initTypewriter(selector, options) {
    options = options || {};
    var speed  = options.speed  || 80;
    var cursor = options.cursor !== false;
    var loop   = options.loop   || false;

    var el = document.querySelector(selector);
    if (!el) return;

    var fullText = el.textContent.trim();
    el.textContent = '';

    var charIndex = 0;
    var cursorEl = null;

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
        setTimeout(function () {
          el.textContent = '';
          charIndex = 0;
          type();
        }, 2000);
      }
    }

    type();
  }

  /* ========================================
     Module: audio-player.js — 像素风音频控件
     ======================================== */

  function escapeHTML(str) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, function (c) { return map[c]; });
  }

  function initAudioPlayer(audioSelector) {
    var audio = document.querySelector(audioSelector);
    if (!audio) return;

    var wrapper = audio.closest('.audio-player');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'audio-player';
      audio.parentNode.insertBefore(wrapper, audio);
      wrapper.appendChild(audio);
    }

    var sourceEl = audio.querySelector('source');
    var src = sourceEl ? sourceEl.getAttribute('src') : (audio.src || '');
    var filename = src ? src.split('/').pop().replace(/\.[^.]+$/, '') : 'Unknown Track';

    wrapper.insertAdjacentHTML('beforeend',
      '<div class="audio-controls">' +
        '<button class="audio-btn" id="audio-play-btn">▶ PLAY</button>' +
        '<span class="audio-label">' + escapeHTML(filename) + '</span>' +
      '</div>' +
      '<div class="progress-bar" id="audio-progress">' +
        '<div class="progress-fill" id="audio-progress-fill"></div>' +
      '</div>'
    );

    var playBtn  = wrapper.querySelector('#audio-play-btn');
    var progress = wrapper.querySelector('#audio-progress');
    var fill     = wrapper.querySelector('#audio-progress-fill');

    playBtn.addEventListener('click', function () {
      audio.paused ? audio.play() : audio.pause();
    });

    audio.addEventListener('play', function () {
      playBtn.textContent = '⏸ PAUSE';
      fill.classList.add('playing');
    });

    audio.addEventListener('pause', function () {
      playBtn.textContent = '▶ PLAY';
      fill.classList.remove('playing');
    });

    audio.addEventListener('ended', function () {
      playBtn.textContent = '↺ REPLAY';
      fill.classList.remove('playing');
    });

    audio.addEventListener('timeupdate', function () {
      if (audio.duration) {
        fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      }
    });

    progress.addEventListener('click', function (e) {
      var rect = progress.getBoundingClientRect();
      var ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = ratio * audio.duration;
    });

    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        audio.paused ? audio.play() : audio.pause();
      }
    });
  }

  /* ========================================
     Module: dirt-block.js — 像素粒子背景
     ======================================== */

  function initParticles(selector, options) {
    options = options || {};
    var count   = options.count   || 10;
    var minSize = options.minSize || 3;
    var maxSize = options.maxSize || 6;

    var container = document.querySelector(selector);
    if (!container) return;

    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var particle = document.createElement('div');
      particle.className = 'dirt-particle';

      var size     = minSize + Math.random() * (maxSize - minSize);
      var left     = Math.random() * 100;
      var delay    = Math.random() * 10;
      var duration = 12 + Math.random() * 18;

      particle.style.cssText =
        'width:' + size + 'px;' +
        'height:' + size + 'px;' +
        'left:' + left + '%;' +
        'bottom:-' + (size + 2) + 'px;' +
        'animation-delay:' + delay + 's;' +
        'animation-duration:' + duration + 's;';

      frag.appendChild(particle);
    }

    container.appendChild(frag);
  }

  /* ========================================
     Init — DOM 就绪后启动所有模块
     ======================================== */

  function boot() {
    initParticles('#particles', { count: 10, minSize: 3, maxSize: 5 });
    initTypewriter('h1', { speed: 80, cursor: true });
    initAudioPlayer('audio');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
