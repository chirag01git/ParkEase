import React, { createContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi } from '../api/services';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('parkease_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await getMeApi();
          if (res.data.success) {
            setUser(res.data.data.user);
          }
        } catch (error) {
          console.error('Session restoration failed:', error);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    if (res.data.success) {
      const { user, token } = res.data.data;
      localStorage.setItem('parkease_token', token);
      setToken(token);
      setUser(user);
      return user;
    }
  };

  const register = async (userData) => {
    const res = await registerApi(userData);
    if (res.data.success) {
      const { user, token } = res.data.data;
      localStorage.setItem('parkease_token', token);
      setToken(token);
      setUser(user);
      return user;
    }
  };

  const logout = () => {
    localStorage.removeItem('parkease_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
