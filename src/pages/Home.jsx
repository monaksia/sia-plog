import ParticleBackground from '../components/ParticleBackground';
import Typewriter from '../components/Typewriter';
import AudioPlayer from '../components/AudioPlayer';

function Home() {
  return (
    <div className="container">
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

      <AudioPlayer src="/audio/C418 - Mice on Venus.mp3" />
    </div>
  );
}

export default Home;
