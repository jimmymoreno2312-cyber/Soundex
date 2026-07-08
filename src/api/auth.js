import { request, isNetworkError, setToken, clearToken } from './client';
import { mockLogin, mockRegister } from './mockData';

export async function login({ identifier, password }) {
  try {
    return await request('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    });
  } catch (err) {
    if (isNetworkError(err)) return mockLogin({ identifier, password });
    throw err;
  }
}

export async function register({ username, email, password }) {
  try {
    return await request('/auth/register', {
      method: 'POST',
      body: { username, email, password },
    });
  } catch (err) {
    if (isNetworkError(err)) return mockRegister({ username, email, password });
    throw err;
  }
}

export { setToken, clearToken };
