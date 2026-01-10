// js/api/wrappedApi.js

import api from './api.js';
import CONFIG from '../config/config.js';

/**
 * Wrapped API Module
 * Handles all Reading Wrapped API operations
 */
const wrappedApi = {
    /**
     * Get complete wrapped summary for a year
     * @param {number} year - Year (optional, defaults to current year)
     * @returns {Promise<Object>} Complete wrapped data
     */
    async getSummary(year = null) {
        try {
            const params = year ? { year } : {};
            const data = await api.get('/wrapped/summary', params);
            return data;
        } catch (error) {
            console.error('Error fetching wrapped summary:', error);
            throw error;
        }
    },

    /**
     * Get general statistics
     * @param {number} year - Year
     * @returns {Promise<Object>} General stats
     */
    async getGeneralStats(year = null) {
        try {
            const params = year ? { year } : {};
            const data = await api.get('/wrapped/general-stats', params);
            return data;
        } catch (error) {
            console.error('Error fetching general stats:', error);
            throw error;
        }
    },

    /**
     * Get protagonist book data
     * @param {number} year - Year
     * @returns {Promise<Object>} Protagonist book stats
     */
    async getProtagonistBook(year = null) {
        try {
            const params = year ? { year } : {};
            const data = await api.get('/wrapped/protagonist-book', params);
            return data;
        } catch (error) {
            console.error('Error fetching protagonist book:', error);
            throw error;
        }
    },

    /**
     * Get authors statistics
     * @param {number} year - Year
     * @returns {Promise<Object>} Authors stats
     */
    async getAuthorsStats(year = null) {
        try {
            const params = year ? { year } : {};
            const data = await api.get('/wrapped/authors', params);
            return data;
        } catch (error) {
            console.error('Error fetching authors stats:', error);
            throw error;
        }
    },

    /**
     * Get reading habits
     * @param {number} year - Year
     * @returns {Promise<Object>} Reading habits
     */
    async getReadingHabits(year = null) {
        try {
            const params = year ? { year } : {};
            const data = await api.get('/wrapped/habits', params);
            return data;
        } catch (error) {
            console.error('Error fetching reading habits:', error);
            throw error;
        }
    },

    /**
     * Get biggest reading day
     * @param {number} year - Year
     * @returns {Promise<Object>} Biggest reading day data
     */
    async getBiggestDay(year = null) {
        try {
            const params = year ? { year } : {};
            const data = await api.get('/wrapped/biggest-day', params);
            return data;
        } catch (error) {
            console.error('Error fetching biggest day:', error);
            throw error;
        }
    },

    /**
     * Get reading status
     * @param {number} year - Year
     * @returns {Promise<Object>} Reading status
     */
    async getReadingStatus(year = null) {
        try {
            const params = year ? { year } : {};
            const data = await api.get('/wrapped/status', params);
            return data;
        } catch (error) {
            console.error('Error fetching reading status:', error);
            throw error;
        }
    },

    /**
     * Get reader personality
     * @param {number} year - Year
     * @returns {Promise<Object>} Reader personality
     */
    async getPersonality(year = null) {
        try {
            const params = year ? { year } : {};
            const data = await api.get('/wrapped/personality', params);
            return data;
        } catch (error) {
            console.error('Error fetching personality:', error);
            throw error;
        }
    },

    /**
     * Get available years with data
     * @returns {Promise<Object>} Object with years array
     */
    async getAvailableYears() {
        try {
            const data = await api.get('/wrapped/available-years');
            return data;
        } catch (error) {
            console.error('Error fetching available years:', error);
            throw error;
        }
    },

    /**
     * Get current year
     * @returns {number} Current year
     */
    getCurrentYear() {
        return new Date().getFullYear();
    }
};

// Freeze the API object to prevent modifications
Object.freeze(wrappedApi);

export default wrappedApi;
