/**
 * AttendanceService.js
 * ─────────────────────────────────────────────────────────
 * API service layer for all attendance-related endpoints.
 * Each method maps 1:1 to a backend controller action.
 * ─────────────────────────────────────────────────────────
 */
import api from './api';

/**
 * AsyncStorage key prefixes for per-user attendance data.
 */
export const STORAGE_KEYS = {
  CHECK_IN_TIMESTAMP: 'checkInTimestamp',
  SHIFT_END_TIMESTAMP: 'shiftEndTimestamp',
  SHIFT_DURATION: 'shiftDurationSeconds',
};

/**
 * Returns a user-scoped AsyncStorage key.
 * @param {string} baseKey - one of STORAGE_KEYS values
 * @param {string|number} userId
 * @returns {string} e.g. 'attendance_checkInTimestamp_123'
 */
export const getUserStorageKey = (baseKey, userId) =>
  `attendance_${baseKey}_${userId}`;

const AttendanceService = {
  /**
   * Geo Check-In — POST /api/attendance/geo-checkin
   * @param {{ latitude: number, longitude: number, accuracy: number }} payload
   * @returns {Promise<{ success: boolean }>}
   */

  
  geoCheckIn: async ({ currentLatitude, currentLongitude, currentCity , geoTags, faceImageBase64 }) => {
    const response = await api.post('/attendance/geo-checkin', {
      currentLatitude,
      currentLongitude,
      currentCity,
      geoTags,
      faceImageBase64
    });
    return response.data;
  },

  getTodayAttendance: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  }, 

  /**
   * Field Check-In — POST /api/attendance/field-work
   * @param {{ latitude: number, longitude: number, faceImageBase64: string }} payload
   * @returns {Promise<{ success: boolean }>}
   */
  fieldCheckIn: async ({ currentLatitude, currentLongitude, faceImageBase64 }) => {
    const response = await api.post('/attendance/field-work', {
      currentLatitude,
      currentLongitude,
      faceImageBase64
    });
    return response.data;
  },

  /**
   * Field Check-Out — POST /api/attendance/field-checkout
   * @param {{ latitude: number, longitude: number, faceImageBase64: string }} payload
   * @returns {Promise<{ success: boolean }>}
   */
  fieldCheckOut: async ({ currentLatitude, currentLongitude, faceImageBase64 }) => {
    const response = await api.post('/attendance/field-checkout', {
      currentLatitude,
      currentLongitude,
      faceImageBase64
    });
    return response.data;
  },

  /**
   * Geo Check-Out — POST /api/attendance/geo-checkout
   * Server identifies the employee from the auth token.
   * @returns {Promise<{ success: boolean }>}
   */
  geoCheckOut: async ({ currentLatitude, currentLongitude }) => {
    const response = await api.post('/attendance/geo-checkout', {
      currentLatitude,
      currentLongitude
    });
    return response.data;
  },

  /**
   * My Attendance Summary — GET /api/Attendance/my-summary
   * @param {{ fromDate?: string, toDate?: string }} params
   * @returns {Promise<{ employee: object, records: Array }>}
   */
  getMySummary: async (params = {}) => {
    const response = await api.get('/Attendance/my-summary', { params });
    return response.data;
  },

  /**
   * Employee Summary (HR View) — GET /api/Attendance/employee-summary/:id
   * @param {number} employeeId
   * @param {object} params
   */
  getEmployeeSummary: async (employeeId, params = {}) => {
    const response = await api.get(
      `/Attendance/employee-summary/${employeeId}`,
      { params },
    );
    return response.data;
  },

  /**
   * All Correction Requests (HR) — GET /api/Attendance/correction-requests
   */
  getAllCorrectionRequests: async () => {
    const response = await api.get('/Attendance/correction-requests');
    return response.data;
  },

  /**
   * Correction Request Data — GET /api/Attendance/correction-request
   * @param {number} employeeId
   */
  getCorrectionRequestData: async (employeeId) => {
    const response = await api.get('/Attendance/correction-request', {
      params: { employeeId },
    });
    return response.data;
  },

  /**
   * Submit Correction Request — POST /api/Attendance/correction-request
   * @param {FormData} formData - multipart/form-data payload
   */
  submitCorrectionRequest: async (formData) => {
    const response = await api.post('/Attendance/correction-request', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default AttendanceService;
