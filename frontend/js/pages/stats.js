// js/pages/stats.js

import statsApi from '../api/statsApi.js';
import sessionApi from '../api/sessionApi.js';
import CONFIG from '../config/config.js';
import notifications from '../utils/notifications.js';
import dateUtils from '../utils/dateUtils.js';
import timeUtils from '../utils/timeUtils.js';

/**
 * Stats Page Controller
 */
class StatsPage {
    constructor() {
        this.stats = null;
        this.dailyStats = [];
        this.selectedPeriod = 7; // Default to 7 days
        this.selectedYear = 2026; // Default to current year (2026)
        this.charts = {
            daily: null,
            books: null,
            weekly: null,
            monthly: null
        };
        
        this.init();
    }

    /**
     * Initialize page
     */
    async init() {
        try {
            // Show loading
            this.showLoading();

            // Load data
            await this.loadData();

            // Setup event listeners
            this.setupEventListeners();

            // Render all components
            this.render();

            // Show content
            this.showContent();

        } catch (error) {
            console.error('Stats page initialization error:', error);
            this.showError();
            notifications.error('Failed to load statistics');
        }
    }

    /**
     * Load all statistics data
     */
    async loadData() {
        try {
            // Load summary stats and daily stats with year filter
            const year = this.selectedYear === 'all' ? null : this.selectedYear;
            [this.stats, this.dailyStats] = await Promise.all([
                statsApi.getSummary(year),
                statsApi.getDailyStats(year)
            ]);
        } catch (error) {
            console.error('Error loading stats data:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Time period buttons
        document.querySelectorAll('.time-period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handlePeriodChange(e.target);
            });
        });

