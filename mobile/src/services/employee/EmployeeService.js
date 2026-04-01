import api from "../api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = api.defaults.baseURL.replace(/\/$/, "");

const EmployeeService = {
    /**
     * Fetch current user's profile
     * GET /api/employees/my-profile
     */
    getProfile: async () => {
        try {
            const response = await api.get('/employees/my-profile');
            return response.data;
        } catch (error) {
            console.error('Profile fetch error:', error?.response?.data || error?.message || error);
            throw error;
        }
    },

    // Inside EmployeeService.js (or wherever API calls are defined)

 updateEmployeeWithFormData : async (id, formData) => {
    const response = await api.put(`/employees/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
},

// Keep the existing getEmployeeById, etc.


    /**
     * Fetch holidays
     * GET /api/holidays
     */
    getHolidays: async () => {
        try {
            const response = await api.get('/holidays');
            return response.data;
        } catch (error) {
            console.error('Holidays fetch error:', error?.response?.data || error?.message || error);
            throw error;
        }
    },



    /**
     * Fetch all employees (HR functionality)
     * GET /api/employees
     */
    getAllEmployees: async () => {
        try {
            const response = await api.get('/employees');
            return response.data;
        } catch (error) {
            console.error('Fetch all employees error:', error?.response?.data || error?.message || error);
            throw error;
        }
    },

    /**
     * Get employee by ID (used by both HR and Employee)
     * GET /api/employees/{id}
     */
    getEmployeeById: async (id) => {
        try {
            const response = await api.get(`/employees/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Fetch employee ${id} error:`, error?.response?.data || error?.message || error);
            throw error;
        }
    },

    updateEmployeeJson: async (id, data) => {
        try {
            const response = await api.put(`/employees/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Update employee ${id} error:`, error?.response?.data || error?.message || error);
            throw error;
        }
    },

    /**
     * Update employee by ID
     * PUT /api/employees/{id}
     * @param {number|string} id - Employee ID
     * @param {FormData} formData - Multipart form data
     */
    updateEmployee: async (id, formData) => {
        try {
            // Do NOT set Content-Type manually for FormData –
            // axios must set it automatically so it includes the multipart boundary.
            // Authorization is already added by the api.js request interceptor.
            const response = await api.put(`/employees/${id}`, formData);
            return response.data;
        } catch (error) {
            console.error(`Update employee ${id} error:`, error?.response?.data || error?.message || error);
            throw error;
        }
    },

    /**
     * Build the URL to view a document.
     * GET /api/employees/ViewDocument?empCode=...&fileName=...
     * @param {string} empCode - Employee code (e.g. IA00088)
     * @param {string} fileName - File name (e.g. Passbook_20251203173600.pdf)
     * @returns {string|null}
     */
    getDocumentUrl: (empCode, fileName) => {
        if (!empCode || !fileName || fileName === '-' || fileName === 'null') return null;
        // Ensure we use the exact base URL and query parameters as per requirements
        return `${API_BASE_URL}/employees/ViewDocument?empCode=${encodeURIComponent(empCode)}&fileName=${encodeURIComponent(fileName)}`;
    },

    /**
     * Create new employee
     * POST /api/employees
     */
    createEmployee: async (employeeData) => {
        try {
            const response = await api.post('/employees', employeeData);
            return response.data;
        } catch (error) {
            console.error('Create employee error:', error?.response?.data || error?.message || error);
            throw error;
        }
    }
};

export default EmployeeService;
