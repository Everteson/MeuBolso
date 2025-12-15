import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthStatus } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.Unknown);

  useEffect(() => {
    // Validate token/user with backend on load
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setStatus(AuthStatus.Unauthenticated);
          return;
        }

        const parsed = JSON.parse(storedUser);
        if (!parsed?.token) {
          localStorage.removeItem('user');
          setStatus(AuthStatus.Unauthenticated);
          return;
        }

        // If token is valid, keep logged in and refresh user fields
        const me = await api.auth.me();
        localStorage.setItem('user', JSON.stringify({ ...me, token: parsed.token }));
        setUser({ ...me, token: parsed.token } as any);
        setStatus(AuthStatus.Authenticated);
      } catch {
        localStorage.removeItem('user');
        setUser(null);
        setStatus(AuthStatus.Unauthenticated);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const user = await api.auth.login(email, pass);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setStatus(AuthStatus.Authenticated);
  };

  const logout = () => {
    localStorage.removeItem('user');
    api.auth.logout();
    setUser(null);
    setStatus(AuthStatus.Unauthenticated);
  };

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
