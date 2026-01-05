// js/pages/sessions.js

import sessionApi from '../api/sessionApi.js';
import bookApi from '../api/bookApi.js';
import CONFIG from '../config/config.js';
import notifications from '../utils/notifications.js';
import dateUtils from '../utils/dateUtils.js';
import timeUtils from '../utils/timeUtils.js';
import validators from '../utils/validators.js';

/**
 * Sessions Page Controller
 */
class SessionsPage {
    constructor() {
        this.sessions = [];
        this.books = [];
        this.dataTable = null;
        this.currentSessionId = null;
        
        this.init();
    }

    /**
     * Initialize page
     */
    async init() {
        try {
            // Load data
            await this.loadData();

            // Setup form
            this.setupForm();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize DataTable
            this.initDataTable();

            // Update summary
            this.updateSummary();

        } catch (error) {
            console.error('Sessions page initialization error:', error);
            notifications.error('Failed to load sessions page');
        }
    }

    /**
     * Load all necessary data
     */
    async loadData() {
        try {
            // Load books and sessions in parallel
            [this.books, this.sessions] = await Promise.all([
                bookApi.getAll(),
                sessionApi.getAll()
            ]);

            // Populate book dropdowns
            this.populateBookSelects();

        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Setup form with default values
     */
    setupForm() {
        // Set default date to today
        document.getElementById('session-date').value = dateUtils.todayString();
        
        // Set max date to today (can't log future sessions)
        document.getElementById('session-date').max = dateUtils.todayString();
    }

    /**
     * Populate book select dropdowns
     */
    populateBookSelects() {
        const sessionBookSelect = document.getElementById('session-book');
        const filterBookSelect = document.getElementById('filter-book');

        // Get only books with status 'reading' for logging sessions
        const readingBooks = this.books.filter(book => book.status === 'reading');

        // Populate session form select
        sessionBookSelect.innerHTML = '<option value="">Select a book</option>';
        readingBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.title}${book.author ? ` - ${book.author}` : ''}`;
            sessionBookSelect.appendChild(option);
        });

        // Populate filter select (all books)
        filterBookSelect.innerHTML = '<option value="">All Books</option>';
        this.books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.title}${book.author ? ` - ${book.author}` : ''}`;
            filterBookSelect.appendChild(option);
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submit
        document.getElementById('session-form').addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Filter by book
        document.getElementById('filter-book').addEventListener('change', () => {
            this.applyFilters();
        });

        // Filter by date range
        document.getElementById('filter-date-range').addEventListener('change', () => {
            this.applyFilters();
        });

        // Clear filters
        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Delete modal buttons
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirm-delete-btn').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Close modal on outside click
        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.closeDeleteModal();
            }
        });
    }

    /**
     * Initialize DataTable
     */
    initDataTable() {
        // Show loading
        document.getElementById('table-loading').classList.remove('hidden');
        document.getElementById('table-container').classList.add('hidden');
        document.getElementById('empty-state').classList.add('hidden');

        // Check if there are sessions
        if (this.sessions.length === 0) {
            document.getElementById('table-loading').classList.add('hidden');
            document.getElementById('empty-state').classList.remove('hidden');
            return;
        }

        // Prepare data with book information
        const tableData = this.sessions.map(session => {
            const book = this.books.find(b => b.id === session.book_id);
            return {
                date: session.date,
                book_title: book ? book.title : 'Unknown',
                book_author: book ? (book.author || 'Unknown Author') : 'Unknown Author',
                minutes_read: session.minutes_read,
                id: session.id
            };
        });

        // Initialize DataTable
        this.dataTable = $('#sessions-table').DataTable({
            data: tableData,
            columns: [
                { 
                    data: 'date',
                    render: (data) => dateUtils.toDisplayFormat(data)
                },
                { data: 'book_title' },
                { data: 'book_author' },
                { 
                    data: 'minutes_read',
                    render: (data) => timeUtils.formatMinutes(data)
                },
                {
                    data: 'id',
                    orderable: false,
                    render: (data) => {
                        return `
                            <button 
                                onclick="sessionsPage.deleteSession(${data})" 
                                class="text-red-400 hover:text-red-300 transition-colors"
                            >
                                🗑️ Delete
                            </button>
                        `;
                    }
                }
            ],
            order: [[0, 'desc']], // Sort by date descending
            pageLength: 10,
            language: {
                emptyTable: "No sessions found",
                zeroRecords: "No matching sessions found"
            },
            dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>',
            drawCallback: () => {
                // Custom styling after table draw
                this.styleDataTable();
            }
        });

        // Show table
        document.getElementById('table-loading').classList.add('hidden');
        document.getElementById('table-container').classList.remove('hidden');
    }

    /**
     * Apply custom styling to DataTable
     */
    styleDataTable() {
        // Style will be handled by CSS file (datatables-custom.css)
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();

        // Get form data
        const formData = {
            book_id: document.getElementById('session-book').value,
            date: document.getElementById('session-date').value,
            minutes_read: document.getElementById('session-minutes').value
        };

        // Validate
        const validation = validators.validateSessionForm(formData);
        
        if (!validation.isValid) {
            validators.displayErrors(validation.errors, 'session-form');
            notifications.warning('Please fix the errors in the form');
            return;
        }

        try {
            // Create session
            await sessionApi.create(formData);
            notifications.success(CONFIG.CONSTANTS.MESSAGES.SUCCESS.SESSION_CREATED);

            // Reset form
            document.getElementById('session-form').reset();
            validators.clearErrors('session-form');
            this.setupForm();

            // Reload data
            await this.reloadSessions();

        } catch (error) {
            console.error('Error creating session:', error);
            notifications.apiError(error, 'Failed to log session');
        }
    }

    /**
     * Reload sessions and update table
     */
    async reloadSessions() {
        try {
            this.sessions = await sessionApi.getAll();

            // Destroy and recreate DataTable
            if (this.dataTable) {
                this.dataTable.destroy();
            }

            this.initDataTable();
            this.updateSummary();

        } catch (error) {
            console.error('Error reloading sessions:', error);
            throw error;
        }
    }

    /**
     * Apply filters to DataTable
     */
    applyFilters() {
        if (!this.dataTable) return;

        const bookFilter = document.getElementById('filter-book').value;
        const dateRangeFilter = document.getElementById('filter-date-range').value;

        // Clear previous filters
        this.dataTable.columns().search('').draw();

        // Apply book filter
        if (bookFilter) {
            const book = this.books.find(b => b.id == bookFilter);
            if (book) {
                this.dataTable.column(1).search(book.title).draw();
            }
        }

        // Apply date range filter
        if (dateRangeFilter !== 'all') {
            let filteredSessions = [];

            switch (dateRangeFilter) {
                case 'today':
                    filteredSessions = this.sessions.filter(s => dateUtils.isToday(s.date));
                    break;
                case 'week':
                    const weekRange = dateUtils.getLastNDays(7);
                    filteredSessions = this.sessions.filter(s => {
                        const sessionDate = new Date(s.date);
                        return sessionDate >= weekRange.start && sessionDate <= weekRange.end;
                    });
                    break;
                case 'month':
                    const startOfMonth = dateUtils.startOfMonth();
                    const endOfMonth = dateUtils.endOfMonth();
                    filteredSessions = this.sessions.filter(s => {
                        const sessionDate = new Date(s.date);
                        return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
                    });
                    break;
                case 'year':
                    const startOfYear = dateUtils.startOfYear();
                    const endOfYear = dateUtils.endOfYear();
                    filteredSessions = this.sessions.filter(s => {
                        const sessionDate = new Date(s.date);
                        return sessionDate >= startOfYear && sessionDate <= endOfYear;
                    });
                    break;
            }

            // Update DataTable with filtered data
            if (dateRangeFilter !== 'all') {
                const tableData = filteredSessions.map(session => {
                    const book = this.books.find(b => b.id === session.book_id);
                    return {
                        date: session.date,
                        book_title: book ? book.title : 'Unknown',
                        book_author: book ? (book.author || 'Unknown Author') : 'Unknown Author',
                        minutes_read: session.minutes_read,
                        id: session.id
                    };
                });

                this.dataTable.clear().rows.add(tableData).draw();
            }
        }

        this.updateSummary();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('filter-book').value = '';
        document.getElementById('filter-date-range').value = 'all';

        if (this.dataTable) {
            this.dataTable.columns().search('').draw();
            
            // Reload all data
            const tableData = this.sessions.map(session => {
                const book = this.books.find(b => b.id === session.book_id);
                return {
                    date: session.date,
                    book_title: book ? book.title : 'Unknown',
                    book_author: book ? (book.author || 'Unknown Author') : 'Unknown Author',
                    minutes_read: session.minutes_read,
                    id: session.id
                };
            });

            this.dataTable.clear().rows.add(tableData).draw();
        }

        this.updateSummary();
    }

    /**
     * Update summary statistics
     */
    updateSummary() {
        const visibleSessions = this.dataTable 
            ? this.dataTable.rows({ search: 'applied' }).data().toArray()
            : [];

        const totalSessions = visibleSessions.length;
        const totalMinutes = visibleSessions.reduce((sum, s) => sum + s.minutes_read, 0);
        const averageMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

        document.getElementById('total-sessions').textContent = totalSessions;
        document.getElementById('total-time').textContent = timeUtils.formatMinutes(totalMinutes);
        document.getElementById('average-time').textContent = timeUtils.formatMinutes(averageMinutes);
    }

    /**
     * Delete session
     */
    deleteSession(sessionId) {
        this.currentSessionId = sessionId;
        document.getElementById('delete-modal').classList.remove('hidden');
    }

    /**
     * Confirm delete
     */
    async confirmDelete() {
        try {
            await sessionApi.delete(this.currentSessionId);
            notifications.success(CONFIG.CONSTANTS.MESSAGES.SUCCESS.SESSION_DELETED);

            this.closeDeleteModal();
            await this.reloadSessions();

        } catch (error) {
            console.error('Error deleting session:', error);
            notifications.apiError(error, 'Failed to delete session');
        }
    }

    /**
     * Close delete modal
     */
    closeDeleteModal() {
        document.getElementById('delete-modal').classList.add('hidden');
        this.currentSessionId = null;
    }
}

// Initialize page when DOM is ready
let sessionsPage;
document.addEventListener('DOMContentLoaded', () => {
    sessionsPage = new SessionsPage();
});

// Make available globally for onclick handlers
window.sessionsPage = null;
document.addEventListener('DOMContentLoaded', () => {
    window.sessionsPage = sessionsPage;
});
