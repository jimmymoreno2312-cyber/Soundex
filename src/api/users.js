import { request, isNetworkError } from './client';
import { mockGetUserReviews } from './mockData';

export async function getUserReviews(userId) {
  try {
    return await request(`/users/${userId}/reviews`, { auth: true });
  } catch (err) {
    if (isNetworkError(err)) return mockGetUserReviews(userId);
    throw err;
  }
}
