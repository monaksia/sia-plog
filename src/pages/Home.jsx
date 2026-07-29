import Typewriter from '../components/Typewriter';
import AudioPlayer from '../components/AudioPlayer';
import SocialLinks from '../components/SocialLinks';

function Home() {
  return (
    <div className="container">
      {/* Magazine cover section */}
      <div className="home-masthead">
        <Typewriter as="h1" speed={80} cursor loop={false}>
          Hello! Sia!
        </Typewriter>

        <p className="home-subtitle">
          摄影 / 电影 / 阅读
        </p>

        <div className="section-rule">
          <span>personal archive</span>
        </div>
      </div>

      {/* Two-column intro — magazine article opening */}
      <div className="home-intro">
        <p className="drop-cap">
          i am sia and this is my personal web space — a quiet corner for photography,
          film reviews, and reading notes. each piece here is a fragment of how i see
          the world, collected and kept.
        </p>
      </div>

      {/* Social links — edit in SocialLinks.jsx */}
      <div className="home-social-section">
        <p className="home-section-label">Find me on</p>
        <SocialLinks />
      </div>

      <hr />

      {/* Music — editorial listening section */}
      <div className="home-music-section">
        <h3 className="home-section-title">Listening</h3>
        <AudioPlayer />
      </div>
    </div>
  );
}

export default Home;
