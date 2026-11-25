import { Link } from 'react-router-dom';
import Typewriter from '../components/Typewriter';
import AudioPlayer from '../components/AudioPlayer';
import SocialLinks from '../components/SocialLinks';
import LoadError from '../components/LoadError';
import useResource from '../hooks/useResource';
import { getRecentUpdates } from '../api';

function RecentUpdates() {
  const { data, loading, error, retry } = useResource(getRecentUpdates);
  const { photo, movie, book } = data || {};
  if (!loading && !error && !photo && !movie && !book) return null;

  return (
    <section className="home-recent" aria-labelledby="recent-heading">
      <h2 id="recent-heading">近期更新</h2>
      {loading && <p role="status">正在加载近期更新…</p>}
      {error && <LoadError error={error} retry={retry} />}
      {data && (
        <div className="home-recent-grid">
          {photo && (
            <Link className="home-recent-photo" to={`/photography?photo=${photo.id}`}>
              <img src={photo.medium || photo.thumb || photo.src} alt="" loading="lazy" decoding="async" />
              <div>
                <span className="home-recent-kind">摄影</span>
                <h3>{photo.alt || photo.location || '最新照片'}</h3>
              </div>
            </Link>
          )}
          {(movie || book) && (
            <div className="home-recent-reviews">
              {[[movie, 'movies', '影评'], [book, 'books', '书评']].map(([review, path, label]) => review && (
                <Link key={path} className="home-recent-review" to={`/${path}/${encodeURIComponent(review.slug)}`}>
                  <span className="home-recent-kind">{label}</span>
                  <h3>{review.title}</h3>
                  {review.excerpt && <p>{review.excerpt}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

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

      <RecentUpdates />

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
