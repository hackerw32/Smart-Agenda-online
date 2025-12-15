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

                // Setup notification action listener for deep linking
                this.setupNotificationActionListener();
            }

            // Reschedule all notifications on app start
            await this.rescheduleAllNotifications();

            console.log('Notifications service initialized');
        },

        /**
         * Setup listener for notification tap actions (deep linking)
         */
        setupNotificationActionListener: function() {
            if (!window.Capacitor || !window.Capacitor.Plugins.LocalNotifications) {
                return;
            }

            const { LocalNotifications } = window.Capacitor.Plugins;

            // Listen for notification tap
            LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
                console.log('Notification tapped:', notification);

                // Extract deep link data from notification
                const extra = notification.notification?.extra;

                if (!extra || !extra.itemId || !extra.itemType) {
                    console.log('No deep link data in notification');
                    return;
                }

                const { itemId, itemType } = extra;
                console.log(`Opening ${itemType} with ID: ${itemId}`);

                // Wait a bit for app to fully load
                setTimeout(() => {
                    this.openItemModal(itemId, itemType);
                }, 500);
            });

            console.log('Notification action listener setup complete');
        },

        /**
         * Open the appropriate modal based on item type
         */
        openItemModal: function(itemId, itemType) {
            try {
                if (itemType === 'appointment') {
                    // Get appointment data
                    const appointment = window.SmartAgenda.DataManager.getById('appointments', itemId);
                    if (!appointment) {
                        window.SmartAgenda.Toast.error('Το ραντεβού δεν βρέθηκε - μπορεί να έχει διαγραφεί');
                        return;
                    }

                    // Switch to calendar tab
                    if (window.SmartAgenda.TabManager) {
                        window.SmartAgenda.TabManager.switchTab('calendar');
                    }

                    // Open appointment modal (even if completed/cancelled)
                    setTimeout(() => {
                        if (window.SmartAgenda.Calendar && window.SmartAgenda.Calendar.showAppointmentModal) {
                            window.SmartAgenda.Calendar.showAppointmentModal(appointment);
                        }
                    }, 300);

                } else if (itemType === 'task') {
                    // Get task data
                    const task = window.SmartAgenda.DataManager.getById('tasks', itemId);
                    if (!task) {
                        window.SmartAgenda.Toast.error('Το task δεν βρέθηκε - μπορεί να έχει διαγραφεί');
                        return;
                    }

                    // Switch to tasks tab
                    if (window.SmartAgenda.TabManager) {
                        window.SmartAgenda.TabManager.switchTab('tasks');
                    }

                    // Open task modal (even if completed)
                    setTimeout(() => {
                        if (window.SmartAgenda.Tasks && window.SmartAgenda.Tasks.showTaskModal) {
                            window.SmartAgenda.Tasks.showTaskModal(task);
                        }
                    }, 300);

                } else if (itemType === 'interaction') {
                    // Get interaction data
                    const interaction = window.SmartAgenda.DataManager.getById('interactions', itemId);
                    if (!interaction) {
                        window.SmartAgenda.Toast.error('Το interaction δεν βρέθηκε - μπορεί να έχει διαγραφεί');
                        return;
                    }

                    // Get client data
                    const client = window.SmartAgenda.DataManager.getById('clients', interaction.clientId);
                    if (!client) {
                        window.SmartAgenda.Toast.error('Ο πελάτης δεν βρέθηκε - μπορεί να έχει διαγραφεί');
                        return;
                    }

                    // Switch to interactions tab
                    if (window.SmartAgenda.TabManager) {
                        window.SmartAgenda.TabManager.switchTab('interactions');
                    }

                    // Open interaction modal (even if completed)
                    setTimeout(() => {
                        if (window.SmartAgenda.InteractionsPage && window.SmartAgenda.InteractionsPage.showInteractionModal) {
                            window.SmartAgenda.InteractionsPage.showInteractionModal({
                                ...interaction,
                                client: client
                            });
                        }
                    }, 300);
                }

                console.log(`Successfully opened ${itemType} modal for ID: ${itemId}`);
            } catch (error) {
                console.error('Error opening item modal:', error);
                window.SmartAgenda.Toast.error('Σφάλμα κατά το άνοιγμα');
            }
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
         * Schedule notifications for an appointment, task, or follow-up
         * Supports multiple custom notifications per item
         */
        scheduleNotification: async function(item) {
            // Only for native platforms
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                return;
            }

            if (!window.Capacitor.Plugins.LocalNotifications) {
                return;
            }

            // Don't schedule for completed or cancelled items
            if (item.status === 'completed' || item.status === 'cancelled' || item.completed) {
                console.log('Item is completed or cancelled, skipping notifications:', item.id);
                return;
            }

            try {
                const { LocalNotifications } = window.Capacitor.Plugins;

                // Get item date
                const itemDate = new Date(item.date || item.dueDate);
                if (isNaN(itemDate.getTime())) {
                    console.log('Invalid date for item:', item.id);
                    return;
                }

                // Determine item type for deep linking
                let itemType = 'appointment'; // default
                if (item.type === 'followup' || item.type === 'checkin') {
                    itemType = 'interaction';
                } else if (item.title && !item.clientName) {
                    itemType = 'task';
                }

                // Check if item has custom notifications array
                if (item.notifications && Array.isArray(item.notifications) && item.notifications.length > 0) {
                    // Schedule each custom notification
                    const notificationsToSchedule = [];

                    for (let i = 0; i < item.notifications.length; i++) {
                        const notif = item.notifications[i];
                        const notificationDate = new Date(itemDate.getTime() - (notif.minutes * 60 * 1000));

                        // Don't schedule if the notification time has already passed
                        if (notificationDate <= new Date()) {
                            console.log(`Notification time has passed for ${item.id} notification ${i}:`, notificationDate);
                            continue;
                        }

                        // Determine notification type and content with enhanced info
                        let title, body;
                        if (item.type === 'followup') {
                            const clientName = this.getClientName(item.clientId) || 'Client';
                            const client = window.SmartAgenda.DataManager.getById('clients', item.clientId);
                            title = '📞 Follow-up Reminder';
                            body = `${clientName}${client && client.phone ? ' (' + client.phone + ')' : ''}${item.notes ? '\n💬 ' + item.notes.substring(0, 60) : ''}\n🕐 ${this.formatDateTime(itemDate)}`;
                        } else if (item.type === 'checkin') {
                            const clientName = this.getClientName(item.clientId) || 'Client';
                            const client = window.SmartAgenda.DataManager.getById('clients', item.clientId);
                            title = '📍 Check-in Reminder';
                            body = `${clientName}${client && client.phone ? ' (' + client.phone + ')' : ''}${item.notes ? '\n💬 ' + item.notes.substring(0, 60) : ''}\n🕐 ${this.formatDateTime(itemDate)}`;
                        } else if (item.clientName) {
                            title = '📅 Appointment Reminder';
                            body = `${item.clientName}${item.description ? '\n💬 ' + item.description.substring(0, 60) : ''}\n🕐 ${this.formatDateTime(itemDate)}`;
                        } else {
                            title = '✅ Task Reminder';
                            body = `${item.title || 'Reminder'}${item.description ? '\n💬 ' + item.description.substring(0, 60) : ''}\n🕐 ${this.formatDateTime(itemDate)}`;
                        }

                        const timeText = this.formatNotificationTime(notif.minutes);

                        notificationsToSchedule.push({
                            id: notif.notificationId ? this.hashCode(notif.notificationId) : this.hashCode(item.id + '_' + i),
                            title: title,
                            body: `⏰ ${timeText}\n${body}`,
                            schedule: {
                                at: notificationDate
                            },
                            sound: 'default',
                            smallIcon: 'ic_stat_icon_config_sample',
                            iconColor: '#1a73e8',
                            extra: {
                                itemId: item.id,
                                itemType: itemType
                            }
                        });
                    }

                    if (notificationsToSchedule.length > 0) {
                        await LocalNotifications.schedule({
                            notifications: notificationsToSchedule
                        });
                        console.log(`Scheduled ${notificationsToSchedule.length} custom notifications for ${item.id}`);
                    }
                } else {
                    // Fallback to global notification setting if no custom notifications
                    if (!this.areNotificationsEnabled()) {
                        return;
                    }

                    const notificationMinutes = this.getNotificationTime();
                    const notificationDate = new Date(itemDate.getTime() - (notificationMinutes * 60 * 1000));

                    // Don't schedule if the notification time has already passed
                    if (notificationDate <= new Date()) {
                        console.log('Notification time has passed, skipping:', item.id);
                        return;
                    }

                    // Determine notification type and content with enhanced info
                    let title, body;
                    if (item.type === 'followup') {
                        const clientName = this.getClientName(item.clientId) || 'Client';
                        const client = window.SmartAgenda.DataManager.getById('clients', item.clientId);
                        title = '📞 Follow-up Reminder';
                        body = `${clientName}${client && client.phone ? ' (' + client.phone + ')' : ''}${item.notes ? '\n💬 ' + item.notes.substring(0, 60) : ''}\n🕐 ${this.formatDateTime(itemDate)}`;
                    } else if (item.type === 'checkin') {
                        const clientName = this.getClientName(item.clientId) || 'Client';
                        const client = window.SmartAgenda.DataManager.getById('clients', item.clientId);
                        title = '📍 Check-in Reminder';
                        body = `${clientName}${client && client.phone ? ' (' + client.phone + ')' : ''}${item.notes ? '\n💬 ' + item.notes.substring(0, 60) : ''}\n🕐 ${this.formatDateTime(itemDate)}`;
                    } else if (item.clientName) {
                        title = '📅 Appointment Reminder';
                        body = `${item.clientName}${item.description ? '\n💬 ' + item.description.substring(0, 60) : ''}\n🕐 ${this.formatDateTime(itemDate)}`;
                    } else {
                        title = '✅ Task Reminder';
                        body = `${item.title || 'Reminder'}${item.description ? '\n💬 ' + item.description.substring(0, 60) : ''}\n🕐 ${this.formatDateTime(itemDate)}`;
                    }

                    // Use item ID as notification ID
                    const notificationId = this.hashCode(item.id);

                    // Schedule the notification with deep link data
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
                                iconColor: '#1a73e8',
                                extra: {
                                    itemId: item.id,
                                    itemType: itemType
                                }
                            }
                        ]
                    });

                    console.log(`Notification scheduled for ${item.id} at ${notificationDate}`);
                }
            } catch (error) {
                console.error('Error scheduling notification:', error);
            }
        },

        /**
         * Get client name by ID (for follow-ups)
         */
        getClientName: function(clientId) {
            if (!clientId || !window.SmartAgenda?.DataManager) return null;
            const client = window.SmartAgenda.DataManager.getById('clients', clientId);
            return client ? client.name : null;
        },

        /**
         * Format notification time for display (e.g., "10 minutes before", "2 hours before")
         */
        formatNotificationTime: function(minutes) {
            if (minutes === 0) return 'At time of event';
            if (minutes < 60) return `${minutes} min before`;
            if (minutes < 1440) {
                const hours = Math.floor(minutes / 60);
                return `${hours} hour${hours > 1 ? 's' : ''} before`;
            }
            const days = Math.floor(minutes / 1440);
            return `${days} day${days > 1 ? 's' : ''} before`;
        },

        /**
         * Cancel all notifications for an item (appointment or task)
         * Handles both single default notification and multiple custom notifications
         */
        cancelNotification: async function(item) {
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                return;
            }

            if (!window.Capacitor.Plugins.LocalNotifications) {
                return;
            }

            try {
                const { LocalNotifications } = window.Capacitor.Plugins;
                const notificationsToCancel = [];

                // If item is a string, it's an ID
                if (typeof item === 'string') {
                    const itemId = item;
                    // Try to get the actual item to check for custom notifications
                    let actualItem = window.SmartAgenda.DataManager.getById('appointments', itemId);
                    if (!actualItem) {
                        actualItem = window.SmartAgenda.DataManager.getById('tasks', itemId);
                    }

                    if (actualItem && actualItem.notifications && Array.isArray(actualItem.notifications)) {
                        // Cancel all custom notifications
                        actualItem.notifications.forEach((notif, i) => {
                            notificationsToCancel.push({
                                id: notif.notificationId ? this.hashCode(notif.notificationId) : this.hashCode(itemId + '_' + i)
                            });
                        });
                    } else {
                        // Cancel default notification
                        notificationsToCancel.push({
                            id: this.hashCode(itemId)
                        });
                    }
                } else {
                    // Item is an object
                    if (item.notifications && Array.isArray(item.notifications)) {
                        // Cancel all custom notifications
                        item.notifications.forEach((notif, i) => {
                            notificationsToCancel.push({
                                id: notif.notificationId ? this.hashCode(notif.notificationId) : this.hashCode(item.id + '_' + i)
                            });
                        });
                    } else {
                        // Cancel default notification
                        notificationsToCancel.push({
                            id: this.hashCode(item.id)
                        });
                    }
                }

                if (notificationsToCancel.length > 0) {
                    await LocalNotifications.cancel({
                        notifications: notificationsToCancel
                    });
                    console.log(`Cancelled ${notificationsToCancel.length} notification(s) for item`);
                }
            } catch (error) {
                console.error('Error cancelling notifications:', error);
            }
        },

        /**
         * Reschedule all notifications for all appointments, tasks, and follow-ups
         */
        rescheduleAllNotifications: async function() {
            // Cancel all existing notifications first
            await this.cancelAllNotifications();

            if (!this.areNotificationsEnabled()) {
                return;
            }

            // Get all appointments, tasks, and interactions
            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const tasks = window.SmartAgenda.DataManager.getAll('tasks');
            const interactions = window.SmartAgenda.DataManager.getAll('interactions') || [];

            // Schedule notifications for each appointment
            for (const appointment of appointments) {
                await this.scheduleNotification(appointment);
            }

            // Schedule notifications for each task
            for (const task of tasks) {
                await this.scheduleNotification(task);
            }

            // Schedule notifications for all interactions (check-ins and follow-ups)
            for (const interaction of interactions) {
                await this.scheduleNotification(interaction);
            }

            console.log('All notifications rescheduled for appointments, tasks, and interactions');
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
         * Format date and time for notification body
         */
        formatDateTime: function(date) {
            const dateObj = new Date(date);
            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear();
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
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
        },

        // ============================================
        // UI Components for Notification Selection
        // ============================================

        /**
         * Show notification selector dialog
         * Returns a Promise that resolves with the selected notifications array
         */
        showNotificationSelector: function(currentNotifications = []) {
            return new Promise((resolve) => {
                // Predefined notification options (in minutes)
                const predefinedOptions = [
                    { label: 'Την ώρα του συμβάντος', minutes: 0 },
                    { label: '10 λεπτά', minutes: 10 },
                    { label: '20 λεπτά', minutes: 20 },
                    { label: '30 λεπτά', minutes: 30 },
                    { label: '1 ώρα', minutes: 60 },
                    { label: '2 ώρες', minutes: 120 },
                    { label: '4 ώρες', minutes: 240 },
                    { label: '8 ώρες', minutes: 480 },
                    { label: '1 ημέρα', minutes: 1440 },
                    { label: '2 ημέρες', minutes: 2880 }
                ];

                // Track selected notifications
                const selectedNotifications = [...currentNotifications];

                // Create checkboxes HTML
                const checkboxesHtml = predefinedOptions.map((option, index) => {
                    const isChecked = selectedNotifications.some(n => n.minutes === option.minutes);
                    return `
                        <div style="padding: 12px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background 0.2s;"
                             class="notification-option"
                             data-minutes="${option.minutes}"
                             onmouseover="this.style.background='var(--surface-hover)'"
                             onmouseout="this.style.background='transparent'">
                            <input type="checkbox"
                                   id="notif-option-${index}"
                                   data-minutes="${option.minutes}"
                                   ${isChecked ? 'checked' : ''}
                                   style="cursor: pointer; width: 20px; height: 20px;">
                            <label for="notif-option-${index}" style="cursor: pointer; flex: 1; font-size: 15px; color: var(--text-primary);">
                                ${option.label}
                            </label>
                        </div>
                    `;
                }).join('');

                // Custom notifications HTML
                let customNotificationsHtml = '';
                selectedNotifications.filter(n => !predefinedOptions.some(opt => opt.minutes === n.minutes)).forEach((custom, index) => {
                    const timeText = this.formatNotificationTime(custom.minutes);
                    customNotificationsHtml += `
                        <div style="padding: 12px; background: var(--primary-color)11; border: 1px solid var(--primary-color); border-radius: 6px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px;"
                             class="custom-notification-item"
                             data-minutes="${custom.minutes}">
                            <span style="flex: 1; color: var(--text-primary);">${timeText}</span>
                            <button class="remove-custom-notif" data-minutes="${custom.minutes}"
                                    style="padding: 4px 12px; background: var(--danger-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                                Διαγραφή
                            </button>
                        </div>
                    `;
                });

                const content = `
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px;">
                            ${checkboxesHtml}
                            <div style="padding: 12px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background 0.2s;"
                                 id="custom-notification-option"
                                 onmouseover="this.style.background='var(--surface-hover)'"
                                 onmouseout="this.style.background='transparent'">
                                <span style="width: 20px; height: 20px;"></span>
                                <span style="cursor: pointer; flex: 1; font-size: 15px; color: var(--primary-color); font-weight: 500;">
                                    Διαμόρφωση...
                                </span>
                            </div>
                        </div>

                        <div id="custom-notifications-container" ${customNotificationsHtml ? '' : 'style="display: none;"'}>
                            <div style="font-weight: 500; margin-bottom: 8px; color: var(--text-primary);">Προσαρμοσμένες Ειδοποιήσεις:</div>
                            <div id="custom-notifications-list">
                                ${customNotificationsHtml}
                            </div>
                        </div>
                    </div>
                `;

                const modal = window.SmartAgenda.UIComponents.showModal({
                    title: 'Επιλογή Ειδοποιήσεων',
                    content: content,
                    hideCloseButton: true,
                    buttons: [
                        {
                            label: 'ΑΚΥΡΟ',
                            type: 'secondary',
                            action: 'cancel',
                            onClick: () => {
                                window.SmartAgenda.UIComponents.closeModal(modal);
                                resolve(null);
                            }
                        },
                        {
                            label: 'ΑΠΟΘΗΚΕΥΣΗ',
                            type: 'primary',
                            action: 'save',
                            onClick: () => {
                                // Collect all selected notifications
                                const finalNotifications = [];

                                // Add predefined selections
                                modal.querySelectorAll('.notification-option input[type="checkbox"]:checked').forEach(checkbox => {
                                    const minutes = parseInt(checkbox.dataset.minutes);
                                    finalNotifications.push({
                                        minutes: minutes,
                                        notificationId: Date.now().toString() + Math.random().toString(36).substring(2, 9)
                                    });
                                });

                                console.log('Predefined notifications selected:', finalNotifications.length);

                                // Add custom notifications
                                const customItems = modal.querySelectorAll('.custom-notification-item');
                                console.log('Found custom notification items:', customItems.length);

                                customItems.forEach(item => {
                                    const minutes = parseInt(item.dataset.minutes);
                                    console.log('Custom item minutes:', minutes);
                                    if (!finalNotifications.some(n => n.minutes === minutes)) {
                                        finalNotifications.push({
                                            minutes: minutes,
                                            notificationId: Date.now().toString() + Math.random().toString(36).substring(2, 9)
                                        });
                                    }
                                });

                                // Sort by time (soonest first)
                                finalNotifications.sort((a, b) => a.minutes - b.minutes);

                                console.log('Final notifications to save:', finalNotifications);

                                window.SmartAgenda.UIComponents.closeModal(modal);
                                // Don't show toast here - let the caller show it
                                resolve(finalNotifications);
                            }
                        }
                    ]
                });

                // Bind checkbox events
                setTimeout(() => {
                    // Handle custom notification option
                    const customOption = modal.querySelector('#custom-notification-option');
                    if (customOption) {
                        let isCustomDialogOpen = false; // Prevent multiple dialogs

                        customOption.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            if (isCustomDialogOpen) return; // Prevent multiple opens
                            isCustomDialogOpen = true;

                            // Hide parent modal temporarily
                            modal.style.display = 'none';

                            this.showCustomNotificationDialog((minutes) => {
                                isCustomDialogOpen = false;
                                // Restore parent modal
                                modal.style.display = '';

                                // Check if already exists
                                const exists = Array.from(modal.querySelectorAll('.custom-notification-item')).some(item =>
                                    parseInt(item.dataset.minutes) === minutes
                                );

                                if (exists) {
                                    window.SmartAgenda.Toast.warning('Αυτή η ειδοποίηση υπάρχει ήδη');
                                    return;
                                }

                                // Add custom notification to the list
                                const customList = modal.querySelector('#custom-notifications-list');
                                const customContainer = modal.querySelector('#custom-notifications-container');
                                const timeText = this.formatNotificationTime(minutes);

                                const customItemHtml = `
                                    <div style="padding: 12px; background: var(--primary-color)11; border: 1px solid var(--primary-color); border-radius: 6px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px;"
                                         class="custom-notification-item"
                                         data-minutes="${minutes}">
                                        <span style="flex: 1; color: var(--text-primary);">${timeText}</span>
                                        <button class="remove-custom-notif" data-minutes="${minutes}"
                                                style="padding: 4px 12px; background: var(--danger-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                                            Διαγραφή
                                        </button>
                                    </div>
                                `;

                                // Add to list
                                if (customList) {
                                    customList.insertAdjacentHTML('beforeend', customItemHtml);

                                    // Show container if it was hidden
                                    if (customContainer) {
                                        customContainer.style.display = '';
                                    }

                                    // Rebind remove buttons
                                    this.bindRemoveCustomNotifButtons(modal);

                                    window.SmartAgenda.Toast.success('Η προσαρμοσμένη ειδοποίηση προστέθηκε');

                                    console.log('Custom notification added:', minutes, 'minutes -', timeText);
                                    console.log('Custom list now has', customList.children.length, 'items');
                                } else {
                                    console.error('Custom notifications list not found!');
                                    window.SmartAgenda.Toast.error('Σφάλμα κατά την προσθήκη της ειδοποίησης');
                                }
                            }, () => {
                                isCustomDialogOpen = false;
                                // On cancel, just restore parent modal
                                modal.style.display = '';
                            });
                        });
                    }

                    // Bind remove buttons for existing custom notifications
                    this.bindRemoveCustomNotifButtons(modal);
                }, 100);
            });
        },

        /**
         * Show custom notification time input dialog
         */
        showCustomNotificationDialog: function(onAdd, onCancel) {
            const content = `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Χρόνος πριν το συμβάν:</label>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <input type="number"
                                   id="custom-notif-value"
                                   min="1"
                                   value="15"
                                   style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-primary); font-size: 15px;">
                            <select id="custom-notif-unit"
                                    style="padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-primary); font-size: 15px;">
                                <option value="minutes">Λεπτά</option>
                                <option value="hours">Ώρες</option>
                                <option value="days">Ημέρες</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;

            const customModal = window.SmartAgenda.UIComponents.showModal({
                title: 'Προσαρμοσμένη Ειδοποίηση',
                content: content,
                hideCloseButton: true,
                buttons: [
                    {
                        label: 'Άκυρο',
                        type: 'secondary',
                        action: 'cancel',
                        onClick: () => {
                            window.SmartAgenda.UIComponents.closeModal(customModal);
                            if (onCancel) onCancel();
                        }
                    },
                    {
                        label: 'Προσθήκη',
                        type: 'primary',
                        action: 'add',
                        onClick: () => {
                            const value = parseInt(customModal.querySelector('#custom-notif-value').value);
                            const unit = customModal.querySelector('#custom-notif-unit').value;

                            if (!value || value < 1) {
                                window.SmartAgenda.Toast.error('Παρακαλώ εισάγετε έγκυρο αριθμό');
                                return;
                            }

                            let minutes = value;
                            if (unit === 'hours') {
                                minutes = value * 60;
                            } else if (unit === 'days') {
                                minutes = value * 1440;
                            }

                            window.SmartAgenda.UIComponents.closeModal(customModal);
                            onAdd(minutes);
                        }
                    }
                ]
            });
        },

        /**
         * Bind remove button events for custom notifications
         */
        bindRemoveCustomNotifButtons: function(modal) {
            modal.querySelectorAll('.remove-custom-notif').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const item = btn.closest('.custom-notification-item');
                    if (item) {
                        item.remove();

                        // Check if list is empty and hide container
                        const customList = modal.querySelector('#custom-notifications-list');
                        const customContainer = modal.querySelector('#custom-notifications-container');
                        if (customList && customList.children.length === 0 && customContainer) {
                            customContainer.style.display = 'none';
                        }
                    }
                });
            });
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
