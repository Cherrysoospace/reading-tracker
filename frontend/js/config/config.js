/**
 * Reading Tracker Configuration
 * Centralized configuration for the entire application
 * Modern dark theme with vibrant accent colors
 */

const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'http://localhost:8000',
        TIMEOUT: 10000, // 10 seconds
        ENDPOINTS: {
            // Books
            BOOKS: '/books',
            BOOKS_BY_ID: (id) => `/books/${id}`,
            BOOKS_FINISH: (id) => `/books/${id}/finish`,
            
            // Sessions
            SESSIONS: '/sessions',
            SESSIONS_BY_ID: (id) => `/sessions/${id}`,
            SESSIONS_BY_DATE: '/sessions/by-date',
            SESSIONS_BY_RANGE: '/sessions/by-range',
            SESSIONS_BY_BOOK: (id) => `/sessions/by-book/${id}`,
            
            // Stats
            STATS_SUMMARY: '/stats/summary',
            STATS_BASIC: '/stats/basic',
            STATS_DAILY: '/stats/daily',
            STATS_BOOKS: '/stats/books',
            STATS_STREAKS: '/stats/streaks',
            STATS_MOST_READ_BOOK: '/stats/most-read-book',
            STATS_MOST_READ_AUTHOR: '/stats/most-read-author',
            STATS_BOOKS_FINISHED: '/stats/books-finished',
            STATS_BOOKS_FINISHED_BY_YEAR: '/stats/books-finished-by-year',
            STATS_TOTAL_TIME: '/stats/total-time',
            STATS_BOOKS_READ_IN_YEAR: (year) => `/stats/books-read-in-year/${year}`,
            STATS_WRAPPED: (year) => `/stats/wrapped/${year}`
        }
    },

    // App Settings
    APP: {
        NAME: 'Reading Tracker',
        VERSION: '1.0.0',
        ITEMS_PER_PAGE: 10,
        DEFAULT_DATE_FORMAT: 'YYYY-MM-DD',
        DISPLAY_DATE_FORMAT: 'MMM DD, YYYY',
        CURRENT_YEAR: new Date().getFullYear(),
        AVAILABLE_YEARS: [2026, 2025, 2024, 2023, 2022] // Years available for filtering
    },

    // UI Settings - Modern Dark Theme
    UI: {
        NOTIFICATION_DURATION: 3000, // 3 seconds
        ANIMATION_DURATION: 300, // milliseconds
        
        // Theme Colors - Modern Dark Palette
        THEME: {
            // Background colors
            bgPrimary: '#0f172a',      // Slate-900 - Main background
            bgSecondary: '#1e293b',    // Slate-800 - Cards/elevated surfaces
            bgTertiary: '#334155',     // Slate-700 - Hover states
            
            // Text colors
            textPrimary: '#f1f5f9',    // Slate-100 - Main text
            textSecondary: '#cbd5e1',  // Slate-300 - Secondary text
            textMuted: '#94a3b8',      // Slate-400 - Muted text
            
            // Accent colors
            accent: '#8b5cf6',         // Purple-500 - Primary accent
            accentHover: '#7c3aed',    // Purple-600 - Accent hover
            
            // Border colors
            border: '#334155',         // Slate-700 - Default borders
            borderLight: '#475569',    // Slate-600 - Light borders
            
            // State colors
            success: '#10b981',        // Emerald-500
            warning: '#f59e0b',        // Amber-500
            danger: '#ef4444',         // Red-500
            info: '#06b6d4'            // Cyan-500
        },
        
        // Chart Colors - Vibrant palette for data visualization
        CHART_COLORS: {
            primary: '#8b5cf6',        // Purple
            secondary: '#ec4899',      // Pink
            tertiary: '#06b6d4',       // Cyan
            quaternary: '#f59e0b',     // Amber
            success: '#10b981',        // Emerald
            danger: '#ef4444',         // Red
            info: '#3b82f6',           // Blue
            warning: '#f59e0b',        // Amber
            
            // Chart-specific colors
            grid: '#334155',           // Slate-700 - Grid lines
            text: '#cbd5e1',           // Slate-300 - Chart text
            tooltip: '#1e293b',        // Slate-800 - Tooltip background
            
            // Multi-color palette for multiple datasets
            palette: [
                '#8b5cf6',  // Purple
                '#ec4899',  // Pink
                '#06b6d4',  // Cyan
                '#f59e0b',  // Amber
                '#10b981',  // Emerald
                '#3b82f6',  // Blue
                '#f43f5e',  // Rose
                '#14b8a6'   // Teal
            ]
        },
        
        // Gradient colors for modern effects
        GRADIENTS: {
            purple: ['#8b5cf6', '#7c3aed', '#6d28d9'],
            pink: ['#ec4899', '#db2777', '#be185d'],
            blue: ['#3b82f6', '#2563eb', '#1d4ed8'],
            cyan: ['#06b6d4', '#0891b2', '#0e7490'],
            emerald: ['#10b981', '#059669', '#047857'],
            amber: ['#f59e0b', '#d97706', '#b45309']
        },
        
        // Shadow values for depth
        SHADOWS: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            glow: '0 0 20px rgba(139, 92, 246, 0.3)' // Purple glow
        }
    },

    // Constants
    CONSTANTS: {
        BOOK_STATUS: {
            READING: 'reading',
            FINISHED: 'finished'
        },
        
        VALIDATION: {
            MIN_MINUTES: 1,
            MAX_MINUTES: 1440, // 24 hours
            MIN_TITLE_LENGTH: 1,
            MAX_TITLE_LENGTH: 200,
            MAX_AUTHOR_LENGTH: 100
        },
        
        DATE_FORMATS: {
            API: 'YYYY-MM-DD',           // Format for API
            DISPLAY: 'MMM DD, YYYY',     // Display to user (e.g., "Jan 03, 2026")
            DISPLAY_SHORT: 'MMM DD',     // Short display (e.g., "Jan 03")
            DISPLAY_FULL: 'dddd, MMMM DD, YYYY', // Full display (e.g., "Friday, January 03, 2026")
            INPUT: 'YYYY-MM-DD'          // HTML input format
        },
        
        TIME_FORMATS: {
            HOURS_MINUTES: 'h[h] m[m]',  // e.g., "2h 30m"
            MINUTES: 'm[min]',            // e.g., "45min"
            HOURS: 'h[h]'                 // e.g., "3h"
        },
        
        MESSAGES: {
            SUCCESS: {
                BOOK_CREATED: '📚 Book created successfully!',
                BOOK_UPDATED: '✏️ Book updated successfully!',
                BOOK_DELETED: '🗑️ Book deleted successfully!',
                BOOK_FINISHED: '🎉 Book marked as finished!',
                SESSION_CREATED: '⏱️ Reading session logged!',
                SESSION_UPDATED: '✏️ Session updated successfully!',
                SESSION_DELETED: '🗑️ Session deleted successfully!',
                DATA_LOADED: '✅ Data loaded successfully!'
            },
            ERROR: {
                GENERIC: '❌ Something went wrong. Please try again.',
                NETWORK: '🌐 Network error. Please check your connection.',
                SERVER_ERROR: '🔥 Server error. Please try again later.',
                BOOK_NOT_FOUND: '📖 Book not found.',
                SESSION_NOT_FOUND: '⏱️ Session not found.',
                BOOK_HAS_SESSIONS: '⚠️ Cannot delete book with reading sessions.',
                INVALID_DATE: '📅 Invalid date format.',
                FUTURE_DATE: '⏰ Date cannot be in the future.',
                INVALID_MINUTES: '⏱️ Minutes must be between 1 and 1440.',
                LOAD_FAILED: '💔 Failed to load data.',
                SAVE_FAILED: '💾 Failed to save data.',
                DELETE_FAILED: '🗑️ Failed to delete.',
                NO_DATA: '📊 No data available yet.',
                VALIDATION_FAILED: '⚠️ Please check your input.'
            },
            INFO: {
                LOADING: '⏳ Loading...',
                PROCESSING: '⚙️ Processing...',
                NO_BOOKS: '📚 No books added yet. Start by adding your first book!',
                NO_SESSIONS: '⏱️ No reading sessions logged yet. Start tracking your reading!',
                NO_STATS: '📊 Not enough data to display statistics. Keep reading!',
                EMPTY_SEARCH: '🔍 No results found. Try a different search.',
                STREAK_BROKEN: '💔 Your streak is currently broken. Start reading to rebuild it!',
                STREAK_ACTIVE: '🔥 Keep your streak alive! Read today to maintain it.'
            }
        },
        
        // Wrapped (Spotify-style) specific settings
        WRAPPED: {
            MIN_YEAR: 2020,
            MAX_YEAR: new Date().getFullYear(),
            ANIMATIONS: {
                fadeIn: 300,
                slideIn: 400,
                scaleUp: 500
            },
            CARD_DELAY: 800, // Delay between cards
            EMOJI: {
                fire: '🔥',
                book: '📚',
                star: '⭐',
                trophy: '🏆',
                calendar: '📅',
                clock: '⏱️',
                rocket: '🚀',
                sparkles: '✨',
                heart: '💜',
                medal: '🏅'
            }
        }
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.API.ENDPOINTS);
Object.freeze(CONFIG.APP);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.UI.THEME);
Object.freeze(CONFIG.UI.CHART_COLORS);
Object.freeze(CONFIG.UI.GRADIENTS);
Object.freeze(CONFIG.UI.SHADOWS);
Object.freeze(CONFIG.CONSTANTS);
Object.freeze(CONFIG.CONSTANTS.BOOK_STATUS);
Object.freeze(CONFIG.CONSTANTS.VALIDATION);
Object.freeze(CONFIG.CONSTANTS.DATE_FORMATS);
Object.freeze(CONFIG.CONSTANTS.TIME_FORMATS);
Object.freeze(CONFIG.CONSTANTS.MESSAGES);
Object.freeze(CONFIG.CONSTANTS.WRAPPED);

// Export for use in other modules
export default CONFIG;
