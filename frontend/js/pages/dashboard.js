// js/pages/dashboard.js

import statsApi from '../api/statsApi.js';
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

            // Fetch only necessary data
            await this.loadData();

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
            // Fetch only summary stats (includes streak info)
            this.stats = await statsApi.getSummary();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            throw error;
        }
    }

    /**
     * Render all dashboard components
     */
    render() {
        this.renderStreak();
        this.renderDailyChart();
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
                    <div class="text-5xl">🔥</div>
                    <div>
                        <h3 class="text-xl font-bold mb-1">
                            ${currentStreak} Day${currentStreak !== 1 ? 's' : ''} Streak!
                        </h3>
                        <p class="text-text-secondary text-sm">
                            ${currentStreak > 0 ? 'Keep it going!' : 'Start reading today to build your streak'}
                        </p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-text-muted text-xs mb-1">Personal Best</p>
                    <p class="text-2xl font-bold text-gradient">
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
            // Import sessionApi for getting recent sessions
            const { default: sessionApi } = await import('../api/sessionApi.js');
            
            // Fetch all sessions
            const allSessions = await sessionApi.getAll();
            
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
            allSessions.forEach(session => {
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
