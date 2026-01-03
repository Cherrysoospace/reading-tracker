// js/api/sessionApi.js

import api from './api.js';
import CONFIG from '../config/config.js';

/**
 * Session API Module
 * Handles all reading session-related API operations
 */
const sessionApi = {
    /**
     * Get all reading sessions
     * @returns {Promise<Array>} Array of sessions (ordered by date, most recent first)
     */
    async getAll() {
        try {
            const sessions = await api.get(CONFIG.API.ENDPOINTS.SESSIONS);
            return sessions || [];
        } catch (error) {
            console.error('Error fetching sessions:', error);
            throw error;
        }
    },

    /**
     * Get a single session by ID
     * @param {number} id - Session ID
     * @returns {Promise<Object>} Session object
     */
    async getById(id) {
        try {
            const session = await api.get(CONFIG.API.ENDPOINTS.SESSIONS_BY_ID(id));
            return session;
        } catch (error) {
            console.error(`Error fetching session ${id}:`, error);
            throw error;
        }
    },

    /**
     * Create a new reading session
     * @param {Object} sessionData - Session data
     * @param {number} sessionData.book_id - Book ID (required)
     * @param {string} sessionData.date - Session date in YYYY-MM-DD format (required)
     * @param {number} sessionData.minutes_read - Minutes read (required, > 0)
     * @returns {Promise<Object>} Created session object
     */
    async create(sessionData) {
        try {
            // Validate required fields
            if (!sessionData.book_id || !sessionData.date || !sessionData.minutes_read) {
                throw new Error('Book ID, date, and minutes read are required');
            }

            // Validate minutes
            if (sessionData.minutes_read <= 0) {
                throw new Error('Minutes read must be greater than 0');
            }

            const payload = {
                book_id: parseInt(sessionData.book_id),
                date: sessionData.date,
                minutes_read: parseInt(sessionData.minutes_read)
            };

            const session = await api.post(CONFIG.API.ENDPOINTS.SESSIONS, payload);
            return session;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    },

    /**
     * Delete a reading session
     * @param {number} id - Session ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async delete(id) {
        try {
            await api.delete(CONFIG.API.ENDPOINTS.SESSIONS_BY_ID(id));
            return true;
        } catch (error) {
            console.error(`Error deleting session ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get sessions for a specific date
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Array>} Array of sessions for that date
     */
    async getByDate(date) {
        try {
            const sessions = await api.get(CONFIG.API.ENDPOINTS.SESSIONS_BY_DATE, { date });
            return sessions || [];
        } catch (error) {
            console.error(`Error fetching sessions for date ${date}:`, error);
            throw error;
        }
    },

    /**
     * Get sessions within a date range
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Array>} Array of sessions within the range
     */
    async getByDateRange(startDate, endDate) {
        try {
            // Validate date range
            if (new Date(endDate) < new Date(startDate)) {
                throw new Error('End date cannot be before start date');
            }

            const sessions = await api.get(CONFIG.API.ENDPOINTS.SESSIONS_BY_RANGE, {
                start_date: startDate,
                end_date: endDate
            });
            return sessions || [];
        } catch (error) {
            console.error(`Error fetching sessions for range ${startDate} to ${endDate}:`, error);
            throw error;
        }
    },

    /**
     * Get all sessions for a specific book
     * @param {number} bookId - Book ID
     * @returns {Promise<Array>} Array of sessions for that book
     */
    async getByBook(bookId) {
        try {
            const sessions = await api.get(CONFIG.API.ENDPOINTS.SESSIONS_BY_BOOK(bookId));
            return sessions || [];
        } catch (error) {
            console.error(`Error fetching sessions for book ${bookId}:`, error);
            throw error;
        }
    },

    /**
     * Get sessions for today
     * @returns {Promise<Array>} Array of today's sessions
     */
    async getToday() {
        const today = this.formatDate(new Date());
        return this.getByDate(today);
    },

    /**
     * Get sessions for current week
     * @returns {Promise<Array>} Array of this week's sessions
     */
    async getThisWeek() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        
        const endOfWeek = new Date(today);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

        return this.getByDateRange(
            this.formatDate(startOfWeek),
            this.formatDate(endOfWeek)
        );
    },

    /**
     * Get sessions for current month
     * @returns {Promise<Array>} Array of this month's sessions
     */
    async getThisMonth() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        return this.getByDateRange(
            this.formatDate(startOfMonth),
            this.formatDate(endOfMonth)
        );
    },

    /**
     * Get sessions for current year
     * @returns {Promise<Array>} Array of this year's sessions
     */
    async getThisYear() {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);

        return this.getByDateRange(
            this.formatDate(startOfYear),
            this.formatDate(endOfYear)
        );
    },

    /**
     * Get total minutes read for a book
     * @param {number} bookId - Book ID
     * @returns {Promise<number>} Total minutes read
     */
    async getTotalMinutesByBook(bookId) {
        try {
            const sessions = await this.getByBook(bookId);
            return sessions.reduce((total, session) => total + session.minutes_read, 0);
        } catch (error) {
            console.error(`Error calculating total minutes for book ${bookId}:`, error);
            throw error;
        }
    },

    /**
     * Get sessions grouped by date
     * @param {Array} sessions - Array of sessions (optional, fetches all if not provided)
     * @returns {Promise<Object>} Object with dates as keys and arrays of sessions as values
     */
    async groupByDate(sessions = null) {
        try {
            const allSessions = sessions || await this.getAll();
            
            const grouped = {};
            allSessions.forEach(session => {
                if (!grouped[session.date]) {
                    grouped[session.date] = [];
                }
                grouped[session.date].push(session);
            });

            return grouped;
        } catch (error) {
            console.error('Error grouping sessions by date:', error);
            throw error;
        }
    },

    /**
     * Calculate daily totals
     * @param {Array} sessions - Array of sessions (optional)
     * @returns {Promise<Object>} Object with dates as keys and total minutes as values
     */
    async calculateDailyTotals(sessions = null) {
        try {
            const allSessions = sessions || await this.getAll();
            
            const totals = {};
            allSessions.forEach(session => {
                if (!totals[session.date]) {
                    totals[session.date] = 0;
                }
                totals[session.date] += session.minutes_read;
            });

            return totals;
        } catch (error) {
            console.error('Error calculating daily totals:', error);
            throw error;
        }
    },

    /**
     * Validate session data before creating
     * @param {Object} sessionData - Session data to validate
     * @returns {Object} Validation result { isValid: boolean, errors: Array }
     */
    validate(sessionData) {
        const errors = [];

        // Validate book_id
        if (!sessionData.book_id) {
            errors.push('Book is required');
        } else if (isNaN(parseInt(sessionData.book_id)) || parseInt(sessionData.book_id) <= 0) {
            errors.push('Invalid book ID');
        }

        // Validate date
        if (!sessionData.date) {
            errors.push('Date is required');
        } else {
            const sessionDate = new Date(sessionData.date);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // End of today

            if (isNaN(sessionDate.getTime())) {
                errors.push(CONFIG.CONSTANTS.MESSAGES.ERROR.INVALID_DATE);
            } else if (sessionDate > today) {
                errors.push(CONFIG.CONSTANTS.MESSAGES.ERROR.FUTURE_DATE);
            }
            // Note: Past dates are allowed (users can log old sessions)
        }

        // Validate minutes_read
        if (!sessionData.minutes_read) {
            errors.push('Minutes read is required');
        } else {
            const minutes = parseInt(sessionData.minutes_read);
            
            if (isNaN(minutes)) {
                errors.push('Minutes must be a number');
            } else if (minutes < CONFIG.CONSTANTS.VALIDATION.MIN_MINUTES) {
                errors.push(`Minutes must be at least ${CONFIG.CONSTANTS.VALIDATION.MIN_MINUTES}`);
            } else if (minutes > CONFIG.CONSTANTS.VALIDATION.MAX_MINUTES) {
                errors.push(`Minutes cannot exceed ${CONFIG.CONSTANTS.VALIDATION.MAX_MINUTES} (24 hours)`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Format date to YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Get date range for last N days
     * @param {number} days - Number of days
     * @returns {Object} Object with startDate and endDate
     */
    getLastNDaysRange(days) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days + 1);

        return {
            startDate: this.formatDate(startDate),
            endDate: this.formatDate(today)
        };
    },

    /**
     * Get sessions for last N days
     * @param {number} days - Number of days (e.g., 7, 30)
     * @returns {Promise<Array>} Array of sessions
     */
    async getLastNDays(days) {
        const { startDate, endDate } = this.getLastNDaysRange(days);
        return this.getByDateRange(startDate, endDate);
    }
};

// Freeze the API object to prevent modifications
Object.freeze(sessionApi);

export default sessionApi;
