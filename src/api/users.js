import { request } from './client';

export async function getUserReviews(userId) {
  return request(`/users/${userId}/reviews`, { auth: true });
}
