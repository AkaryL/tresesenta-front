import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider mounted');
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'exists' : 'null');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    console.log('loadUser called');
    try {
      const response = await authAPI.me();
      console.log('loadUser response:', response.data);
      // El backend devuelve { user: {...} }
      if (response.data && response.data.user) {
        console.log('Setting user from response.data.user');
        setUser(response.data.user);
      } else if (response.data) {
        // Si el backend devuelve directamente el usuario
        console.log('Setting user from response.data');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      console.log('loadUser finished, setting loading to false');
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    console.log('login called with:', credentials);
    const response = await authAPI.login(credentials);
    console.log('login response:', response.data);
    const { token, user: newUser } = response.data;
    localStorage.setItem('token', token);
    console.log('Token saved, setting user:', newUser);
    setUser(newUser);
    setLoading(false);
    return response.data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { token, user: newUser } = response.data;
    localStorage.setItem('token', token);
    setUser(newUser);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
