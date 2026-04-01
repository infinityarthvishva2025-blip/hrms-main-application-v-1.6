import api from '../api';

const LeaveService = {
  // ================= EMPLOYEE OPERATIONS =================

  /**
   * Apply for leave
   * @param {Object} leaveData - { category, leaveType, startDate, endDate, timeValue, reason }
   * @returns {Promise}
   */
  applyLeave: async (leaveData) => {
    try {
      const response = await api.post('/Leave/Create', leaveData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
 * Get comp-off details (balance and available dates)
 * @returns {Promise}
 */
  getCompOffDetails: async () => {
    try {
      const response = await api.get('/Leave/Create');
      return response.data; // returns { compOffBalance, compOffDates, ... }
    } catch (error) {
      throw error;
    }
  },



  /**
   * Get my leaves
   * @returns {Promise}
   */


  getMyLeaves: async () => {
    try {
      const response = await api.get('/Leave/MyLeaves');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get monthly leave summary for a specific year
   * @param {Number} year - Year (e.g., 2026)
   * @returns {Promise}
   */
  getMonthlySummary: async (year) => {
    try {
      const response = await api.get('/Leave/monthly-summary', {
        params: { year }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get leave status summary (Approved/Rejected/Cancelled/Pending counts)
   * @returns {Promise}
   */
  getStatusSummary: async () => {
    try {
      const response = await api.get('/Leave/status-summary');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancel a leave request
   * @param {Number} leaveId - Leave ID
   * @returns {Promise}
   */
  cancelLeave: async (leaveId) => {
    try {
      const response = await api.post(`/Leave/${leaveId}/cancel`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ================= HR OPERATIONS =================

  /**
   * Get pending leave approvals (HR/Manager/VP/Director based on role)
   * @returns {Promise}
   */
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/Leave/pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Approve or reject a leave request
   * @param {Number} leaveId - Leave ID
   * @param {Boolean} approve - true to approve, false to reject
   * @param {String} remarks - Optional remarks
   * @returns {Promise}
   */
  processLeave: async (leaveId, approve, remarks = '') => {
    try {
      const response = await api.post(`/Leave/${leaveId}/approve`, {
        approve,
        remarks
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default LeaveService;
