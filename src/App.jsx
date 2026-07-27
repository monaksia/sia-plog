import ParticleBackground from './components/ParticleBackground';
import Typewriter from './components/Typewriter';
import AudioPlayer from './components/AudioPlayer';
import LazyImage from './components/LazyImage';

function App() {
  return (
    <>
      {/* 背景粒子 */}
      <ParticleBackground count={10} minSize={3} maxSize={5} />

      {/* 主内容 */}
      <main className="container">
        <Typewriter as="h1" speed={80} cursor loop={false}>
          Hello! Sia!
        </Typewriter>
        <hr />
        <h2>here is my first web page</h2>
        <p>
          i am sia and this is my first web page, here is some information about
          me:
        </p>
        <p>
          <a
            href="https://space.bilibili.com/329907805?spm_id_from=333.1365.0.0"
            title="bilibili"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>
              <em>here is my bilibili:</em>
            </strong>
          </a>
        </p>
        <LazyImage
          srcSm="/img/optimized/lifestyle-sm.webp"
          srcMd="/img/optimized/lifestyle-md.webp"
          srcLg="/img/optimized/lifestyle-lg.webp"
          placeholder="/img/optimized/lifestyle-placeholder.webp"
          fallback="/img/138900663_p0.png"
          alt="my life style"
          width="800"
          title="my life style"
        />

        {/* 音频 */}
        <AudioPlayer src="/audio/C418 - Mice on Venus.mp3" />
      </main>
    </>
  );
}

export default App;
