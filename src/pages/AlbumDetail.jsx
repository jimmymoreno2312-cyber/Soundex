import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAlbumById } from '../api/albums';
import { getAlbumRatings, submitRating, deleteRating } from '../api/ratings';
import { getLists, addAlbumToList } from '../api/lists';
import { useAuth } from '../context/AuthContext';
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
  const { user, isAuthenticated } = useAuth();
  const [album, setAlbum] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  const [scoreInput, setScoreInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [myLists, setMyLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [addToListMessage, setAddToListMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    getLists()
      .then((data) => setMyLists(data))
      .catch(() => {
        // My Lists page shows a real error if this fails; here it just
        // means the "add to list" control has nothing to offer.
      });
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    Promise.all([getAlbumById(id), getAlbumRatings(id)])
      .then(([albumData, ratingsData]) => {
        if (cancelled) return;
        setAlbum(albumData);
        setRatings(ratingsData);
        setStatus('ready');

        const myRating = user && ratingsData.find((r) => r.user_id === user.id);
        if (myRating) {
          setScoreInput(String(myRating.score));
          setBodyInput(myRating.body || '');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load album');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, retryToken]);

  async function handleSubmitRating(e) {
    e.preventDefault();
    const score = Number(scoreInput);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      setSubmitError('Score must be a whole number from 0 to 100');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await submitRating(id, { score, body: bodyInput.trim() });
      const [albumData, ratingsData] = await Promise.all([getAlbumById(id), getAlbumRatings(id)]);
      setAlbum(albumData);
      setRatings(ratingsData);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRating(ratingId) {
    if (!window.confirm('Delete this rating?')) return;
    setDeleteError('');
    try {
      await deleteRating(id, ratingId);
      setRatings((prev) => prev.filter((r) => r.id !== ratingId));
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete rating');
    }
  }

  async function handleAddToList() {
    if (!selectedListId) return;
    setAddToListMessage('');
    try {
      await addAlbumToList(selectedListId, album.id);
      setAddToListMessage('Added.');
    } catch (err) {
      setAddToListMessage(err.message || 'Failed to add to list');
    }
  }

  if (status === 'loading') {
    return <Spinner label="Loading album…" />;
  }

  if (status === 'error') {
    return <ErrorMessage message={error} onRetry={() => setRetryToken((n) => n + 1)} />;
  }

  const writtenRatings = ratings.filter((r) => r.body && r.body.trim());
  const alreadyRated = user && ratings.some((r) => r.user_id === user.id);

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

      {isAuthenticated && (
        <div className="add-to-list-row">
          {myLists.length > 0 ? (
            <>
              <select
                className="add-to-list-select"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                aria-label="Choose a list"
              >
                <option value="">Add to a list…</option>
                {myLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddToList}
                disabled={!selectedListId}
              >
                Add
              </button>
              {addToListMessage && <span className="add-to-list-message">{addToListMessage}</span>}
            </>
          ) : (
            <Link to="/lists" className="empty-state">
              Create a list to save albums to it.
            </Link>
          )}
        </div>
      )}

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

        {isAuthenticated ? (
          <form className="rating-form" onSubmit={handleSubmitRating}>
            <div className="rating-form-header">
              <span className="avatar" aria-hidden="true">
                {user.username.charAt(0).toUpperCase()}
              </span>
              <span className="rating-form-username">{user.username}</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                className="rating-score-input"
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                aria-label="Score, 0 to 100"
              />
            </div>

            <textarea
              className="rating-body-input"
              placeholder="Add a review (optional)"
              value={bodyInput}
              onChange={(e) => setBodyInput(e.target.value)}
              rows={3}
            />

            {submitError && <p className="field-error">{submitError}</p>}

            <div className="rating-form-footer">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Posting…' : alreadyRated ? 'Update rating' : 'Post'}
              </button>
            </div>
          </form>
        ) : (
          <p className="empty-state">
            <Link to="/login">Log in</Link> to rate this album.
          </p>
        )}

        {deleteError && <p className="field-error">{deleteError}</p>}

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
                  {(user?.id === rating.user_id || user?.role === 'moderator') && (
                    <button
                      type="button"
                      className="btn btn-ghost review-list-delete"
                      onClick={() => handleDeleteRating(rating.id)}
                    >
                      Delete
                    </button>
                  )}
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
