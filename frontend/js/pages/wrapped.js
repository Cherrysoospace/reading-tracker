// js/pages/wrapped.js

import statsApi from '../api/statsApi.js';
import CONFIG from '../config/config.js';
import notifications from '../utils/notifications.js';

/**
 * Wrapped Page Controller
 * Creates a Spotify-style year recap experience
 */
class WrappedPage {
    constructor() {
        this.currentCard = 0;
        this.totalCards = 9;
        this.wrappedData = null;
        this.selectedYear = null;
        this.isAnimating = false;
        
        this.init();
    }

    /**
     * Initialize page
     */
    init() {
        // Populate year selector
        this.populateYearSelector();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
    }

    /**
     * Populate year selector dropdown
     */
    populateYearSelector() {
        const select = document.getElementById('year-select');
        const currentYear = new Date().getFullYear();
        const startYear = CONFIG.CONSTANTS.WRAPPED.MIN_YEAR;
        
        // Populate years from current to minimum
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear - 1) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startWrapped();
        });

        // Skip button
        document.getElementById('skip-btn').addEventListener('click', () => {
            this.nextCard();
        });

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });

        // Click to advance
        document.addEventListener('click', (e) => {
            // Don't advance on button clicks or during animations
            if (e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'SELECT' || 
                e.target.tagName === 'A' ||
                this.isAnimating) {
                return;
            }
            
            if (this.currentCard > 0 && this.currentCard < this.totalCards) {
                this.nextCard();
            }
        });
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.currentCard === 0) return; // Don't navigate on selection screen
            
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.nextCard();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.previousCard();
            }
        });
    }

    /**
     * Start wrapped experience
     */
    async startWrapped() {
        this.selectedYear = parseInt(document.getElementById('year-select').value);
        
        try {
            // Show loading
            this.showCard('loading-screen');
            
            // Fetch wrapped data
            this.wrappedData = await statsApi.getWrapped(this.selectedYear);
            
            // Debug: Log the received data
            console.log('Wrapped data received:', this.wrappedData);
            console.log('Data keys:', Object.keys(this.wrappedData || {}));
            console.log('Total books:', this.wrappedData?.total_books);
            console.log('Total minutes:', this.wrappedData?.total_minutes);
            
            // Check if there's data
            if (!this.wrappedData) {
                console.log('No data returned from API');
                notifications.info(`No reading data found for ${this.selectedYear}`);
                this.restart();
                return;
            }
            
            // Populate data in cards
            this.populateCards();
            
            // Start from first card
            setTimeout(() => {
                this.currentCard = 1;
                this.showCard('card-1');
                this.updateProgress();
            }, 1500);
            
        } catch (error) {
            console.error('Error loading wrapped data:', error);
            notifications.error('Failed to load your reading wrapped');
            this.restart();
        }
    }

    /**
     * Populate all cards with data
     */
    populateCards() {
        const data = this.wrappedData;
        const year = this.selectedYear;
        const nextYear = year + 1;
        
        // Update year displays
        document.querySelectorAll('[id^="year-display"]').forEach(el => {
            el.textContent = year;
        });
        document.getElementById('year-next').textContent = nextYear;
        
        // Card 2: Total Books
        const totalBooks = data.books_read || 0;
        document.getElementById('total-books').textContent = totalBooks;
        const avgBooksPerMonth = (totalBooks / 12).toFixed(1);
        document.getElementById('books-comparison').textContent = 
            `That's about ${avgBooksPerMonth} books per month! 📚`;
        
        // Card 3: Total Time
        const totalMinutes = data.total_minutes_read || 0;
        const totalHours = Math.round(totalMinutes / 60);
        document.getElementById('total-hours').textContent = totalHours;
        const days = Math.round(totalHours / 24);
        document.getElementById('time-equivalent').textContent = 
            days > 0 ? `That's ${days} full ${days === 1 ? 'day' : 'days'} of reading! 🤯` : 'Every minute counts! 📖';
        
        // Card 4: Most Read Book
        if (data.most_read_book) {
            document.getElementById('top-book-title').textContent = data.most_read_book.title || 'Unknown';
            document.getElementById('top-book-author').textContent = 
                data.most_read_book.author ? `by ${data.most_read_book.author}` : 'Unknown Author';
            document.getElementById('top-book-minutes').textContent = data.most_read_book.total_minutes || 0;
            // Backend no devuelve session_count, usar top_books para obtenerlo
            const topBook = data.top_books?.find(b => b.book_id === data.most_read_book.book_id);
            document.getElementById('top-book-sessions').textContent = topBook?.session_count || 0;
        } else {
            document.getElementById('top-book-title').textContent = 'No data';
            document.getElementById('top-book-author').textContent = '';
            document.getElementById('top-book-minutes').textContent = '0';
            document.getElementById('top-book-sessions').textContent = '0';
        }
        
        // Card 5: Longest Streak (usar current_streak si no hay longest_streak)
        const maxStreak = data.longest_streak || data.current_streak || 0;
        document.getElementById('max-streak').textContent = maxStreak;
        document.getElementById('streak-message').textContent = 
            maxStreak >= 30 ? 'Incredible dedication! 🌟' :
            maxStreak >= 14 ? 'Amazing consistency! 💪' :
            maxStreak >= 7 ? 'Great habit building! 🔥' :
            'Keep going, consistency is key! 💫';
        
        // Card 6: Busiest Month
        if (data.busiest_month) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'];
            document.getElementById('busiest-month').textContent = 
                monthNames[data.busiest_month.month - 1] || 'Unknown';
            document.getElementById('busiest-month-minutes').textContent = 
                data.busiest_month.total_minutes || 0;
            document.getElementById('busiest-month-sessions').textContent = 
                data.busiest_month.session_count || 0;
        } else {
            document.getElementById('busiest-month').textContent = 'No data';
            document.getElementById('busiest-month-minutes').textContent = '0';
            document.getElementById('busiest-month-sessions').textContent = '0';
        }
        
        // Card 7: Average per Day
        const avgDaily = Math.round(data.average_minutes_per_day || 0);
        document.getElementById('avg-daily').textContent = avgDaily;
        document.getElementById('avg-message').textContent = 
            avgDaily >= 60 ? 'Over an hour every day! Outstanding! 🏆' :
            avgDaily >= 30 ? 'Half an hour daily! Fantastic! 🌟' :
            avgDaily >= 15 ? 'Steady progress! Keep it up! 📚' :
            'Every bit of reading matters! 💙';
        
        // Card 8: Finished Books
        const finishedBooks = data.books_finished_in_year || 0;
        document.getElementById('finished-books').textContent = finishedBooks;
        document.getElementById('finished-message').textContent = 
            finishedBooks >= 20 ? 'You\'re a reading machine! 🚀' :
            finishedBooks >= 10 ? 'Double digits! Impressive! 🎉' :
            finishedBooks >= 5 ? 'Quality over quantity! 📖' :
            finishedBooks > 0 ? 'Every completion is a victory! 🏅' :
            'Keep reading, you\'ll finish more soon! 💪';
        
        // Card 9: Summary
        document.getElementById('summary-books').textContent = totalBooks;
        document.getElementById('summary-hours').textContent = totalHours + 'h';
        document.getElementById('summary-streak').textContent = maxStreak;
        document.getElementById('summary-finished').textContent = finishedBooks;
    }

    /**
     * Show specific card
     */
    showCard(cardId) {
        this.isAnimating = true;
        
        // Hide all cards
        const cards = document.querySelectorAll('.wrapped-card');
        cards.forEach(card => {
            card.classList.remove('active');
            card.classList.add('exit');
        });
        
        // Show target card
        setTimeout(() => {
            cards.forEach(card => {
                card.classList.remove('exit');
            });
            
            const targetCard = document.getElementById(cardId);
            if (targetCard) {
                targetCard.classList.add('active');
            }
            
            this.isAnimating = false;
        }, 300);
    }

    /**
     * Go to next card
     */
    nextCard() {
        if (this.isAnimating) return;
        
        if (this.currentCard < this.totalCards) {
            this.currentCard++;
            this.showCard(`card-${this.currentCard}`);
            this.updateProgress();
            
            // Show home button on last card
            if (this.currentCard === this.totalCards) {
                document.getElementById('home-btn').classList.remove('hidden');
                document.getElementById('skip-btn').classList.add('hidden');
            }
        }
    }

    /**
     * Go to previous card
     */
    previousCard() {
        if (this.isAnimating) return;
        
        if (this.currentCard > 1) {
            this.currentCard--;
            this.showCard(`card-${this.currentCard}`);
            this.updateProgress();
            
            // Hide home button if not on last card
            document.getElementById('home-btn').classList.add('hidden');
            document.getElementById('skip-btn').classList.remove('hidden');
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progress = (this.currentCard / this.totalCards) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    }

    /**
     * Restart wrapped experience
     */
    restart() {
        this.currentCard = 0;
        this.wrappedData = null;
        document.getElementById('progress-bar').style.width = '0%';
        document.getElementById('home-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.remove('hidden');
        this.showCard('year-selection');
    }
}

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WrappedPage();
});
