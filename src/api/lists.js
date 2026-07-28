import { request } from './client';

// Get the logged-in user's lists
export async function getLists() {
  return request('/lists', { auth: true });
}

// Get one list and its albums
export async function getListById(listId) {
  return request(`/lists/${listId}`, { auth: true });
}

// Create a list
export async function createList(list) {
  return request('/lists', {
    method: 'POST',
    body: list,
    auth: true,
  });
}

// Edit a list
export async function updateList(listId, list) {
  return request(`/lists/${listId}`, {
    method: 'PATCH',
    body: list,
    auth: true,
  });
}

// Delete a list
export async function deleteList(listId) {
  return request(`/lists/${listId}`, {
    method: 'DELETE',
    auth: true,
  });
}

// Add an album to a list
export async function addAlbumToList(listId, albumId) {
  return request(`/lists/${listId}/items`, {
    method: 'POST',
    body: { album_id: albumId },
    auth: true,
  });
}

// Remove an album from a list
export async function removeAlbumFromList(listId, albumId) {
  return request(`/lists/${listId}/items/${albumId}`, {
    method: 'DELETE',
    auth: true,
  });
}
