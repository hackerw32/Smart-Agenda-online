/**
 * Smart Agenda - Quick Actions Module
 *
 * Provides quick action buttons for clients, tasks, and appointments
 */

(function() {
    'use strict';

    const QuickActions = {
        /**
         * Create quick action buttons for a client
         */
        createClientActions: function(client, options = {}) {
            const container = document.createElement('div');
            container.className = 'quick-actions';
            container.style.cssText = `
                display: flex;
                gap: 4px;
                margin-top: 8px;
                flex-wrap: wrap;
            `;

            const actions = [];

            // Map action (if client has location)
            if (client.lat && client.lng) {
                actions.push({
                    icon: '🗺️',
                    label: 'Map',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.openMap(client);
                    }
                });
            }

            // Phone action (if client has phone)
            if (client.phone) {
                actions.push({
                    icon: '📞',
                    label: 'Call',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.callPhone(client.phone);
                    }
                });

                actions.push({
                    icon: '💬',
                    label: 'SMS',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendSMS(client.phone);
                    }
                });
            }

            // Email action (if client has email)
            if (client.email) {
                actions.push({
                    icon: '✉️',
                    label: 'Email',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendEmail(client.email);
                    }
                });
            }

            // Task action
            if (!options.hideTaskAction) {
                actions.push({
                    icon: '✓',
                    label: 'Task',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.createTask(client);
                    }
                });
            }

            // Appointment action
            if (!options.hideAppointmentAction) {
                actions.push({
                    icon: '📅',
                    label: 'Appt',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.createAppointment(client);
                    }
                });
            }

            // Create buttons
            actions.forEach(action => {
                const button = this.createActionButton(action);
                container.appendChild(button);
            });

            return container;
        },

        /**
         * Create quick action buttons for a task
         */
        createTaskActions: function(task) {
            const container = document.createElement('div');
            container.className = 'quick-actions';
            container.style.cssText = `
                display: flex;
                flex-direction: row;
                gap: 4px;
                margin-top: 8px;
                flex-wrap: wrap;
            `;

            // Only show actions if task has a client
            if (!task.client || task.isStandalone) {
                return container; // Return empty container
            }

            const client = window.SmartAgenda?.DataManager?.get('clients', task.client);
            if (!client) return container;

            const actions = [];

            // Map action (if client has location)
            if (client.lat && client.lng) {
                actions.push({
                    icon: '🗺️',
                    label: 'Map',
                    onClick: (e) => {
                        e.stopPropagation();
                        // Pass context to reopen task modal when returning
                        this.openMap(client, { type: 'task', id: task.id, tab: 'tasks' });
                    }
                });
            }

            // Phone action (if client has phone)
            if (client.phone) {
                actions.push({
                    icon: '📞',
                    label: 'Call',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.callPhone(client.phone);
                    }
                });

                actions.push({
                    icon: '💬',
                    label: 'SMS',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendSMS(client.phone);
                    }
                });
            }

            // Email action (if client has email)
            if (client.email) {
                actions.push({
                    icon: '✉️',
                    label: 'Email',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendEmail(client.email);
                    }
                });
            }

            // Appointment action
            actions.push({
                icon: '📅',
                label: 'Appt',
                onClick: (e) => {
                    e.stopPropagation();
                    this.createAppointment(client);
                }
            });

            // Create buttons
            actions.forEach(action => {
                const button = this.createActionButton(action);
                container.appendChild(button);
            });

            return container;
        },

        /**
         * Create quick action buttons for an appointment
         */
        createAppointmentActions: function(appointment) {
            const container = document.createElement('div');
            container.className = 'quick-actions';
            container.style.cssText = `
                display: flex;
                flex-direction: row;
                gap: 4px;
                margin-top: 8px;
                flex-wrap: wrap;
            `;

            // Only show actions if appointment has a client
            if (!appointment.client || appointment.isStandalone) {
                return container; // Return empty container
            }

            const client = window.SmartAgenda?.DataManager?.get('clients', appointment.client);
            if (!client) return container;

            const actions = [];

            // Map action (if client has location)
            if (client.lat && client.lng) {
                actions.push({
                    icon: '🗺️',
                    label: 'Map',
                    onClick: (e) => {
                        e.stopPropagation();
                        // Pass context to reopen appointment modal when returning
                        this.openMap(client, { type: 'appointment', id: appointment.id, tab: 'appointments' });
                    }
                });
            }

            // Phone action (if client has phone)
            if (client.phone) {
                actions.push({
                    icon: '📞',
                    label: 'Call',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.callPhone(client.phone);
                    }
                });

                actions.push({
                    icon: '💬',
                    label: 'SMS',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendSMS(client.phone);
                    }
                });
            }

            // Email action (if client has email)
            if (client.email) {
                actions.push({
                    icon: '✉️',
                    label: 'Email',
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendEmail(client.email);
                    }
                });
            }

            // Task action
            actions.push({
                icon: '✓',
                label: 'Task',
                onClick: (e) => {
                    e.stopPropagation();
                    this.createTask(client);
                }
            });

            // Create buttons
            actions.forEach(action => {
                const button = this.createActionButton(action);
                container.appendChild(button);
            });

            return container;
        },

        /**
         * Create a single action button
         */
        createActionButton: function(action) {
            const button = document.createElement('button');
            button.className = 'quick-action-btn';
            button.type = 'button';
            button.innerHTML = `
                <span style="font-size: 16px; margin-right: 4px;">${action.icon}</span>
                <span style="font-size: 11px; font-weight: 500; white-space: nowrap;">${action.label}</span>
            `;
            button.style.cssText = `
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--border-radius-sm);
                padding: 6px 10px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                color: var(--text-primary);
                flex-shrink: 0;
                height: 32px;
            `;

            button.addEventListener('click', action.onClick);

            // Hover effects
            button.addEventListener('mouseenter', () => {
                button.style.background = 'var(--primary-color)';
                button.style.borderColor = 'var(--primary-color)';
                button.style.color = 'white';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.background = 'var(--surface)';
                button.style.borderColor = 'var(--border)';
                button.style.color = 'var(--text-primary)';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            });

            return button;
        },

        // =============================================================================
        // ACTION HANDLERS
        // =============================================================================

        openMap: function(client, context) {
            // Close any open modals and store what was open for reopening later
            const openModals = document.querySelectorAll('.modal-overlay.active');
            if (openModals.length > 0 && context) {
                // Store context to reopen modal when user returns
                window.SmartAgenda._lastModalContext = context;

                // Close all modals
                openModals.forEach(modal => {
                    window.SmartAgenda.UIComponents.closeModal(modal);
                });

                // Set up one-time listener for returning to the original tab
                const tabChangeHandler = (tabName) => {
                    if (tabName === context.tab && window.SmartAgenda._lastModalContext) {
                        setTimeout(() => {
                            // Reopen the modal based on context
                            if (context.type === 'appointment' && window.SmartAgenda.Appointments) {
                                const appointment = window.SmartAgenda.DataManager.getById('appointments', context.id);
                                if (appointment) {
                                    window.SmartAgenda.Appointments.showAppointmentModal(appointment);
                                }
                            } else if (context.type === 'task' && window.SmartAgenda.Tasks) {
                                const task = window.SmartAgenda.DataManager.getById('tasks', context.id);
                                if (task) {
                                    window.SmartAgenda.Tasks.showTaskModal(task);
                                }
                            }
                            // Clear the context
                            window.SmartAgenda._lastModalContext = null;
                        }, 300);

                        // Remove the listener after it fires once
                        window.SmartAgenda.EventBus.off('tab:change', tabChangeHandler);
                    }
                };

                window.SmartAgenda.EventBus.on('tab:change', tabChangeHandler);
            }

            // Switch to map tab and focus on client
            if (window.SmartAgenda?.Navigation) {
                window.SmartAgenda.Navigation.switchTab('map');

                // After a brief delay, center map on client
                setTimeout(() => {
                    if (window.SmartAgenda?.Maps?.map && client.lat && client.lng) {
                        const position = {
                            lat: parseFloat(client.lat),
                            lng: parseFloat(client.lng)
                        };
                        window.SmartAgenda.Maps.map.setCenter(position);
                        window.SmartAgenda.Maps.map.setZoom(16);

                        // Trigger click on the marker to show info window
                        const marker = window.SmartAgenda.Maps.clientMarkers.find(
                            m => m.clientData?.id === client.id
                        );
                        if (marker) {
                            google.maps.event.trigger(marker, 'click');
                        }
                    }
                }, 300);
            }
        },

        callPhone: function(phone) {
            window.location.href = `tel:${phone}`;
        },

        sendSMS: function(phone) {
            window.location.href = `sms:${phone}`;
        },

        sendEmail: function(email) {
            window.location.href = `mailto:${email}`;
        },

        createTask: function(client) {
            if (window.SmartAgenda?.Tasks) {
                window.SmartAgenda.Tasks.showTaskModal(null, client.id);
            }
        },

        createAppointment: function(client) {
            if (window.SmartAgenda?.Appointments) {
                window.SmartAgenda.Appointments.showAppointmentModal(null, client.id);
            }
        }
    };

    // Export to window
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.QuickActions = QuickActions;

    console.log('Quick Actions module loaded');

})();
