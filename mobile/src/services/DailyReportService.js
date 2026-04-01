/**
 * DailyReportService.js
 * ─────────────────────────────────────────────────────────
 * API service for Daily Report submission.
 * ─────────────────────────────────────────────────────────
 */
import api from './api';

const DailyReportService = {
    /**
     * Submit Daily Report — POST /api/DailyReportApi/send
     *
     * @param {FormData} formData - multipart/form-data with:
     *   - TodaysWork (string, required)
     *   - PendingWork (string)
     *   - Issues (string)
     *   - SelectedRecipientIds (appended multiple times for each ID)
     *   - Attachment (file, optional)
     * @returns {Promise<{ message: string }>}
     */
    sendDailyReport: async (formData) => {
        const response = await api.post('/DailyReportApi/send', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};

export default DailyReportService;
