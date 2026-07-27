import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAlbumById } from '../api/albums';
import { getAlbumRatings } from '../api/ratings';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

function formatDate(iso) {
  if (!iso) return 'Unknown';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// release_date is a plain calendar date (no time-of-day), so parse it as
// local to avoid UTC-midnight shifting it back a day in negative-offset zones.
function formatReleaseDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function scoreClass(score) {
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-mid';
  return 'score-low';
}

export default function AlbumDetail() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    Promise.all([getAlbumById(id), getAlbumRatings(id)])
      .then(([albumData, ratingsData]) => {
        if (cancelled) return;
        setAlbum(albumData);
        setRatings(ratingsData);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load album');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, retryToken]);

  if (status === 'loading') {
    return <Spinner label="Loading album…" />;
  }

  if (status === 'error') {
    return <ErrorMessage message={error} onRetry={() => setRetryToken((n) => n + 1)} />;
  }

  const writtenRatings = ratings.filter((r) => r.body && r.body.trim());

  return (
    <div className="album-detail-page">
      <Link to="/" className="back-link">
        ← Back to browse
      </Link>

      <div className="album-detail-header">
        <div className="album-detail-cover">
          {album.cover_url ? (
            <img src={album.cover_url} alt={`${album.title} cover art`} />
          ) : (
            <div className="album-detail-cover-placeholder" aria-hidden="true">
              {album.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="album-detail-info">
          <h1>{album.title}</h1>
          <Link
            to={`/artists/${encodeURIComponent(album.artist)}`}
            className="album-detail-artist"
          >
            {album.artist}
          </Link>
          <p className="album-detail-meta">
            {album.release_date ? formatReleaseDate(album.release_date) : 'Release date unknown'}
          </p>
          {album.genre && (
            <div className="genre-tags">
              <span className="genre-tag">{album.genre}</span>
            </div>
          )}
        </div>

        <div className="album-detail-score">
          {album.avg_score != null ? (
            <span className={`score-value ${scoreClass(album.avg_score)}`}>
              {album.avg_score}
            </span>
          ) : (
            <span className="score-value score-none">—</span>
          )}
          <span className="score-label">
            {album.avg_score != null ? 'out of 100' : 'Not yet rated'}
          </span>
        </div>
      </div>

      <section className="album-detail-section">
        <h2>Tracklist</h2>
        {album.tracks && album.tracks.length > 0 ? (
          <ol className="tracklist">
            {album.tracks.map((track) => (
              <li key={track.position} className="tracklist-item">
                <span className="tracklist-position">{track.position}</span>
                <span className="tracklist-title">{track.title}</span>
                <span className="tracklist-duration">
                  {formatDuration(track.duration_seconds)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-state">No tracklist available.</p>
        )}
      </section>

      <section className="album-detail-section">
        <h2>Ratings</h2>
        {writtenRatings.length === 0 ? (
          <p className="empty-state">No written ratings yet.</p>
        ) : (
          <ul className="review-list">
            {writtenRatings.map((rating) => (
              <li key={rating.id} className="review-list-item">
                <div className="review-list-header">
                  <span className="review-list-username">{rating.username}</span>
                  <span className={`review-list-score ${scoreClass(rating.score)}`}>
                    {rating.score}/100
                  </span>
                </div>
                <p className="review-list-body">{rating.body}</p>
                <p className="review-list-date">{formatDate(rating.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
