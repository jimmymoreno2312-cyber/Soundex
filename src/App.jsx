import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Browse from './pages/Browse';
import AlbumDetail from './pages/AlbumDetail';
import ArtistDetail from './pages/ArtistDetail';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import AddAlbum from './pages/AddAlbum';

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/albums/:id" element={<AlbumDetail />} />
          <Route path="/artists/:id" element={<ArtistDetail />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/add-album" element={<AddAlbum />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
