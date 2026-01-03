/**
 * Statistics API Module
 * Handles all statistics and metrics-related API operations
 */

import { fetchData } from './api.js';

/**
 * Get complete statistics summary
 * Endpoint: GET /stats/summary?year={year}
 * 
 * @param {number|null} year - Optional year filter (e.g., 2025)
 * @returns {Promise<Object>} Complete statistics including totals, streaks, daily stats, book stats
 */
export async function getSummaryStats(year = null) {
    const endpoint = year ? `/stats/summary?year=${year}` : '/stats/summary';
    return await fetchData(endpoint, {
        method: 'GET'
    });
}

/**
 * Get basic statistics for dashboard widgets
 * Endpoint: GET /stats/basic?year={year}
 * 
 * @param {number|null} year - Optional year filter (e.g., 2025)
 * @returns {Promise<Object>} Basic stats (total_minutes_read, books_finished, current_streak, most_read_author)
 */
export async function getBasicStats(year = null) {
    const endpoint = year ? `/stats/basic?year=${year}` : '/stats/basic';
    return await fetchData(endpoint, {
        method: 'GET'
    });
}

/**
 * Get daily reading statistics
 * Endpoint: GET /stats/daily?year={year}
 * 
 * @param {number|null} year - Optional year filter (e.g., 2025)
 * @returns {Promise<Array>} Array of daily stats [{date: "YYYY-MM-DD", total_minutes: number}]
 */
export async function getDailyStats(year = null) {
    const endpoint = year ? `/stats/daily?year=${year}` : '/stats/daily';
    return await fetchData(endpoint, {
        method: 'GET'
    });
}

/**
 * Get reading statistics by book
 * Endpoint: GET /stats/books?year={year}
 * 
 * @param {number|null} year - Optional year filter (e.g., 2025)
 * @returns {Promise<Array>} Array of book stats [{book_id, title, author, total_minutes}]
 */
export async function getBookStats(year = null) {
    const endpoint = year ? `/stats/books?year=${year}` : '/stats/books';
    return await fetchData(endpoint, {
        method: 'GET'
    });
}

/**
 * Get reading streak statistics
 * Endpoint: GET /stats/streaks
 * 
 * @returns {Promise<Object>} Streak stats {current_streak: number, max_streak: number}
 */
export async function getStreaks() {
    return await fetchData('/stats/streaks', {
        method: 'GET'
    });
}

/**
 * Get the most read book
 * Endpoint: GET /stats/most-read-book?year={year}
 * 
 * @param {number|null} year - Optional year filter (e.g., 2025)
 * @returns {Promise<Object|null>} Most read book stats or null if no data
 */
export async function getMostReadBook(year = null) {
    const endpoint = year ? `/stats/most-read-book?year=${year}` : '/stats/most-read-book';
    return await fetchData(endpoint, {
        method: 'GET'
    });
}

/**
 * Get the most read author
 * Endpoint: GET /stats/most-read-author?year={year}
 * 
 * @param {number|null} year - Optional year filter (e.g., 2025)
 * @returns {Promise<string|null>} Most read author name or null if no data
 */
export async function getMostReadAuthor(year = null) {
    const endpoint = year ? `/stats/most-read-author?year=${year}` : '/stats/most-read-author';
    return await fetchData(endpoint, {
        method: 'GET'
    });
}

/**
 * Get books finished by year
 * Endpoint: GET /stats/books-finished-by-year
 * 
 * @returns {Promise<Array>} Array of yearly stats [{year: number, books_finished: number}]
 */
export async function getBooksFinishedByYear() {
    return await fetchData('/stats/books-finished-by-year', {
        method: 'GET'
    });
}
