/**
 * Book API Module
 * Handles all book-related API operations (CRUD)
 */

import { fetchData } from './api.js';

/**
 * Get all books
 * Endpoint: GET /books
 * 
 * @returns {Promise<Array>} Array of book objects
 */
export async function getBooks() {
    return await fetchData('/books', {
        method: 'GET'
    });
}

/**
 * Get a specific book by ID
 * Endpoint: GET /books/{book_id}
 * 
 * @param {number} id - Book ID
 * @returns {Promise<Object>} Book object
 */
export async function getBookById(id) {
    return await fetchData(`/books/${id}`, {
        method: 'GET'
    });
}

/**
 * Create a new book
 * Endpoint: POST /books
 * 
 * @param {Object} bookData - Book data
 * @param {string} bookData.title - Book title (required)
 * @param {string} bookData.author - Book author (optional, default: "")
 * @param {string} bookData.start_date - Start date in YYYY-MM-DD format (required)
 * @returns {Promise<Object>} Created book object
 */
export async function createBook(bookData) {
    return await fetchData('/books', {
        method: 'POST',
        body: JSON.stringify(bookData)
    });
}

/**
 * Update an existing book
 * Endpoint: PUT /books/{book_id}
 * 
 * @param {number} id - Book ID
 * @param {Object} bookData - Book data to update (all fields optional)
 * @param {string} [bookData.title] - Book title
 * @param {string} [bookData.author] - Book author
 * @param {string} [bookData.end_date] - End date in YYYY-MM-DD format
 * @param {string} [bookData.status] - Book status ('reading' or 'finished')
 * @returns {Promise<Object>} Updated book object
 */
export async function updateBook(id, bookData) {
    return await fetchData(`/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bookData)
    });
}

/**
 * Mark a book as finished
 * Endpoint: PATCH /books/{book_id}/finish
 * 
 * @param {number} id - Book ID
 * @param {string} [endDate] - End date in YYYY-MM-DD format (optional, defaults to today)
 * @returns {Promise<Object>} Updated book object with status='finished'
 */
export async function markAsFinished(id, endDate = null) {
    const endpoint = endDate 
        ? `/books/${id}/finish?end_date=${endDate}`
        : `/books/${id}/finish`;
    
    return await fetchData(endpoint, {
        method: 'PATCH'
    });
}

/**
 * Delete a book
 * Endpoint: DELETE /books/{book_id}
 * 
 * @param {number} id - Book ID
 * @returns {Promise<null>} Returns null on success (204 No Content)
 */
export async function deleteBook(id) {
    return await fetchData(`/books/${id}`, {
        method: 'DELETE'
    });
}
