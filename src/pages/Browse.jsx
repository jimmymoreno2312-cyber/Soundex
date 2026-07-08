import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAlbums } from '../api/albums';
import { GENRES } from '../api/mockData';
import AlbumCard from '../components/AlbumCard';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const genre = searchParams.get('genre') || '';

  const [albums, setAlbums] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getAlbums({ search, genre })
      .then((data) => {
        if (cancelled) return;
        setAlbums(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load albums');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [search, genre, retryToken]);

  function handleGenreChange(e) {
    const next = new URLSearchParams(searchParams);
    if (e.target.value) {
      next.set('genre', e.target.value);
    } else {
      next.delete('genre');
    }
    setSearchParams(next);
  }

  function retry() {
    setRetryToken((n) => n + 1);
  }

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>{search ? `Results for "${search}"` : 'Browse albums'}</h1>
        <select
          className="genre-select"
          value={genre}
          onChange={handleGenreChange}
          aria-label="Filter by genre"
        >
          <option value="">All genres</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {status === 'loading' && <Spinner label="Loading albums…" />}
      {status === 'error' && <ErrorMessage message={error} onRetry={retry} />}
      {status === 'ready' && albums.length === 0 && (
        <p className="empty-state">No albums match your search.</p>
      )}
      {status === 'ready' && albums.length > 0 && (
        <div className="album-grid">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}
