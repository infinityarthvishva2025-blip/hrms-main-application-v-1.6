import api from './api';

const LeaveService = {
    /**
     * Get Pending Leaves (HR/Manager View)
     * GET /api/Leave/pending
     */
    getPendingLeaves: async () => {
        const response = await api.get('/Leave/pending');
        return response.data;
    },

    /**
     * Approve or Reject Leave
     * POST /api/Leave/{id}/approve
     * Body: { approve: boolean }
     */
    approveLeave: async (id, approve) => {
        const response = await api.post(`/Leave/${id}/approve`, { approve });
        return response.data;
    },

    /**
     * Get My Leaves (Employee View)
     * GET /api/Leave/my
     */
    getMyLeaves: async () => {
        const response = await api.get('/Leave/my');
        return response.data;
    },

    /**
     * Apply for Leave
     * POST /api/Leave
     */
    applyLeave: async (data) => {
        const response = await api.post('/Leave', data);
        return response.data;
    },
};

export default LeaveService;
