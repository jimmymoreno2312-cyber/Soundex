import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserReviews } from '../api/users';
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

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setStatus('loading');
    getUserReviews(user.id)
      .then((data) => {
        if (cancelled) return;
        setReviews(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load reviews');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [user, retryToken]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <span className="avatar avatar-lg" aria-hidden="true">
          {user.username.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1>{user.username}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-joined">Joined {formatDate(user.created_at)}</p>
        </div>
        <button type="button" className="btn btn-secondary" disabled title="Coming soon">
          Edit profile
        </button>
      </div>

      <section className="profile-reviews">
        <h2>Your reviews</h2>
        {status === 'loading' && <Spinner label="Loading reviews…" />}
        {status === 'error' && (
          <ErrorMessage message={error} onRetry={() => setRetryToken((n) => n + 1)} />
        )}
        {status === 'ready' && reviews.length === 0 && (
          <p className="empty-state">You haven't reviewed any albums yet.</p>
        )}
        {status === 'ready' && reviews.length > 0 && (
          <ul className="review-list">
            {reviews.map((review) => (
              <li key={review.id} className="review-list-item">
                <div className="review-list-rating">★ {review.rating}/5</div>
                <p className="review-list-body">{review.body}</p>
                <p className="review-list-date">{formatDate(review.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
