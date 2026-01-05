// js/components/bookModal.js

import CONFIG from '../config/config.js';
import validators from '../utils/validators.js';
import dateUtils from '../utils/dateUtils.js';

/**
 * Book Modal Component
 * Reusable modal for adding/editing books
 */
class BookModal {
    constructor() {
        this.modal = null;
        this.form = null;
        this.isEditMode = false;
        this.currentBookId = null;
        this.onSave = null;
    }

    /**
     * Initialize modal
     */
    init() {
        this.modal = document.getElementById('book-modal');
        this.form = document.getElementById('book-form');
        
        if (!this.modal || !this.form) {
            console.error('Book modal elements not found');
            return;
        }

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close buttons
        document.getElementById('close-modal-btn')?.addEventListener('click', () => {
            this.close();
        });

        document.getElementById('cancel-btn')?.addEventListener('click', () => {
            this.close();
        });

        // Form submit
        this.form.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        // Status change - show/hide end date
        const statusSelect = document.getElementById('book-status');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                const endDateField = document.getElementById('end-date-field');
                if (e.target.value === 'finished') {
                    endDateField?.classList.remove('hidden');
                } else {
                    endDateField?.classList.add('hidden');
                    document.getElementById('book-end-date').value = '';
                }
            });
        }

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target.id === 'book-modal') {
                this.close();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    /**
     * Open modal for adding a book
     */
    openAdd(onSave) {
        this.isEditMode = false;
        this.currentBookId = null;
        this.onSave = onSave;

        // Reset form
        this.form.reset();
        validators.clearErrors('book-form');

        // Set UI for add mode
        document.getElementById('modal-title').textContent = 'Add Book';
        document.getElementById('submit-btn-text').textContent = 'Add Book';

        // Hide edit-only fields
        document.getElementById('status-field')?.classList.add('hidden');
        document.getElementById('end-date-field')?.classList.add('hidden');

        // Set default start date
        document.getElementById('book-start-date').value = dateUtils.todayString();

        // Show modal
        this.modal.classList.remove('hidden');
        
        // Focus first field
        setTimeout(() => {
            document.getElementById('book-title')?.focus();
        }, 100);
    }

    /**
     * Open modal for editing a book
     */
    openEdit(book, onSave) {
        this.isEditMode = true;
        this.currentBookId = book.id;
        this.onSave = onSave;

        // Reset form
        this.form.reset();
        validators.clearErrors('book-form');

        // Set UI for edit mode
        document.getElementById('modal-title').textContent = 'Edit Book';
        document.getElementById('submit-btn-text').textContent = 'Save Changes';

        // Show edit fields
        document.getElementById('status-field')?.classList.remove('hidden');
        
        // Populate form
        document.getElementById('book-id').value = book.id;
        document.getElementById('book-title').value = book.title;
        document.getElementById('book-author').value = book.author || '';
        document.getElementById('book-start-date').value = book.start_date;
        document.getElementById('book-status').value = book.status;

        // Show/populate end date if finished
        if (book.status === 'finished' && book.end_date) {
            document.getElementById('end-date-field')?.classList.remove('hidden');
            document.getElementById('book-end-date').value = book.end_date;
        } else {
            document.getElementById('end-date-field')?.classList.add('hidden');
        }

        // Show modal
        this.modal.classList.remove('hidden');

        // Focus first field
        setTimeout(() => {
            document.getElementById('book-title')?.focus();
        }, 100);
    }

    /**
     * Close modal
     */
    close() {
        this.modal.classList.add('hidden');
        this.form.reset();
        validators.clearErrors('book-form');
        this.isEditMode = false;
        this.currentBookId = null;
        this.onSave = null;
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Get form data
        const formData = this.getFormData();

        // Validate
        const validation = validators.validateBookForm(formData);
        
        if (!validation.isValid) {
            validators.displayErrors(validation.errors, 'book-form');
            return;
        }

        // Clear errors
        validators.clearErrors('book-form');

        // Call save callback
        if (this.onSave) {
            const success = await this.onSave({
                id: this.currentBookId,
                data: formData,
                isEdit: this.isEditMode
            });

            if (success) {
                this.close();
            }
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        const data = {
            title: document.getElementById('book-title').value.trim(),
            author: document.getElementById('book-author').value.trim(),
            start_date: document.getElementById('book-start-date').value
        };

        if (this.isEditMode) {
            data.status = document.getElementById('book-status').value;
            
            const endDate = document.getElementById('book-end-date').value;
            if (endDate) {
                data.end_date = endDate;
            }
        }

        return data;
    }

    /**
     * Set loading state
     */
    setLoading(isLoading) {
        const submitBtn = document.getElementById('submit-btn-text');
        const cancelBtn = document.getElementById('cancel-btn');
        
        if (isLoading) {
            submitBtn.textContent = 'Saving...';
            cancelBtn.disabled = true;
            this.form.querySelectorAll('input, select, button').forEach(el => {
                el.disabled = true;
            });
        } else {
            submitBtn.textContent = this.isEditMode ? 'Save Changes' : 'Add Book';
            cancelBtn.disabled = false;
            this.form.querySelectorAll('input, select, button').forEach(el => {
                el.disabled = false;
            });
        }
    }
}

// Export singleton instance
const bookModal = new BookModal();

export default Object.freeze(bookModal);
