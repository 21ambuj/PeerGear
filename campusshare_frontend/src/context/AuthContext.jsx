import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, adminApi, analyticsApi } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('campusshare_token') || '');
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchProfileIfLoggedIn();
  }, []);

  // Background activity alert poller when authenticated
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchProfileIfLoggedIn = async () => {
    const savedToken = localStorage.getItem('campusshare_token');
    if (savedToken) {
      try {
        const profRes = await authApi.getProfile();
        const profUser = profRes.data?.user;
        if (!profUser || !profUser.is_email_verified) {
          // If unverified, clear session immediately
          localStorage.removeItem('campusshare_token');
          setToken('');
          setUser(null);
        } else {
          setUser(profUser);
          fetchNotifications();
        }
      } catch (err) {
        // Token expired or invalid
        localStorage.removeItem('campusshare_token');
        setToken('');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await analyticsApi.getNotifications();
      setUnreadNotifications(res.data.unread_count || 0);
    } catch (e) {
      // Ignore
    }
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data?.requires_otp || !res.data?.user?.is_email_verified) {
      // Unverified student: DO NOT log in, return response requiring OTP verification
      return res.data;
    }
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('campusshare_token', newToken);
    setToken(newToken);
    setUser(newUser);
    fetchNotifications();
    return newUser;
  };

  const adminLogin = async (email, password) => {
    const res = await adminApi.login({ email, password });
    const { token: newToken, admin: adminUser } = res.data;
    localStorage.setItem('campusshare_token', newToken);
    setToken(newToken);
    setUser(adminUser);
    fetchNotifications();
    return adminUser;
  };

  const register = async (userData) => {
    // Only dispatch registration and request OTP. DO NOT log in before OTP is verified!
    const res = await authApi.register(userData);
    return res.data;
  };

  // Called ONLY when 6-digit email OTP is verified successfully
  const loginWithVerifiedSession = (newToken, verifiedUser) => {
    localStorage.setItem('campusshare_token', newToken);
    setToken(newToken);
    setUser(verifiedUser);
    fetchNotifications();
  };

  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('campusshare_token');
    setToken('');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getProfile();
      setUser(res.data.user);
      fetchNotifications();
    } catch (e) {
      console.error("Failed to refresh user:", e);
    }
  };

  const topupWallet = async (amount, metadata = {}) => {
    const res = await authApi.topupWallet(amount, metadata);
    if (user) {
      setUser({ ...user, wallet_balance: res.data.wallet_balance });
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        unreadNotifications,
        login,
        adminLogin,
        register,
        loginWithVerifiedSession,
        updateUserState,
        logout,
        refreshUser,
        topupWallet,
        fetchNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
