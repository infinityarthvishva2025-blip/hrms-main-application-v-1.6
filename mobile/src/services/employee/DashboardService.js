// DashboardService.js
// import api from './api';

import api from "../api";

const DashboardService = {
  /**
   * Fetch employee dashboard data
   * Backend example:
   * GET /api/employees/dashboard/41?month=1&year=2026
   */
  getEmployeeDashboard: async ({ employeeId, month, year }) => {
    try {
      if (!employeeId) {
        throw new Error('Employee ID is required to fetch dashboard data.');
      }

      const response = await api.get(`/api/employees/dashboard/${employeeId}`, {
        params: { month, year },
      });

      return response.data;
    } catch (error) {
      console.error('Dashboard fetch error:', error?.response?.data || error?.message || error);
      throw error;
    }
  },
};

export default DashboardService;
