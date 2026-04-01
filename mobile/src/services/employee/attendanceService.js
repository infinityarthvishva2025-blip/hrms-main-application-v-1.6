import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------- User‑scoped storage keys ----------
export const STORAGE_KEYS = {
  CHECK_IN_TIMESTAMP: '@attendance_check_in_timestamp',
  SHIFT_END_TIMESTAMP: '@attendance_shift_end_timestamp',
  SHIFT_DURATION: '@attendance_shift_duration',
};

export const getUserStorageKey = (baseKey, userId) => {
  if (!userId) throw new Error('userId is required to build storage key');
  return `${baseKey}_${userId}`;
};

const AttendanceService = {
  // --- Employee Endpoints ---
  geoCheckIn: async ({ latitude, longitude, accuracy }) => {
    try {
      const response = await api.post('/attendance/geo-checkin', {
        latitude,
        longitude,
        accuracy,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  geoCheckOut: async ({ latitude, longitude, accuracy }) => {
    try {
      const response = await api.post('/attendance/geo-checkout', {
        latitude,
        longitude,
        accuracy,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMySummary: async (params = {}) => {
    try {
      const response = await api.get('/Attendance/my-summary', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // --- Clear user‑specific attendance data from AsyncStorage ---
  clearUserAttendanceData: async (userId) => {
    if (!userId) return;
    const keysToRemove = [
      getUserStorageKey(STORAGE_KEYS.CHECK_IN_TIMESTAMP, userId),
      getUserStorageKey(STORAGE_KEYS.SHIFT_END_TIMESTAMP, userId),
      getUserStorageKey(STORAGE_KEYS.SHIFT_DURATION, userId),
    ];
    try {
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.log('Failed to clear attendance data for user', userId, error);
    }
  },

  // --- Other endpoints (unchanged) ---
  getCorrectionRequestData: async (employeeId) => {
    try {
      const response = await api.get('/Attendance/correction-request', {
        params: { employeeId },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  submitCorrectionRequest: async (formData) => {
    try {
      const response = await api.post('/Attendance/correction-request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEmployeeSummary: async (employeeId) => {
    try {
      const response = await api.get(`/Attendance/employee-summary/${employeeId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllCorrectionRequests: async () => {
    try {
      const response = await api.get('/Attendance/correction-requests');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  processCorrectionRequest: async (data) => {
    try {
      const response = await api.post('/Attendance/approve-reject', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default AttendanceService;