import { request, isNetworkError } from './client';
import { mockGetAlbums } from './mockData';

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
  return request(`/albums/${id}`);

export async function addAlbum(album) {
  return request('/albums', {
    method: 'POST',
    body: album,
    auth: true,
  });
}

}
