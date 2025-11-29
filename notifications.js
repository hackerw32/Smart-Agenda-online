/**
 * Smart Agenda - Notifications Service
 * Handles appointment reminder notifications
 */
(function() {
    'use strict';

    const Notifications = {
        permissionGranted: false,

        /**
         * Initialize notifications service
         */
        init: async function() {
            console.log('Notifications service initializing...');

            // Load and apply settings
            this.loadSettings();
            this.bindSettingsEvents();

            // Request permissions on native platforms
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                await this.requestPermissions();
            }

            // Reschedule all notifications on app start
            await this.rescheduleAllNotifications();

            console.log('Notifications service initialized');
        },

        /**
         * Load notification settings from localStorage
         */
        loadSettings: function() {
            const enabledSelect = document.getElementById('notifications-enabled');
            const timeSelect = document.getElementById('notification-time');

            if (enabledSelect) {
                const enabled = localStorage.getItem('notifications-enabled') !== null
                    ? localStorage.getItem('notifications-enabled')
                    : 'true'; // Default: enabled
                enabledSelect.value = enabled;
            }

            if (timeSelect) {
                const time = localStorage.getItem('notification-time') || '30'; // Default: 30 minutes
                timeSelect.value = time;
            }
        },

        /**
         * Bind events to notification settings
         */
        bindSettingsEvents: function() {
            const enabledSelect = document.getElementById('notifications-enabled');
            const timeSelect = document.getElementById('notification-time');

            if (enabledSelect) {
                enabledSelect.addEventListener('change', (e) => {
                    localStorage.setItem('notifications-enabled', e.target.value);
                    this.rescheduleAllNotifications();

                    if (e.target.value === 'true') {
                        window.SmartAgenda.Toast.success('Notifications enabled');
                    } else {
                        window.SmartAgenda.Toast.success('Notifications disabled');
                        this.cancelAllNotifications();
                    }
                });
            }

            if (timeSelect) {
                timeSelect.addEventListener('change', (e) => {
                    localStorage.setItem('notification-time', e.target.value);
                    this.rescheduleAllNotifications();

                    const minutes = parseInt(e.target.value);
                    const hours = minutes >= 60 ? `${minutes / 60} hour${minutes > 60 ? 's' : ''}` : `${minutes} minutes`;
                    window.SmartAgenda.Toast.success(`Notifications will arrive ${hours} before appointments`);
                });
            }
        },

        /**
         * Check if notifications are enabled
         */
        areNotificationsEnabled: function() {
            const enabled = localStorage.getItem('notifications-enabled');
            return enabled === null || enabled === 'true'; // Default: true
        },

        /**
         * Get notification time in minutes
         */
        getNotificationTime: function() {
            return parseInt(localStorage.getItem('notification-time') || '30');
        },

        /**
         * Request notification permissions (for native apps)
         */
        requestPermissions: async function() {
            if (!window.Capacitor || !window.Capacitor.Plugins.LocalNotifications) {
                console.log('LocalNotifications plugin not available');
                return false;
            }

            try {
                const { LocalNotifications } = window.Capacitor.Plugins;
                const result = await LocalNotifications.requestPermissions();

                this.permissionGranted = result.display === 'granted';

                if (this.permissionGranted) {
                    console.log('Notification permissions granted');
                } else {
                    console.log('Notification permissions denied');
                    window.SmartAgenda.Toast.warning('Please enable notifications in your device settings for appointment reminders');
                }

                return this.permissionGranted;
            } catch (error) {
                console.error('Error requesting notification permissions:', error);
                return false;
            }
        },

        /**
         * Schedule a notification for an appointment
         */
        scheduleNotification: async function(appointment) {
            // Check if notifications are enabled
            if (!this.areNotificationsEnabled()) {
                return;
            }

            // Only for native platforms
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                return;
            }

            if (!window.Capacitor.Plugins.LocalNotifications) {
                return;
            }

            try {
                const { LocalNotifications } = window.Capacitor.Plugins;

                // Calculate notification time
                const appointmentDate = new Date(appointment.date);
                const notificationMinutes = this.getNotificationTime();
                const notificationDate = new Date(appointmentDate.getTime() - (notificationMinutes * 60 * 1000));

                // Don't schedule if the notification time has already passed
                if (notificationDate <= new Date()) {
                    console.log('Notification time has passed, skipping:', appointment.id);
                    return;
                }

                // Don't schedule for completed or cancelled appointments
                if (appointment.status === 'completed' || appointment.status === 'cancelled') {
                    console.log('Appointment is completed or cancelled, skipping notification:', appointment.id);
                    return;
                }

                // Format the notification
                const title = 'Appointment Reminder';
                const body = `${appointment.clientName || 'Appointment'} - ${this.formatTime(appointmentDate)}`;

                // Use appointment ID as notification ID (convert string to number hash)
                const notificationId = this.hashCode(appointment.id);

                // Schedule the notification
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            id: notificationId,
                            title: title,
                            body: body,
                            schedule: {
                                at: notificationDate
                            },
                            sound: 'default',
                            smallIcon: 'ic_stat_icon_config_sample',
                            iconColor: '#1a73e8'
                        }
                    ]
                });

                console.log(`Notification scheduled for appointment ${appointment.id} at ${notificationDate}`);
            } catch (error) {
                console.error('Error scheduling notification:', error);
            }
        },

        /**
         * Cancel a notification for an appointment
         */
        cancelNotification: async function(appointmentId) {
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                return;
            }

            if (!window.Capacitor.Plugins.LocalNotifications) {
                return;
            }

            try {
                const { LocalNotifications } = window.Capacitor.Plugins;
                const notificationId = this.hashCode(appointmentId);

                await LocalNotifications.cancel({
                    notifications: [{ id: notificationId }]
                });

                console.log(`Notification cancelled for appointment ${appointmentId}`);
            } catch (error) {
                console.error('Error cancelling notification:', error);
            }
        },

        /**
         * Reschedule all notifications for all appointments
         */
        rescheduleAllNotifications: async function() {
            if (!this.areNotificationsEnabled()) {
                await this.cancelAllNotifications();
                return;
            }

            // Get all appointments
            const appointments = window.SmartAgenda.DataManager.getAll('appointments');

            // Cancel all existing notifications first
            await this.cancelAllNotifications();

            // Schedule notifications for each appointment
            for (const appointment of appointments) {
                await this.scheduleNotification(appointment);
            }

            console.log('All notifications rescheduled');
        },

        /**
         * Cancel all notifications
         */
        cancelAllNotifications: async function() {
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                return;
            }

            if (!window.Capacitor.Plugins.LocalNotifications) {
                return;
            }

            try {
                const { LocalNotifications } = window.Capacitor.Plugins;

                // Get all pending notifications
                const pending = await LocalNotifications.getPending();

                if (pending.notifications && pending.notifications.length > 0) {
                    // Cancel all pending notifications
                    await LocalNotifications.cancel({
                        notifications: pending.notifications
                    });
                    console.log(`Cancelled ${pending.notifications.length} notifications`);
                }
            } catch (error) {
                console.error('Error cancelling all notifications:', error);
            }
        },

        /**
         * Format time for notification body
         */
        formatTime: function(date) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        },

        /**
         * Convert string ID to number hash for notification ID
         */
        hashCode: function(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash);
        }
    };

    // Initialize when app is ready
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            Notifications.init();
        });
        window.SmartAgenda.Notifications = Notifications;
    }

})();
