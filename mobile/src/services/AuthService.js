import api, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthService = {
  // Login – expected response: { accessToken, refreshToken, employeeId, employeeName, role, ... }
  login: async ({ identifier, password }) => {
    try {
      const response = await api.post('/auth/login', {
        UserId: identifier,
        Password: password,
      });

      const { accessToken, refreshToken, employeeId, employeeName, role, employeeCode } = response.data;

      // Store tokens and user data
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await AsyncStorage.setItem(
        USER_DATA_KEY,
        JSON.stringify({
          employeeId,
          employeeName,
          role,
          employeeCode,
        })
      );

      return {
        accessToken,
        refreshToken,
        user: { employeeId, employeeName, role, employeeCode },
      };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Register (final step)
  register: async (formData) => {
    const response = await api.post('/auth/register', formData);
    return response.data;
  },

  // Send OTP for register
  sendRegisterOtp: async (data) => {
    const response = await api.post('/auth/register/send-otp', data);
    return response.data;
  },

  // Verify OTP for register
  verifyRegisterOtp: async (data) => {
    const response = await api.post('/auth/register/verify-otp', data);
    return response.data;
  },

  // Send OTP for login
  sendLoginOtp: async (data) => {
    const response = await api.post('/auth/login/otp/send', data);
    return response.data;
  },

  // Verify OTP for login
  verifyLoginOtp: async (data) => {
    const response = await api.post('/auth/login/otp/verify', data);
    return response.data;
  },

  // Get current user's profile (dashboard)
  getProfile: async () => {
    const response = await api.get('/dashboard/profile');
    return response.data;
  },

  // Reset password
  forgotPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
};

export default AuthService;