// js/utils/notifications.js

import CONFIG from '../config/config.js';

/**
 * Notification/Toast System
 * Display success, error, warning, and info messages
 */
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.init();
    }

    /**
     * Initialize the notification container
     */
    init() {
        // Create container if it doesn't exist
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-3';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    /**
     * Show a notification
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, warning, info)
     * @param {number} duration - Duration in ms (0 for persistent)
     * @returns {string} Notification ID
     */
    show(message, type = 'info', duration = null) {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const autoDismiss = duration !== null ? duration : CONFIG.UI.NOTIFICATION_DURATION;

        // Create notification element
        const notification = this.createNotificationElement(id, message, type);
        
        // Add to container
        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto dismiss if duration is set
        if (autoDismiss > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, autoDismiss);
        }

        return id;
    }

    /**
     * Create notification DOM element
     * @param {string} id - Notification ID
     * @param {string} message - Message text
     * @param {string} type - Notification type
     * @returns {HTMLElement} Notification element
     */
    createNotificationElement(id, message, type) {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification notification-${type} transform translate-x-full transition-all duration-300 ease-in-out`;
        
        // Get type-specific styles and icon
        const { bgClass, borderClass, icon } = this.getTypeStyles(type);
        
        notification.innerHTML = `
            <div class="glass-card p-4 min-w-[320px] max-w-md flex items-start gap-3 ${bgClass} ${borderClass}">
                <div class="flex-shrink-0 text-2xl">
                    ${icon}
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-white">${message}</p>
                </div>
                <button 
                    onclick="notifications.dismiss('${id}')" 
                    class="flex-shrink-0 text-white/70 hover:text-white transition-colors"
                    aria-label="Close notification"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        return notification;
    }

    /**
     * Get type-specific styles and icon
     * @param {string} type - Notification type
     * @returns {Object} Object with bgClass, borderClass, and icon
     */
    getTypeStyles(type) {
        const styles = {
            success: {
                bgClass: 'bg-green-500/20',
                borderClass: 'border-green-500/50',
                icon: '✓'
            },
            error: {
                bgClass: 'bg-red-500/20',
                borderClass: 'border-red-500/50',
                icon: '✕'
            },
            warning: {
                bgClass: 'bg-amber-500/20',
                borderClass: 'border-amber-500/50',
                icon: '⚠'
            },
            info: {
                bgClass: 'bg-blue-500/20',
                borderClass: 'border-blue-500/50',
                icon: 'ℹ'
            }
        };

        return styles[type] || styles.info;
    }

    /**
     * Dismiss a notification
     * @param {string} id - Notification ID
     */
    dismiss(id) {
        const notification = document.getElementById(id);
        
        if (notification) {
            // Animate out
            notification.classList.remove('show');
            notification.classList.add('translate-x-full');
            
            // Remove from DOM after animation
            setTimeout(() => {
                notification.remove();
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    /**
     * Dismiss all notifications
     */
    dismissAll() {
        this.notifications.forEach(({ id }) => {
            this.dismiss(id);
        });
    }

    /**
     * Show success notification
     * @param {string} message - Message to display
     * @param {number} duration - Duration in ms
     * @returns {string} Notification ID
     */
    success(message, duration = null) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show error notification
     * @param {string} message - Message to display
     * @param {number} duration - Duration in ms (0 for persistent)
     * @returns {string} Notification ID
     */
    error(message, duration = 0) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show warning notification
     * @param {string} message - Message to display
     * @param {number} duration - Duration in ms
     * @returns {string} Notification ID
     */
    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Show info notification
     * @param {string} message - Message to display
     * @param {number} duration - Duration in ms
     * @returns {string} Notification ID
     */
    info(message, duration = null) {
        return this.show(message, 'info', duration);
    }

    /**
     * Show API error notification with fallback message
     * @param {Error} error - Error object
     * @param {string} fallbackMessage - Fallback message if error has no message
     */
    apiError(error, fallbackMessage = null) {
        const message = error.message || fallbackMessage || CONFIG.CONSTANTS.MESSAGES.ERROR.GENERIC;
        return this.error(message, 0); // Persistent for errors
    }
}

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
    #notification-container {
        pointer-events: none;
    }

    #notification-container > * {
        pointer-events: auto;
    }

    .notification.show {
        transform: translateX(0) !important;
    }

    .notification {
        transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);

// Create and export singleton instance
const notifications = new NotificationSystem();

// Make globally available for onclick handlers
window.notifications = notifications;

export default notifications;
