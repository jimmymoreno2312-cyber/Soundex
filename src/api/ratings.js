import { request } from './client';

export async function getAlbumRatings(albumId) {
  return request(`/albums/${albumId}/ratings`);
}
