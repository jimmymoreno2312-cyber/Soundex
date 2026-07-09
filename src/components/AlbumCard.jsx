import { Link } from 'react-router-dom';

export default function AlbumCard({ album }) {
  return (
    <Link to={`/albums/${album.id}`} className="album-card">
      <div className="album-card-cover">
        {album.cover_url ? (
          <img src={album.cover_url} alt={`${album.title} cover art`} loading="lazy" />
        ) : (
          <div className="album-card-cover-placeholder" aria-hidden="true">
            {album.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="album-card-body">
        <p className="album-card-title">{album.title}</p>
        <p className="album-card-artist">{album.artist}</p>
        <p className="album-card-rating">
          ★ {album.avg_rating != null ? album.avg_rating.toFixed(1) : '—'}
          {album.rating_count != null
            ? ` from ${album.rating_count.toLocaleString()} ratings`
            : ''}
        </p>
      </div>
    </Link>
  );
}
