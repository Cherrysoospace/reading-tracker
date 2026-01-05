// js/utils/timeUtils.js

/**
 * Time Utilities Module
 * Helper functions for time conversion and formatting
 */
const timeUtils = {
    /**
     * Convert minutes to hours (decimal)
     * @param {number} minutes - Total minutes
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {number} Hours as decimal
     */
    minutesToHours(minutes, decimals = 2) {
        if (!minutes || minutes === 0) return 0;
        
        const hours = minutes / 60;
        return Number(hours.toFixed(decimals));
    },

    /**
     * Convert hours to minutes
     * @param {number} hours - Total hours
     * @returns {number} Minutes
     */
    hoursToMinutes(hours) {
        if (!hours || hours === 0) return 0;
        
        return Math.round(hours * 60);
    },

    /**
     * Format minutes to readable string (e.g., "2h 30m" or "45m")
     * @param {number} minutes - Total minutes
     * @param {boolean} verbose - Use verbose format (default: false)
     * @returns {string} Formatted time string
     */
    formatMinutes(minutes, verbose = false) {
        if (!minutes || minutes === 0) {
            return verbose ? '0 minutes' : '0m';
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (verbose) {
            if (hours === 0) {
                return mins === 1 ? '1 minute' : `${mins} minutes`;
            } else if (mins === 0) {
                return hours === 1 ? '1 hour' : `${hours} hours`;
            } else {
                const hourStr = hours === 1 ? '1 hour' : `${hours} hours`;
                const minStr = mins === 1 ? '1 minute' : `${mins} minutes`;
                return `${hourStr} ${minStr}`;
            }
        } else {
            if (hours === 0) {
                return `${mins}m`;
            } else if (mins === 0) {
                return `${hours}h`;
            } else {
                return `${hours}h ${mins}m`;
            }
        }
    },

    /**
     * Format hours to readable string (e.g., "2.5 hours" or "2.5h")
     * @param {number} hours - Total hours
     * @param {boolean} verbose - Use verbose format (default: false)
     * @returns {string} Formatted hours string
     */
    formatHours(hours, verbose = false) {
        if (!hours || hours === 0) {
            return verbose ? '0 hours' : '0h';
        }

        const rounded = Math.round(hours * 10) / 10; // Round to 1 decimal

        if (verbose) {
            return rounded === 1 ? '1 hour' : `${rounded} hours`;
        } else {
            return `${rounded}h`;
        }
    },

    /**
     * Format minutes as hours and minutes object
     * @param {number} minutes - Total minutes
     * @returns {Object} Object with hours and minutes properties
     */
    splitMinutes(minutes) {
        if (!minutes || minutes === 0) {
            return { hours: 0, minutes: 0 };
        }

        return {
            hours: Math.floor(minutes / 60),
            minutes: minutes % 60
        };
    },

    /**
     * Calculate reading pace (pages per minute)
     * @param {number} pages - Number of pages
     * @param {number} minutes - Time in minutes
     * @returns {number} Pages per minute (rounded to 2 decimals)
     */
    calculatePace(pages, minutes) {
        if (!pages || !minutes || minutes === 0) return 0;
        
        const pace = pages / minutes;
        return Number(pace.toFixed(2));
    },

    /**
     * Estimate time to finish (minutes)
     * @param {number} pagesLeft - Pages remaining
     * @param {number} averagePace - Average pages per minute
     * @returns {number} Estimated minutes to finish
     */
    estimateTimeToFinish(pagesLeft, averagePace) {
        if (!pagesLeft || !averagePace || averagePace === 0) return 0;
        
        return Math.round(pagesLeft / averagePace);
    },

    /**
     * Format duration between two timestamps
     * @param {Date|string} startTime - Start time
     * @param {Date|string} endTime - End time
     * @returns {string} Formatted duration
     */
    formatDuration(startTime, endTime) {
        const start = startTime instanceof Date ? startTime : new Date(startTime);
        const end = endTime instanceof Date ? endTime : new Date(endTime);
        
        const diffMs = end - start;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        return this.formatMinutes(diffMinutes);
    },

    /**
     * Calculate average minutes per day
     * @param {number} totalMinutes - Total minutes
     * @param {number} days - Number of days
     * @returns {number} Average minutes per day (rounded)
     */
    calculateAverage(totalMinutes, days) {
        if (!totalMinutes || !days || days === 0) return 0;
        
        return Math.round(totalMinutes / days);
    },

    /**
     * Get time of day greeting based on current time
     * @returns {string} Greeting ("morning", "afternoon", "evening")
     */
    getTimeOfDay() {
        const hour = new Date().getHours();
        
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    },

    /**
     * Format time for display (HH:MM AM/PM)
     * @param {Date|string} time - Time to format
     * @returns {string} Formatted time string
     */
    formatTime(time) {
        const d = time instanceof Date ? time : new Date(time);
        
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    /**
     * Validate minutes value
     * @param {number} minutes - Minutes to validate
     * @param {number} min - Minimum allowed value (default: 1)
     * @param {number} max - Maximum allowed value (default: 1440)
     * @returns {Object} Validation result { isValid: boolean, error: string }
     */
    validateMinutes(minutes, min = 1, max = 1440) {
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

        if (value < min) {
            return {
                isValid: false,
                error: `Minutes must be at least ${min}`
            };
        }

        if (value > max) {
            return {
                isValid: false,
                error: `Minutes cannot exceed ${max} (24 hours)`
            };
        }

        return {
            isValid: true,
            error: null
        };
    },

    /**
     * Get reading goal progress
     * @param {number} currentMinutes - Current minutes read
     * @param {number} goalMinutes - Goal minutes
     * @returns {Object} Progress object with percentage and remaining
     */
    getProgress(currentMinutes, goalMinutes) {
        if (!goalMinutes || goalMinutes === 0) {
            return {
                percentage: 0,
                remaining: 0,
                isComplete: false
            };
        }

        const percentage = Math.min(Math.round((currentMinutes / goalMinutes) * 100), 100);
        const remaining = Math.max(goalMinutes - currentMinutes, 0);

        return {
            percentage,
            remaining,
            isComplete: currentMinutes >= goalMinutes
        };
    },

    /**
     * Format reading statistics summary
     * @param {number} totalMinutes - Total minutes read
     * @returns {Object} Summary object with different time formats
     */
    getSummary(totalMinutes) {
        const hours = this.minutesToHours(totalMinutes);
        const { hours: h, minutes: m } = this.splitMinutes(totalMinutes);

        return {
            totalMinutes,
            totalHours: hours,
            formatted: this.formatMinutes(totalMinutes),
            formattedVerbose: this.formatMinutes(totalMinutes, true),
            split: { hours: h, minutes: m }
        };
    },

    /**
     * Compare two time values
     * @param {number} minutes1 - First time in minutes
     * @param {number} minutes2 - Second time in minutes
     * @returns {Object} Comparison object
     */
    compare(minutes1, minutes2) {
        const diff = minutes1 - minutes2;
        const percentChange = minutes2 > 0 
            ? Math.round((diff / minutes2) * 100) 
            : (minutes1 > 0 ? 100 : 0);

        return {
            difference: diff,
            percentChange,
            isIncrease: diff > 0,
            isDecrease: diff < 0,
            formatted: this.formatMinutes(Math.abs(diff))
        };
    },

    /**
     * Calculate minutes from hours and minutes input
     * @param {number} hours - Hours
     * @param {number} minutes - Minutes
     * @returns {number} Total minutes
     */
    combineTime(hours, minutes) {
        const h = Number(hours) || 0;
        const m = Number(minutes) || 0;
        
        return (h * 60) + m;
    },

    /**
     * Round minutes to nearest interval
     * @param {number} minutes - Minutes to round
     * @param {number} interval - Interval to round to (default: 5)
     * @returns {number} Rounded minutes
     */
    roundToInterval(minutes, interval = 5) {
        if (!minutes) return 0;
        
        return Math.round(minutes / interval) * interval;
    }
};

// Freeze the utility object to prevent modifications
Object.freeze(timeUtils);

export default timeUtils;
