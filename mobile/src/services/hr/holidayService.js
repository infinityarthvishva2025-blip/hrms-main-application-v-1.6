import api from '../api';

const HolidayService = {
    // Get all holidays
    getHolidays: async () => {
        try {
            const response = await api.get('/holidays');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Create a new holiday
    createHoliday: async (holidayData) => {
        try {
            const response = await api.post('/holidays', holidayData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Delete a holiday
    deleteHoliday: async (id) => {
        try {
            const response = await api.delete(`/holidays/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default HolidayService;
