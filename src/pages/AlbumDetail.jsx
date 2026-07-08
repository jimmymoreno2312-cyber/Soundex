import { Link, useParams } from 'react-router-dom';

export default function AlbumDetail() {
  const { id } = useParams();

  return (
    <div className="album-detail-page album-detail-stub">
      <Link to="/" className="back-link">
        ← Back to browse
      </Link>
      <h1>Album #{id}</h1>
      <p className="empty-state">
        Full album details, ratings, and reviews are coming soon.
      </p>
    </div>
  );
}
