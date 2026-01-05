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

            // Render books
            this.renderBooks();

        } catch (error) {
            console.error('Books page initialization error:', error);
            this.showError();
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

        // Search input
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Status filter
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.handleFilter(e.target.value);
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
            this.showLoading();
            this.books = await bookApi.getAll();
            this.filteredBooks = [...this.books];
            this.showContent();
        } catch (error) {
            console.error('Error loading books:', error);
            this.showError();
            throw error;
        }
    }

    /**
     * Render books grid
     */
    renderBooks() {
        const container = document.getElementById('books-grid');
        
        // Show empty state if no books
        if (this.books.length === 0) {
            this.showEmptyState();
            return;
        }

        // Show no results if filtered list is empty
        if (this.filteredBooks.length === 0) {
            this.showNoResults();
            return;
        }

        // Hide empty/no results states
        document.getElementById('empty-state').classList.add('hidden');
        document.getElementById('no-results-state').classList.add('hidden');
        container.classList.remove('hidden');

        // Render book cards
        container.innerHTML = this.filteredBooks.map(book => this.createBookCard(book)).join('');
    }

    /**
     * Create a book card HTML
     */
    createBookCard(book) {
        const statusBadge = book.status === 'finished' 
            ? '<span class="px-2 py-1 text-xs font-semibold rounded bg-green-500/20 text-green-400">Finished</span>'
            : '<span class="px-2 py-1 text-xs font-semibold rounded bg-blue-500/20 text-blue-400">Reading</span>';

        const dateInfo = book.status === 'finished' && book.end_date
            ? `Finished: ${dateUtils.toDisplayFormat(book.end_date)}`
            : `Started: ${dateUtils.toDisplayFormat(book.start_date)}`;

        return `
            <div class="glass-card animate-fade-in hover:scale-105 transition-transform">
                <!-- Card Header -->
                <div class="flex items-start justify-between mb-4">
                    <div class="text-4xl">📖</div>
                    ${statusBadge}
                </div>

                <!-- Book Info -->
                <h3 class="text-xl font-bold mb-2 line-clamp-2">${book.title}</h3>
                <p class="text-text-secondary mb-4">${book.author || 'Unknown Author'}</p>
                
                <!-- Date Info -->
                <p class="text-sm text-text-muted mb-4">${dateInfo}</p>

                <!-- Actions -->
                <div class="flex gap-2 pt-4 border-t border-glass-border">
                    ${book.status === 'reading' ? `
                        <button 
                            onclick="booksPage.markAsFinished(${book.id})" 
                            class="btn btn-secondary flex-1 text-sm py-2"
                        >
                            ✓ Finish
                        </button>
                    ` : ''}
                    <button 
                        onclick="booksPage.editBook(${book.id})" 
                        class="btn btn-secondary flex-1 text-sm py-2"
                    >
                        ✏️ Edit
                    </button>
                    <button 
                        onclick="booksPage.deleteBook(${book.id})" 
                        class="btn btn-danger flex-1 text-sm py-2"
                    >
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
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
            this.renderBooks();
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
            this.renderBooks();
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
            this.renderBooks();
            
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

    /**
     * Handle search
     */
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredBooks = [...this.books];
        } else {
            this.filteredBooks = this.books.filter(book => {
                const title = book.title.toLowerCase();
                const author = (book.author || '').toLowerCase();
                return title.includes(searchTerm) || author.includes(searchTerm);
            });
        }

        this.renderBooks();
    }

    /**
     * Handle status filter
     */
    handleFilter(status) {
        if (status === 'all') {
            this.filteredBooks = [...this.books];
        } else {
            this.filteredBooks = this.books.filter(book => book.status === status);
        }

        this.renderBooks();
    }

    /**
     * Show loading state
     */
    showLoading() {
        document.getElementById('loading-state').classList.remove('hidden');
        document.getElementById('books-grid').classList.add('hidden');
        document.getElementById('empty-state').classList.add('hidden');
        document.getElementById('no-results-state').classList.add('hidden');
        document.getElementById('error-state').classList.add('hidden');
    }

    /**
     * Show content
     */
    showContent() {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.add('hidden');
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        document.getElementById('books-grid').classList.add('hidden');
        document.getElementById('no-results-state').classList.add('hidden');
        document.getElementById('empty-state').classList.remove('hidden');
    }

    /**
     * Show no results state
     */
    showNoResults() {
        document.getElementById('books-grid').classList.add('hidden');
        document.getElementById('empty-state').classList.add('hidden');
        document.getElementById('no-results-state').classList.remove('hidden');
    }

    /**
     * Show error state
     */
    showError() {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('books-grid').classList.add('hidden');
        document.getElementById('empty-state').classList.add('hidden');
        document.getElementById('no-results-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
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
