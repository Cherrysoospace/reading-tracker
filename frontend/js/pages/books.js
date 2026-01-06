// js/pages/books.js

import bookApi from '../api/bookApi.js';
import sessionApi from '../api/sessionApi.js';
import CONFIG from '../config/config.js';
import notifications from '../utils/notifications.js';
import dateUtils from '../utils/dateUtils.js';
import timeUtils from '../utils/timeUtils.js';
import validators from '../utils/validators.js';

/**
 * Books Page Controller
 */
class BooksPage {
    constructor() {
        this.books = [];
        this.filteredBooks = [];
        this.dataTable = null;
        this.currentBookId = null;
        this.isEditMode = false;
        
        this.init();
    }

    /**
     * Initialize page
     */
    async init() {
        try {
            // Setup event listeners
            this.setupEventListeners();

            // Load books
            await this.loadBooks();

            // Initialize DataTable
            this.initDataTable();

        } catch (error) {
            console.error('Books page initialization error:', error);
            notifications.error('Failed to load books page');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add book button
        document.getElementById('add-book-btn').addEventListener('click', () => {
            this.openModal();
        });

        // Close modal buttons
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // Form submit
        document.getElementById('book-form').addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Status filter
        document.getElementById('status-filter').addEventListener('change', (e) => {
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

        // Close modals on outside click
        document.getElementById('book-modal').addEventListener('click', (e) => {
            if (e.target.id === 'book-modal') {
                this.closeModal();
            }
        });

        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.closeDeleteModal();
            }
        });
    }

    /**
     * Load all books from API
     */
    async loadBooks() {
        try {
            this.books = await bookApi.getAll();
            this.filteredBooks = [...this.books];
        } catch (error) {
            console.error('Error loading books:', error);
            throw error;
        }
    }

    /**
     * Initialize DataTable
     */
    initDataTable() {
        // Show loading
        document.getElementById('table-loading').classList.remove('hidden');
        document.getElementById('table-container').classList.add('hidden');
        document.getElementById('empty-state').classList.add('hidden');

        // Check if there are books
        if (this.books.length === 0) {
            document.getElementById('table-loading').classList.add('hidden');
            document.getElementById('empty-state').classList.remove('hidden');
            return;
        }

        // Prepare data
        const tableData = this.filteredBooks.map(book => {
            return {
                title: book.title,
                author: book.author || 'Unknown Author',
                status: book.status,
                start_date: book.start_date,
                end_date: book.end_date || '',
                id: book.id
            };
        });

        // Initialize DataTable
        this.dataTable = $('#books-table').DataTable({
            data: tableData,
            columns: [
                { data: 'title' },
                { data: 'author' },
                { 
                    data: 'status',
                    render: (data) => {
                        if (data === 'finished') {
                            return '<span class="px-2 py-1 text-xs font-semibold rounded bg-green-500/20 text-green-400">Finished</span>';
                        }
                        return '<span class="px-2 py-1 text-xs font-semibold rounded bg-blue-500/20 text-blue-400">Reading</span>';
                    }
                },
                { 
                    data: 'start_date',
                    render: (data) => dateUtils.toDisplayFormat(data)
                },
                { 
                    data: 'end_date',
                    render: (data) => data ? dateUtils.toDisplayFormat(data) : '-'
                },
                {
                    data: null,
                    orderable: false,
                    render: (data, type, row) => {
                        let buttons = '';
                        if (row.status === 'reading') {
                            buttons += `
                                <button 
                                    onclick="booksPage.markAsFinished(${row.id})" 
                                    class="text-green-400 hover:text-green-300 transition-colors mr-2"
                                    title="Mark as Finished"
                                >
                                    ✓
                                </button>
                            `;
                        }
                        buttons += `
                            <button 
                                onclick="booksPage.editBook(${row.id})" 
                                class="text-blue-400 hover:text-blue-300 transition-colors mr-2"
                                title="Edit"
                            >
                                ✏️
                            </button>
                            <button 
                                onclick="booksPage.deleteBook(${row.id})" 
                                class="text-red-400 hover:text-red-300 transition-colors"
                                title="Delete"
                            >
                                🗑️
                            </button>
                        `;
                        return buttons;
                    }
                }
            ],
            order: [[0, 'asc']], // Sort by title by default
            pageLength: 10,
            language: {
                search: "Search:",
                lengthMenu: "Show _MENU_ books per page",
                info: "Showing _START_ to _END_ of _TOTAL_ books",
                infoEmpty: "No books available",
                infoFiltered: "(filtered from _MAX_ total books)",
                zeroRecords: "No books found",
                emptyTable: "No books in your library"
            },
            destroy: true
        });

        // Show table
        document.getElementById('table-loading').classList.add('hidden');
        document.getElementById('table-container').classList.remove('hidden');
    }

    /**
     * Refresh DataTable with current data
     */
    refreshDataTable() {
        if (this.dataTable) {
            this.dataTable.destroy();
        }
        this.initDataTable();
    }

    /**
     * Apply filters to the book list
     */
    applyFilters() {
        const statusFilter = document.getElementById('status-filter').value;

        // Filter books
        if (statusFilter === 'all') {
            this.filteredBooks = [...this.books];
        } else {
            this.filteredBooks = this.books.filter(book => book.status === statusFilter);
        }

        // Refresh table
        this.refreshDataTable();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('status-filter').value = 'all';
        this.filteredBooks = [...this.books];
        this.refreshDataTable();
    }

