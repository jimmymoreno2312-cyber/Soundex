import { Link, useParams } from 'react-router-dom';

export default function ArtistDetail() {
  const { id } = useParams();

  return (
    <div className="album-detail-stub">
      <Link to="/" className="back-link">
        ← Back to browse
      </Link>
      <h1>{decodeURIComponent(id)}</h1>
      <p className="empty-state">Artist pages are coming soon.</p>
    </div>
  );
}
