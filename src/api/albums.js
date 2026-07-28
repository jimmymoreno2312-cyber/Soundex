import { request } from './client';

export async function getAlbums({ search = '', genre = '' } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (genre) params.set('genre', genre);
  const qs = params.toString();

  return request(`/albums${qs ? `?${qs}` : ''}`);
}

export async function getAlbumById(id) {
  return request(`/albums/${id}`);
}

export async function addAlbum(album) {
  return request('/albums', {
    method: 'POST',
    body: album,
    auth: true,
  });
}
