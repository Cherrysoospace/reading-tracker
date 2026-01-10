// js/pages/wrapped.js

import wrappedApi from '../api/wrappedApi.js';
import dateUtils from '../utils/dateUtils.js';
import notifications from '../utils/notifications.js';

/**
 * Wrapped Page Controller
 */
class WrappedPage {
    constructor() {
        this.wrappedData = null;
        this.selectedYear = new Date().getFullYear();
        this.init();
    }

    /**
     * Initialize wrapped page
     */
    async init() {
        try {
            console.log('Initializing wrapped page...');
            
            // Show loading
            this.showLoading();
            console.log('Loading screen shown');

            // Load available years
            await this.loadAvailableYears();
            console.log('Years loaded');

            // Load wrapped data
            await this.loadWrappedData();
            console.log('Wrapped data loaded:', this.wrappedData);

            // Check if we have data
            if (!this.wrappedData) {
                throw new Error('No wrapped data available');
            }

            // Setup event listeners
            this.setupEventListeners();
            console.log('Event listeners setup');

            // Populate all cards
            this.populateCards();
            console.log('Cards populated');

            // Show wrapped
            this.showWrapped();
            console.log('Wrapped shown');

        } catch (error) {
            console.error('Wrapped page error:', error);
            this.showError();
            notifications.error('Failed to load your Reading Wrapped');
        }
    }

    /**
     * Load available years
     */
    async loadAvailableYears() {
        try {
            console.log('Loading available years...');
            const response = await wrappedApi.getAvailableYears();
            console.log('Available years response:', response);
            
            const years = response.years || [];
            console.log('Years array:', years);

            const yearInput = document.getElementById('year-input');
            const availableYearsText = document.getElementById('available-years-text');
            
            if (!yearInput) {
                console.error('Year input not found!');
                return;
            }

            if (years.length === 0) {
                console.warn('No years available');
                if (availableYearsText) {
                    availableYearsText.textContent = 'No data available';
                }
                return;
            }

            // Use the latest available year if current year not available
            if (!years.includes(this.selectedYear) && years.length > 0) {
                console.log(`Current year ${this.selectedYear} not available, using ${years[0]}`);
                this.selectedYear = years[0];
            }

            // Set input value to selected year
            yearInput.value = this.selectedYear;
            
            // Show available years
            if (availableYearsText) {
                availableYearsText.textContent = `Available: ${years.join(', ')}`;
            }
            
            console.log('Year input configured successfully');

        } catch (error) {
            console.error('Error loading years:', error);
            const yearInput = document.getElementById('year-input');
            if (yearInput) {
                yearInput.value = this.selectedYear;
            }
        }
    }

    /**
     * Load wrapped data for selected year
     */
    async loadWrappedData() {
        try {
            this.wrappedData = await wrappedApi.getSummary(this.selectedYear);
        } catch (error) {
            console.error('Error loading wrapped data:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Load year button
        const loadYearBtn = document.getElementById('load-year-btn');
        const yearInput = document.getElementById('year-input');
        
        if (loadYearBtn && yearInput) {
            loadYearBtn.addEventListener('click', async () => {
                const year = parseInt(yearInput.value);
                if (year && year >= 2000 && year <= 2100) {
                    this.selectedYear = year;
                    await this.reloadWrapped();
                } else {
                    notifications.error('Please enter a valid year (2000-2100)');
                }
            });
            
            // Also allow Enter key
            yearInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    loadYearBtn.click();
                }
            });
        }
        
