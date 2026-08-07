import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  playerLogin: (mobileNumber: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('cricrs_token');
    const savedUser = localStorage.getItem('cricrs_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('cricrs_token', data.token);
    localStorage.setItem('cricrs_user', JSON.stringify(data.user));
  };

  const playerLogin = async (mobileNumber: string) => {
    const data = await authService.playerLogin(mobileNumber);
    setToken(data.token);
    setUser(data.player);
    localStorage.setItem('cricrs_token', data.token);
    localStorage.setItem('cricrs_user', JSON.stringify(data.player));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cricrs_token');
    localStorage.removeItem('cricrs_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, playerLogin, logout, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
