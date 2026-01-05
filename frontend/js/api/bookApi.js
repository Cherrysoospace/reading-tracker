// js/api/bookApi.js

import api from './api.js';
import CONFIG from '../config/config.js';

/**
 * Book API Module
 * Handles all book-related API operations
 */
const bookApi = {
    /**
     * Get all books
     * @returns {Promise<Array>} Array of books
     */
    async getAll() {
        try {
            const books = await api.get(CONFIG.API.ENDPOINTS.BOOKS);
            return books || [];
        } catch (error) {
            console.error('Error fetching books:', error);
            throw error;
        }
    },

    /**
     * Get a single book by ID
     * @param {number} id - Book ID
     * @returns {Promise<Object>} Book object
     */
    async getById(id) {
        try {
            const book = await api.get(CONFIG.API.ENDPOINTS.BOOKS_BY_ID(id));
            return book;
        } catch (error) {
            console.error(`Error fetching book ${id}:`, error);
            throw error;
        }
    },

    /**
     * Create a new book
     * @param {Object} bookData - Book data
     * @param {string} bookData.title - Book title (required)
     * @param {string} bookData.author - Book author (optional)
     * @param {string} bookData.start_date - Start date in YYYY-MM-DD format (required)
     * @returns {Promise<Object>} Created book object
     */
    async create(bookData) {
        try {
            // Validate required fields
            if (!bookData.title || !bookData.start_date) {
                throw new Error('Title and start date are required');
            }

            const payload = {
                title: bookData.title.trim(),
                author: bookData.author ? bookData.author.trim() : '',
                start_date: bookData.start_date
            };

            const book = await api.post(CONFIG.API.ENDPOINTS.BOOKS, payload);
            return book;
        } catch (error) {
            console.error('Error creating book:', error);
            throw error;
        }
    },

    /**
     * Update a book
     * @param {number} id - Book ID
     * @param {Object} bookData - Updated book data (all fields optional)
     * @param {string} bookData.title - Book title
     * @param {string} bookData.author - Book author
     * @param {string} bookData.start_date - Start date in YYYY-MM-DD format
     * @param {string} bookData.end_date - End date in YYYY-MM-DD format
     * @param {string} bookData.status - Book status ('reading' or 'finished')
     * @returns {Promise<Object>} Updated book object
     */
    async update(id, bookData) {
        try {
            // Build payload with only provided fields
            const payload = {};

            if (bookData.title !== undefined) {
                payload.title = bookData.title.trim();
            }

            if (bookData.author !== undefined) {
                payload.author = bookData.author.trim();
            }

            if (bookData.start_date !== undefined) {
                payload.start_date = bookData.start_date;
            }

            if (bookData.end_date !== undefined) {
                payload.end_date = bookData.end_date;
            }

            if (bookData.status !== undefined) {
                // Validate status
                const validStatuses = Object.values(CONFIG.CONSTANTS.BOOK_STATUS);
                if (!validStatuses.includes(bookData.status)) {
                    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
                }
                payload.status = bookData.status;
            }

            const book = await api.put(CONFIG.API.ENDPOINTS.BOOKS_BY_ID(id), payload);
            return book;
        } catch (error) {
            console.error(`Error updating book ${id}:`, error);
            throw error;
        }
    },

    /**
     * Mark a book as finished
     * @param {number} id - Book ID
     * @param {string} endDate - End date in YYYY-MM-DD format (optional, defaults to today on backend)
     * @returns {Promise<Object>} Updated book object
     */
    async markAsFinished(id, endDate = null) {
        try {
            const endpoint = endDate 
                ? `${CONFIG.API.ENDPOINTS.BOOKS_FINISH(id)}?end_date=${endDate}`
                : CONFIG.API.ENDPOINTS.BOOKS_FINISH(id);

            const book = await api.patch(endpoint);
            return book;
        } catch (error) {
            console.error(`Error marking book ${id} as finished:`, error);
            throw error;
        }
    },

    /**
     * Delete a book
     * @param {number} id - Book ID
     * @returns {Promise<boolean>} True if deleted successfully
     * @throws {Error} If book has sessions or doesn't exist
     */
    async delete(id) {
        try {
            await api.delete(CONFIG.API.ENDPOINTS.BOOKS_BY_ID(id));
            return true;
        } catch (error) {
            console.error(`Error deleting book ${id}:`, error);
            
            // Check if error is due to sessions
            if (error.message.toLowerCase().includes('session')) {
                throw new Error(CONFIG.CONSTANTS.MESSAGES.ERROR.BOOK_HAS_SESSIONS);
            }
            
            throw error;
        }
    },

    /**
     * Get books filtered by status
     * @param {string} status - Book status ('reading' or 'finished')
     * @returns {Promise<Array>} Filtered array of books
     */
    async getByStatus(status) {
        try {
            const allBooks = await this.getAll();
            return allBooks.filter(book => book.status === status);
        } catch (error) {
            console.error(`Error fetching books with status ${status}:`, error);
            throw error;
        }
    },

    /**
     * Get currently reading books
     * @returns {Promise<Array>} Array of books with status 'reading'
     */
    async getCurrentlyReading() {
        return this.getByStatus(CONFIG.CONSTANTS.BOOK_STATUS.READING);
    },

    /**
     * Get finished books
     * @returns {Promise<Array>} Array of books with status 'finished'
     */
    async getFinished() {
        return this.getByStatus(CONFIG.CONSTANTS.BOOK_STATUS.FINISHED);
    },

    /**
     * Search books by title or author
     * @param {string} query - Search query
     * @returns {Promise<Array>} Filtered array of books
     */
    async search(query) {
        try {
            const allBooks = await this.getAll();
            const searchTerm = query.toLowerCase().trim();
            
            return allBooks.filter(book => {
                const title = book.title.toLowerCase();
                const author = (book.author || '').toLowerCase();
                return title.includes(searchTerm) || author.includes(searchTerm);
            });
        } catch (error) {
            console.error('Error searching books:', error);
            throw error;
        }
    },

    /**
     * Validate book data before creating/updating
     * @param {Object} bookData - Book data to validate
     * @returns {Object} Validation result { isValid: boolean, errors: Array }
     */
    validate(bookData) {
        const errors = [];

        // Validate title
        if (bookData.title !== undefined) {
            const title = bookData.title.trim();
            if (!title) {
                errors.push('Title is required');
            } else if (title.length < CONFIG.CONSTANTS.VALIDATION.MIN_TITLE_LENGTH) {
                errors.push('Title is too short');
            } else if (title.length > CONFIG.CONSTANTS.VALIDATION.MAX_TITLE_LENGTH) {
                errors.push(`Title must be less than ${CONFIG.CONSTANTS.VALIDATION.MAX_TITLE_LENGTH} characters`);
            }
        }

        // Validate author
        if (bookData.author !== undefined && bookData.author) {
            if (bookData.author.length > CONFIG.CONSTANTS.VALIDATION.MAX_AUTHOR_LENGTH) {
                errors.push(`Author must be less than ${CONFIG.CONSTANTS.VALIDATION.MAX_AUTHOR_LENGTH} characters`);
            }
        }

        // Validate start_date
        if (bookData.start_date !== undefined) {
            const date = new Date(bookData.start_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (isNaN(date.getTime())) {
                errors.push('Invalid start date');
            } else if (date > today) {
                errors.push('Start date cannot be in the future');
            }
        }

        // Validate end_date
        if (bookData.end_date !== undefined && bookData.end_date) {
            const endDate = new Date(bookData.end_date);
            
            if (isNaN(endDate.getTime())) {
                errors.push('Invalid end date');
            }
            
            // If both start and end date provided, validate end >= start
            if (bookData.start_date) {
                const startDate = new Date(bookData.start_date);
                if (endDate < startDate) {
                    errors.push('End date cannot be before start date');
                }
            }
        }

        // Validate status
        if (bookData.status !== undefined) {
            const validStatuses = Object.values(CONFIG.CONSTANTS.BOOK_STATUS);
            if (!validStatuses.includes(bookData.status)) {
                errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// Freeze the API object to prevent modifications
Object.freeze(bookApi);

export default bookApi;
