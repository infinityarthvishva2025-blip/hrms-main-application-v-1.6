import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerToken, setRegisterToken] = useState(null);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken) setToken(storedToken);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setRole(userData.role);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (e) {
        console.error('Failed to load storage data', e);
        setUser(null);
        setToken(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = async (identifier, password) => {
    try {
      const data = await AuthService.login({ identifier, password });
      const { token, user } = data;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      setToken(token);
      setUser(user);
      setRole(user.role);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const sendLoginOtp = async (identifier) => {
    try {
      const data = await AuthService.sendLoginOtp({ identifier });
      return { success: true, message: data?.message || 'OTP sent successfully' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  };

  const loginWithOtp = async (identifier, otp) => {
    try {
      const data = await AuthService.verifyLoginOtp({ identifier, otp });
      const { token, user } = data;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP Login failed',
      };
    }
  };

  const signup = async (name, email, mobile, password, rm_referral, confirmpass) => {
    try {
      const data = await AuthService.register({
        name,
        email,
        mobile,
        password,
        confirm_password: confirmpass,
        rm_referral: rm_referral || '',
      });
      return { success: true, message: data?.message || 'OTP verification required.', data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      if (errorMessage.toLowerCase().includes('otp') || errorMessage.toLowerCase().includes('verification required')) {
        return { success: true, message: 'OTP verification required.' };
      }
      return { success: false, message: errorMessage };
    }
  };

  const sendOtp = async (mobile) => {
    try {
      const data = await AuthService.sendRegisterOtp({ mobile });
      return { success: true, message: data?.message || 'OTP sent successfully' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      if (errorMessage.toLowerCase().includes('already in use') || errorMessage.toLowerCase().includes('already exists')) {
        return { success: false, message: 'This mobile number is already registered. Please use a different number or login.', stopFlow: true };
      }
      return { success: false, message: errorMessage };
    }
  };

  const verifyOtp = async (mobile, otp) => {
    try {
      const data = await AuthService.verifyRegisterOtp({ mobile, otp });
      const { message, registerToken } = data;
      if (!registerToken) throw new Error('No register token received from server');
      setRegisterToken(registerToken);
      return { success: true, message: message || 'OTP verified successfully', registerToken };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Invalid OTP' };
    }
  };

  const completeRegistration = async (userData, registerToken) => {
    try {
      const data = await AuthService.register({ ...userData, registerToken });
      const { message, user: registeredUser } = data;
      if (!registerToken) throw new Error('Register token missing');

      await AsyncStorage.setItem('userToken', registerToken);
      await AsyncStorage.setItem('userData', JSON.stringify(registeredUser));

      setToken(registerToken);
      setUser(registeredUser);
      setRegisterToken(null);
      return { success: true, message: message || 'Registration successful!', user: registeredUser, token: registerToken };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to complete registration' };
    }
  };

  const fetchUserProfile = async () => {
    try {
      const data = await AuthService.getProfile();
      const { user } = data;
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        setUser(user);
        return { success: true, user };
      }
      return { success: false, message: 'No user data received' };
    } catch (error) {
      console.error('Fetch profile error:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to fetch user profile' };
    }
  };

  // --- LOGOUT ---
  // NOTE: We do NOT clear attendance data on logout. 
  // Timer data must persist so users can logout/login and continue their shift.
  // Attendance data is only cleared on successful check-out.
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (e) {
      console.error('Logout error:', e);
    }
    setToken(null);
    setUser(null);
    setRole(null);
    setRegisterToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        registerToken,
        login,
        signup,
        loginWithOtp,
        sendLoginOtp,
        logout,
        sendOtp,
        verifyOtp,
        completeRegistration,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);