import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(
    location.pathname === '/' ? searchParams.get('search') || '' : ''
  );

  function handleSearchSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    navigate(`/${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          Soundex
        </Link>

        <form className="search-form" onSubmit={handleSearchSubmit} role="search">
          <input
            type="search"
            className="search-input"
            placeholder="Search albums or artists"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search albums or artists"
          />
        </form>

        <div className="header-auth">
          {isAuthenticated ? (
            <div className="header-auth-user">
              <Link to="/profile" className="profile-link">
                <span className="avatar" aria-hidden="true">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="profile-username">{user.username}</span>
              </Link>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Log in
            </Link>
          )}
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}
