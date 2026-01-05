// js/pages/dashboard.js

import statsApi from '../api/statsApi.js';
import bookApi from '../api/bookApi.js';
import CONFIG from '../config/config.js';
import notifications from '../utils/notifications.js';
import dateUtils from '../utils/dateUtils.js';
import timeUtils from '../utils/timeUtils.js';

/**
 * Dashboard Page Controller
 */
class Dashboard {
    constructor() {
        this.stats = null;
        this.allSessions = [];
        this.allBooks = [];
        this.selectedYear = 'all';
        this.chart = null;
        this.init();
    }

    /**
     * Initialize dashboard
     */
    async init() {
        try {
            // Set greeting
            this.setGreeting();

            // Show loading state
            this.showLoading();

            // Fetch all data
            await this.loadData();

            // Setup year filter
            this.setupYearFilter();

            // Render dashboard
            this.render();

            // Hide loading, show content
            this.showContent();

        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showError();
            notifications.error('Failed to load dashboard');
        }
    }

    /**
     * Load all dashboard data
     */
    async loadData() {
        try {
            // Import sessionApi for getting all sessions
            const { default: sessionApi } = await import('../api/sessionApi.js');
            
            // Fetch summary stats, sessions, and books
            [this.stats, this.allSessions, this.allBooks] = await Promise.all([
                statsApi.getSummary(),
                sessionApi.getAll(),
                bookApi.getAll()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            throw error;
        }
    }

    /**
     * Setup year filter buttons
     */
    setupYearFilter() {
        // Get unique years from sessions
        const years = [...new Set(this.allSessions.map(s => new Date(s.date).getFullYear()))];
        years.sort((a, b) => b - a); // Sort descending
        
        if (years.length === 0) {
            return; // No sessions yet
        }

        // Show filter section
        document.getElementById('year-filter-section').style.display = 'block';

        const container = document.getElementById('year-filter-buttons');
        
        // Create "All Years" button
        const allYearsBtn = document.createElement('button');
        allYearsBtn.className = 'btn btn-primary year-filter-btn';
        allYearsBtn.dataset.year = 'all';
        allYearsBtn.textContent = 'All Years';
        container.appendChild(allYearsBtn);

        // Create button for each year
        years.forEach(year => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary year-filter-btn';
            btn.dataset.year = year;
            btn.textContent = year;
            container.appendChild(btn);
        });

        // Add click handlers
        document.querySelectorAll('.year-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleYearChange(btn.dataset.year);
            });
        });
    }

    /**
     * Handle year filter change
     */
    handleYearChange(year) {
        // Update selected year
        this.selectedYear = year;

        // Update button states
        document.querySelectorAll('.year-filter-btn').forEach(btn => {
            if (btn.dataset.year === year) {
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-primary');
            } else {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            }
        });

        // Re-render dashboard with filtered data
        this.render();
    }

    /**
     * Get filtered sessions based on selected year
     */
    getFilteredSessions() {
        if (this.selectedYear === 'all') {
            return this.allSessions;
        }
        
        return this.allSessions.filter(session => {
            const sessionYear = new Date(session.date).getFullYear();
            return sessionYear === parseInt(this.selectedYear);
        });
    }

    /**
     * Get filtered stats based on selected year
     */
    getFilteredStats() {
        const filteredSessions = this.getFilteredSessions();
        
        // Calculate stats from filtered sessions
        const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.minutes_read, 0);
        const uniqueBooks = new Set(filteredSessions.map(s => s.book_id));
        
        // For books finished, we'd need to check the end_date
        // For now, use the overall stats if 'all', or recalculate if specific year
        
        return {
            total_minutes_read: totalMinutes,
            books_count: uniqueBooks.size,
            books_finished: this.selectedYear === 'all' ? this.stats.books_finished : 
                           this.calculateBooksFinished(filteredSessions),
            current_streak: this.stats.current_streak, // Keep global streak
            max_streak: this.stats.max_streak
        };
    }

    /**
     * Calculate books finished in filtered sessions
     */
    async calculateBooksFinished(filteredSessions) {
        try {
            const uniqueBooks = [...new Set(filteredSessions.map(s => s.book_id))];
            const books = await bookApi.getAll();
            
            let finished = 0;
            books.forEach(book => {
                if (book.status === 'finished' && uniqueBooks.includes(book.id)) {
                    if (this.selectedYear === 'all') {
                        finished++;
                    } else {
                        // Check if book was finished in the selected year
                        if (book.end_date) {
                            const endYear = new Date(book.end_date).getFullYear();
                            if (endYear === parseInt(this.selectedYear)) {
                                finished++;
                            }
                        }
                    }
                }
            });
            
            return finished;
        } catch (error) {
            console.error('Error calculating books finished:', error);
            return 0;
        }
    }

    /**
     * Render all dashboard components
     */
    render() {
        this.renderStatsCards();
        this.renderStreak();
        this.renderDailyChart();
        this.renderTopBooks();
    }

    /**
     * Render statistics cards
     */
    renderStatsCards() {
        const container = document.getElementById('stats-cards');
        
        // Use filtered stats
        const displayStats = this.getFilteredStats();
        
        const cards = [
            {
                icon: '📚',
                title: 'Total Reading Time',
                value: timeUtils.formatMinutes(displayStats.total_minutes_read || 0),
                subtitle: `${timeUtils.minutesToHours(displayStats.total_minutes_read || 0)} hours`,
                gradient: 'from-purple-500 to-pink-500'
            },
            {
                icon: '✅',
                title: 'Books Finished',
                value: displayStats.books_finished || 0,
                subtitle: 'Completed',
                gradient: 'from-green-500 to-teal-500'
            },
            {
                icon: '🔥',
                title: 'Current Streak',
                value: `${displayStats.current_streak || 0}`,
                subtitle: displayStats.current_streak === 1 ? 'day' : 'days',
                gradient: 'from-orange-500 to-red-500'
            },
            {
                icon: '✍️',
                title: 'Most Read Author',
                value: this.stats.most_read_author || 'N/A',
                subtitle: 'Favorite',
                gradient: 'from-blue-500 to-cyan-500',
                smallValue: true
            }
        ];

        container.innerHTML = cards.map(card => `
            <div class="stat-card animate-fade-in hover:scale-105 transition-transform">
                <div class="flex items-start justify-between mb-4">
                    <div class="text-4xl">${card.icon}</div>
                    <div class="h-12 w-12 rounded-lg bg-gradient-to-br ${card.gradient} opacity-20"></div>
                </div>
                <h3 class="text-text-secondary text-sm font-medium mb-2">${card.title}</h3>
                <p class="text-3xl font-bold mb-1 ${card.smallValue ? 'text-2xl' : ''}">${card.value}</p>
                <p class="text-text-muted text-sm">${card.subtitle}</p>
            </div>
        `).join('');
    }

    /**
     * Render streak section
     */
    renderStreak() {
        const container = document.getElementById('streak-section');
        const currentStreak = this.stats.current_streak || 0;
        const maxStreak = this.stats.max_streak || 0;

        container.innerHTML = `
            <div class="flex items-center justify-between flex-wrap gap-6">
                <div class="flex items-center space-x-4">
                    <div class="text-6xl">🔥</div>
                    <div>
                        <h3 class="text-2xl font-bold mb-1">
                            ${currentStreak} Day${currentStreak !== 1 ? 's' : ''} Streak!
                        </h3>
                        <p class="text-text-secondary">
                            ${currentStreak > 0 ? 'Keep it going!' : 'Start reading today to build your streak'}
                        </p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-text-muted text-sm mb-1">Personal Best</p>
                    <p class="text-3xl font-bold text-gradient">
                        ${maxStreak} day${maxStreak !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Render daily reading chart (last 7 days)
     */
    async renderDailyChart() {
        try {
            // Get filtered sessions
            const filteredSessions = this.getFilteredSessions();
            
            // Group by last 7 days
            const last7Days = [];
            const dailyData = {};
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = dateUtils.toAPIFormat(date);
                last7Days.push(dateStr);
                dailyData[dateStr] = 0;
            }
            
            // Sum minutes for each day
            filteredSessions.forEach(session => {
                if (dailyData.hasOwnProperty(session.date)) {
                    dailyData[session.date] += session.minutes_read;
                }
            });

            const ctx = document.getElementById('daily-chart').getContext('2d');

            // Destroy existing chart if it exists
            if (this.chart) {
                this.chart.destroy();
            }

            // Prepare data
            const labels = last7Days.map(date => dateUtils.toShortFormat(date));
            const data = last7Days.map(date => dailyData[date]);

            // Create chart
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Minutes Read',
                        data,
                        borderColor: CONFIG.UI.CHART_COLORS.primary,
                        backgroundColor: `${CONFIG.UI.CHART_COLORS.primary}33`,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: CONFIG.UI.CHART_COLORS.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            titleColor: '#f1f5f9',
                            bodyColor: '#cbd5e1',
                            borderColor: CONFIG.UI.CHART_COLORS.primary,
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => {
                                    return `${context.parsed.y} minutes`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: CONFIG.UI.CHART_COLORS.grid,
                                drawBorder: false
                            },
                            ticks: {
                                color: CONFIG.UI.CHART_COLORS.text,
                                callback: (value) => `${value}m`
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: CONFIG.UI.CHART_COLORS.text
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error rendering chart:', error);
        }
    }

    /**
     * Render top 5 most read books
     */
    async renderTopBooks() {
        try {
            const filteredSessions = this.getFilteredSessions();
            const container = document.getElementById('top-books-list');

            if (filteredSessions.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-text-muted">
                        <p>No reading sessions yet</p>
                        <p class="text-sm mt-2">Start logging your reading to see stats!</p>
                    </div>
                `;
                return;
            }
            
            // Group sessions by book and calculate totals
            const bookStats = {};
            filteredSessions.forEach(session => {
                if (!bookStats[session.book_id]) {
                    // Find the book details
                    const book = this.allBooks.find(b => b.id === session.book_id);
                    bookStats[session.book_id] = {
                        book_id: session.book_id,
                        title: book ? book.title : 'Unknown Book',
                        author: book ? book.author : 'Unknown Author',
                        total_minutes: 0
                    };
                }
                bookStats[session.book_id].total_minutes += session.minutes_read;
            });
            
            // Convert to array and sort by total minutes
            const topBooks = Object.values(bookStats)
                .sort((a, b) => b.total_minutes - a.total_minutes)
                .slice(0, 5);

            container.innerHTML = topBooks.map((book, index) => `
                <div class="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50 hover:bg-bg-secondary transition-colors">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <span class="text-2xl font-bold text-text-muted">${index + 1}</span>
                        <div class="min-w-0 flex-1">
                            <p class="font-semibold truncate">${book.title}</p>
                            <p class="text-sm text-text-muted truncate">${book.author || 'Unknown Author'}</p>
                        </div>
                    </div>
                    <div class="text-right ml-4">
                        <p class="font-bold text-accent-purple">${timeUtils.formatMinutes(book.total_minutes)}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering top books:', error);
        }
    }

    /**
     * Set greeting based on time of day
     */
    setGreeting() {
        const timeOfDay = timeUtils.getTimeOfDay();
        const greetings = {
            morning: 'Good Morning!',
            afternoon: 'Good Afternoon!',
            evening: 'Good Evening!'
        };

        document.getElementById('greeting').textContent = greetings[timeOfDay];
    }

    /**
     * Show loading state
     */
    showLoading() {
        document.getElementById('loading-state').classList.remove('hidden');
        document.getElementById('dashboard-content').classList.add('hidden');
        document.getElementById('error-state').classList.add('hidden');
    }

    /**
     * Show main content
     */
    showContent() {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('dashboard-content').classList.remove('hidden');
        document.getElementById('error-state').classList.add('hidden');
    }

    /**
     * Show error state
     */
    showError() {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('dashboard-content').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});
