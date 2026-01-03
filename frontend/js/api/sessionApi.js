/**
 * Session API Module
 * Handles all reading session-related API operations
 */

import { fetchData } from './api.js';

/**
 * Get all reading sessions
 * Endpoint: GET /sessions
 * 
 * @returns {Promise<Array>} Array of session objects (ordered by date, most recent first)
 */
export async function getSessions() {
    return await fetchData('/sessions', {
        method: 'GET'
    });
}

/**
 * Get reading sessions for a specific date
 * Endpoint: GET /sessions/by-date?date={date}
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of session objects for the specified date
 */
export async function getSessionsByDate(date) {
    return await fetchData(`/sessions/by-date?date=${date}`, {
        method: 'GET'
    });
}

/**
 * Get reading sessions within a date range
 * Endpoint: GET /sessions/by-range?start_date={start}&end_date={end}
 * 
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of session objects within the date range
 */
export async function getSessionsByRange(startDate, endDate) {
    return await fetchData(`/sessions/by-range?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET'
    });
}

/**
 * Get all reading sessions for a specific book
 * Endpoint: GET /sessions/by-book/{book_id}
 * 
 * @param {number} bookId - Book ID
 * @returns {Promise<Array>} Array of session objects for the specified book
 */
export async function getSessionsByBook(bookId) {
    return await fetchData(`/sessions/by-book/${bookId}`, {
        method: 'GET'
    });
}

/**
 * Get all sessions with book details (title and author)
 * Endpoint: GET /sessions/detailed
 * 
 * @returns {Promise<Array>} Array of session objects including book_title and book_author
 */
export async function getDetailedSessions() {
    return await fetchData('/sessions/detailed', {
        method: 'GET'
    });
}

/**
 * Create a new reading session
 * Endpoint: POST /sessions
 * 
 * @param {Object} sessionData - Session data
 * @param {number} sessionData.book_id - ID of the book being read (required)
 * @param {string} sessionData.date - Session date in YYYY-MM-DD format (required)
 * @param {number} sessionData.minutes_read - Minutes read in this session (required, must be > 0)
 * @returns {Promise<Object>} Created session object
 */
export async function createSession(sessionData) {
    return await fetchData('/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
    });
}

/**
 * Delete a reading session
 * Endpoint: DELETE /sessions/{session_id}
 * 
 * @param {number} id - Session ID
 * @returns {Promise<null>} Returns null on success (204 No Content)
 */
export async function deleteSession(id) {
    return await fetchData(`/sessions/${id}`, {
        method: 'DELETE'
    });
}