        console.log('Event listeners setup');
    }

    /**
     * Populate all cards with data
     */
    populateCards() {
        try {
            console.log('Populating cards...');
            
            // Update year
            const yearEl = document.getElementById('wrapped-year');
            if (yearEl) yearEl.textContent = this.selectedYear;

            // General Stats
            const stats = this.wrappedData.general_stats || {};
            this.setElementText('total-hours', Math.round(stats.total_hours || 0));
            this.setElementText('total-minutes-text', `${stats.total_minutes || 0} minutes`);
            this.setElementText('total-days', stats.total_days_with_reading || 0);
            this.setElementText('average-per-day-text', `Avg: ${Math.round(stats.average_minutes_per_active_day || 0)} min/day`);
            this.setElementText('longest-streak', stats.longest_streak || 0);

            // Protagonist Book
            const protagonist = this.wrappedData.protagonist_book || {};
            if (protagonist.most_read_by_minutes) {
                const book = protagonist.most_read_by_minutes;
                this.setElementText('most-read-book-title', book.title || 'Unknown');
                this.setElementText('most-read-book-author', `by ${book.author || 'Unknown'}`);
                this.setElementText('most-read-book-time', `${Math.round((book.minutes || 0) / 60)} hours`);
            }
            
            if (protagonist.most_sessions) {
                const book = protagonist.most_sessions;
                this.setElementText('most-sessions-book-title', book.title || 'Unknown');
                this.setElementText('most-sessions-book-author', `by ${book.author || 'Unknown'}`);
                this.setElementText('most-sessions-book-count', `${book.sessions || 0} sessions`);
            }

            // Biggest Day
            const biggestDay = this.wrappedData.biggest_reading_day;
            if (biggestDay && biggestDay.date) {
                try {
                    this.setElementText('biggest-day-date', dateUtils.toDisplayFormat(biggestDay.date));
                } catch (e) {
                    this.setElementText('biggest-day-date', biggestDay.date);
                }
                this.setElementText('biggest-day-hours', Math.round(biggestDay.hours || 0));
                this.setElementText('biggest-day-sessions', `${biggestDay.sessions || 0} sessions`);
            }

            // Favorite Author
            const authors = this.wrappedData.authors_stats || {};
            if (authors.most_read_author) {
                const author = authors.most_read_author;
                this.setElementText('favorite-author-name', author.name || 'Unknown');
                this.setElementText('favorite-author-time', `${Math.round(author.hours || 0)} hours`);
            }

            // Reading Habits
            const habits = this.wrappedData.reading_habits || {};
            this.setElementText('favorite-day', habits.favorite_day || 'N/A');
            if (habits.best_month) {
                this.setElementText('best-month-text', `${habits.best_month.name || 'N/A'} (${Math.round(habits.best_month.hours || 0)}h)`);
            }
            this.setElementText('avg-session-text', `${Math.round(habits.average_session_duration || 0)} min`);

            // Books Status
            const status = this.wrappedData.reading_status || {};
            this.setElementText('books-finished', status.books_finished || 0);
            this.setElementText('completion-rate-text', `${Math.round(status.completion_rate || 0)}% completion`);

            // Reader Personality
            const personality = this.wrappedData.reader_personality || {};
            if (personality.type) {
                const typeFormatted = personality.type
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                this.setElementText('personality-type', typeFormatted);
            }
            this.setElementText('personality-description', personality.description || 'Keep reading!');
            
            console.log('Cards populated successfully');
            
        } catch (error) {
            console.error('Error populating cards:', error);
            throw error;
        }
    }

    /**
     * Helper to set element text content
     */
    setElementText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    /**
     * Reload wrapped for different year
     */
    async reloadWrapped() {
        try {
            this.showLoading();
            await this.loadWrappedData();
            this.populateCards();
            this.showWrapped();
        } catch (error) {
            console.error('Error reloading wrapped:', error);
            notifications.error('Failed to load wrapped for selected year');
        }
    }

    /**
     * Show loading screen
     */
    showLoading() {
        document.getElementById('loading-screen').classList.remove('hidden');
        document.getElementById('wrapped-container').classList.add('hidden');
        document.getElementById('error-state').classList.add('hidden');
    }

    /**
     * Show wrapped content
     */
    showWrapped() {
        console.log('showWrapped called');
        const loadingScreen = document.getElementById('loading-screen');
        const wrappedContainer = document.getElementById('wrapped-container');
        const errorState = document.getElementById('error-state');
        
        console.log('Elements:', { loadingScreen, wrappedContainer, errorState });
        
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (wrappedContainer) wrappedContainer.classList.remove('hidden');
        if (errorState) errorState.classList.add('hidden');
        
        console.log('Wrapped container classes after show:', wrappedContainer?.className);
    }

    /**
     * Show error state
     */
    showError() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('wrapped-container').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WrappedPage();
});
