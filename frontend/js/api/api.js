/**
 * Base API configuration and utilities
 * Provides common functionality for all API modules
 */

// Base URL for all API requests
export const API_BASE_URL = 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 * Handles common HTTP errors and network issues
 * 
 * @param {string} endpoint - API endpoint (e.g., '/books', '/sessions')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} Throws error with descriptive message for network or HTTP errors
 */
export async function fetchData(endpoint, options = {}) {
    try {
        // Ensure headers are set
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        // Make the request
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle HTTP errors
        if (!response.ok) {
            let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
            
            try {
                // Try to parse error details from response
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = typeof errorData.detail === 'string' 
                        ? errorData.detail 
                        : JSON.stringify(errorData.detail);
                }
            } catch (e) {
                // If parsing fails, use default error message
            }

            throw new Error(errorMessage);
        }

        // Handle 204 No Content responses
        if (response.status === 204) {
            return null;
        }

        // Parse and return JSON response
        return await response.json();

    } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to the server. Please check if the backend is running.');
        }
        
        // Re-throw other errors
        throw error;
    }
}