        // Year filter buttons
        document.querySelectorAll('.year-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleYearChange(e.target);
            });
        });

        // Custom year input and apply button
        const customYearInput = document.getElementById('custom-year-input');
        const applyYearBtn = document.getElementById('apply-custom-year-btn');
        
        if (applyYearBtn) {
            applyYearBtn.addEventListener('click', () => {
                this.handleCustomYearApply();
            });
        }
        
        if (customYearInput) {
            customYearInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleCustomYearApply();
                }
            });
        }
    }

    /**
     * Handle time period change
     */
    async handlePeriodChange(button) {
        // Update active button
        document.querySelectorAll('.time-period-btn').forEach(btn => {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-secondary');
        });
        button.classList.remove('btn-secondary');
        button.classList.add('active', 'btn-primary');

        // Update selected period
        this.selectedPeriod = parseInt(button.dataset.period);

        // Re-render charts with new period
        await this.renderCharts();
    }

    /**
     * Handle year filter change
     */
    async handleYearChange(button) {
        // Update active button
        document.querySelectorAll('.year-filter-btn').forEach(btn => {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-secondary');
        });
        button.classList.remove('btn-secondary');
        button.classList.add('active', 'btn-primary');

        // Update selected year
        const yearValue = button.dataset.year;
        this.selectedYear = yearValue === 'all' ? 'all' : parseInt(yearValue);

        // Clear custom year input
        const customYearInput = document.getElementById('custom-year-input');
        if (customYearInput) {
            customYearInput.value = '';
        }

        // Show loading
        this.showLoading();

        try {
            // Reload data with new year filter
            await this.loadData();

            // Re-render all components
            this.render();

            // Show success notification
            const yearText = this.selectedYear === 'all' ? 'All Years' : this.selectedYear;
            notifications.success(`Showing statistics for ${yearText}`);
        } catch (error) {
            console.error('Error loading data for year:', error);
            notifications.error('Failed to load statistics for selected year');
        } finally {
            this.showContent();
        }
    }

    /**
     * Handle custom year apply
     */
    async handleCustomYearApply() {
        const customYearInput = document.getElementById('custom-year-input');
        const yearValue = parseInt(customYearInput.value);

        if (!yearValue || yearValue < 2000 || yearValue > 2100) {
            notifications.error('Please enter a valid year between 2000 and 2100');
            return;
        }

        // Update active button (deselect preset buttons)
        document.querySelectorAll('.year-filter-btn').forEach(btn => {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-secondary');
        });

        // Update selected year
        this.selectedYear = yearValue;

        // Show loading
        this.showLoading();

        try {
            // Reload data with new year filter
            await this.loadData();

            // Re-render all components
            this.render();

            // Show success notification
            notifications.success(`Showing statistics for ${yearValue}`);
        } catch (error) {
            console.error('Error loading data for custom year:', error);
            notifications.error('Failed to load statistics for selected year');
        } finally {
            this.showContent();
        }
    }

    /**
     * Render all components
     */
    render() {
        this.renderOverviewCards();
        this.renderCharts();
        this.renderStreaks();
        this.renderBooksFinishedByYear();
        this.renderTopBooks();
        this.renderConsistencyMetrics();
    }

    /**
     * Render overview cards
     */
    renderOverviewCards() {
        const container = document.getElementById('overview-cards');

        const cards = [
            {
                icon: '📚',
                title: 'Total Time',
                value: timeUtils.formatMinutes(this.stats.total_minutes_read || 0),
                subtitle: `${timeUtils.minutesToHours(this.stats.total_minutes_read || 0)} hours`,
                gradient: 'from-purple-500 to-pink-500'
            },
            {
                icon: '📖',
                title: 'Books Finished',
                value: this.stats.books_finished || 0,
                subtitle: 'Completed',
                gradient: 'from-green-500 to-teal-500'
            },
            {
                icon: '🔥',
                title: 'Current Streak',
                value: `${this.stats.current_streak || 0}`,
                subtitle: 'days in a row',
                gradient: 'from-orange-500 to-red-500'
            },
            {
                icon: '📊',
                title: 'Total Sessions',
                value: this.dailyStats.length || 0,
                subtitle: 'Reading sessions',
                gradient: 'from-blue-500 to-cyan-500'
            }
        ];

        container.innerHTML = cards.map(card => `
            <div class="stat-card animate-fade-in">
                <div class="flex items-start justify-between mb-4">
                    <div class="text-4xl">${card.icon}</div>
                    <div class="h-12 w-12 rounded-lg bg-gradient-to-br ${card.gradient} opacity-20"></div>
                </div>
                <h3 class="text-text-secondary text-sm font-medium mb-2">${card.title}</h3>
                <p class="text-3xl font-bold mb-1">${card.value}</p>
                <p class="text-text-muted text-sm">${card.subtitle}</p>
            </div>
        `).join('');
    }

    /**
     * Render all charts
     */
    async renderCharts() {
        await this.renderDailyTrendChart();
        await this.renderBooksChart();
        await this.renderWeeklyChart();
        await this.renderMonthlyChart();
    }

    /**
     * Render daily trend chart
     */
    async renderDailyTrendChart() {
        const ctx = document.getElementById('daily-trend-chart').getContext('2d');

        // Destroy existing chart
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }

        // Get data for selected period with year filter
        const year = this.selectedYear === 'all' ? null : this.selectedYear;
        const periodData = await statsApi.getDailyStatsForPeriod(this.selectedPeriod, year);

        const labels = periodData.map(stat => dateUtils.toShortFormat(stat.date));
        const data = periodData.map(stat => stat.total_minutes);

        this.charts.daily = new Chart(ctx, {
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
                    pointRadius: 4,
                    pointHoverRadius: 6,
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
                                return `${context.parsed.y} minutes (${timeUtils.minutesToHours(context.parsed.y)}h)`;
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
    }

    /**
     * Render books comparison chart
     */
    async renderBooksChart() {
        const ctx = document.getElementById('books-chart').getContext('2d');

        // Destroy existing chart
        if (this.charts.books) {
            this.charts.books.destroy();
        }

        // Get top 10 books with year filter
        const year = this.selectedYear === 'all' ? null : this.selectedYear;
        const topBooks = await statsApi.getTopBooks(10, year);

        const labels = topBooks.map(book => {
            const title = book.title.length > 20 ? book.title.substring(0, 20) + '...' : book.title;
            return title;
        });
        const data = topBooks.map(book => book.total_minutes);

        this.charts.books = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Minutes Read',
                    data,
                    backgroundColor: CONFIG.UI.GRADIENTS.purple.map(color => `${color}99`),
                    borderColor: CONFIG.UI.CHART_COLORS.primary,
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
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
                                return `${context.parsed.x} minutes (${timeUtils.minutesToHours(context.parsed.x)}h)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
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
                    y: {
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
    }

    /**
     * Render weekly distribution chart
     */
    async renderWeeklyChart() {
        const ctx = document.getElementById('weekly-chart').getContext('2d');

        // Destroy existing chart
        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        // Use dailyStats which are already filtered by year
        // Group by day of week
        const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat

        this.dailyStats.forEach(stat => {
            const date = new Date(stat.date);
            const dayOfWeek = date.getDay();
            weeklyData[dayOfWeek] += stat.total_minutes;
        });

        const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        this.charts.weekly = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels,
                datasets: [{
                    data: weeklyData,
                    backgroundColor: [
                        `${CONFIG.UI.CHART_COLORS.primary}99`,
                        `${CONFIG.UI.CHART_COLORS.secondary}99`,
                        `${CONFIG.UI.CHART_COLORS.tertiary}99`,
                        `${CONFIG.UI.CHART_COLORS.success}99`,
                        `${CONFIG.UI.CHART_COLORS.warning}99`,
                        `${CONFIG.UI.CHART_COLORS.danger}99`,
                        `${CONFIG.UI.CHART_COLORS.primary}66`
                    ],
                    borderColor: CONFIG.UI.CHART_COLORS.grid,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: CONFIG.UI.CHART_COLORS.text,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#cbd5e1',
                        borderColor: CONFIG.UI.CHART_COLORS.primary,
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.r} minutes (${timeUtils.minutesToHours(context.parsed.r)}h)`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        grid: {
                            color: CONFIG.UI.CHART_COLORS.grid
                        },
                        ticks: {
                            color: CONFIG.UI.CHART_COLORS.text,
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });
    }

    /**
     * Render monthly progress chart
     */
    async renderMonthlyChart() {
        const ctx = document.getElementById('monthly-chart').getContext('2d');

        // Destroy existing chart
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        // Get data for last 12 months
        const monthlyData = [];
        const labels = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const monthStart = dateUtils.startOfMonth(date);
            const monthEnd = dateUtils.endOfMonth(date);
            
            const monthSessions = this.dailyStats.filter(stat => {
                const statDate = new Date(stat.date);
                return statDate >= monthStart && statDate <= monthEnd;
            });
            
            const totalMinutes = monthSessions.reduce((sum, stat) => sum + stat.total_minutes, 0);
            
            monthlyData.push(totalMinutes);
            labels.push(dateUtils.getMonthName(date, true));
        }

        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Minutes Read',
                    data: monthlyData,
                    backgroundColor: CONFIG.UI.GRADIENTS.emerald.map(color => `${color}99`),
                    borderColor: CONFIG.UI.CHART_COLORS.success,
                    borderWidth: 2,
                    borderRadius: 8
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
                        borderColor: CONFIG.UI.CHART_COLORS.success,
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.y} minutes (${timeUtils.minutesToHours(context.parsed.y)}h)`;
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
    }

    /**
     * Render streaks section
     */
    renderStreaks() {
        const container = document.getElementById('streaks-section');

        const currentStreak = this.stats.current_streak || 0;
        const maxStreak = this.stats.max_streak || 0;

        container.innerHTML = `
            <div class="flex items-center justify-between p-4 bg-bg-secondary/50 rounded-lg">
                <div>
                    <p class="text-text-muted text-sm mb-1">Current Streak</p>
                    <p class="text-3xl font-bold text-gradient">${currentStreak} day${currentStreak !== 1 ? 's' : ''}</p>
                </div>
                <div class="text-5xl">🔥</div>
            </div>

            <div class="flex items-center justify-between p-4 bg-bg-secondary/50 rounded-lg">
                <div>
                    <p class="text-text-muted text-sm mb-1">Longest Streak</p>
                    <p class="text-3xl font-bold">${maxStreak} day${maxStreak !== 1 ? 's' : ''}</p>
                </div>
                <div class="text-5xl">🏆</div>
            </div>

            <div class="p-4 bg-accent-purple/10 border border-accent-purple/30 rounded-lg">
                <p class="text-sm">
                    ${currentStreak > 0 
                        ? `You're on fire! Keep reading today to extend your streak to ${currentStreak + 1} days!` 
                        : 'Start reading today to begin a new streak!'}
                </p>
            </div>
        `;
    }

    /**
     * Render books finished by year
     */
    async renderBooksFinishedByYear() {
        const container = document.getElementById('books-by-year-section');
        const booksFinished = await statsApi.getBooksFinishedByYear();

        if (booksFinished.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-text-muted">
                    <p>No finished books yet</p>
                </div>
            `;
            return;
        }

        // Sort by year descending
        const sorted = booksFinished.sort((a, b) => b.year - a.year);

        container.innerHTML = sorted.map((item, index) => `
            <div class="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-lg hover:bg-bg-secondary transition-colors">
                <div class="flex items-center space-x-3">
                    <span class="text-2xl font-bold text-text-muted">${index + 1}</span>
                    <div>
                        <p class="font-semibold">${item.year}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-accent-purple">${item.books_finished}</p>
                    <p class="text-sm text-text-muted">book${item.books_finished !== 1 ? 's' : ''}</p>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render top books table
     */
    async renderTopBooks() {
        const container = document.getElementById('top-books-table');
        const year = this.selectedYear === 'all' ? null : this.selectedYear;
        const topBooks = await statsApi.getTopBooks(10, year);

        if (topBooks.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-text-muted">
                        No reading sessions yet
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = topBooks.map((book, index) => `
            <tr class="border-b border-glass-border hover:bg-bg-secondary transition-colors">
                <td class="py-3 px-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' : 
                        index === 1 ? 'bg-gray-400/20 text-gray-300' :
                        index === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-bg-secondary text-text-muted'
                    } font-bold">
                        ${index + 1}
                    </span>
                </td>
                <td class="py-3 px-4 font-semibold">${book.title}</td>
                <td class="py-3 px-4 text-text-secondary">${book.author || 'Unknown'}</td>
                <td class="py-3 px-4 text-right font-mono">${timeUtils.formatMinutes(book.total_minutes)}</td>
                <td class="py-3 px-4 text-right text-text-muted">${timeUtils.minutesToHours(book.total_minutes)}h</td>
            </tr>
        `).join('');
    }

    /**
     * Render consistency metrics
     */
    async renderConsistencyMetrics() {
        const year = this.selectedYear === 'all' ? null : this.selectedYear;
        
        // Consistency percentage
        const consistencyPercentage = await statsApi.getConsistencyPercentage(30, year);
        document.getElementById('consistency-percentage').textContent = `${consistencyPercentage}%`;

        // Average per day
        const averagePerDay = await statsApi.calculateAveragePerDay(null, year);
        document.getElementById('average-per-day').textContent = timeUtils.formatMinutes(averagePerDay);

        // Most read author (with year filter)
        const authorResult = await statsApi.getMostReadAuthor(year);
        const author = authorResult?.author || 'N/A';
        document.getElementById('favorite-author').textContent = author;
    }

    /**
     * Show loading state
     */
    showLoading() {
        document.getElementById('loading-state').classList.remove('hidden');
        document.getElementById('stats-content').classList.add('hidden');
        document.getElementById('error-state').classList.add('hidden');
    }

    /**
     * Show content
     */
    showContent() {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('stats-content').classList.remove('hidden');
        document.getElementById('error-state').classList.add('hidden');
    }

    /**
     * Show error state
     */
    showError() {
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('stats-content').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}

// Initialize page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new StatsPage();
});