    /**
     * Open modal for adding/editing book
     */
    openModal(book = null) {
        const modal = document.getElementById('book-modal');
        const form = document.getElementById('book-form');
        
        // Reset form
        form.reset();
        validators.clearErrors('book-form');

        if (book) {
            // Edit mode
            this.isEditMode = true;
            this.currentBookId = book.id;
            
            document.getElementById('modal-title').textContent = 'Edit Book';
            document.getElementById('submit-btn-text').textContent = 'Save Changes';
            
            // Populate form
            document.getElementById('book-id').value = book.id;
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-author').value = book.author || '';
            document.getElementById('book-start-date').value = book.start_date;
            
            // Show additional fields for editing
            document.getElementById('status-field').classList.remove('hidden');
            document.getElementById('book-status').value = book.status;
            
            if (book.status === 'finished') {
                document.getElementById('end-date-field').classList.remove('hidden');
                document.getElementById('book-end-date').value = book.end_date || '';
            }
        } else {
            // Add mode
            this.isEditMode = false;
            this.currentBookId = null;
            
            document.getElementById('modal-title').textContent = 'Add Book';
            document.getElementById('submit-btn-text').textContent = 'Add Book';
            
            // Hide additional fields
            document.getElementById('status-field').classList.add('hidden');
            document.getElementById('end-date-field').classList.add('hidden');
            
            // Set default start date to today
            document.getElementById('book-start-date').value = dateUtils.todayString();
        }

        modal.classList.remove('hidden');
    }

    /**
     * Close book modal
     */
    closeModal() {
        document.getElementById('book-modal').classList.add('hidden');
        document.getElementById('book-form').reset();
        validators.clearErrors('book-form');
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();

        // Get form data
        const formData = {
            title: document.getElementById('book-title').value,
            author: document.getElementById('book-author').value,
            start_date: document.getElementById('book-start-date').value
        };

        if (this.isEditMode) {
            formData.status = document.getElementById('book-status').value;
            const endDate = document.getElementById('book-end-date').value;
            if (endDate) {
                formData.end_date = endDate;
            }
        }

        // Validate
        const validation = validators.validateBookForm(formData);
        
        if (!validation.isValid) {
            validators.displayErrors(validation.errors, 'book-form');
            notifications.warning('Please fix the errors in the form');
            return;
        }

        try {
            if (this.isEditMode) {
                // Update book
                await bookApi.update(this.currentBookId, formData);
                notifications.success(CONFIG.CONSTANTS.MESSAGES.SUCCESS.BOOK_UPDATED);
            } else {
                // Create book
                await bookApi.create(formData);
                notifications.success(CONFIG.CONSTANTS.MESSAGES.SUCCESS.BOOK_CREATED);
            }

            // Reload books and close modal
            await this.loadBooks();
            this.filteredBooks = [...this.books];
            this.refreshDataTable();
            this.closeModal();

        } catch (error) {
            console.error('Error saving book:', error);
            notifications.apiError(error, 'Failed to save book');
        }
    }

    /**
     * Edit book
     */
    async editBook(bookId) {
        try {
            const book = await bookApi.getById(bookId);
            this.openModal(book);
        } catch (error) {
            console.error('Error loading book:', error);
            notifications.error('Failed to load book details');
        }
    }

    /**
     * Mark book as finished
     */
    async markAsFinished(bookId) {
        try {
            await bookApi.markAsFinished(bookId, dateUtils.todayString());
            notifications.success(CONFIG.CONSTANTS.MESSAGES.SUCCESS.BOOK_FINISHED);
            
            await this.loadBooks();
            this.filteredBooks = [...this.books];
            this.refreshDataTable();
        } catch (error) {
            console.error('Error marking book as finished:', error);
            notifications.apiError(error, 'Failed to mark book as finished');
        }
    }

    /**
     * Delete book
     */
    async deleteBook(bookId) {
        try {
            const book = await bookApi.getById(bookId);
            const sessions = await sessionApi.getByBook(bookId);
            
            this.currentBookId = bookId;
            
            // Show delete confirmation
            const message = sessions.length > 0
                ? `This book has ${sessions.length} reading session${sessions.length > 1 ? 's' : ''}. Deleting it will also delete all sessions. This action cannot be undone.`
                : 'Are you sure you want to delete this book? This action cannot be undone.';
            
            document.getElementById('delete-message').textContent = message;
            document.getElementById('delete-modal').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error preparing delete:', error);
            notifications.error('Failed to load book details');
        }
    }

    /**
     * Confirm delete
     */
    async confirmDelete() {
        try {
            await bookApi.delete(this.currentBookId);
            notifications.success(CONFIG.CONSTANTS.MESSAGES.SUCCESS.BOOK_DELETED);
            
            this.closeDeleteModal();
            await this.loadBooks();
            this.filteredBooks = [...this.books];
            this.refreshDataTable();
            
        } catch (error) {
            console.error('Error deleting book:', error);
            
            if (error.message.toLowerCase().includes('session')) {
                notifications.error(CONFIG.CONSTANTS.MESSAGES.ERROR.BOOK_HAS_SESSIONS);
            } else {
                notifications.apiError(error, 'Failed to delete book');
            }
        }
    }

    /**
     * Close delete modal
     */
    closeDeleteModal() {
        document.getElementById('delete-modal').classList.add('hidden');
        this.currentBookId = null;
    }
}

// Initialize page when DOM is ready
let booksPage;
document.addEventListener('DOMContentLoaded', () => {
    booksPage = new BooksPage();
});

// Make available globally for onclick handlers
window.booksPage = null;
document.addEventListener('DOMContentLoaded', () => {
    window.booksPage = booksPage;
});
