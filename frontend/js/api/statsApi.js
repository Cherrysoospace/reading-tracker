// js/api/statsApi.js

import api from './api.js';
import CONFIG from '../config/config.js';

/**
 * Stats API Module
 * Handles all statistics-related API operations
 */
const statsApi = {
    /**
     * Get comprehensive statistics summary
     * @param {number|null} year - Optional year to filter statistics (e.g., 2025)
     * @returns {Promise<Object>} Complete statistics object with all metrics
     */
    async getSummary(year = null) {
        try {
            const params = year ? { year } : {};
            const stats = await api.get(CONFIG.API.ENDPOINTS.STATS_SUMMARY, params);
            return stats;
        } catch (error) {
            console.error('Error fetching summary stats:', error);
            throw error;
        }
    },

    /**
     * Get basic statistics (lightweight)
     * @param {number|null} year - Optional year to filter statistics (e.g., 2025)
     * @returns {Promise<Object>} Basic statistics object
     */
    async getBasic(year = null) {
        try {
            const params = year ? { year } : {};
            const stats = await api.get(CONFIG.API.ENDPOINTS.STATS_BASIC, params);
            return stats;
        } catch (error) {
            console.error('Error fetching basic stats:', error);
            throw error;
        }
    },

    /**
     * Get daily reading statistics
     * @param {number|null} year - Optional year to filter statistics (e.g., 2025)
     * @returns {Promise<Array>} Array of daily stats with date and total_minutes
     */
    async getDailyStats(year = null) {
        try {
            const params = year ? { year } : {};
            const stats = await api.get(CONFIG.API.ENDPOINTS.STATS_DAILY, params);
            return stats || [];
        } catch (error) {
            console.error('Error fetching daily stats:', error);
            throw error;
        }
    },

    /**
     * Get statistics by book
     * @param {number|null} year - Optional year to filter statistics (e.g., 2025)
     * @returns {Promise<Array>} Array of book stats with book info and total minutes
     */
    async getBookStats(year = null) {
        try {
            const params = year ? { year } : {};
            const stats = await api.get(CONFIG.API.ENDPOINTS.STATS_BOOKS, params);
            return stats || [];
        } catch (error) {
            console.error('Error fetching book stats:', error);
            throw error;
        }
    },

    /**
     * Get streak statistics
     * @param {number|null} year - Optional year to filter statistics (e.g., 2025)
     * @returns {Promise<Object>} Object with current_streak and max_streak
     */
    async getStreaks(year = null) {
        try {
            const params = year ? { year } : {};
            const streaks = await api.get(CONFIG.API.ENDPOINTS.STATS_STREAKS, params);
            return streaks;
        } catch (error) {
            console.error('Error fetching streak stats:', error);
            throw error;
        }
    },

    /**
     * Get most read book
     * @param {number|null} year - Optional year to filter statistics
     * @returns {Promise<Object|null>} Most read book object or null if no sessions
     */
    async getMostReadBook(year = null) {
        try {
            const params = year ? { year } : {};
            const book = await api.get(CONFIG.API.ENDPOINTS.STATS_MOST_READ_BOOK, params);
            return book;
        } catch (error) {
            console.error('Error fetching most read book:', error);
            throw error;
        }
    },

    /**
     * Get most read author
     * @param {number|null} year - Optional year to filter statistics
     * @returns {Promise<Object>} Object with author name
     */
    async getMostReadAuthor(year = null) {
        try {
            const params = year ? { year } : {};
            const result = await api.get(CONFIG.API.ENDPOINTS.STATS_MOST_READ_AUTHOR, params);
            return result;
        } catch (error) {
            console.error('Error fetching most read author:', error);
            throw error;
        }
    },

    /**
     * Get total books finished count
     * @param {number|null} year - Optional year to filter statistics (e.g., 2025)
     * @returns {Promise<Object>} Object with books_finished count
     */
    async getBooksFinishedCount(year = null) {
        try {
            const params = year ? { year } : {};
            const result = await api.get(CONFIG.API.ENDPOINTS.STATS_BOOKS_FINISHED, params);
            return result;
        } catch (error) {
            console.error('Error fetching books finished count:', error);
            throw error;
        }
    },

    /**
     * Get books finished by year
     * @returns {Promise<Array>} Array of objects with year and books_finished count
     */
    async getBooksFinishedByYear() {
        try {
            const stats = await api.get(CONFIG.API.ENDPOINTS.STATS_BOOKS_FINISHED_BY_YEAR);
            return stats || [];
        } catch (error) {
            console.error('Error fetching books finished by year:', error);
            throw error;
        }
    },

    /**
     * Get total reading time
     * @returns {Promise<Object>} Object with total_minutes and total_hours
     */
    async getTotalTime() {
        try {
            const result = await api.get(CONFIG.API.ENDPOINTS.STATS_TOTAL_TIME);
            return result;
        } catch (error) {
            console.error('Error fetching total time:', error);
            throw error;
        }
    },

    /**
     * Format minutes to readable time string
     * @param {number} minutes - Total minutes
     * @returns {string} Formatted time string (e.g., "2h 30m" or "45m")
     */
    formatMinutes(minutes) {
        if (!minutes || minutes === 0) return '0m';

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours === 0) {
            return `${mins}m`;
        } else if (mins === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${mins}m`;
        }
    },

    /**
     * Convert minutes to hours (decimal)
     * @param {number} minutes - Total minutes
     * @returns {number} Hours as decimal (rounded to 2 decimals)
     */
    minutesToHours(minutes) {
        if (!minutes) return 0;
        return Math.round((minutes / 60) * 100) / 100;
    },

    /**
     * Get daily stats for last N days
     * @param {number} days - Number of days
     * @param {number|null} year - Optional year to filter statistics
     * @returns {Promise<Array>} Array of daily stats for the period
     */
    async getDailyStatsForPeriod(days, year = null) {
        try {
            const allStats = await this.getDailyStats(year);
            
            // Get date range
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - days + 1);

            // Filter stats for the period
            const filteredStats = allStats.filter(stat => {
                const statDate = new Date(stat.date);
                return statDate >= startDate && statDate <= today;
            });

            // Fill in missing dates with 0 minutes
            const completeStats = [];
            const currentDate = new Date(startDate);
            
            while (currentDate <= today) {
                const dateStr = this.formatDate(currentDate);
                const existingStat = filteredStats.find(s => s.date === dateStr);
                
                completeStats.push({
                    date: dateStr,
                    total_minutes: existingStat ? existingStat.total_minutes : 0
                });
                
                currentDate.setDate(currentDate.getDate() + 1);
            }

            return completeStats;
        } catch (error) {
            console.error(`Error fetching daily stats for ${days} days:`, error);
            throw error;
        }
    },

    /**
     * Calculate average reading time per day
     * @param {Array} dailyStats - Array of daily stats (optional, fetches if not provided)
     * @param {number|null} year - Optional year to filter statistics
     * @returns {Promise<number>} Average minutes per day
     */
    async calculateAveragePerDay(dailyStats = null, year = null) {
        try {
            const stats = dailyStats || await this.getDailyStats(year);
            
            if (stats.length === 0) return 0;
            
            const totalMinutes = stats.reduce((sum, stat) => sum + stat.total_minutes, 0);
            const daysWithSessions = stats.filter(stat => stat.total_minutes > 0).length;
            
            if (daysWithSessions === 0) return 0;
            
            return Math.round(totalMinutes / daysWithSessions);
        } catch (error) {
            console.error('Error calculating average per day:', error);
            throw error;
        }
    },

    /**
     * Get reading consistency percentage
     * @param {number} days - Number of days to check (default: 30)
     * @param {number|null} year - Optional year to filter statistics
     * @returns {Promise<number>} Percentage of days with reading sessions (0-100)
     */
    async getConsistencyPercentage(days = 30, year = null) {
        try {
            const stats = await this.getDailyStatsForPeriod(days, year);
            const daysWithSessions = stats.filter(stat => stat.total_minutes > 0).length;
            
            return Math.round((daysWithSessions / days) * 100);
        } catch (error) {
            console.error('Error calculating consistency:', error);
            throw error;
        }
    },

    /**
     * Get top N books by reading time
     * @param {number} limit - Number of books to return (default: 5)
     * @param {number|null} year - Optional year to filter statistics
     * @returns {Promise<Array>} Array of top books sorted by total_minutes
     */
    async getTopBooks(limit = 5, year = null) {
        try {
            const bookStats = await this.getBookStats(year);
            
            // Sort by total_minutes descending and limit
            return bookStats
                .sort((a, b) => b.total_minutes - a.total_minutes)
                .slice(0, limit);
        } catch (error) {
            console.error(`Error fetching top ${limit} books:`, error);
            throw error;
        }
    },

    /**
     * Get reading activity data for heatmap/calendar view
     * @param {number} days - Number of days (default: 365)
     * @param {number|null} year - Optional year to filter statistics
     * @returns {Promise<Array>} Array of dates with reading activity
     */
    async getActivityData(days = 365, year = null) {
        try {
            const stats = await this.getDailyStatsForPeriod(days, year);
            
            return stats.map(stat => ({
                date: stat.date,
                minutes: stat.total_minutes,
                level: this.getActivityLevel(stat.total_minutes)
            }));
        } catch (error) {
            console.error('Error fetching activity data:', error);
            throw error;
        }
    },

    /**
     * Determine activity level for a given number of minutes
     * @param {number} minutes - Minutes read
     * @returns {number} Activity level (0-4)
     */
    getActivityLevel(minutes) {
        if (minutes === 0) return 0;
        if (minutes < 15) return 1;
        if (minutes < 30) return 2;
        if (minutes < 60) return 3;
        return 4;
    },

    /**
     * Get statistics for a specific year
     * @param {number} year - Year (e.g., 2024)
     * @returns {Promise<Object>} Object with year statistics
     */
    async getYearStats(year) {
        try {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            
            // Get all stats and filter by year
            const [dailyStats, bookStats, booksFinished] = await Promise.all([
                this.getDailyStats(),
                this.getBookStats(),
                this.getBooksFinishedByYear()
            ]);

            // Filter daily stats for the year
            const yearDailyStats = dailyStats.filter(stat => {
                const statYear = new Date(stat.date).getFullYear();
                return statYear === year;
            });

            // Calculate totals
            const totalMinutes = yearDailyStats.reduce((sum, stat) => sum + stat.total_minutes, 0);
            const daysRead = yearDailyStats.filter(stat => stat.total_minutes > 0).length;
            
            // Get books finished for this year
            const yearBooks = booksFinished.find(b => b.year === year);

            return {
                year,
                total_minutes: totalMinutes,
                total_hours: this.minutesToHours(totalMinutes),
                days_read: daysRead,
                books_finished: yearBooks ? yearBooks.books_finished : 0,
                average_per_day: daysRead > 0 ? Math.round(totalMinutes / daysRead) : 0
            };
        } catch (error) {
            console.error(`Error fetching stats for year ${year}:`, error);
            throw error;
        }
    },

    /**
     * Get comparison between two time periods
     * @param {number} days - Number of days per period
     * @returns {Promise<Object>} Comparison object with current and previous period stats
     */
    async getPeriodComparison(days = 30) {
        try {
            const allStats = await this.getDailyStats();
            
            const today = new Date();
            
            // Current period
            const currentStart = new Date(today);
            currentStart.setDate(today.getDate() - days + 1);
            
            // Previous period
            const previousStart = new Date(currentStart);
            previousStart.setDate(currentStart.getDate() - days);
            const previousEnd = new Date(currentStart);
            previousEnd.setDate(currentStart.getDate() - 1);

            // Calculate current period
            const currentStats = allStats.filter(stat => {
                const date = new Date(stat.date);
                return date >= currentStart && date <= today;
            });
            const currentTotal = currentStats.reduce((sum, stat) => sum + stat.total_minutes, 0);
            const currentDays = currentStats.filter(s => s.total_minutes > 0).length;

            // Calculate previous period
            const previousStats = allStats.filter(stat => {
                const date = new Date(stat.date);
                return date >= previousStart && date <= previousEnd;
            });
            const previousTotal = previousStats.reduce((sum, stat) => sum + stat.total_minutes, 0);
            const previousDays = previousStats.filter(s => s.total_minutes > 0).length;

            // Calculate change
            const changeMinutes = currentTotal - previousTotal;
            const changePercent = previousTotal > 0 
                ? Math.round((changeMinutes / previousTotal) * 100) 
                : (currentTotal > 0 ? 100 : 0);

            return {
                current: {
                    total_minutes: currentTotal,
                    total_hours: this.minutesToHours(currentTotal),
                    days_read: currentDays
                },
                previous: {
                    total_minutes: previousTotal,
                    total_hours: this.minutesToHours(previousTotal),
                    days_read: previousDays
                },
                change: {
                    minutes: changeMinutes,
                    percent: changePercent,
                    is_increase: changeMinutes > 0
                }
            };
        } catch (error) {
            console.error('Error calculating period comparison:', error);
            throw error;
        }
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
    }
};

// Freeze the API object to prevent modifications
Object.freeze(statsApi);

export default statsApi;
