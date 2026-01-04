/**
 * Smart Agenda - Quick Actions Module
 *
 * Provides quick action buttons for clients, tasks, and appointments
 */

(function() {
    'use strict';

    const QuickActions = {
        /**
         * Check if client has valid location coordinates (supports both old and new formats)
         */
        hasClientLocation: function(client) {
            if (!client) return false;
            // Check old format
            if (client.lat && client.lng) return true;
            // Check new format
            if (client.addresses?.some(addr => addr.type === 'map' && addr.lat && addr.lng)) return true;
            return false;
        },

        /**
         * Get client coordinates (supports both old and new formats)
         */
        getClientCoordinates: function(client) {
            if (!client) return null;
            // Check old format
            if (client.lat && client.lng) {
                return { lat: parseFloat(client.lat), lng: parseFloat(client.lng) };
            }
            // Check new format
            const mapAddress = client.addresses?.find(addr => addr.type === 'map' && addr.lat && addr.lng);
            if (mapAddress) {
                return { lat: parseFloat(mapAddress.lat), lng: parseFloat(mapAddress.lng) };
            }
            return null;
        },

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
            if (this.hasClientLocation(client)) {
                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
                    label: 'Map',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.openMap(client);
                    }
                });
            }

            // Phone action (if client has phone)
            if (client.phone) {
                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
                    label: 'Call',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.callPhone(client.phone);
                    }
                });

                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
                    label: 'SMS',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendSMS(client.phone);
                    }
                });
            }

            // Email action (if client has email)
            if (client.email) {
                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
                    label: 'Email',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendEmail(client.email);
                    }
                });
            }

            // Task action
            if (!options.hideTaskAction) {
                actions.push({
                    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
                    label: 'Task',
                    showLabel: true,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.createTask(client);
                    }
                });
            }

            // Appointment action
            if (!options.hideAppointmentAction) {
                actions.push({
                    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
                    label: 'Appt',
                    showLabel: true,
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
            if (this.hasClientLocation(client)) {
                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
                    label: 'Map',
                    showLabel: false,
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
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
                    label: 'Call',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.callPhone(client.phone);
                    }
                });

                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
                    label: 'SMS',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendSMS(client.phone);
                    }
                });
            }

            // Email action (if client has email)
            if (client.email) {
                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
                    label: 'Email',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendEmail(client.email);
                    }
                });
            }

            // Appointment action
            actions.push({
                svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
                label: 'Appt',
                showLabel: true,
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
            if (this.hasClientLocation(client)) {
                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
                    label: 'Map',
                    showLabel: false,
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
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
                    label: 'Call',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.callPhone(client.phone);
                    }
                });

                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
                    label: 'SMS',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendSMS(client.phone);
                    }
                });
            }

            // Email action (if client has email)
            if (client.email) {
                actions.push({
                    svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
                    label: 'Email',
                    showLabel: false,
                    onClick: (e) => {
                        e.stopPropagation();
                        this.sendEmail(client.email);
                    }
                });
            }

            // Task action
            actions.push({
                svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
                label: 'Task',
                showLabel: true,
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

            // If showLabel is false (for icon-only buttons)
            if (action.showLabel === false) {
                button.innerHTML = `
                    <span style="display: flex; align-items: center;">${action.svg || action.icon}</span>
                `;
                button.style.cssText = `
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: var(--border-radius-sm);
                    padding: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-primary);
                    flex-shrink: 0;
                    width: 48px;
                    height: 48px;
                `;
            } else {
                // Button with label (for Task and Appt)
                button.innerHTML = `
                    <span style="margin-right: 4px; display: flex; align-items: center;">${action.svg || action.icon}</span>
                    <span style="font-size: 12px; font-weight: 500; white-space: nowrap;">${action.label}</span>
                `;
                button.style.cssText = `
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: var(--border-radius-sm);
                    padding: 12px 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-primary);
                    flex-shrink: 0;
                    height: 48px;
                `;
            }

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

                // Use the Maps module's showClientOnMap which has retry logic
                setTimeout(() => {
                    if (window.SmartAgenda?.Maps?.showClientOnMap && client.id) {
                        window.SmartAgenda.Maps.showClientOnMap(client.id);
                    } else {
                        // Fallback to old method
                        const coords = this.getClientCoordinates(client);
                        if (window.SmartAgenda?.Maps?.map && coords) {
                            const position = coords;
                            window.SmartAgenda.Maps.map.setCenter(position);
                            window.SmartAgenda.Maps.map.setZoom(16);

                            // Trigger click on the marker to show info window
                            const marker = window.SmartAgenda.Maps.clientMarkers.find(
                                m => String(m.clientData?.id) === String(client.id)
                            );
                            if (marker) {
                                google.maps.event.trigger(marker, 'click');
                            }
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
