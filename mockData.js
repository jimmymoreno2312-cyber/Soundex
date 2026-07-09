import { ApiError } from './client';

export const GENRES = [
  'Singer-Songwriter',
  'Progressive Rock',
  'Soul',
  'Post-Rock',
  'Alt-Country',
  'Hard Bop',
  'Downtempo',
  'Art Pop',
  'Neo-Psychedelia',
  'Art Rock',
  'Post-Bop',
  'Spiritual Jazz',
  'Free Jazz',
  'Avant-Garde Jazz',
];

export const mockAlbums = [
  {
    id: 1,
    title: 'Solid Air',
    artist: 'John Martyn',
    release_date: '1973-02-01',
    genres: ['Singer-Songwriter'],
    primary_genre: 'Singer-Songwriter',
    avg_rating: 3.85,
    release_rating: 3.85,
    rating_count: 6233,
    cover_url:
      'https://coverartarchive.org/release/e25065f2-161a-464e-88b2-d9f4f8f293ca/front-500',
  },
  {
    id: 2,
    title: 'Wish You Were Here',
    artist: 'Pink Floyd',
    release_date: '1975-09-12',
    genres: ['Progressive Rock'],
    primary_genre: 'Progressive Rock',
    avg_rating: 4.36,
    release_rating: 4.36,
    rating_count: 94775,
    cover_url:
      'https://coverartarchive.org/release/424db76a-8604-4350-a50f-766f58570470/front-500',
  },
  {
    id: 3,
    title: 'Songs in the Key of Life',
    artist: 'Stevie Wonder',
    release_date: '1976-09-28',
    genres: ['Soul'],
    primary_genre: 'Soul',
    avg_rating: 4.3,
    release_rating: 4.3,
    rating_count: 34804,
    cover_url:
      'https://coverartarchive.org/release/9b51a6b5-7f55-4dc7-8e10-a69410c7b306/front-500',
  },
  {
    id: 4,
    title: 'El jardín de los presentes',
    artist: 'Invisible',
    release_date: '1976-09-29',
    genres: ['Progressive Rock'],
    primary_genre: 'Progressive Rock',
    avg_rating: 4.1,
    release_rating: 4.1,
    rating_count: 15310,
    cover_url:
      'https://coverartarchive.org/release/2911329e-dc82-4fcd-a803-e3fd9ea827fa/front-500',
  },
  {
    id: 5,
    title: 'Hex',
    artist: 'Bark Psychosis',
    release_date: '1994-02-14',
    genres: ['Post-Rock'],
    primary_genre: 'Post-Rock',
    avg_rating: 3.84,
    release_rating: 3.84,
    rating_count: 15431,
    cover_url:
      'https://coverartarchive.org/release/6c13438f-0179-3d15-b6c8-03da5231d3fa/front-500',
  },
  {
    id: 6,
    title: 'The Magnolia Electric Co.',
    artist: 'Songs: Ohia',
    release_date: '2003-03-04',
    genres: ['Alt-Country'],
    primary_genre: 'Alt-Country',
    avg_rating: 4.1,
    release_rating: 4.1,
    rating_count: 22501,
    cover_url:
      'https://coverartarchive.org/release/f9479fc5-6438-42e6-b493-0f0bde23a352/front-500',
  },
  {
    id: 7,
    title: "What's Going On",
    artist: 'Marvin Gaye',
    release_date: '1971-05-21',
    genres: ['Soul'],
    primary_genre: 'Soul',
    avg_rating: 4.2,
    release_rating: 4.2,
    rating_count: 42691,
    cover_url:
      'https://coverartarchive.org/release/ba91f9e2-2391-4bbd-9114-c9eff138fd98/front-500',
  },
  {
    id: 8,
    title: 'Carrie & Lowell',
    artist: 'Sufjan Stevens',
    release_date: '2015-03-21',
    genres: ['Singer-Songwriter'],
    primary_genre: 'Singer-Songwriter',
    avg_rating: 4.1,
    release_rating: 4.1,
    rating_count: 36901,
    cover_url:
      'https://coverartarchive.org/release/a3a5335f-3739-42e9-b755-6f944a5f427a/front-500',
  },
  {
    id: 9,
    title: 'Purple Mountains',
    artist: 'Purple Mountains',
    release_date: '2019-07-12',
    genres: ['Alt-Country'],
    primary_genre: 'Alt-Country',
    avg_rating: 3.9,
    release_rating: 3.9,
    rating_count: 12560,
    cover_url:
      'https://coverartarchive.org/release/7b5bbdc0-3cf6-4e2b-9aea-7397095b45dc/front-500',
  },
  {
    id: 10,
    title: 'Giant Steps',
    artist: 'John Coltrane',
    release_date: '1960-01-27',
    genres: ['Hard Bop'],
    primary_genre: 'Hard Bop',
    avg_rating: 4.11,
    release_rating: 4.11,
    rating_count: 25270,
    cover_url:
      'https://coverartarchive.org/release/22689758-ffc1-450f-bb48-52b577077dba/front-500',
  },
  {
    id: 11,
    title: 'Bocanada',
    artist: 'Gustavo Cerati',
    release_date: '1999-06-28',
    genres: ['Downtempo', 'Art Pop', 'Neo-Psychedelia', 'Art Rock'],
    primary_genre: 'Downtempo',
    avg_rating: 4.08,
    release_rating: 4.08,
    rating_count: 17117,
    cover_url:
      'https://coverartarchive.org/release/8a36348d-c96b-46c3-adc6-faf765597a07/front-500',
  },
  {
    id: 12,
    title: 'Sahara',
    artist: 'McCoy Tyner',
    release_date: '1972-06',
    genres: ['Post-Bop', 'Spiritual Jazz', 'Free Jazz', 'Avant-Garde Jazz'],
    primary_genre: 'Post-Bop',
    avg_rating: 3.88,
    release_rating: 3.88,
    rating_count: 2789,
    cover_url:
      'https://coverartarchive.org/release/5065431e-cf4b-3928-8c0f-e9579629781b/front-500',
  },
];

export const mockUsers = [
  { id: 1, username: 'demo', email: 'demo@soundex.app', role: 'user', created_at: '2023-04-11T00:00:00Z' },
];

export const mockReviews = [
  {
    id: 1,
    user_id: 1,
    album_id: 2,
    rating: 5,
    body: 'A massive album with one of the strongest title tracks ever.',
    created_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    album_id: 6,
    rating: 5,
    body: 'Farewell Transmission carries the whole record into classic territory.',
    created_at: '2024-03-14T00:00:00Z',
  },
  {
    id: 3,
    user_id: 1,
    album_id: 12,
    rating: 4,
    body: 'Spiritual jazz energy with a huge McCoy Tyner performance.',
    created_at: '2024-05-22T00:00:00Z',
  },
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
