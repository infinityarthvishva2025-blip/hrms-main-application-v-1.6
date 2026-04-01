import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AuthService from '../services/AuthService';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Rehydrate auth state
  useEffect(() => {
    let mounted = true;

    const loadStoredData = async () => {
      try {
        const [storedAccessToken, storedRefreshToken, storedUser] =
          await Promise.all([
            AsyncStorage.getItem(ACCESS_TOKEN_KEY),
            AsyncStorage.getItem(REFRESH_TOKEN_KEY),
            AsyncStorage.getItem(USER_DATA_KEY),
          ]);

        if (!mounted) return;

        if (storedAccessToken) setAccessToken(storedAccessToken);
        if (storedRefreshToken) setRefreshToken(storedRefreshToken);

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setRole(parsedUser.role); // ✅ CRITICAL FIX
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStoredData();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ LOGIN FIX
  const login = async (identifier, password) => {
    try {
      const data = await AuthService.login({ identifier, password });

      const {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: userData, // ✅ correct
      } = data;

      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      setRole(userData?.role); // ✅ FIX

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        ACCESS_TOKEN_KEY,
        REFRESH_TOKEN_KEY,
        USER_DATA_KEY,
      ]);
    } catch (e) {
      console.error('Logout error', e);
    }

    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setRole(null); // ✅ IMPORTANT
  };

  const fetchUserProfile = async () => {
    try {
      const data = await AuthService.getProfile();
      const profileUser = data.user || data;

      if (profileUser) {
        await AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(profileUser)
        );

        setUser(profileUser);
        setRole(profileUser.role); // ✅ FIX

        return { success: true, user: profileUser };
      }

      return { success: false, message: 'No user data received' };
    } catch (error) {
      console.error('Fetch profile error:', error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Failed to fetch user profile',
      };
    }
  };

  const value = useMemo(
    () => ({
      user,
      role,
      accessToken,
      refreshToken,
      loading,
      isAuthenticated: !!accessToken,
      login,
      logout,
      fetchUserProfile,
    }),
    [user, role, accessToken, refreshToken, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);