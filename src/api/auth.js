import { request, setToken, clearToken } from './client';

export async function login({ identifier, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: { identifier, password },
  });
}

export async function register({ username, email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: { username, email, password },
  });
}

export { setToken, clearToken };
