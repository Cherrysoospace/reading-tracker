// js/utils/dateUtils.js

import CONFIG from '../config/config.js';

/**
 * Date Utilities Module
 * Helper functions for date formatting and manipulation
 */
const dateUtils = {
    /**
     * Format date to YYYY-MM-DD (API format)
     * @param {Date|string} date - Date object or date string
     * @returns {string} Formatted date string
     */
    toAPIFormat(date) {
        const d = date instanceof Date ? date : new Date(date);
        
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date');
        }

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },

    /**
     * Parse a date string (YYYY-MM-DD) as local date, not UTC
     * This prevents the "off by one day" issue when displaying dates
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @returns {Date} Date object in local timezone
     */
    parseLocalDate(dateString) {
        if (!dateString) return null;
        
        // Split the date string and create a date in local timezone
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    },

    /**
     * Format date for display (e.g., "Jan 15, 2024")
     * @param {Date|string} date - Date object or date string
     * @param {boolean} includeYear - Whether to include year (default: true)
     * @returns {string} Formatted date string
     */
    toDisplayFormat(date, includeYear = true) {
        let d;
        
        if (date instanceof Date) {
            d = date;
        } else if (typeof date === 'string') {
            // If it's a YYYY-MM-DD string, parse as local date
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                d = this.parseLocalDate(date);
            } else {
                d = new Date(date);
            }
        } else {
            return 'Invalid date';
        }
        
        if (!d || isNaN(d.getTime())) {
            return 'Invalid date';
        }

        const options = { 
            month: 'short', 
            day: 'numeric'
        };
        
        if (includeYear) {
            options.year = 'numeric';
        }

        return d.toLocaleDateString('en-US', options);
    },

    /**
     * Format date for display in short format (e.g., "Jan 15")
     * @param {Date|string} date - Date object or date string
     * @returns {string} Formatted date string
     */
    toShortFormat(date) {
        return this.toDisplayFormat(date, false);
    },

    /**
     * Format date for input[type="date"] (YYYY-MM-DD)
     * @param {Date|string} date - Date object or date string
     * @returns {string} Formatted date string
     */
    toInputFormat(date) {
        return this.toAPIFormat(date);
    },

    /**
     * Get current date as Date object
     * @returns {Date} Current date (time set to midnight)
     */
    today() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    },

    /**
     * Get current date in API format (YYYY-MM-DD)
     * @returns {string} Current date string
     */
    todayString() {
        return this.toAPIFormat(this.today());
    },

    /**
     * Get yesterday's date
     * @returns {Date} Yesterday's date
     */
    yesterday() {
        const date = this.today();
        date.setDate(date.getDate() - 1);
        return date;
    },

    /**
     * Get tomorrow's date
     * @returns {Date} Tomorrow's date
     */
    tomorrow() {
        const date = this.today();
        date.setDate(date.getDate() + 1);
        return date;
    },

    /**
     * Check if date is today
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is today
     */
    isToday(date) {
        const d = date instanceof Date ? date : new Date(date);
        const today = this.today();
        
        return d.toDateString() === today.toDateString();
    },

    /**
     * Check if date is in the past
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is in the past
     */
    isPast(date) {
        const d = date instanceof Date ? date : new Date(date);
        const today = this.today();
        
        return d < today;
    },

    /**
     * Check if date is in the future
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is in the future
     */
    isFuture(date) {
        const d = date instanceof Date ? date : new Date(date);
        const today = this.today();
        
        return d > today;
    },

    /**
     * Check if date is valid
     * @param {Date|string} date - Date to validate
     * @returns {boolean} True if date is valid
     */
    isValid(date) {
        if (!date) return false;
        
        const d = date instanceof Date ? date : new Date(date);
        return !isNaN(d.getTime());
    },

    /**
     * Add days to a date
     * @param {Date|string} date - Starting date
     * @param {number} days - Number of days to add (can be negative)
     * @returns {Date} New date
     */
    addDays(date, days) {
        const d = date instanceof Date ? new Date(date) : new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    },

    /**
     * Add months to a date
     * @param {Date|string} date - Starting date
     * @param {number} months - Number of months to add (can be negative)
     * @returns {Date} New date
     */
    addMonths(date, months) {
        const d = date instanceof Date ? new Date(date) : new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    },

    /**
     * Get difference between two dates in days
     * @param {Date|string} date1 - First date
     * @param {Date|string} date2 - Second date
     * @returns {number} Difference in days (absolute value)
     */
    diffInDays(date1, date2) {
        const d1 = date1 instanceof Date ? date1 : new Date(date1);
        const d2 = date2 instanceof Date ? date2 : new Date(date2);
        
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Get start of week (Sunday)
     * @param {Date|string} date - Reference date (default: today)
     * @returns {Date} Start of week
     */
    startOfWeek(date = null) {
        const d = date ? (date instanceof Date ? new Date(date) : new Date(date)) : this.today();
        const day = d.getDay();
        const diff = d.getDate() - day;
        
        return new Date(d.setDate(diff));
    },

    /**
     * Get end of week (Saturday)
     * @param {Date|string} date - Reference date (default: today)
     * @returns {Date} End of week
     */
    endOfWeek(date = null) {
        const start = this.startOfWeek(date);
        return this.addDays(start, 6);
    },

    /**
     * Get start of month
     * @param {Date|string} date - Reference date (default: today)
     * @returns {Date} Start of month
     */
    startOfMonth(date = null) {
        const d = date ? (date instanceof Date ? new Date(date) : new Date(date)) : this.today();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    },

    /**
     * Get end of month
     * @param {Date|string} date - Reference date (default: today)
     * @returns {Date} End of month
     */
    endOfMonth(date = null) {
        const d = date ? (date instanceof Date ? new Date(date) : new Date(date)) : this.today();
        return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    },

    /**
     * Get start of year
     * @param {Date|string} date - Reference date (default: today)
     * @returns {Date} Start of year
     */
    startOfYear(date = null) {
        const d = date ? (date instanceof Date ? new Date(date) : new Date(date)) : this.today();
        return new Date(d.getFullYear(), 0, 1);
    },

    /**
     * Get end of year
     * @param {Date|string} date - Reference date (default: today)
     * @returns {Date} End of year
     */
    endOfYear(date = null) {
        const d = date ? (date instanceof Date ? new Date(date) : new Date(date)) : this.today();
        return new Date(d.getFullYear(), 11, 31);
    },

    /**
     * Get date range for last N days
     * @param {number} days - Number of days
     * @returns {Object} Object with start and end dates
     */
    getLastNDays(days) {
        const end = this.today();
        const start = this.addDays(end, -(days - 1));
        
        return {
            start,
            end,
            startString: this.toAPIFormat(start),
            endString: this.toAPIFormat(end)
        };
    },

    /**
     * Get relative date description (e.g., "Today", "Yesterday", "3 days ago")
     * @param {Date|string} date - Date to describe
     * @returns {string} Relative description
     */
    getRelativeDescription(date) {
        const d = date instanceof Date ? date : new Date(date);
        const today = this.today();
        const yesterday = this.yesterday();
        
        if (d.toDateString() === today.toDateString()) {
            return 'Today';
        }
        
        if (d.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        
        const diffDays = this.diffInDays(d, today);
        
        if (d < today) {
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
            }
            if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                return months === 1 ? '1 month ago' : `${months} months ago`;
            }
            const years = Math.floor(diffDays / 365);
            return years === 1 ? '1 year ago' : `${years} years ago`;
        }
        
        return this.toDisplayFormat(d);
    },

    /**
     * Get day name (e.g., "Monday", "Tuesday")
     * @param {Date|string} date - Date
     * @param {boolean} short - Use short format (e.g., "Mon") (default: false)
     * @returns {string} Day name
     */
    getDayName(date, short = false) {
        const d = date instanceof Date ? date : new Date(date);
        const options = { weekday: short ? 'short' : 'long' };
        return d.toLocaleDateString('en-US', options);
    },

    /**
     * Get month name (e.g., "January", "February")
     * @param {Date|string} date - Date
     * @param {boolean} short - Use short format (e.g., "Jan") (default: false)
     * @returns {string} Month name
     */
    getMonthName(date, short = false) {
        const d = date instanceof Date ? date : new Date(date);
        const options = { month: short ? 'short' : 'long' };
        return d.toLocaleDateString('en-US', options);
    },

    /**
     * Parse date string in various formats
     * @param {string} dateString - Date string to parse
     * @returns {Date|null} Parsed date or null if invalid
     */
    parse(dateString) {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        return this.isValid(date) ? date : null;
    },

    /**
     * Compare two dates
     * @param {Date|string} date1 - First date
     * @param {Date|string} date2 - Second date
     * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
     */
    compare(date1, date2) {
        const d1 = date1 instanceof Date ? date1 : new Date(date1);
        const d2 = date2 instanceof Date ? date2 : new Date(date2);
        
        if (d1 < d2) return -1;
        if (d1 > d2) return 1;
        return 0;
    },

    /**
     * Get array of dates between start and end (inclusive)
     * @param {Date|string} startDate - Start date
     * @param {Date|string} endDate - End date
     * @returns {Array<Date>} Array of dates
     */
    getDateRange(startDate, endDate) {
        const start = startDate instanceof Date ? startDate : new Date(startDate);
        const end = endDate instanceof Date ? endDate : new Date(endDate);
        const dates = [];
        
        const current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return dates;
    }
};

// Freeze the utility object to prevent modifications
Object.freeze(dateUtils);

export default dateUtils;
