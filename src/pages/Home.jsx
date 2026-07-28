import Typewriter from '../components/Typewriter';
import AudioPlayer from '../components/AudioPlayer';

function Home() {
  return (
    <div className="container">
      <Typewriter as="h1" speed={80} cursor loop={false}>
        Hello! Sia!
      </Typewriter>

      <p className="home-subtitle">
        摄影 / 电影 / 阅读 — 个人内容存档
      </p>

      <hr />

      <p>
        i am sia and this is my first web page, here is some
        information about me:
      </p>

      <p>
        <a
          href="https://space.bilibili.com/329907805?spm_id_from=333.1365.0.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          bilibili ↗
        </a>
      </p>

      <AudioPlayer />
    </div>
  );
}

export default Home;
