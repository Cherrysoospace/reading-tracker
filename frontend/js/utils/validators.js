// js/utils/validators.js

import CONFIG from '../config/config.js';
import dateUtils from './dateUtils.js';

/**
 * Form Validation Utilities
 * Client-side validation functions
 */
const validators = {
    /**
     * Validate book title
     * @param {string} title - Book title
     * @returns {Object} Validation result { isValid: boolean, error: string }
     */
    validateTitle(title) {
        if (!title || !title.trim()) {
            return {
                isValid: false,
                error: 'Title is required'
            };
        }

        const trimmed = title.trim();

        if (trimmed.length < CONFIG.CONSTANTS.VALIDATION.MIN_TITLE_LENGTH) {
            return {
                isValid: false,
                error: 'Title is too short'
            };
        }

        if (trimmed.length > CONFIG.CONSTANTS.VALIDATION.MAX_TITLE_LENGTH) {
            return {
                isValid: false,
                error: `Title must be less than ${CONFIG.CONSTANTS.VALIDATION.MAX_TITLE_LENGTH} characters`
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    /**
     * Validate author name
     * @param {string} author - Author name
     * @returns {Object} Validation result { isValid: boolean, error: string }
     */
    validateAuthor(author) {
        // Author is optional, so empty is valid
        if (!author || !author.trim()) {
            return {
                isValid: true,
                error: null
            };
        }

        if (author.length > CONFIG.CONSTANTS.VALIDATION.MAX_AUTHOR_LENGTH) {
            return {
                isValid: false,
                error: `Author must be less than ${CONFIG.CONSTANTS.VALIDATION.MAX_AUTHOR_LENGTH} characters`
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    /**
     * Validate start date
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @returns {Object} Validation result { isValid: boolean, error: string }
     */
    validateStartDate(startDate) {
        if (!startDate) {
            return {
                isValid: false,
                error: 'Start date is required'
            };
        }

        if (!dateUtils.isValid(startDate)) {
            return {
                isValid: false,
                error: CONFIG.CONSTANTS.MESSAGES.ERROR.INVALID_DATE
            };
        }

        if (dateUtils.isFuture(startDate)) {
            return {
                isValid: false,
                error: 'Start date cannot be in the future'
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    /**
     * Validate end date
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {string} startDate - Start date for comparison (optional)
     * @returns {Object} Validation result { isValid: boolean, error: string }
     */
    validateEndDate(endDate, startDate = null) {
        // End date is optional
        if (!endDate) {
            return {
                isValid: true,
                error: null
            };
        }

        if (!dateUtils.isValid(endDate)) {
            return {
                isValid: false,
                error: CONFIG.CONSTANTS.MESSAGES.ERROR.INVALID_DATE
            };
        }

        // Check if end date is before start date
        if (startDate && dateUtils.isValid(startDate)) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end < start) {
                return {
                    isValid: false,
                    error: 'End date cannot be before start date'
                };
            }
        }

        return {
            isValid: true,
            error: null
        };
    },

    /**
     * Validate session date
     * @param {string} date - Session date (YYYY-MM-DD)
     * @returns {Object} Validation result { isValid: boolean, error: string }
     */
    validateSessionDate(date) {
        if (!date) {
            return {
                isValid: false,
                error: 'Date is required'
            };
        }

        if (!dateUtils.isValid(date)) {
            return {
                isValid: false,
                error: CONFIG.CONSTANTS.MESSAGES.ERROR.INVALID_DATE
            };
        }

        if (dateUtils.isFuture(date)) {
            return {
                isValid: false,
                error: CONFIG.CONSTANTS.MESSAGES.ERROR.FUTURE_DATE
            };
        }

        // Past dates are allowed (users can log old sessions)

        return {
            isValid: true,
            error: null
        };
    },

    /**
     * Validate minutes read
     * @param {number|string} minutes - Minutes read
     * @returns {Object} Validation result { isValid: boolean, error: string }
     */
    validateMinutes(minutes) {
        if (!minutes && minutes !== 0) {
            return {
                isValid: false,
                error: 'Minutes is required'
            };
        }

        const value = Number(minutes);

        if (isNaN(value)) {
            return {
                isValid: false,
                error: 'Minutes must be a number'
            };
        }

        if (value < CONFIG.CONSTANTS.VALIDATION.MIN_MINUTES) {
            return {
                isValid: false,
                error: `Minutes must be at least ${CONFIG.CONSTANTS.VALIDATION.MIN_MINUTES}`
            };
        }

        if (value > CONFIG.CONSTANTS.VALIDATION.MAX_MINUTES) {
            return {
                isValid: false,
                error: CONFIG.CONSTANTS.MESSAGES.ERROR.INVALID_MINUTES
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    /**
     * Validate book ID
     * @param {number|string} bookId - Book ID
     * @returns {Object} Validation result { isValid: boolean, error: string }
     */
    validateBookId(bookId) {
        if (!bookId) {
            return {
                isValid: false,
                error: 'Book is required'
            };
        }

        const value = Number(bookId);

        if (isNaN(value) || value <= 0) {
            return {
                isValid: false,
                error: 'Invalid book selection'
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    /**
     * Validate book status
     * @param {string} status - Book status
     * @returns {Object} Validation result { isValid: boolean, error: string }
     */
    validateStatus(status) {
        if (!status) {
            return {
                isValid: false,
                error: 'Status is required'
            };
        }

        const validStatuses = Object.values(CONFIG.CONSTANTS.BOOK_STATUS);
        
        if (!validStatuses.includes(status)) {
            return {
                isValid: false,
                error: `Status must be one of: ${validStatuses.join(', ')}`
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    /**
     * Validate complete book form
     * @param {Object} formData - Form data object
     * @returns {Object} Validation result { isValid: boolean, errors: Object }
     */
    validateBookForm(formData) {
        const errors = {};

        // Validate title
        const titleResult = this.validateTitle(formData.title);
        if (!titleResult.isValid) {
            errors.title = titleResult.error;
        }

        // Validate author (optional)
        if (formData.author) {
            const authorResult = this.validateAuthor(formData.author);
            if (!authorResult.isValid) {
                errors.author = authorResult.error;
            }
        }

        // Validate start date
        const startDateResult = this.validateStartDate(formData.start_date);
        if (!startDateResult.isValid) {
            errors.start_date = startDateResult.error;
        }

        // Validate end date if provided
        if (formData.end_date) {
            const endDateResult = this.validateEndDate(formData.end_date, formData.start_date);
            if (!endDateResult.isValid) {
                errors.end_date = endDateResult.error;
            }
        }

        // Validate status if provided
        if (formData.status) {
            const statusResult = this.validateStatus(formData.status);
            if (!statusResult.isValid) {
                errors.status = statusResult.error;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Validate complete session form
     * @param {Object} formData - Form data object
     * @returns {Object} Validation result { isValid: boolean, errors: Object }
     */
    validateSessionForm(formData) {
        const errors = {};

        // Validate book ID
        const bookIdResult = this.validateBookId(formData.book_id);
        if (!bookIdResult.isValid) {
            errors.book_id = bookIdResult.error;
        }

        // Validate date
        const dateResult = this.validateSessionDate(formData.date);
        if (!dateResult.isValid) {
            errors.date = dateResult.error;
        }

        // Validate minutes
        const minutesResult = this.validateMinutes(formData.minutes_read);
        if (!minutesResult.isValid) {
            errors.minutes_read = minutesResult.error;
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Display validation errors on form
     * @param {Object} errors - Errors object with field names as keys
     * @param {string} formId - Form ID
     */
    displayErrors(errors, formId) {
        // Clear previous errors
        this.clearErrors(formId);

        // Display new errors
        Object.keys(errors).forEach(fieldName => {
            const field = document.querySelector(`#${formId} [name="${fieldName}"]`);
            
            if (field) {
                // Add error class to field
                field.classList.add('border-red-500');
                
                // Create error message element
                const errorDiv = document.createElement('div');
                errorDiv.className = 'text-red-400 text-sm mt-1 error-message';
                errorDiv.textContent = errors[fieldName];
                
                // Insert error message after field
                field.parentElement.appendChild(errorDiv);
            }
        });
    },

    /**
     * Clear validation errors from form
     * @param {string} formId - Form ID
     */
    clearErrors(formId) {
        const form = document.getElementById(formId);
        
        if (form) {
            // Remove error classes
            form.querySelectorAll('.border-red-500').forEach(field => {
                field.classList.remove('border-red-500');
            });

            // Remove error messages
            form.querySelectorAll('.error-message').forEach(error => {
                error.remove();
            });
        }
    },

    /**
     * Sanitize string input (trim and remove extra whitespace)
     * @param {string} input - Input string
     * @returns {string} Sanitized string
     */
    sanitizeString(input) {
        if (!input) return '';
        
        return input.trim().replace(/\s+/g, ' ');
    },

    /**
     * Sanitize form data
     * @param {Object} formData - Form data object
     * @returns {Object} Sanitized form data
     */
    sanitizeFormData(formData) {
        const sanitized = {};

        Object.keys(formData).forEach(key => {
            const value = formData[key];

            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else {
                sanitized[key] = value;
            }
        });

        return sanitized;
    }
};

// Freeze the utility object to prevent modifications
Object.freeze(validators);

export default validators;
