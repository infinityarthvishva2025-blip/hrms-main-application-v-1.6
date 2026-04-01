import api from './api';

const AnnouncementService = {
    // HR: Get all announcements
    getAllAnnouncements: async () => {
        try {
            const response = await api.get('/AnnouncementsApi/hr/list');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HR: Create announcement
    createAnnouncement: async (announcementData) => {
        try {
            const response = await api.post('/AnnouncementsApi/hr/create', announcementData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HR: Delete one announcement
    deleteAnnouncement: async (id) => {
        try {
            const response = await api.delete(`/AnnouncementsApi/hr/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // HR: Delete all announcements
    deleteAllAnnouncements: async () => {
        try {
            const response = await api.delete('/AnnouncementsApi/hr/delete-all');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Employee: Get my announcements
    getMyAnnouncements: async () => {
        try {
            const response = await api.get('/AnnouncementsApi/my');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Employee: Mark as read
    markAsRead: async (id) => {
        try {
            const response = await api.post(`/AnnouncementsApi/${id}/read`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default AnnouncementService;
