import { request, isNetworkError } from './client';
import { mockGetAlbums, mockGetAlbumById } from './mockData';

export async function getAlbums({ search = '', genre = '' } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (genre) params.set('genre', genre);
  const qs = params.toString();

  try {
    return await request(`/albums${qs ? `?${qs}` : ''}`);
  } catch (err) {
    if (isNetworkError(err)) return mockGetAlbums({ search, genre });
    throw err;
  }
}

export async function getAlbumById(id) {
  try {
    return await request(`/albums/${id}`);
  } catch (err) {
    if (isNetworkError(err)) return mockGetAlbumById(id);
    throw err;
  }
}
