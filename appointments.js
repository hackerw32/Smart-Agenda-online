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

            // Search with proper IME composition support for Greek keyboard
            let searchTimeout = null;
            let isComposing = false;

            // Track composition state
            this.searchInput?.addEventListener('compositionstart', () => {
                isComposing = true;
            });

            this.searchInput?.addEventListener('compositionend', (e) => {
                isComposing = false;
                // Trigger search after composition ends
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = this.searchInput.value;
                    this.updateSearchUI();
                    this.render();
                }, 100);
            });

            this.searchInput?.addEventListener('input', (e) => {
                // Skip if composing (wait for compositionend)
                if (isComposing) return;

                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = this.searchInput.value;
                    this.updateSearchUI();
                    this.render();
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
                if (a.date && b.date) {
                    const aDate = this.parseLocalDate(a.date);
                    const bDate = this.parseLocalDate(b.date);
                    return aDate - bDate;
                }
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
            card.className = 'appointment-item modern-appointment-card';
            card.dataset.id = apt.id;

            // Set default status if not present
            const status = apt.status || 'pending';

            if (status === 'completed') card.classList.add('completed');
            if (status === 'cancelled') card.classList.add('cancelled');
            if (this.isOverdue(apt) && status !== 'completed' && status !== 'cancelled') card.classList.add('overdue');

            const priorityConfig = {
                high: { icon: '🔴', color: '#ef4444', label: 'High' },
                medium: { icon: '🟠', color: '#f59e0b', label: 'Medium' },
                low: { icon: '🟢', color: '#10b981', label: 'Low' }
            };
            const priority = priorityConfig[apt.priority] || priorityConfig.medium;

            const statusConfig = {
                pending: { color: '#3b82f6', bgColor: '#3b82f622', icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>` },
                cancelled: { color: '#ef4444', bgColor: '#ef444422', icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>` },
                completed: { color: '#10b981', bgColor: '#10b98122', icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>` }
            };
            const statusInfo = statusConfig[status] || statusConfig.pending;

            const clientName = apt.clientName || this.getClientName(apt.client) || 'Standalone';
            const dateTimeDisplay = apt.date ? this.formatDateTime(apt.date) : '';

            // Get translated status and priority
            const i18n = window.SmartAgenda.I18n;
            const translatedStatus = i18n.translate(`status.${status}`);
            const translatedPriority = i18n.translate(`priority.${apt.priority || 'medium'}`);

            // Payment status icon
            let paymentIcon = '';
            if (apt.amount) {
                if (apt.paid === 'paid') {
                    paymentIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                } else if (apt.paid === 'partial') {
                    paymentIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
                } else {
                    paymentIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
                }
            }

            card.innerHTML = `
                <div style="display: flex; gap: 12px; width: 100%;">
                    <!-- Priority Indicator -->
                    <div style="width: 4px; background: ${priority.color}; border-radius: 4px; flex-shrink: 0;"></div>

                    <div style="flex: 1; min-width: 0;">
                        <!-- Header -->
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                                <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${this.escapeHtml(clientName)}
                                </div>
                                ${apt.isStandalone ? `<span style="background: var(--primary-light); color: var(--primary-color); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; flex-shrink: 0;">Standalone</span>` : ''}
                            </div>
                            <div style="font-size: 16px; flex-shrink: 0;">${priority.icon}</div>
                        </div>

                        <!-- Date & Time -->
                        ${dateTimeDisplay ? `
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px; color: var(--text-secondary);">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span>${dateTimeDisplay}</span>
                            </div>
                        ` : ''}

                        <!-- Description -->
                        ${apt.desc ? `
                            <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4;">
                                ${this.escapeHtml(this.stripHtml(apt.desc))}
                            </div>
                        ` : ''}

                        <!-- Footer -->
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <!-- Status Badge -->
                            <div style="display: inline-flex; align-items: center; gap: 4px; background: ${statusInfo.bgColor}; color: ${statusInfo.color}; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                                ${statusInfo.icon}
                                <span>${translatedStatus}</span>
                            </div>

                            <!-- Amount -->
                            ${apt.amount ? `
                                <div style="display: inline-flex; align-items: center; gap: 4px; background: var(--surface); border: 1px solid var(--border); padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; color: var(--text-primary);">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                    <span>${window.SmartAgenda.State.get('currentCurrency')}${parseFloat(apt.amount).toFixed(2)}</span>
                                    ${paymentIcon}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Chevron -->
                    <div style="flex-shrink: 0; display: flex; align-items: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
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

            // Extract date, start time, and end time from ISO string
            let dateValue = '';
            let timeValue = '';
            let endTimeValue = '';

            // Check if there's a temp time range from calendar selection
            const tempTimeRange = window.SmartAgenda?._tempTimeRange;

            if (appointment?.date) {
                const d = this.parseLocalDate(appointment.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dateValue = `${year}-${month}-${day}`;

                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                timeValue = `${hours}:${minutes}`;

                // If appointment has endDate, extract end time
                if (appointment.endDate) {
                    const endD = this.parseLocalDate(appointment.endDate);
                    const endHours = String(endD.getHours()).padStart(2, '0');
                    const endMinutes = String(endD.getMinutes()).padStart(2, '0');
                    endTimeValue = `${endHours}:${endMinutes}`;
                }
            } else if (tempTimeRange) {
                // Pre-fill from calendar time block selection (parse as local time)
                const startD = this.parseLocalDate(tempTimeRange.start);
                const endD = this.parseLocalDate(tempTimeRange.end);

                const year = startD.getFullYear();
                const month = String(startD.getMonth() + 1).padStart(2, '0');
                const day = String(startD.getDate()).padStart(2, '0');
                dateValue = `${year}-${month}-${day}`;

                const hours = String(startD.getHours()).padStart(2, '0');
                const minutes = String(startD.getMinutes()).padStart(2, '0');
                timeValue = `${hours}:${minutes}`;

                const endHours = String(endD.getHours()).padStart(2, '0');
                const endMinutes = String(endD.getMinutes()).padStart(2, '0');
                endTimeValue = `${endHours}:${endMinutes}`;

                // Clear temp time range after using it
                delete window.SmartAgenda._tempTimeRange;
            } else if (preSelectedDate) {
                // Pre-fill date from calendar selection
                const d = new Date(preSelectedDate);
                dateValue = d.toISOString().split('T')[0];
                timeValue = d.toTimeString().substring(0, 5);
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
                        label: i18n.translate('appointment.time') + ' (start)',
                        type: 'time',
                        placeholder: '14:00',
                        width: '48%'
                    },
                    {
                        name: 'endTime',
                        label: i18n.translate('appointment.time') + ' (end - optional)',
                        type: 'time',
                        placeholder: '15:00',
                        width: '48%'
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
                        label: 'Τζίρος',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01',
                        width: 'calc(50% - 8px)',
                        newRow: true
                    },
                    {
                        name: 'profit',
                        label: 'Κέρδος',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01',
                        width: 'calc(50% - 6px)'
                    },
                    {
                        name: 'profit-note',
                        type: 'note',
                        text: 'ℹ️ Αν συμπληρωθεί το Κέρδος, μόνο αυτό θα υπολογίζεται στο ημερολόγιο οικονομικών.'
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
                        label: i18n.translate('appointment.time') + ' (start)',
                        type: 'time',
                        placeholder: '14:00',
                        width: '48%'
                    },
                    {
                        name: 'endTime',
                        label: i18n.translate('appointment.time') + ' (end - optional)',
                        type: 'time',
                        placeholder: '15:00',
                        width: '48%'
                    },
                    {
                        name: 'status',
                        label: i18n.translate('appointment.status'),
                        type: 'select',
                        width: '48%',
                        newRow: true,
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
                        width: '48%',
                        options: [
                            { value: 'low', label: i18n.translate('priority.low') },
                            { value: 'medium', label: i18n.translate('priority.medium') },
                            { value: 'high', label: i18n.translate('priority.high') }
                        ]
                    },
                    {
                        name: 'amount',
                        label: 'Τζίρος',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01',
                        width: 'calc(50% - 8px)',
                        newRow: true
                    },
                    {
                        name: 'profit',
                        label: 'Κέρδος',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01',
                        width: 'calc(50% - 6px)'
                    },
                    {
                        name: 'profit-note',
                        type: 'note',
                        text: 'ℹ️ Αν συμπληρωθεί το Κέρδος, μόνο αυτό θα υπολογίζεται στο ημερολόγιο οικονομικών.'
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
                        label: i18n.translate('appointment.time') + ' (start)',
                        type: 'time',
                        placeholder: '14:00',
                        width: '48%'
                    },
                    {
                        name: 'endTime',
                        label: i18n.translate('appointment.time') + ' (end - optional)',
                        type: 'time',
                        placeholder: '15:00',
                        width: '48%'
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
                        label: 'Τζίρος',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01',
                        width: 'calc(50% - 8px)',
                        newRow: true
                    },
                    {
                        name: 'profit',
                        label: 'Κέρδος',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01',
                        width: 'calc(50% - 6px)'
                    },
                    {
                        name: 'profit-note',
                        type: 'note',
                        text: 'ℹ️ Αν συμπληρωθεί το Κέρδος, μόνο αυτό θα υπολογίζεται στο ημερολόγιο οικονομικών.'
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
                endTime: endTimeValue,
                status: appointment.status || 'pending',
                paid: appointment.paid || 'unpaid'
            } : {
                client: preSelectedClient || '',
                priority: 'medium',
                status: 'pending',
                paid: 'unpaid',
                completed: false,
                isStandalone: isStandalone,
                date: dateValue || new Date().toISOString().split('T')[0], // Today's date or pre-selected
                time: timeValue || '',
                endTime: endTimeValue || ''
            };

            // Create form
            const form = window.SmartAgenda.UIComponents.createForm(fields, initialValues);

            // Modal buttons
            const buttons = [];

            if (isEdit) {
                // Complete button first when editing - sets both status and payment status
                buttons.push({
                    label: appointment.status === 'completed' ? i18n.translate('actions.incomplete') : i18n.translate('actions.complete'),
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

                        // If opened from day view, refresh it instead of just closing
                        if (window.SmartAgenda._fromDayView) {
                            delete window.SmartAgenda._fromDayView;
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            if (window.SmartAgenda.CalendarViews && window.SmartAgenda.CalendarViews.refreshDayView) {
                                window.SmartAgenda.CalendarViews.refreshDayView();
                            }
                        } else {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                        }
                    }
                });

                // Delete button for editing
                buttons.push({
                    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>`,
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

            // Add notification management
            this.addNotificationButton(modal, appointment);
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

            // Parse profit - convert to number or remove if empty
            if (values.profit !== undefined && values.profit !== '') {
                const parsedProfit = parseFloat(values.profit);
                if (!isNaN(parsedProfit) && parsedProfit >= 0) {
                    values.profit = parsedProfit;
                } else {
                    delete values.profit; // Remove invalid profit
                }
            } else {
                delete values.profit; // Remove empty profit
            }

            // Validate: profit must be <= amount
            if (values.profit && values.amount && values.profit > values.amount) {
                window.SmartAgenda.Toast.error('Το κέρδος δεν μπορεί να είναι μεγαλύτερο από το ποσό!');
                return;
            }

            // Get amountPaid from hidden field if it exists (for partial payments)
            const amountPaidInput = modal.querySelector('[name="amountPaid"]');
            if (amountPaidInput && amountPaidInput.value) {
                const amountPaid = parseFloat(amountPaidInput.value);
                if (!isNaN(amountPaid) && amountPaid >= 0) {
                    values.amountPaid = amountPaid;
                }
            }

            // Combine date and time into ISO string (local time, no timezone conversion)
            let dateTimeString = values.date;
            if (values.time) {
                dateTimeString += 'T' + values.time + ':00.000';
            } else {
                dateTimeString += 'T12:00:00.000'; // Default to noon if no time
            }
            values.date = dateTimeString;

            // Handle end time if provided
            if (values.endTime) {
                let endDateTimeString = values.date.split('T')[0]; // Same date as start
                endDateTimeString += 'T' + values.endTime + ':00.000';
                values.endDate = endDateTimeString;
            } else {
                // No end time - remove endDate if it exists
                delete values.endDate;
            }

            // Remove time fields (they're now in date and endDate)
            delete values.time;
            delete values.endTime;

            // Check for overlapping appointments
            const hasOverlap = this.checkAppointmentOverlap(
                values.date,
                values.endDate || values.date, // If no endDate, use same as start
                existingAppointment ? existingAppointment.id : null
            );

            if (hasOverlap) {
                window.SmartAgenda.Toast.error('Υπάρχει ήδη ραντεβού σε αυτή την ώρα!');
                return;
            }

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

            // Get notifications from modal's stored data
            const notificationsData = modal.getAttribute('data-notifications');
            if (notificationsData) {
                try {
                    values.notifications = JSON.parse(notificationsData);
                } catch (e) {
                    console.error('Error parsing notifications:', e);
                }
            } else if (existingAppointment && existingAppointment.notifications) {
                // Keep existing notifications if not modified
                values.notifications = existingAppointment.notifications;
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

                    // If opened from day view, refresh it instead of just closing
                    if (window.SmartAgenda._fromDayView) {
                        delete window.SmartAgenda._fromDayView;
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        if (window.SmartAgenda.CalendarViews && window.SmartAgenda.CalendarViews.refreshDayView) {
                            window.SmartAgenda.CalendarViews.refreshDayView();
                        }
                    } else {
                        window.SmartAgenda.UIComponents.closeModal(modal);
                    }
                }
            } else {
                const added = window.SmartAgenda.DataManager.add('appointments', values);
                if (added) {
                    // Schedule notification for new appointment
                    if (window.SmartAgenda.Notifications) {
                        window.SmartAgenda.Notifications.scheduleNotification(added);
                    }

                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.saved'));

                    // If opened from day view, refresh it instead of just closing
                    if (window.SmartAgenda._fromDayView) {
                        delete window.SmartAgenda._fromDayView;
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        if (window.SmartAgenda.CalendarViews && window.SmartAgenda.CalendarViews.refreshDayView) {
                            window.SmartAgenda.CalendarViews.refreshDayView();
                        }
                    } else {
                        window.SmartAgenda.UIComponents.closeModal(modal);
                    }
                }
            }
        },

        /**
         * Parse date string as local time (no timezone conversion)
         * Format: "2024-12-13T01:00:00.000" or "2024-12-13T01:00:00"
         */
        parseLocalDate: function(dateStr) {
            if (!dateStr) return null;

            const [datepart, timepart] = dateStr.split('T');
            const [year, month, day] = datepart.split('-').map(Number);

            if (timepart) {
                const timeParts = timepart.split(':');
                const hours = parseInt(timeParts[0], 10);
                const minutes = parseInt(timeParts[1], 10);
                const seconds = timeParts[2] ? parseInt(timeParts[2].split('.')[0], 10) : 0;
                return new Date(year, month - 1, day, hours, minutes, seconds);
            }

            return new Date(year, month - 1, day);
        },

        /**
         * Check if an appointment overlaps with existing appointments
         */
        checkAppointmentOverlap: function(startDate, endDate, excludeId = null) {
            const appointments = window.SmartAgenda.DataManager.getAll('appointments');

            // Parse the dates as local time
            const newStart = this.parseLocalDate(startDate);
            const newEnd = this.parseLocalDate(endDate);

            // Check each existing appointment
            for (const apt of appointments) {
                // Skip the appointment we're editing
                if (excludeId && apt.id === excludeId) continue;

                // Skip cancelled or completed appointments
                if (apt.status === 'cancelled' || apt.status === 'completed') continue;

                const aptStart = this.parseLocalDate(apt.date);
                let aptEnd = apt.endDate ? this.parseLocalDate(apt.endDate) : new Date(aptStart.getTime() + 30 * 60000); // Default 30 min

                // Check for overlap: start1 < end2 AND end1 > start2
                if (newStart < aptEnd && newEnd > aptStart) {
                    return true; // Overlap found
                }
            }

            return false; // No overlap
        },

        /**
         * Add notification button and management to appointment modal
         */
        addNotificationButton: function(modal, appointment) {
            const formElement = modal.querySelector('.modal-form');
            if (!formElement) return;

            const currentNotifications = appointment?.notifications || [];

            // Create notification section
            const notificationSection = document.createElement('div');
            notificationSection.className = 'notification-section';
            notificationSection.style.cssText = 'margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);';

            // Count active notifications
            const notifCount = currentNotifications.length;
            const countBadge = notifCount > 0 ? ` <span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${notifCount}</span>` : '';

            notificationSection.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 500; color: var(--text-primary);">Ειδοποιήσεις</span>
                        ${countBadge}
                    </div>
                    <button type="button" id="manage-notifications-btn"
                            style="padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                        <span>${appointment ? 'Επεξεργασία' : 'Προσθήκη'}</span>
                    </button>
                </div>
                ${notifCount > 0 ? `
                    <div id="notifications-summary" style="margin-top: 12px; padding: 12px; background: var(--background); border-radius: 6px; border: 1px solid var(--border);">
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Ενεργές ειδοποιήσεις:</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${currentNotifications.map(n => {
                                const timeText = window.SmartAgenda.Notifications.formatNotificationTime(n.minutes);
                                return `<span style="padding: 4px 10px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 16px; font-size: 12px; font-weight: 500;">${timeText}</span>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            `;

            // Append to form
            formElement.appendChild(notificationSection);

            // Store current notifications in modal
            modal.setAttribute('data-notifications', JSON.stringify(currentNotifications));

            // Create handler function for managing notifications
            const handleManageNotifications = async () => {
                // Get current notifications from modal
                const currentData = modal.getAttribute('data-notifications');
                const currentNotifs = currentData ? JSON.parse(currentData) : [];

                // Show notification selector
                const selectedNotifications = await window.SmartAgenda.Notifications.showNotificationSelector(currentNotifs);

                if (selectedNotifications !== null) {
                    // Update modal data
                    modal.setAttribute('data-notifications', JSON.stringify(selectedNotifications));

                    // Update summary
                    const notifCount = selectedNotifications.length;
                    const countBadge = notifCount > 0 ? ` <span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${notifCount}</span>` : '';

                    const headerSection = notificationSection.querySelector('div:first-child');
                    if (headerSection) {
                        headerSection.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 500; color: var(--text-primary);">Ειδοποιήσεις</span>
                                ${countBadge}
                            </div>
                            <button type="button" id="manage-notifications-btn"
                                    style="padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                                <span>${appointment ? 'Επεξεργασία' : 'Προσθήκη'}</span>
                            </button>
                        `;

                        // Re-bind button with the same handler
                        const newBtn = headerSection.querySelector('#manage-notifications-btn');
                        if (newBtn) {
                            newBtn.addEventListener('click', handleManageNotifications);
                        }
                    }

                    // Update or create summary
                    let summaryDiv = notificationSection.querySelector('#notifications-summary');
                    if (notifCount > 0) {
                        const summaryHtml = `
                            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Ενεργές ειδοποιήσεις:</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${selectedNotifications.map(n => {
                                    const timeText = window.SmartAgenda.Notifications.formatNotificationTime(n.minutes);
                                    return `<span style="padding: 4px 10px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 16px; font-size: 12px; font-weight: 500;">${timeText}</span>`;
                                }).join('')}
                            </div>
                        `;

                        if (summaryDiv) {
                            summaryDiv.innerHTML = summaryHtml;
                        } else {
                            summaryDiv = document.createElement('div');
                            summaryDiv.id = 'notifications-summary';
                            summaryDiv.style.cssText = 'margin-top: 12px; padding: 12px; background: var(--background); border-radius: 6px; border: 1px solid var(--border);';
                            summaryDiv.innerHTML = summaryHtml;
                            notificationSection.appendChild(summaryDiv);
                        }
                    } else {
                        if (summaryDiv) {
                            summaryDiv.remove();
                        }
                    }

                    window.SmartAgenda.Toast.success('Οι ειδοποιήσεις ενημερώθηκαν');
                }
            };

            // Bind button event
            setTimeout(() => {
                const manageBtn = modal.querySelector('#manage-notifications-btn');
                if (manageBtn) {
                    manageBtn.addEventListener('click', handleManageNotifications);
                }
            }, 100);
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

                    // If opened from day view, refresh it instead of just closing
                    if (window.SmartAgenda._fromDayView) {
                        delete window.SmartAgenda._fromDayView;
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        if (window.SmartAgenda.CalendarViews && window.SmartAgenda.CalendarViews.refreshDayView) {
                            window.SmartAgenda.CalendarViews.refreshDayView();
                        }
                    } else {
                        window.SmartAgenda.UIComponents.closeModal(modal);
                    }
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
            let currentSearchTerm = '';

            const renderOptions = () => {
                const searchTerm = currentSearchTerm.toLowerCase();
                selectElement.innerHTML = '';

                let filtered = allOptions;
                if (searchTerm) {
                    // When searching, show all matching results
                    filtered = allOptions.filter(option =>
                        option.text.toLowerCase().includes(searchTerm) || option.value === ''
                    );
                } else {
                    // When not searching, show ALL clients (no pagination)
                    filtered = allOptions;
                }

                // Render all filtered results
                filtered.forEach(option => {
                    selectElement.appendChild(option.cloneNode(true));
                });

                const currentValue = selectElement.dataset.currentValue;
                if (currentValue) {
                    selectElement.value = currentValue;
                }
            };

            searchInput.addEventListener('input', (e) => {
                currentSearchTerm = e.target.value;
                renderOptions();
            });

            selectElement.addEventListener('change', (e) => {
                selectElement.dataset.currentValue = e.target.value;
            });

            // Initial render - show all clients
            renderOptions();
        },

        getClientName: function(clientId) {
            if (!clientId) return null;
            const client = window.SmartAgenda.DataManager.getById('clients', clientId);
            return client ? client.name : null;
        },

        isOverdue: function(appointment) {
            if (!appointment.date || appointment.completed) return false;
            return this.parseLocalDate(appointment.date) < new Date();
        },

        formatDateTime: function(dateString) {
            if (!dateString) return '';
            const date = this.parseLocalDate(dateString);
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
