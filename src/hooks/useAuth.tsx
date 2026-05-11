import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import type { User, AuthState } from '../types';

interface AuthContextValue extends AuthState {
  login:  (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── mock users ────────────────────────────────────────────────
const MOCK_USERS: Record<string, User & { password: string }> = {
  'alex@acme.com': {
    id: 'usr_01',
    name: 'Alex Morel',
    email: 'alex@acme.com',
    password: 'password',
    role: 'developer',
    workspace: 'Acme Corp',
    avatar: undefined,
  },
  'admin@acme.com': {
    id: 'usr_02',
    name: 'Admin User',
    email: 'admin@acme.com',
    password: 'admin',
    role: 'admin',
    workspace: 'Acme Corp',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  // rehydrate from localStorage
  useEffect(() => {
    const token = localStorage.getItem('aria_token');
    const raw   = localStorage.getItem('aria_user');
    if (token && raw) {
      try {
        const user = JSON.parse(raw) as User;
        setState({ user, token, loading: false });
        return;
      } catch { /* fall through */ }
    }
    setState(s => ({ ...s, loading: false }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // mock — replace with: const { user, token } = await api.post('/auth/login', { email, password })
    await new Promise(r => setTimeout(r, 600));
    const found = MOCK_USERS[email.toLowerCase()];
    if (!found || found.password !== password) throw new Error('Invalid credentials');
    const { password: _, ...user } = found;
    const token = `mock_jwt_${Date.now()}`;
    localStorage.setItem('aria_token', token);
    localStorage.setItem('aria_user', JSON.stringify(user));
    setState({ user, token, loading: false });
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 700));
    const user: User = { id: `usr_${Date.now()}`, name, email, role: 'developer', workspace: 'My Workspace' };
    const token = `mock_jwt_${Date.now()}`;
    localStorage.setItem('aria_token', token);
    localStorage.setItem('aria_user', JSON.stringify(user));
    setState({ user, token, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('aria_token');
    localStorage.removeItem('aria_user');
    setState({ user: null, token: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
