/**
 * Base API Module
 * Robust fetch wrapper for making HTTP requests to the backend
 * Includes error handling, timeout management, and request/response interceptors
 */

import CONFIG from '../config/config.js';

/**
 * Base API class for making HTTP requests
 * Provides methods for all HTTP verbs with consistent error handling
 */
class API {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
    }

    /**
     * Make an HTTP request with timeout and error handling
     * 
     * @param {string} endpoint - API endpoint (relative to base URL)
     * @param {Object} options - Fetch options (method, headers, body, etc.)
     * @returns {Promise<Object|null>} Response data or null for 204 No Content
     * @throws {Error} Network errors, timeout errors, or HTTP errors
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            // Make request
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Handle HTTP errors (4xx, 5xx)
            if (!response.ok) {
                await this.handleError(response);
            }

            // Handle 204 No Content (successful but no body)
            if (response.status === 204) {
                return null;
            }

            // Parse and return JSON response
            const data = await response.json();
            return data;

        } catch (error) {
            // Handle network errors
            if (error.name === 'AbortError') {
                const timeoutError = new Error('Request timeout - please try again');
                timeoutError.status = 408;
                throw timeoutError;
            }
            
            // Handle fetch errors (network issues)
            if (error.message === 'Failed to fetch') {
                const networkError = new Error(CONFIG.CONSTANTS.MESSAGES.ERROR.NETWORK);
                networkError.status = 0;
                throw networkError;
            }
            
            // Re-throw other errors
            throw error;
        }
    }

    /**
     * Handle HTTP error responses
     * Attempts to extract error message from response body
     * 
     * @param {Response} response - Fetch response object
     * @throws {Error} Error with status code and descriptive message
     */
    async handleError(response) {
        let errorMessage = CONFIG.CONSTANTS.MESSAGES.ERROR.GENERIC;

        try {
            const errorData = await response.json();
            
            // Try different common error message fields
            errorMessage = errorData.detail || 
                          errorData.message || 
                          errorData.error ||
                          errorMessage;
                          
        } catch (e) {
            // If response body is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
        }

        // Create error with status code
        const error = new Error(errorMessage);
        error.status = response.status;
        
        // Add specific error messages for common status codes
        if (response.status === 404) {
            error.message = errorData?.detail || 'Resource not found';
        } else if (response.status === 500) {
            error.message = CONFIG.CONSTANTS.MESSAGES.ERROR.SERVER_ERROR;
        }
        
        throw error;
    }

    /**
     * GET request - Retrieve data from server
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters as key-value pairs
     * @returns {Promise<Object>} Response data
     * 
     * @example
     * api.get('/books', { status: 'reading' })
     * // GET /books?status=reading
     */
    async get(endpoint, params = {}) {
        // Build query string from params object
        const queryString = new URLSearchParams(
            // Filter out null/undefined values
            Object.entries(params).filter(([_, value]) => value != null)
        ).toString();
        
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    /**
     * POST request - Create new resource
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise<Object>} Response data (usually created resource)
     * 
     * @example
     * api.post('/books', { title: 'Book Title', author: 'Author Name' })
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request - Update entire resource
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise<Object>} Response data (usually updated resource)
     * 
     * @example
     * api.put('/books/1', { title: 'New Title', author: 'New Author' })
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * PATCH request - Partially update resource
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data (partial update)
     * @returns {Promise<Object>} Response data (usually updated resource)
     * 
     * @example
     * api.patch('/books/1', { status: 'finished' })
     */
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request - Delete resource
     * 
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object|null>} Response data or null
     * 
     * @example
     * api.delete('/books/1')
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Create and export singleton instance
const api = new API();

export default api;
