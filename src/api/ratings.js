import { request } from './client';

export async function getAlbumRatings(albumId) {
  return request(`/albums/${albumId}/ratings`);
}

export async function submitRating(albumId, { score, body }) {
  return request(`/albums/${albumId}/ratings`, {
    method: 'POST',
    body: { score, body: body || null },
    auth: true,
  });
}

export async function deleteRating(albumId, ratingId) {
  return request(`/albums/${albumId}/ratings/${ratingId}`, {
    method: 'DELETE',
    auth: true,
  });
}
