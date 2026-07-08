import { createContext, useContext, useState, useCallback } from 'react';
import * as authApi from '../api/auth';

const USER_KEY = 'soundex_user';
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const persist = useCallback(({ token, user: nextUser }) => {
    authApi.setToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials);
      persist(data);
      return data;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload);
      persist(data);
      return data;
    },
    [persist]
  );

  const logout = useCallback(() => {
    authApi.clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = { user, isAuthenticated: !!user, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
