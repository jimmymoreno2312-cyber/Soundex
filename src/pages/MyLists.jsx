import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { createList, getLists } from '../api/lists';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

export default function MyLists() {
  const { isAuthenticated } = useAuth();
  const [lists, setLists] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    setStatus('loading');

    getLists()
      .then((data) => {
        if (cancelled) return;
        setLists(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load lists');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, retryToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    setCreateError('');
    setSubmitting(true);

    try {
      const newList = await createList({
        title: title.trim(),
        description: description.trim(),
      });
      setLists([newList, ...lists]);
      setTitle('');
      setDescription('');
    } catch (err) {
      setCreateError(err.message || 'Failed to create list');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="lists-page">
      <div className="page-heading">
        <div>
          <h1>My Lists</h1>
          <p>Make collections of albums you want to keep together.</p>
        </div>
      </div>

      <section className="create-list-card">
        <h2>Create a list</h2>
        <form className="create-list-form" onSubmit={handleSubmit}>
          {createError && (
            <p className="form-error" role="alert">
              {createError}
            </p>
          )}

          <label className="field">
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength="150"
              required
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="Optional"
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create list'}
          </button>
        </form>
      </section>

      <section className="lists-section">
        <h2>Your lists</h2>

        {status === 'loading' && <Spinner label="Loading lists…" />}
        {status === 'error' && (
          <ErrorMessage
            message={error}
            onRetry={() => setRetryToken(retryToken + 1)}
          />
        )}
        {status === 'ready' && lists.length === 0 && (
          <p className="empty-state">You haven't created any lists yet.</p>
        )}
        {status === 'ready' && lists.length > 0 && (
          <div className="lists-grid">
            {lists.map((list) => (
              <Link key={list.id} to={`/lists/${list.id}`} className="list-card">
                <h3>{list.title}</h3>
                <p>{list.description || 'No description'}</p>
                <span>View list →</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
