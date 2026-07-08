import { ApiError } from './client';

export const GENRES = [
  'Rock',
  'Pop',
  'Hip-Hop',
  'Electronic',
  'Jazz',
  'R&B',
  'Indie',
  'Metal',
  'Classical',
];

export const mockAlbums = [
  { id: 1, title: 'Wildflower Hours', artist: 'Marina Cole', release_date: '2023-06-09', genres: ['Indie', 'Pop'], avg_rating: 4.3, cover_url: null },
  { id: 2, title: 'Concrete Skyline', artist: 'The Overpass', release_date: '2021-11-02', genres: ['Rock'], avg_rating: 3.8, cover_url: null },
  { id: 3, title: 'Midnight Frequency', artist: 'DJ Kessler', release_date: '2022-03-18', genres: ['Electronic'], avg_rating: 4.6, cover_url: null },
  { id: 4, title: 'Low Tide', artist: 'Salt & Cedar', release_date: '2020-08-14', genres: ['Indie', 'R&B'], avg_rating: 4.1, cover_url: null },
  { id: 5, title: 'Brass & Bone', artist: 'Ezra Whitfield', release_date: '2019-01-25', genres: ['Jazz'], avg_rating: 4.7, cover_url: null },
  { id: 6, title: 'Iron Choir', artist: 'Deathwatch', release_date: '2018-10-31', genres: ['Metal'], avg_rating: 3.9, cover_url: null },
  { id: 7, title: 'Corner Store Radio', artist: 'Nia Preston', release_date: '2023-02-10', genres: ['R&B', 'Pop'], avg_rating: 4.4, cover_url: null },
  { id: 8, title: 'Static Bloom', artist: 'Halogen', release_date: '2022-07-22', genres: ['Electronic', 'Rock'], avg_rating: 3.6, cover_url: null },
  { id: 9, title: 'Paper Moons', artist: 'The Fainters', release_date: '2021-05-06', genres: ['Indie'], avg_rating: 4.0, cover_url: null },
  { id: 10, title: 'Etudes for a Quiet House', artist: 'Liesl Amundsen', release_date: '2017-09-12', genres: ['Classical'], avg_rating: 4.8, cover_url: null },
  { id: 11, title: 'Trapdoor Sun', artist: 'Marigold Static', release_date: '2020-12-01', genres: ['Pop', 'Electronic'], avg_rating: 3.5, cover_url: null },
  { id: 12, title: 'Rust Belt Hymnal', artist: 'The Overpass', release_date: '2024-01-19', genres: ['Rock', 'Indie'], avg_rating: 4.2, cover_url: null },
];

export const mockUsers = [
  { id: 1, username: 'demo', email: 'demo@soundex.app', role: 'user', created_at: '2023-04-11T00:00:00Z' },
];

export const mockReviews = [
  { id: 1, user_id: 1, album_id: 1, rating: 5, body: 'Warm production, the closing track is a stunner.', created_at: '2024-02-01T00:00:00Z' },
  { id: 2, user_id: 1, album_id: 5, rating: 4, body: 'Brass arrangements carry the whole record.', created_at: '2024-03-14T00:00:00Z' },
  { id: 3, user_id: 1, album_id: 9, rating: 4, body: 'Grows on you after a couple listens.', created_at: '2024-05-22T00:00:00Z' },
];

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockGetAlbums({ search = '', genre = '' } = {}) {
  await delay();
  const q = search.trim().toLowerCase();
  const g = genre.trim();
  return mockAlbums.filter((album) => {
    const matchesQuery =
      !q || album.title.toLowerCase().includes(q) || album.artist.toLowerCase().includes(q);
    const matchesGenre = !g || album.genres.includes(g);
    return matchesQuery && matchesGenre;
  });
}

export async function mockGetAlbumById(id) {
  await delay();
  const album = mockAlbums.find((a) => String(a.id) === String(id));
  if (!album) throw new ApiError('Album not found', 404);
  return album;
}

export async function mockGetUserReviews(userId) {
  await delay();
  return mockReviews.filter((r) => String(r.user_id) === String(userId));
}

function makeToken(username) {
  return `mock-jwt.${username}.${Date.now()}`;
}

export async function mockLogin({ identifier, password }) {
  await delay();
  if (!password) throw new ApiError('Password is required', 400);
  if (identifier?.toLowerCase() === 'baduser') {
    throw new ApiError('Invalid username/email or password', 401);
  }
  const existing = mockUsers.find(
    (u) => u.username === identifier || u.email === identifier
  );
  const user = existing || {
    id: 1,
    username: identifier,
    email: identifier.includes('@') ? identifier : `${identifier}@soundex.app`,
    role: 'user',
    created_at: '2023-04-11T00:00:00Z',
  };
  return { token: makeToken(user.username), user };
}

export async function mockRegister({ username, email }) {
  await delay();
  if (username?.toLowerCase() === 'admin' || username?.toLowerCase() === 'demo') {
    throw new ApiError('Username is already taken', 409);
  }
  const user = {
    id: Date.now(),
    username,
    email,
    role: 'user',
    created_at: new Date().toISOString(),
  };
  return { token: makeToken(username), user };
}
