import { useRef, useState, useEffect } from 'react';

/**
 * 自定义像素风格音频播放器
 * @param {string} src - 音频文件路径
 */
function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [progress, setProgress] = useState(0);

  const filename = src
    ? src.split('/').pop().replace(/\.[^.]+$/, '')
    : 'Unknown Track';

  // 空格键控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        const audio = audioRef.current;
        if (!audio) return;
        audio.paused ? audio.play() : audio.pause();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  };

  const buttonLabel = isEnded ? '↺ REPLAY' : isPlaying ? '⏸ PAUSE' : '▶ PLAY';

  return (
    <div className="audio-player">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        controls
        loop
        preload="metadata"
        onPlay={() => {
          setIsPlaying(true);
          setIsEnded(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setIsEnded(true);
        }}
        onTimeUpdate={handleTimeUpdate}
      >
        <source src={src} type="audio/mp3" />
        your browser does not support audio playback
      </audio>

      <div className="audio-controls">
        <button className="audio-btn" onClick={handlePlayPause}>
          {buttonLabel}
        </button>
        <span className="audio-label">{filename}</span>
      </div>

      <div
        className="progress-bar"
        ref={progressRef}
        onClick={handleProgressClick}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress-fill${isPlaying ? ' playing' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default AudioPlayer;
