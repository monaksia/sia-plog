import Typewriter from '../components/Typewriter';
import AudioPlayer from '../components/AudioPlayer';
import SocialLinks from '../components/SocialLinks';

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

      <SocialLinks />

      <AudioPlayer />
    </div>
  );
}

export default Home;
