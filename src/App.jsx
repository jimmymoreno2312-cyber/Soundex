import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Browse from './pages/Browse';
import AlbumDetail from './pages/AlbumDetail';
import ArtistDetail from './pages/ArtistDetail';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import AddAlbum from './pages/AddAlbum';
import MyLists from './pages/MyLists';
import ListDetail from './pages/ListDetail';

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
          <Route path="/lists" element={<MyLists />} />
          <Route path="/lists/:id" element={<ListDetail />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
