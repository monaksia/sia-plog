import { useState, useRef, useEffect, useCallback } from 'react';
import { getLocalMusic } from '../api';

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function AudioPlayer() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const currentTrack = tracks[currentIdx] || null;

  // 加载本地曲库
  useEffect(() => {
    getLocalMusic()
      .then((data) => setTracks(data.files || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Time update
  const handleTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    setProgress((a.currentTime / a.duration) * 100);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setIsEnded(true);
    setProgress(100);
  }, []);

  const handleError = useCallback((e) => {
    const a = audioRef.current;
    const src = a?.src || '';
    setIsPlaying(false);
    setError(`无法加载: ${src ? decodeURIComponent(src.split('/').pop()) : '未知文件'}`);
    console.error('Audio playback error:', src, e);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsPlaying(true);
    setIsEnded(false);
  }, []);

  // Play/pause
  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !currentTrack) return;
    if (isEnded) {
      a.currentTime = 0;
      setIsEnded(false);
    }
    if (a.paused) {
      a.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      a.pause();
      setIsPlaying(false);
    }
  }, [isEnded, currentTrack]);

  // Space bar
  useEffect(() => {
    const handler = (e) => {
      if (e.key === ' ' && e.target === document.body && currentTrack) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, currentTrack]);

  // Progress bar click
  const seek = useCallback((e) => {
    const bar = progressRef.current;
    const a = audioRef.current;
    if (!bar || !a || !a.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * a.duration;
  }, []);

  // Select track
  const playTrack = useCallback((idx) => {
    setCurrentIdx(idx);
    setIsPlaying(false);
    setIsEnded(false);
    setError(null);
    setProgress(0);
  }, []);

  // 上一首 / 下一首
  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const next = currentIdx <= 0 ? tracks.length - 1 : currentIdx - 1;
    playTrack(next);
  }, [currentIdx, tracks.length, playTrack]);

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const next = currentIdx >= tracks.length - 1 ? 0 : currentIdx + 1;
    playTrack(next);
  }, [currentIdx, tracks.length, playTrack]);

  if (loading) {
    return (
      <div className="music-player">
        <p className="music-hint">加载曲库...</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="music-player">
        <p className="music-hint">暂无本地音乐，将文件放入 public/audio/ 目录</p>
      </div>
    );
  }

  return (
    <div className="music-player">
      {/* Playlist */}
      {!currentTrack && (
        <div className="music-results">
          {tracks.map((track, idx) => (
            <button
              key={track.id}
              className="music-track"
              onClick={() => playTrack(idx)}
            >
              <span className="music-track-name">{track.name}</span>
              <span className="music-track-dur">▶</span>
            </button>
          ))}
        </div>
      )}

      {/* Now Playing */}
      {currentTrack && (
        <div className="music-nowplaying">
          <button className="music-back-btn" onClick={() => setCurrentIdx(-1)}>
            ← 播放列表
          </button>

          <div className="music-track-info">
            <span className="music-np-name">{currentTrack.name}</span>
          </div>

          <div className="music-controls">
            <button className="music-play-btn" onClick={prevTrack}>⏮</button>
            <button className="music-play-btn" onClick={togglePlay}>
              {isEnded ? '↺' : isPlaying ? '⏸' : '▶'}
            </button>
            <button className="music-play-btn" onClick={nextTrack}>⏭</button>
            <div className="music-progress" ref={progressRef} onClick={seek}>
              <div className="music-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="music-time">{formatTime(audioRef.current?.currentTime || 0)}</span>
          </div>

          {error && <p className="music-error">{error}</p>}
        </div>
      )}

      <audio
        ref={audioRef}
        src={currentTrack ? currentTrack.url : undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onPlaying={handlePlaying}
        preload="auto"
      />
    </div>
  );
}

export default AudioPlayer;
