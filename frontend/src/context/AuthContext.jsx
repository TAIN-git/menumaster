import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('menumaster_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      const savedToken = localStorage.getItem('menumaster_token');
      if (savedToken) {
        try {
          const response = await authService.getMe();
          const userData = response.data || response.user || response;
          setUser(userData);
          setToken(savedToken);
          localStorage.setItem('menumaster_user', JSON.stringify(userData));
        } catch (error) {
          console.error('Token inválido:', error);
          localStorage.removeItem('menumaster_token');
          localStorage.removeItem('menumaster_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const { token: newToken, user: userData } = response.data || response;
    localStorage.setItem('menumaster_token', newToken);
    localStorage.setItem('menumaster_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('menumaster_token');
    localStorage.removeItem('menumaster_user');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const isAuthenticated = !!token && !!user;

  const getHomeRoute = useCallback(() => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
        return '/dashboard';
      case 'WAITER':
        return '/floor';
      case 'KITCHEN':
        return '/kitchen';
      default:
        return '/login';
    }
  }, [user]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    getHomeRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
