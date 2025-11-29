/**
 * Smart Agenda - Appointments Module
 * 
 * Complete appointment management with:
 * - Standalone appointments (no client)
 * - Client-based appointments
 * - Separate date and time fields
 * - Searchable client dropdown
 * - Priority and status filtering
 */

(function() {
    'use strict';

    const Appointments = {
        appointmentsList: null,
        searchInput: null,
        addButton: null,
        filterButton: null,
        currentFilter: 'all',
        currentPriority: 'all',
        searchQuery: '',
        virtualScroll: null,
        itemsToShow: 100, // Initial number of items to show
        itemsPerPage: 100, // Number of items to load when "Load More" is clicked
        lastRenderState: null, // Track last filter/search state to reset pagination

        init: function() {
            this.appointmentsList = document.getElementById('appointments-list');
            this.searchInput = document.getElementById('appointments-search');
            this.searchClearBtn = document.getElementById('appointments-search-clear');
            this.searchIndicator = document.getElementById('appointments-search-indicator');
            this.addButton = document.getElementById('appointments-add-btn');
            this.filterButton = document.getElementById('appointments-filter-btn');
            this.bindEvents();
            this.render();
        },

        bindEvents: function() {
            // Add button - creates standalone appointment by default
            this.addButton?.addEventListener('click', () => this.showAppointmentModal());

            // Real-time search with VALUE POLLING for Android Greek keyboard compatibility
            // Android Greek keyboards don't fire events while typing - characters stay in composition buffer
            // Solution: Poll input.value every 200ms to detect changes
            let searchTimeout = null;
            let lastValue = '';
            let pollInterval = null;
            let isProcessing = false; // Prevent overlapping searches

            // Helper function to trigger search
            const triggerSearch = (eventType) => {
                // Skip if already processing
                if (isProcessing) return;

                const currentValue = this.searchInput.value;

                // Skip if value hasn't changed
                if (currentValue === lastValue) return;

                console.log(`[Appointments Search] ${eventType} triggered - Value:`, currentValue, 'Length:', currentValue.length);

                lastValue = currentValue;
                this.searchQuery = currentValue;
                this.updateSearchUI();

                // Set processing flag before render
                isProcessing = true;
                requestAnimationFrame(() => {
                    this.render();
                    isProcessing = false;
                });
            };

            // Start polling when input is focused
            this.searchInput?.addEventListener('focus', () => {
                console.log('[Appointments Search] Focus - starting polling');
                lastValue = this.searchInput.value;

                // Clear any existing interval
                if (pollInterval) {
                    clearInterval(pollInterval);
                }

                // Poll every 200ms to catch uncommitted composition buffer text
                pollInterval = setInterval(() => {
                    // Skip polling if input is not focused
                    if (document.activeElement !== this.searchInput) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                        return;
                    }

                    const currentValue = this.searchInput.value;
                    if (currentValue !== lastValue) {
                        console.log('[Appointments Search] Polling detected change:', currentValue);
                        // Only schedule new search if one isn't already pending
                        if (!searchTimeout) {
                            searchTimeout = setTimeout(() => {
                                triggerSearch('polling');
                                searchTimeout = null;
                            }, 300);
                        }
                    }
                }, 200);
            });

            // Stop polling when input loses focus
            this.searchInput?.addEventListener('blur', () => {
                console.log('[Appointments Search] Blur - stopping polling');
                if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                }
                // Clear any pending search
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                    searchTimeout = null;
                }
                // Trigger final search on blur only if value changed
                if (this.searchInput.value !== lastValue) {
                    triggerSearch('blur');
                }
            });

            // Keep standard events as fallback for browsers where they work
            this.searchInput?.addEventListener('input', (e) => {
                console.log('[Appointments Search] Input event fired');
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    triggerSearch('input');
                    searchTimeout = null;
                }, 300);
            });

            // Search clear button
            this.searchClearBtn?.addEventListener('click', () => {
                this.clearSearch();
            });

            this.filterButton?.addEventListener('click', () => this.showFilterMenu());

            if (window.SmartAgenda) {
                window.SmartAgenda.EventBus.on('data:appointments:change', () => this.render());
                window.SmartAgenda.EventBus.on('language:change', () => this.render());
            }
        },

        render: function() {
            if (!this.appointmentsList) return;

            // Update filter button text
            this.updateFilterButtonText();

            // Check if filter/search state has changed - if so, reset pagination
            const currentState = `${this.currentFilter}-${this.currentPriority}-${this.searchQuery}`;
            if (this.lastRenderState !== currentState) {
                this.itemsToShow = this.itemsPerPage;
                this.lastRenderState = currentState;
            }

            let appointments = window.SmartAgenda.DataManager.getAll('appointments');

            if (this.searchQuery) {
                appointments = window.SmartAgenda.DataManager.search('appointments', this.searchQuery);
            }

            // Apply filter - 'all' now means "all active" (excludes completed)
            appointments = appointments.filter(apt => {
                const status = apt.status || 'pending';
                const isCompleted = apt.completed || status === 'completed';
                const isCancelled = status === 'cancelled';

                if (this.currentFilter === 'all') return !isCompleted && !isCancelled;
                if (this.currentFilter === 'pending') return status === 'pending' && !this.isOverdue(apt);
                if (this.currentFilter === 'cancelled') return isCancelled;
                if (this.currentFilter === 'completed') return isCompleted;
                if (this.currentFilter === 'overdue') return !isCompleted && !isCancelled && this.isOverdue(apt);
                return true;
            });

            if (this.currentPriority !== 'all') {
                appointments = appointments.filter(a => a.priority === this.currentPriority);
            }

            // Sort by date and priority
            appointments = appointments.sort((a, b) => {
                // Completed and cancelled go to bottom
                const aInactive = (a.status === 'completed' || a.status === 'cancelled');
                const bInactive = (b.status === 'completed' || b.status === 'cancelled');
                if (aInactive !== bInactive) return aInactive ? 1 : -1;

                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const aPriority = priorityOrder[a.priority] ?? 999;
                const bPriority = priorityOrder[b.priority] ?? 999;
                if (aPriority !== bPriority) return aPriority - bPriority;
                if (a.date && b.date) return new Date(a.date) - new Date(b.date);
                return a.date ? -1 : 1;
            });

            // Render with Load More pagination
            this.appointmentsList.innerHTML = '';

            if (appointments.length === 0) {
                this.renderEmptyState();
                return;
            }

            // Show only the first itemsToShow appointments
            const appointmentsToDisplay = appointments.slice(0, this.itemsToShow);
            const hasMore = appointments.length > this.itemsToShow;

            // Render appointments
            appointmentsToDisplay.forEach(apt => {
                const card = this.createAppointmentCard(apt);
                this.appointmentsList.appendChild(card);
            });

            // Add "Load More" button if there are more items
            if (hasMore) {
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.className = 'load-more-btn';
                loadMoreBtn.textContent = `Load More (${appointments.length - this.itemsToShow} remaining)`;
                loadMoreBtn.style.cssText = `
                    width: 100%;
                    padding: 16px;
                    margin-top: 16px;
                    background: var(--surface);
                    border: 2px dashed var(--border);
                    border-radius: var(--border-radius-sm);
                    color: var(--primary-color);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                loadMoreBtn.addEventListener('click', () => {
                    this.itemsToShow += this.itemsPerPage;
                    this.render();
                });
                loadMoreBtn.addEventListener('mouseenter', function() {
                    this.style.background = 'var(--primary-color)';
                    this.style.color = 'white';
                    this.style.borderStyle = 'solid';
                });
                loadMoreBtn.addEventListener('mouseleave', function() {
                    this.style.background = 'var(--surface)';
                    this.style.color = 'var(--primary-color)';
                    this.style.borderStyle = 'dashed';
                });
                this.appointmentsList.appendChild(loadMoreBtn);
            }
        },

        createAppointmentCard: function(apt) {
            const card = document.createElement('div');
            card.className = 'appointment-item';
            card.dataset.id = apt.id;

            // Set default status if not present
            const status = apt.status || 'pending';

            if (status === 'completed') card.classList.add('completed');
            if (status === 'cancelled') card.classList.add('cancelled');
            if (this.isOverdue(apt) && status !== 'completed' && status !== 'cancelled') card.classList.add('overdue');

            const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
            const priorityColor = priorityColors[apt.priority] || '#3b82f6';

            const statusColors = {
                pending: '#94a3b8',
                cancelled: '#ef4444',
                completed: '#64748b'
            };
            const statusColor = statusColors[status] || '#94a3b8';

            const clientName = apt.clientName || this.getClientName(apt.client) || 'Standalone Appointment';
            const dateTimeDisplay = apt.date ? this.formatDateTime(apt.date) : '';

            // Get translated status and priority
            const i18n = window.SmartAgenda.I18n;
            const translatedStatus = i18n.translate(`status.${status}`);
            const translatedPriority = i18n.translate(`priority.${apt.priority || 'medium'}`);

            card.innerHTML = `
                <div class="appointment-content">
                    <div class="appointment-header">
                        <div class="appointment-title">${this.escapeHtml(clientName)}</div>
                        ${dateTimeDisplay ? `<div class="appointment-datetime">${dateTimeDisplay}</div>` : ''}
                    </div>
                    ${apt.desc ? `<div class="appointment-description">${this.escapeHtml(this.stripHtml(apt.desc).substring(0, 100))}${this.stripHtml(apt.desc).length > 100 ? '...' : ''}</div>` : ''}
                    <div class="appointment-footer">
                        <span class="appointment-status" style="background: ${statusColor}22; color: ${statusColor}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                            ${translatedStatus}
                        </span>
                        <span class="appointment-priority" style="color: ${priorityColor}; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                            ${translatedPriority}
                        </span>
                        ${apt.amount ? `
                            <span class="appointment-amount" style="display: inline-flex; align-items: center; gap: 4px;">
                                ${window.SmartAgenda.State.get('currentCurrency')}${parseFloat(apt.amount).toFixed(2)}
                                ${apt.paid === 'paid' ? '<span style="color: #10b981;">✓</span>' : apt.paid === 'partial' ? '<span style="color: #f59e0b;">⊗</span>' : '<span style="color: #ef4444;">✗</span>'}
                            </span>
                        ` : ''}
                        ${apt.isStandalone ? `<span class="appointment-standalone-badge">📌 Standalone</span>` : ''}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => this.showAppointmentModal(apt));

            return card;
        },

        renderEmptyState: function() {
            const emptyState = window.SmartAgenda.UIComponents.createEmptyState({
                icon: '📅',
                title: window.SmartAgenda.I18n.translate('empty.appointments.title'),
                message: window.SmartAgenda.I18n.translate('empty.appointments.message'),
                actionText: window.SmartAgenda.I18n.translate('actions.add'),
                onAction: () => this.showAppointmentModal()
            });
            this.appointmentsList.appendChild(emptyState);
        },

        showAppointmentModal: function(appointment = null, preSelectedClient = null, preSelectedDate = null) {
            const isEdit = !!appointment;
            const i18n = window.SmartAgenda.I18n;

            // Determine if standalone appointment
            const isStandalone = !preSelectedClient && !appointment?.client;

            // Get clients for dropdown
            const clients = window.SmartAgenda.DataManager.getAll('clients');
            const clientOptions = [
                { value: '', label: '-- Select Client (or leave empty) --' },
                ...clients.map(c => ({ value: c.id, label: c.name }))
            ];

            // Extract date and time from ISO string
            let dateValue = '';
            let timeValue = '';
            if (appointment?.date) {
                const d = new Date(appointment.date);
                dateValue = d.toISOString().split('T')[0];
                timeValue = d.toTimeString().substring(0, 5);
            } else if (preSelectedDate) {
                // Pre-fill date from calendar selection
                const d = new Date(preSelectedDate);
                dateValue = d.toISOString().split('T')[0];
            }

            // Define form fields
            let fields;
            
            if (isStandalone && !isEdit) {
                // Standalone appointment - simplified (new appointment)
                fields = [
                    {
                        name: 'clientName',
                        label: i18n.translate('appointment.client'),
                        type: 'text',
                        required: true,
                        placeholder: 'e.g., Meeting with supplier, Doctor appointment...'
                    },
                    {
                        name: 'date',
                        label: i18n.translate('appointment.date'),
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'time',
                        label: i18n.translate('appointment.time'),
                        type: 'time',
                        placeholder: '14:00'
                    },
                    {
                        name: 'priority',
                        label: i18n.translate('appointment.priority'),
                        type: 'select',
                        options: [
                            { value: 'low', label: i18n.translate('priority.low') },
                            { value: 'medium', label: i18n.translate('priority.medium') },
                            { value: 'high', label: i18n.translate('priority.high') }
                        ]
                    },
                    {
                        name: 'amount',
                        label: i18n.translate('appointment.amount') + ' (optional)',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01'
                    },
                    {
                        name: 'desc',
                        label: i18n.translate('appointment.description') + ' (optional)',
                        type: 'textarea',
                        rows: 3,
                        placeholder: 'Add details...'
                    }
                ];
            } else if (isEdit) {
                // Editing appointment - full fields including status
                const isClientBased = appointment.client && !appointment.isStandalone;
                fields = [
                    {
                        name: isClientBased ? 'clientName' : 'clientName',
                        label: i18n.translate('appointment.client'),
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'date',
                        label: i18n.translate('appointment.date'),
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'time',
                        label: i18n.translate('appointment.time'),
                        type: 'time',
                        placeholder: '14:00'
                    },
                    {
                        name: 'status',
                        label: i18n.translate('appointment.status'),
                        type: 'select',
                        options: [
                            { value: 'pending', label: i18n.translate('status.pending') },
                            { value: 'cancelled', label: i18n.translate('status.cancelled') },
                            { value: 'completed', label: i18n.translate('status.completed') }
                        ]
                    },
                    {
                        name: 'priority',
                        label: i18n.translate('appointment.priority'),
                        type: 'select',
                        options: [
                            { value: 'low', label: i18n.translate('priority.low') },
                            { value: 'medium', label: i18n.translate('priority.medium') },
                            { value: 'high', label: i18n.translate('priority.high') }
                        ]
                    },
                    {
                        name: 'amount',
                        label: i18n.translate('appointment.amount'),
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01'
                    },
                    {
                        name: 'paid',
                        label: i18n.translate('payment.status'),
                        type: 'select',
                        options: [
                            { value: 'unpaid', label: i18n.translate('payment.unpaid') },
                            { value: 'paid', label: i18n.translate('payment.paid') },
                            { value: 'partial', label: i18n.translate('payment.partial') }
                        ]
                    },
                    {
                        name: 'desc',
                        label: i18n.translate('appointment.description'),
                        type: 'textarea',
                        rows: 4,
                        placeholder: 'Appointment details...'
                    }
                ];
            } else {
                // New client-based appointment - no status/payment fields
                fields = [
                    {
                        name: 'client',
                        label: i18n.translate('appointment.client') + ' (optional)',
                        type: 'select',
                        options: clientOptions
                    },
                    {
                        name: 'date',
                        label: i18n.translate('appointment.date'),
                        type: 'date',
                        required: true
                    },
                    {
                        name: 'time',
                        label: i18n.translate('appointment.time'),
                        type: 'time',
                        placeholder: '14:00'
                    },
                    {
                        name: 'priority',
                        label: i18n.translate('appointment.priority'),
                        type: 'select',
                        options: [
                            { value: 'low', label: i18n.translate('priority.low') },
                            { value: 'medium', label: i18n.translate('priority.medium') },
                            { value: 'high', label: i18n.translate('priority.high') }
                        ]
                    },
                    {
                        name: 'amount',
                        label: i18n.translate('appointment.amount') + ' (optional)',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01'
                    },
                    {
                        name: 'desc',
                        label: i18n.translate('appointment.description'),
                        type: 'textarea',
                        rows: 4,
                        placeholder: 'Appointment details...'
                    }
                ];
            }

            // Initial values
            const initialValues = appointment ? {
                ...appointment,
                client: appointment.client || '',
                date: dateValue,
                time: timeValue,
                status: appointment.status || 'pending',
                paid: appointment.paid || 'unpaid'
            } : {
                client: preSelectedClient || '',
                priority: 'medium',
                status: 'pending',
                paid: 'unpaid',
                completed: false,
                isStandalone: isStandalone,
                date: new Date().toISOString().split('T')[0] // Today's date
            };

            // Create form
            const form = window.SmartAgenda.UIComponents.createForm(fields, initialValues);

            // Modal buttons
            const buttons = [];

            if (isEdit) {
                // Complete button first when editing - sets both status and payment status
                buttons.push({
                    label: appointment.status === 'completed' ? 'Mark as Incomplete' : i18n.translate('actions.complete'),
                    type: appointment.status === 'completed' ? 'secondary' : 'success',
                    action: 'complete',
                    onClick: (modal) => {
                        const isCompleted = appointment.status === 'completed';
                        window.SmartAgenda.DataManager.update('appointments', appointment.id, {
                            completed: !isCompleted,
                            status: isCompleted ? 'pending' : 'completed',
                            paid: isCompleted ? 'unpaid' : 'paid'
                        });

                        // Update notification based on new status
                        if (window.SmartAgenda.Notifications) {
                            if (!isCompleted) {
                                // Appointment completed - cancel notification
                                window.SmartAgenda.Notifications.cancelNotification(appointment.id);
                            } else {
                                // Appointment marked as incomplete - reschedule notification
                                const updatedAppointment = window.SmartAgenda.DataManager.getById('appointments', appointment.id);
                                window.SmartAgenda.Notifications.scheduleNotification(updatedAppointment);
                            }
                        }

                        window.SmartAgenda.Toast.success(isCompleted ? 'Marked as incomplete' : 'Marked as complete and paid');
                        window.SmartAgenda.UIComponents.closeModal(modal);
                    }
                });

                // Delete button for editing
                buttons.push({
                    label: i18n.translate('actions.delete'),
                    type: 'danger',
                    action: 'delete',
                    onClick: (modal) => this.deleteAppointment(modal, appointment.id)
                });
            } else {
                // Cancel button only when creating new
                buttons.push({
                    label: i18n.translate('actions.cancel'),
                    type: 'secondary',
                    action: 'cancel',
                    onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                });
            }

            // Save button always last
            buttons.push({
                label: i18n.translate('actions.save'),
                type: 'primary',
                action: 'save',
                onClick: (modal) => this.saveAppointment(modal, form, appointment, descEditor, isStandalone)
            });

            // Determine modal title
            let modalTitle;
            if (isEdit) {
                // Get client name for the title when editing
                if (appointment.client && !appointment.isStandalone) {
                    const client = window.SmartAgenda.DataManager.getById('clients', appointment.client);
                    const clientName = client ? client.name : appointment.clientName || 'Unknown Client';
                    modalTitle = `Edit Appointment for ${clientName}`;
                } else {
                    modalTitle = `Edit Appointment - ${appointment.clientName || 'Unnamed'}`;
                }
            } else {
                modalTitle = isStandalone ? 'Add Standalone Appointment' : 'Add Appointment';
            }

            // Show modal
            const modal = window.SmartAgenda.UIComponents.showModal({
                title: modalTitle,
                content: form.element.outerHTML,
                buttons: buttons,
                size: 'medium'
            });

            // Re-attach form reference
            form.element = modal.querySelector('.modal-form');

            // If editing a client-based appointment, make the clientName field readonly
            if (isEdit && appointment.client && !appointment.isStandalone) {
                const clientNameField = form.element.querySelector('[name="clientName"]');
                if (clientNameField) {
                    clientNameField.setAttribute('readonly', 'readonly');
                    clientNameField.style.backgroundColor = 'var(--surface-hover)';
                    clientNameField.style.cursor = 'not-allowed';
                    clientNameField.title = 'Client name cannot be changed. This appointment is linked to a client.';
                }
            }

            // Enhance description field with Quill editor
            const descTextarea = form.element.querySelector('[name="desc"]');
            const descEditor = window.SmartAgenda.UIComponents.enhanceTextareaWithEditor(
                descTextarea,
                appointment?.desc || ''
            );

            // Add search functionality to client select if it exists
            const clientSelect = form.element.querySelector('[name="client"]');
            if (clientSelect) {
                this.enhanceSelectWithSearch(clientSelect);

                // Pre-select client if provided
                if (preSelectedClient) {
                    clientSelect.value = preSelectedClient;
                }
            }

            // Add partial payment handling
            if (isEdit) {
                this.setupPartialPaymentHandling(modal, appointment);
            }

            // Add action buttons if editing and has client
            if (isEdit && appointment.client && !appointment.isStandalone && window.SmartAgenda?.QuickActions) {
                const client = window.SmartAgenda.DataManager.getById('clients', appointment.client);
                if (client) {
                    const quickActions = window.SmartAgenda.QuickActions.createAppointmentActions(appointment);
                    // Append additional styles without overwriting existing flex styles
                    quickActions.style.marginBottom = '16px';
                    quickActions.style.paddingBottom = '16px';
                    quickActions.style.borderBottom = '1px solid var(--border)';

                    // Insert actions at the top of the form
                    const formElement = modal.querySelector('.modal-form');
                    if (formElement && formElement.firstChild) {
                        formElement.insertBefore(quickActions, formElement.firstChild);
                    }
                }
            }
        },

        saveAppointment: function(modal, form, existingAppointment, descEditor, isStandalone) {
            const values = form.getValues();

            // Validate required fields
            if (!values.date) {
                window.SmartAgenda.Toast.error('Please select a date');
                return;
            }

            // Get description from Quill editor
            if (descEditor) {
                values.desc = descEditor.getValue();
            }

            // Parse amount - convert to number or remove if empty
            if (values.amount !== undefined && values.amount !== '') {
                const parsedAmount = parseFloat(values.amount);
                if (!isNaN(parsedAmount) && parsedAmount >= 0) {
                    values.amount = parsedAmount;
                } else {
                    delete values.amount; // Remove invalid amounts
                }
            } else {
                delete values.amount; // Remove empty amounts
            }

            // Get amountPaid from hidden field if it exists (for partial payments)
            const amountPaidInput = modal.querySelector('[name="amountPaid"]');
            if (amountPaidInput && amountPaidInput.value) {
                const amountPaid = parseFloat(amountPaidInput.value);
                if (!isNaN(amountPaid) && amountPaid >= 0) {
                    values.amountPaid = amountPaid;
                }
            }

            // Combine date and time into ISO string
            let dateTimeString = values.date;
            if (values.time) {
                dateTimeString += 'T' + values.time + ':00';
            } else {
                dateTimeString += 'T12:00:00'; // Default to noon if no time
            }
            values.date = new Date(dateTimeString).toISOString();

            // Remove time field (it's now in date)
            delete values.time;

            // Handle standalone vs client-based appointments
            if (isStandalone && !values.client) {
                // Standalone appointment
                values.isStandalone = true;
                // clientName is already in the form
            } else {
                // Client-based appointment
                if (values.client) {
                    const client = window.SmartAgenda.DataManager.getById('clients', values.client);
                    values.clientName = client ? client.name : '';
                }
                values.isStandalone = false;
            }

            if (existingAppointment) {
                const updated = window.SmartAgenda.DataManager.update('appointments', existingAppointment.id, values);
                if (updated) {
                    // Schedule notification for updated appointment
                    if (window.SmartAgenda.Notifications) {
                        const updatedAppointment = window.SmartAgenda.DataManager.getById('appointments', existingAppointment.id);
                        window.SmartAgenda.Notifications.cancelNotification(existingAppointment.id);
                        window.SmartAgenda.Notifications.scheduleNotification(updatedAppointment);
                    }

                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.saved'));
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            } else {
                const added = window.SmartAgenda.DataManager.add('appointments', values);
                if (added) {
                    // Schedule notification for new appointment
                    if (window.SmartAgenda.Notifications) {
                        window.SmartAgenda.Notifications.scheduleNotification(added);
                    }

                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.saved'));
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            }
        },

        setupPartialPaymentHandling: function(modal, appointment) {
            const paidSelect = modal.querySelector('[name="paid"]');
            const amountInput = modal.querySelector('[name="amount"]');

            if (!paidSelect || !amountInput) return;

            // Create container for partial payment info
            const paidFormGroup = paidSelect.closest('.form-group');
            if (!paidFormGroup) return;

            // Create remaining amount display and amountPaid input
            const partialPaymentContainer = document.createElement('div');
            partialPaymentContainer.id = 'partial-payment-container';
            partialPaymentContainer.style.cssText = 'margin-top: 12px; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: var(--border-radius-sm); display: none;';
            partialPaymentContainer.innerHTML = `
                <div style="margin-bottom: 12px;">
                    <label for="amountPaid" style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px; color: var(--text-primary);">Amount Paid <span class="text-danger">*</span></label>
                    <input type="number" name="amountPaid" id="amountPaid" class="form-control" placeholder="0.00" step="0.01" min="0" value="${appointment?.amountPaid || ''}">
                </div>
                <div id="remaining-amount-display" style="padding: 8px 12px; background: var(--warning)22; border: 1px solid var(--warning); border-radius: var(--border-radius-sm); color: var(--text-primary); font-size: 14px;">
                    <strong>Remaining:</strong> <span id="remaining-amount-value">$0.00</span>
                </div>
            `;

            paidFormGroup.appendChild(partialPaymentContainer);

            // Function to update remaining amount display
            const updateRemainingAmount = () => {
                const totalAmount = parseFloat(amountInput.value) || 0;
                const amountPaidValue = parseFloat(partialPaymentContainer.querySelector('#amountPaid').value) || 0;
                const remaining = totalAmount - amountPaidValue;

                const currency = window.SmartAgenda.State.get('currentCurrency') || '$';
                partialPaymentContainer.querySelector('#remaining-amount-value').textContent =
                    `${currency}${remaining.toFixed(2)}`;

                // Update color based on remaining amount
                const remainingDisplay = partialPaymentContainer.querySelector('#remaining-amount-display');
                if (remaining <= 0) {
                    remainingDisplay.style.background = 'var(--success)22';
                    remainingDisplay.style.borderColor = 'var(--success)';
                } else if (remaining < totalAmount) {
                    remainingDisplay.style.background = 'var(--warning)22';
                    remainingDisplay.style.borderColor = 'var(--warning)';
                } else {
                    remainingDisplay.style.background = 'var(--danger)22';
                    remainingDisplay.style.borderColor = 'var(--danger)';
                }
            };

            // Function to toggle partial payment container
            const togglePartialPayment = () => {
                const paymentStatus = paidSelect.value;
                if (paymentStatus === 'partial') {
                    partialPaymentContainer.style.display = 'block';
                    updateRemainingAmount();

                    // Validate and request amount paid if not set
                    const amountPaidInput = partialPaymentContainer.querySelector('#amountPaid');
                    if (!amountPaidInput.value) {
                        // Focus on the amount paid input
                        setTimeout(() => amountPaidInput.focus(), 100);
                    }
                } else {
                    partialPaymentContainer.style.display = 'none';
                }
            };

            // Add event listeners
            paidSelect.addEventListener('change', togglePartialPayment);
            amountInput.addEventListener('input', () => {
                if (paidSelect.value === 'partial') {
                    updateRemainingAmount();
                }
            });
            partialPaymentContainer.querySelector('#amountPaid').addEventListener('input', updateRemainingAmount);

            // Initialize display
            togglePartialPayment();
        },

        deleteAppointment: async function(modal, appointmentId) {
            const confirmed = await window.SmartAgenda.UIComponents.confirm({
                title: 'Delete Appointment',
                message: window.SmartAgenda.I18n.translate('msg.confirm_delete'),
                confirmText: window.SmartAgenda.I18n.translate('actions.delete'),
                cancelText: window.SmartAgenda.I18n.translate('actions.cancel'),
                type: 'danger'
            });
            
            if (confirmed) {
                const deleted = window.SmartAgenda.DataManager.delete('appointments', appointmentId);
                if (deleted) {
                    // Cancel notification for deleted appointment
                    if (window.SmartAgenda.Notifications) {
                        window.SmartAgenda.Notifications.cancelNotification(appointmentId);
                    }

                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.deleted'));
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            }
        },

        toggleComplete: function(appointmentId, completed) {
            window.SmartAgenda.DataManager.update('appointments', appointmentId, { completed });
        },

        updateFilterButtonText: function() {
            if (!this.filterButton) return;

            const i18n = window.SmartAgenda.I18n;
            let filterKey;

            // Determine filter text based on current filter and priority
            if (this.currentFilter === 'all' && this.currentPriority === 'all') {
                filterKey = 'filter.all';
            } else if (this.currentFilter === 'all') {
                // All + specific priority (e.g., "All High")
                filterKey = `filter.all_${this.currentPriority}`;
            } else if (this.currentPriority === 'all') {
                // Specific filter + all priorities (e.g., "All Pending")
                filterKey = `filter.all_${this.currentFilter}`;
            } else {
                // Specific priority + specific filter (e.g., "High Pending")
                filterKey = `filter.${this.currentPriority}_${this.currentFilter}`;
            }

            this.filterButton.textContent = i18n.translate(filterKey);
        },

        showFilterMenu: function() {
            const i18n = window.SmartAgenda.I18n;

            const content = `
                <div class="filter-menu">
                    <h4>${i18n.translate('appointment.status')}</h4>
                    <div class="filter-option ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                        <span>${i18n.translate('status.all_active')}</span>
                    </div>
                    <div class="filter-option ${this.currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">
                        <span>${i18n.translate('status.pending')}</span>
                    </div>
                    <div class="filter-option ${this.currentFilter === 'cancelled' ? 'active' : ''}" data-filter="cancelled">
                        <span>${i18n.translate('status.cancelled')}</span>
                    </div>
                    <div class="filter-option ${this.currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">
                        <span>${i18n.translate('status.completed')}</span>
                    </div>
                    <div class="filter-option ${this.currentFilter === 'overdue' ? 'active' : ''}" data-filter="overdue">
                        <span>${i18n.translate('status.overdue')}</span>
                    </div>

                    <h4 style="margin-top: 20px;">${i18n.translate('appointment.priority')}</h4>
                    <div class="filter-option ${this.currentPriority === 'all' ? 'active' : ''}" data-priority="all">
                        <span>${i18n.translate('status.all_priorities')}</span>
                    </div>
                    <div class="filter-option ${this.currentPriority === 'high' ? 'active' : ''}" data-priority="high">
                        <span>${i18n.translate('priority.high')}</span>
                    </div>
                    <div class="filter-option ${this.currentPriority === 'medium' ? 'active' : ''}" data-priority="medium">
                        <span>${i18n.translate('priority.medium')}</span>
                    </div>
                    <div class="filter-option ${this.currentPriority === 'low' ? 'active' : ''}" data-priority="low">
                        <span>${i18n.translate('priority.low')}</span>
                    </div>
                </div>
            `;
            
            const modal = window.SmartAgenda.UIComponents.showModal({
                title: i18n.translate('actions.filter'),
                content: content,
                buttons: [
                    {
                        label: i18n.translate('actions.cancel'),
                        type: 'secondary',
                        action: 'close',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'small'
            });

            // Bind status filter options
            modal.querySelectorAll('[data-filter]').forEach(option => {
                option.addEventListener('click', () => {
                    this.currentFilter = option.dataset.filter;
                    this.render();
                    window.SmartAgenda.UIComponents.closeModal(modal);
                });
            });

            // Bind priority filter options
            modal.querySelectorAll('[data-priority]').forEach(option => {
                option.addEventListener('click', () => {
                    this.currentPriority = option.dataset.priority;
                    this.render();
                    window.SmartAgenda.UIComponents.closeModal(modal);
                });
            });
        },

        enhanceSelectWithSearch: function(selectElement) {
            const wrapper = document.createElement('div');
            wrapper.className = 'searchable-select-wrapper';
            
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'form-control searchable-select-search';
            searchInput.placeholder = 'Search clients...';
            
            selectElement.parentNode.insertBefore(wrapper, selectElement);
            wrapper.appendChild(searchInput);
            wrapper.appendChild(selectElement);
            
            const allOptions = Array.from(selectElement.options);
            
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                selectElement.innerHTML = '';
                
                allOptions.forEach(option => {
                    if (option.text.toLowerCase().includes(searchTerm) || option.value === '') {
                        selectElement.appendChild(option.cloneNode(true));
                    }
                });
                
                const currentValue = selectElement.dataset.currentValue;
                if (currentValue) {
                    selectElement.value = currentValue;
                }
            });
            
            selectElement.addEventListener('change', (e) => {
                selectElement.dataset.currentValue = e.target.value;
            });
        },

        getClientName: function(clientId) {
            if (!clientId) return null;
            const client = window.SmartAgenda.DataManager.getById('clients', clientId);
            return client ? client.name : null;
        },

        isOverdue: function(appointment) {
            if (!appointment.date || appointment.completed) return false;
            return new Date(appointment.date) < new Date();
        },

        formatDateTime: function(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            let dateLabel = '';
            if (dateOnly.getTime() === today.getTime()) {
                dateLabel = 'Today';
            } else if (dateOnly.getTime() === tomorrow.getTime()) {
                dateLabel = 'Tomorrow';
            } else {
                dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }
            
            const timeLabel = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            return `${dateLabel} ${timeLabel}`;
        },

        stripHtml: function(html) {
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent || div.innerText || '';
        },

        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        clearSearch: function() {
            if (this.searchInput) {
                this.searchInput.value = '';
                this.searchQuery = '';
                this.updateSearchUI();
                this.render();
            }
        },

        updateSearchUI: function() {
            // Show/hide clear button and search indicator based on search query
            const hasQuery = this.searchQuery && this.searchQuery.trim() !== '';

            if (this.searchClearBtn) {
                this.searchClearBtn.style.display = hasQuery ? 'block' : 'none';
            }

            if (this.searchIndicator) {
                this.searchIndicator.style.display = hasQuery ? 'block' : 'none';
            }
        }
    };

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        .appointment-item { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: var(--border-radius-sm); padding: 16px; display: flex; gap: 12px; cursor: pointer; transition: all var(--transition-fast); }
        .appointment-item:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
        .appointment-item.completed { opacity: 0.6; }
        .appointment-item.completed .appointment-title { text-decoration: line-through; }
        .appointment-item.cancelled { opacity: 0.7; background: #fee; }
        .appointment-item.cancelled .appointment-title { text-decoration: line-through; color: #999; }
        .appointment-item.overdue { border-left: 3px solid var(--danger); }
        .appointment-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .appointment-content { flex: 1; min-width: 0; }
        .appointment-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .appointment-title { font-weight: 600; font-size: 15px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .appointment-datetime { font-size: 13px; color: var(--text-tertiary); white-space: nowrap; }
        .appointment-description { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4; }
        .appointment-footer { display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 600; flex-wrap: wrap; }
        .appointment-priority { text-transform: uppercase; letter-spacing: 0.5px; }
        .appointment-amount { color: var(--text-tertiary); }
        .appointment-standalone-badge { padding: 2px 6px; background: var(--info)22; color: var(--info); border-radius: 4px; font-size: 11px; }
    `;
    document.head.appendChild(styles);

    // Initialize when app is ready
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => Appointments.init());
        window.SmartAgenda.Appointments = Appointments;
    }

})();
