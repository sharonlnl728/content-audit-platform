import { useState, useEffect } from 'react';
import { message } from 'antd';
import api from '../api';

interface UserInfo {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUserInfo(null);
      setLoading(false);
      return;
    }

    try {
      // Parse user info from token (simplified here, should call backend validation in production)
      const response = await api.getProfile();
      if (response.data.code === 200) {
        const userData = response.data.data;
        setUserInfo(userData);
        setIsAuthenticated(true);
        // Store user info in localStorage for API interceptor to use
        // Transform user data to match backend expected format
        const transformedUserData = {
          id: userData.id,
          username: userData.username,
          role: userData.role === 'ADMIN' ? 'MAKER' : 'USER'
        };
        localStorage.setItem('userInfo', JSON.stringify(transformedUserData));
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
            // Get user info immediately
    try {
      const response = await api.getProfile();
      if (response.data.code === 200) {
        const userData = response.data.data;
        setUserInfo(userData);
        // Store user info in localStorage for API interceptor to use
        // Transform user data to match backend expected format
        const transformedUserData = {
          id: userData.id,
          username: userData.username,
          role: userData.role === 'ADMIN' ? 'MAKER' : 'USER'
        };
        localStorage.setItem('userInfo', JSON.stringify(transformedUserData));
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserInfo(null);
    message.success('Logged out successfully');
  };



  const hasRole = (role: 'USER' | 'ADMIN') => {
    return userInfo?.role === role;
  };

  const isAdmin = () => {
    return userInfo?.role === 'ADMIN';
  };

  return {
    isAuthenticated,
    userInfo,
    loading,
    login,
    logout,
    hasRole,
    isAdmin,
    checkAuthStatus
  };
}; 