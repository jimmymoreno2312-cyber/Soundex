import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getListById, removeAlbumFromList } from '../api/lists';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

export default function ListDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [list, setList] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const [removingAlbumId, setRemovingAlbumId] = useState(null);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    setStatus('loading');

    getListById(id)
      .then((data) => {
        if (cancelled) return;
        setList(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load list');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated, retryToken]);

  async function handleRemove(albumId) {
    setRemoveError('');
    setRemovingAlbumId(albumId);

    try {
      await removeAlbumFromList(id, albumId);
      const albums = list.albums.filter((album) => album.id !== albumId);
      setList({ ...list, albums });
    } catch (err) {
      setRemoveError(err.message || 'Failed to remove album');
    } finally {
      setRemovingAlbumId(null);
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (status === 'loading') {
    return <Spinner label="Loading list…" />;
  }

  if (status === 'error') {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => setRetryToken(retryToken + 1)}
      />
    );
  }

  return (
    <div className="list-detail-page">
      <Link to="/lists" className="back-link">
        ← Back to My Lists
      </Link>

      <div className="list-detail-header">
        <div>
          <h1>{list.title}</h1>
          {list.description && <p>{list.description}</p>}
        </div>
        <span className="list-count">
          {list.albums.length} {list.albums.length === 1 ? 'album' : 'albums'}
        </span>
      </div>

      {removeError && (
        <p className="form-error list-remove-error" role="alert">
          {removeError}
        </p>
      )}

      {list.albums.length === 0 ? (
        <div className="list-empty">
          <p>This list doesn't have any albums yet.</p>
          <Link to="/" className="btn btn-secondary">
            Browse albums
          </Link>
        </div>
      ) : (
        <ul className="list-albums">
          {list.albums.map((album) => (
            <li key={album.id} className="list-album-item">
              <Link to={`/albums/${album.id}`} className="list-album-main">
                <div className="list-album-cover">
                  {album.cover_url ? (
                    <img src={album.cover_url} alt={`${album.title} cover art`} />
                  ) : (
                    <div className="album-card-cover-placeholder" aria-hidden="true">
                      {album.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="list-album-info">
                  <h2>{album.title}</h2>
                  <p>{album.artist}</p>
                  <span>
                    {album.genre}
                    {album.release_date ? ` · ${album.release_date}` : ''}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                className="btn btn-ghost list-remove-button"
                onClick={() => handleRemove(album.id)}
                disabled={removingAlbumId === album.id}
              >
                {removingAlbumId === album.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
