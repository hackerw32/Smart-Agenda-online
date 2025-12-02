/**
 * Smart Agenda - Calendar Views Module
 * 
 * Two calendar views:
 * 1. Appointments Calendar - Shows appointments count per day
 * 2. Finance Calendar - Shows revenue per day
 * 
 * Features:
 * - Google Calendar-style monthly grid
 * - Click day to create new or view existing
 * - Navigation between months/years
 * - Statistics panel
 * - Color coding
 */

(function() {
    'use strict';

    const CalendarViews = {
        // Current state
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        currentView: 'appointments', // 'appointments' or 'finance'

        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            if (window.SmartAgenda) {
                window.SmartAgenda.EventBus.on('tab:change', (tab) => {
                    if (tab === 'calendar') {
                        this.currentView = 'appointments';
                        this.renderAppointmentsCalendar();
                    } else if (tab === 'finance') {
                        this.currentView = 'finance';
                        this.renderFinanceCalendar();
                    }
                });

                // Listen to data changes
                window.SmartAgenda.EventBus.on('data:appointments:change', () => {
                    if (this.currentView === 'appointments') {
                        this.renderAppointmentsCalendar();
                    }
                });

                window.SmartAgenda.EventBus.on('data:change', () => {
                    if (this.currentView === 'finance') {
                        this.renderFinanceCalendar();
                    }
                });
            }
        },

        // ============================================
        // Appointments Calendar
        // ============================================

        renderAppointmentsCalendar: function() {
            const container = document.getElementById('appointments-calendar');
            if (!container) return;

            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            
            // Group appointments by date
            const appointmentsByDate = this.groupAppointmentsByDate(appointments);
            
            // Calculate statistics
            const stats = this.calculateAppointmentStats(appointments);

            container.innerHTML = `
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-nav">
                            <button class="btn-icon" id="prev-month-apt">‹</button>
                            <h2 class="calendar-title" id="calendar-month-apt">${this.getMonthYearString()}</h2>
                            <button class="btn-icon" id="next-month-apt">›</button>
                        </div>
                    </div>

                    <div class="calendar-stats">
                        <div class="stat-card">
                            <div class="stat-number">${stats.total}</div>
                            <div class="stat-label">${window.SmartAgenda.I18n.translate('calendar.total')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: var(--warning)">${stats.pending}</div>
                            <div class="stat-label">${window.SmartAgenda.I18n.translate('calendar.pending')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: var(--success)">${stats.completed}</div>
                            <div class="stat-label">${window.SmartAgenda.I18n.translate('calendar.completed')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: var(--danger)">${stats.overdue}</div>
                            <div class="stat-label">${window.SmartAgenda.I18n.translate('calendar.overdue')}</div>
                        </div>
                    </div>

                    <div class="calendar-grid">
                        <div class="calendar-weekdays">
                            <div class="weekday">Sun</div>
                            <div class="weekday">Mon</div>
                            <div class="weekday">Tue</div>
                            <div class="weekday">Wed</div>
                            <div class="weekday">Thu</div>
                            <div class="weekday">Fri</div>
                            <div class="weekday">Sat</div>
                        </div>
                        <div class="calendar-days" id="calendar-days-apt">
                            ${this.renderCalendarDays(appointmentsByDate, 'appointments')}
                        </div>
                    </div>

                    <!-- Day Details Section -->
                    <div id="day-details-container" class="day-details-container"></div>
                </div>
            `;

            this.bindAppointmentsCalendarEvents(appointmentsByDate);
        },

        bindAppointmentsCalendarEvents: function(appointmentsByDate) {
            // Navigation buttons
            document.getElementById('prev-month-apt')?.addEventListener('click', () => {
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                this.renderAppointmentsCalendar();
            });

            document.getElementById('next-month-apt')?.addEventListener('click', () => {
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.renderAppointmentsCalendar();
            });


            // Day click events
            document.querySelectorAll('.calendar-day').forEach(day => {
                day.addEventListener('click', () => {
                    const dateKey = day.dataset.date;
                    if (dateKey) {
                        this.showDayAppointments(dateKey, appointmentsByDate[dateKey] || []);
                    }
                });
            });
        },

        showDayAppointments: function(dateKey, appointments) {
            const date = new Date(dateKey);
            const dateStr = date.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            let content = `
                <div class="day-appointments" style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <h3 style="margin: 0 0 12px 0; color: var(--text-primary);">${dateStr}</h3>
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <button class="btn-primary" id="create-apt-for-day" style="flex: 1;">+ Create Appointment</button>
                            <button class="btn-secondary" id="create-task-for-day" style="flex: 1;">+ Create Task</button>
                        </div>
                    </div>
            `;

            if (appointments.length === 0) {
                content += `
                    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        <p>No appointments for this day</p>
                    </div>
                `;
            } else {
                content += '<div class="appointments-list" style="display: flex; flex-direction: column; gap: 12px;">';
                appointments.forEach(apt => {
                    const time = new Date(apt.date).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const statusClass = apt.completed ? 'completed' : (new Date(apt.date) < new Date() ? 'overdue' : 'pending');
                    const statusColors = {
                        completed: '#10b981',
                        overdue: '#ef4444',
                        pending: '#3b82f6'
                    };

                    content += `
                        <div class="appointment-list-item" data-id="${apt.id}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: var(--border-radius-sm); cursor: pointer; transition: all var(--transition-fast);">
                            <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); min-width: 60px;">${time}</div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(apt.clientName || 'Untitled')}</div>
                                ${apt.desc ? `<div style="font-size: 13px; color: var(--text-secondary);">${this.escapeHtml(this.stripHtml(apt.desc).substring(0, 50))}...</div>` : ''}
                            </div>
                            <div style="font-size: 20px; color: ${statusColors[statusClass]};">
                                ${apt.completed ? '✓' : (statusClass === 'overdue' ? '⚠' : '○')}
                            </div>
                        </div>
                    `;
                });
                content += '</div>';
            }

            content += '</div>';

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Appointments',
                content: content,
                buttons: [
                    {
                        label: 'Close',
                        type: 'secondary',
                        action: 'close',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'medium'
            });

            // Bind create buttons
            modal.querySelector('#create-apt-for-day')?.addEventListener('click', () => {
                window.SmartAgenda.UIComponents.closeModal(modal);
                if (window.SmartAgenda.Appointments) {
                    this.showCreateAppointmentWithSearch(dateKey);
                }
            });

            modal.querySelector('#create-task-for-day')?.addEventListener('click', () => {
                window.SmartAgenda.UIComponents.closeModal(modal);
                if (window.SmartAgenda.Tasks) {
                    this.showCreateTaskWithSearch(dateKey);
                }
            });

            // Bind appointment items
            modal.querySelectorAll('.appointment-list-item').forEach(item => {
                item.addEventListener('click', () => {
                    const aptId = item.dataset.id;
                    const apt = window.SmartAgenda.DataManager.getById('appointments', aptId);
                    if (apt && window.SmartAgenda.Appointments) {
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        window.SmartAgenda.Appointments.showAppointmentModal(apt);
                    }
                });

                // Add hover effect
                item.addEventListener('mouseenter', function() {
                    this.style.borderColor = 'var(--border-hover)';
                    this.style.boxShadow = 'var(--shadow-sm)';
                    this.style.transform = 'translateY(-1px)';
                });
                item.addEventListener('mouseleave', function() {
                    this.style.borderColor = 'var(--border)';
                    this.style.boxShadow = 'none';
                    this.style.transform = 'translateY(0)';
                });
            });
        },

        showCreateAppointmentWithSearch: function(dateKey) {
            const clients = window.SmartAgenda.DataManager.getAll('clients');

            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Search Client</label>
                        <input type="text" id="client-search-input" placeholder="Search by name or phone number..."
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary);">
                    </div>
                    <div id="client-search-results" style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                        <!-- Results will be populated here -->
                    </div>
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
                        <button class="btn-secondary" id="create-standalone-btn" style="width: 100%;">
                            Create Standalone Appointment
                        </button>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Create Appointment',
                content: content,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        action: 'cancel',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'medium'
            });

            const searchInput = modal.querySelector('#client-search-input');
            const resultsContainer = modal.querySelector('#client-search-results');
            const standaloneBtn = modal.querySelector('#create-standalone-btn');

            // Function to render search results
            const renderResults = (query) => {
                const filtered = query ? clients.filter(c => {
                    const nameMatch = c.name && c.name.toLowerCase().includes(query.toLowerCase());
                    const phoneMatch = c.phone && c.phone.includes(query);
                    return nameMatch || phoneMatch;
                }) : clients.slice(0, 10); // Show first 10 if no search

                if (filtered.length === 0) {
                    resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No clients found</div>';
                    return;
                }

                resultsContainer.innerHTML = filtered.map(client => `
                    <div class="client-result-item" data-client-id="${client.id}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: var(--border-radius-sm); cursor: pointer; transition: all var(--transition-fast);">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(client.name)}</div>
                            ${client.phone ? `<div style="font-size: 13px; color: var(--text-secondary);">${this.escapeHtml(client.phone)}</div>` : ''}
                        </div>
                        <div style="color: var(--primary-color);">→</div>
                    </div>
                `).join('');

                // Bind click events
                modal.querySelectorAll('.client-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const clientId = item.dataset.clientId;
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        // Create appointment with selected client and pre-selected date
                        if (window.SmartAgenda.Appointments) {
                            window.SmartAgenda.Appointments.showAppointmentModal(null, clientId, dateKey);
                        }
                    });

                    // Hover effect
                    item.addEventListener('mouseenter', function() {
                        this.style.borderColor = 'var(--primary-color)';
                        this.style.background = 'var(--surface)';
                    });
                    item.addEventListener('mouseleave', function() {
                        this.style.borderColor = 'var(--border)';
                        this.style.background = 'var(--background)';
                    });
                });
            };

            // Initial render
            renderResults('');

            // Search input listener with IME composition support
            let searchTimeout = null;
            let isComposing = false;

            searchInput.addEventListener('compositionstart', () => {
                isComposing = true;
            });

            searchInput.addEventListener('compositionend', (e) => {
                isComposing = false;
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    renderResults(e.target.value);
                }, 100);
            });

            searchInput.addEventListener('input', (e) => {
                if (isComposing) return;
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    renderResults(e.target.value);
                }, 300);
            });

            // Standalone button
            standaloneBtn.addEventListener('click', () => {
                window.SmartAgenda.UIComponents.closeModal(modal);
                if (window.SmartAgenda.Appointments) {
                    window.SmartAgenda.Appointments.showAppointmentModal(null, null, dateKey);
                }
            });
        },

        showCreateTaskWithSearch: function(dateKey) {
            const clients = window.SmartAgenda.DataManager.getAll('clients');

            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Search Client</label>
                        <input type="text" id="client-search-input-task" placeholder="Search by name or phone number..."
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary);">
                    </div>
                    <div id="client-search-results-task" style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                        <!-- Results will be populated here -->
                    </div>
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
                        <button class="btn-secondary" id="create-standalone-task-btn" style="width: 100%;">
                            Create Standalone Task
                        </button>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Create Task',
                content: content,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        action: 'cancel',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'medium'
            });

            const searchInput = modal.querySelector('#client-search-input-task');
            const resultsContainer = modal.querySelector('#client-search-results-task');
            const standaloneBtn = modal.querySelector('#create-standalone-task-btn');

            // Function to render search results
            const renderResults = (query) => {
                const filtered = query ? clients.filter(c => {
                    const nameMatch = c.name && c.name.toLowerCase().includes(query.toLowerCase());
                    const phoneMatch = c.phone && c.phone.includes(query);
                    return nameMatch || phoneMatch;
                }) : clients.slice(0, 10); // Show first 10 if no search

                if (filtered.length === 0) {
                    resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No clients found</div>';
                    return;
                }

                resultsContainer.innerHTML = filtered.map(client => `
                    <div class="client-result-item-task" data-client-id="${client.id}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: var(--border-radius-sm); cursor: pointer; transition: all var(--transition-fast);">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(client.name)}</div>
                            ${client.phone ? `<div style="font-size: 13px; color: var(--text-secondary);">${this.escapeHtml(client.phone)}</div>` : ''}
                        </div>
                        <div style="color: var(--primary-color);">→</div>
                    </div>
                `).join('');

                // Bind click events
                modal.querySelectorAll('.client-result-item-task').forEach(item => {
                    item.addEventListener('click', () => {
                        const clientId = item.dataset.clientId;
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        // Create task with selected client and pre-selected date
                        if (window.SmartAgenda.Tasks) {
                            window.SmartAgenda.Tasks.showTaskModal(null, clientId, dateKey);
                        }
                    });

                    // Hover effect
                    item.addEventListener('mouseenter', function() {
                        this.style.borderColor = 'var(--primary-color)';
                        this.style.background = 'var(--surface)';
                    });
                    item.addEventListener('mouseleave', function() {
                        this.style.borderColor = 'var(--border)';
                        this.style.background = 'var(--background)';
                    });
                });
            };

            // Initial render
            renderResults('');

            // Search input listener with IME composition support
            let searchTimeout = null;
            let isComposing = false;

            searchInput.addEventListener('compositionstart', () => {
                isComposing = true;
            });

            searchInput.addEventListener('compositionend', (e) => {
                isComposing = false;
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    renderResults(e.target.value);
                }, 100);
            });

            searchInput.addEventListener('input', (e) => {
                if (isComposing) return;
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    renderResults(e.target.value);
                }, 300);
            });

            // Standalone button
            standaloneBtn.addEventListener('click', () => {
                window.SmartAgenda.UIComponents.closeModal(modal);
                if (window.SmartAgenda.Tasks) {
                    window.SmartAgenda.Tasks.showTaskModal(null, null, dateKey);
                }
            });
        },

        // ============================================
        // Finance Calendar
        // ============================================

        renderFinanceCalendar: function() {
            const container = document.getElementById('finance-calendar');
            if (!container) return;

            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const tasks = window.SmartAgenda.DataManager.getAll('tasks');
            
            // Group by date with amounts
            const revenueByDate = this.groupRevenueByDate(appointments, tasks);
            
            // Calculate statistics
            const stats = this.calculateFinanceStats(appointments, tasks);

            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';

            container.innerHTML = `
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-nav">
                            <button class="btn-icon" id="prev-month-fin">‹</button>
                            <h2 class="calendar-title" id="calendar-month-fin">${this.getMonthYearString()}</h2>
                            <button class="btn-icon" id="next-month-fin">›</button>
                        </div>
                    </div>

                    <div class="calendar-stats">
                        <div class="stat-card">
                            <div class="stat-number" style="color: var(--success)">${currency}${stats.total.toFixed(2)}</div>
                            <div class="stat-label">${window.SmartAgenda.I18n.translate('calendar.total_revenue')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.count}</div>
                            <div class="stat-label">${window.SmartAgenda.I18n.translate('calendar.completed')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: var(--warning)">${stats.pending}</div>
                            <div class="stat-label">${window.SmartAgenda.I18n.translate('calendar.pending')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: var(--text-tertiary)">${currency}${stats.potentialRevenue.toFixed(2)}</div>
                            <div class="stat-label">${window.SmartAgenda.I18n.translate('calendar.potential')}</div>
                        </div>
                    </div>

                    <div class="calendar-grid">
                        <div class="calendar-weekdays">
                            <div class="weekday">Sun</div>
                            <div class="weekday">Mon</div>
                            <div class="weekday">Tue</div>
                            <div class="weekday">Wed</div>
                            <div class="weekday">Thu</div>
                            <div class="weekday">Fri</div>
                            <div class="weekday">Sat</div>
                        </div>
                        <div class="calendar-days" id="calendar-days-fin">
                            ${this.renderCalendarDays(revenueByDate, 'finance')}
                        </div>
                    </div>
                </div>
            `;

            this.bindFinanceCalendarEvents(revenueByDate);
        },

        bindFinanceCalendarEvents: function(revenueByDate) {
            // Navigation buttons
            document.getElementById('prev-month-fin')?.addEventListener('click', () => {
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                this.renderFinanceCalendar();
            });

            document.getElementById('next-month-fin')?.addEventListener('click', () => {
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.renderFinanceCalendar();
            });

            // Day click events
            document.querySelectorAll('.calendar-day').forEach(day => {
                day.addEventListener('click', () => {
                    const dateKey = day.dataset.date;
                    if (dateKey && revenueByDate[dateKey]) {
                        this.showDayRevenue(dateKey, revenueByDate[dateKey]);
                    }
                });
            });
        },

        showDayRevenue: function(dateKey, data) {
            const date = new Date(dateKey);
            const dateStr = date.toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';

            let content = `
                <div class="day-revenue">
                    <h3>${dateStr}</h3>
                    <div class="day-revenue-summary">
                        <div class="revenue-stat">
                            <span>Revenue Received:</span>
                            <strong style="color: var(--success)">${currency}${data.total.toFixed(2)}</strong>
                        </div>
                        <div class="revenue-stat">
                            <span>Transactions:</span>
                            <strong>${data.items.length}</strong>
                        </div>
                    </div>
                    <div class="revenue-items">
            `;

            data.items.forEach(item => {
                const time = new Date(item.date).toLocaleTimeString(undefined, { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const statusClass = item.completed ? 'completed' : 'pending';
                const icon = item.type === 'appointment' ? '📅' : '✓';
                
                content += `
                    <div class="revenue-item ${statusClass}" data-type="${item.type}" data-id="${item.id}">
                        <div class="revenue-icon">${icon}</div>
                        <div class="revenue-details">
                            <div class="revenue-name">${this.escapeHtml(item.clientName || 'Untitled')}</div>
                            <div class="revenue-time">${time}</div>
                        </div>
                        <div class="revenue-amount">${currency}${parseFloat(item.amount).toFixed(2)}</div>
                    </div>
                `;
            });

            content += '</div></div>';

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Revenue Details',
                content: content,
                buttons: [
                    {
                        label: 'Close',
                        type: 'secondary',
                        action: 'close',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'medium'
            });

            // Bind revenue items
            modal.querySelectorAll('.revenue-item').forEach(item => {
                item.addEventListener('click', () => {
                    const itemId = item.dataset.id;
                    const itemType = item.dataset.type;
                    
                    window.SmartAgenda.UIComponents.closeModal(modal);
                    
                    if (itemType === 'appointment') {
                        const apt = window.SmartAgenda.DataManager.getById('appointments', itemId);
                        if (apt && window.SmartAgenda.Appointments) {
                            window.SmartAgenda.Appointments.showAppointmentModal(apt);
                        }
                    } else {
                        const task = window.SmartAgenda.DataManager.getById('tasks', itemId);
                        if (task && window.SmartAgenda.Tasks) {
                            window.SmartAgenda.Tasks.showTaskModal(task);
                        }
                    }
                });
            });
        },

        // ============================================
        // Calendar Rendering
        // ============================================

        renderCalendarDays: function(dataByDate, viewType) {
            const firstDay = new Date(this.currentYear, this.currentMonth, 1);
            const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let html = '';

            // Empty cells before first day
            for (let i = 0; i < startingDayOfWeek; i++) {
                html += '<div class="calendar-day empty"></div>';
            }

            // Days of month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(this.currentYear, this.currentMonth, day);
                // Use LOCAL date format to match grouping functions
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const dayStr = String(date.getDate()).padStart(2, '0');
                const dateKey = `${year}-${month}-${dayStr}`;
                const isToday = date.getTime() === today.getTime();

                const data = dataByDate[dateKey];
                let dayClass = 'calendar-day';
                if (isToday) dayClass += ' today';
                if (data) dayClass += ' has-data';

                let dataDisplay = '';
                if (viewType === 'appointments' && data) {
                    const count = data.length;
                    const hasOverdue = data.some(apt => !apt.completed && new Date(apt.date) < new Date());
                    const allCompleted = data.every(apt => apt.completed);
                    
                    let indicatorClass = 'appointment-indicator';
                    if (hasOverdue) indicatorClass += ' overdue';
                    else if (allCompleted) indicatorClass += ' completed';
                    
                    dataDisplay = `<div class="${indicatorClass}">${count}</div>`;
                } else if (viewType === 'finance' && data) {
                    const currency = window.SmartAgenda.State.get('currentCurrency') || '€';
                    const amount = data.total;
                    dataDisplay = `<div class="finance-amount">${currency}${amount.toFixed(0)}</div>`;
                }

                html += `
                    <div class="${dayClass}" data-date="${dateKey}">
                        <div class="day-number">${day}</div>
                        ${dataDisplay}
                    </div>
                `;
            }

            return html;
        },

        // ============================================
        // Data Processing
        // ============================================

        groupAppointmentsByDate: function(appointments) {
            const grouped = {};

            // Filter for current month
            appointments.forEach(apt => {
                if (!apt.date) return;

                const date = new Date(apt.date);
                if (date.getMonth() === this.currentMonth && date.getFullYear() === this.currentYear) {
                    // Use LOCAL date for grouping, not UTC
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${day}`;

                    if (!grouped[dateKey]) {
                        grouped[dateKey] = [];
                    }
                    grouped[dateKey].push(apt);
                }
            });

            return grouped;
        },

        groupRevenueByDate: function(appointments, tasks) {
            const grouped = {};

            // Process appointments - COMPLETED or PAID or PARTIAL
            appointments.forEach(apt => {
                if (!apt.date || !apt.amount) return;
                // Include if completed OR payment status is paid or partial
                if (!apt.completed && apt.paid !== 'paid' && apt.paid !== 'partial') return;

                const date = new Date(apt.date);
                if (date.getMonth() === this.currentMonth && date.getFullYear() === this.currentYear) {
                    // Use LOCAL date for grouping, not UTC
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${day}`;

                    if (!grouped[dateKey]) {
                        grouped[dateKey] = { total: 0, completed: 0, pending: 0, items: [] };
                    }

                    // Calculate amount - use amountPaid for partial payments
                    let amount;
                    if (apt.paid === 'paid' || apt.completed) {
                        amount = parseFloat(apt.amount);
                    } else if (apt.paid === 'partial') {
                        amount = parseFloat(apt.amountPaid) || 0;
                    }

                    grouped[dateKey].total += amount;
                    grouped[dateKey].completed += amount;
                    grouped[dateKey].items.push({ ...apt, type: 'appointment' });
                }
            });

            // Process tasks - COMPLETED or PAID
            tasks.forEach(task => {
                if (!task.date || !task.amount) return;
                // Include if completed OR payment status is paid
                if (!task.completed && task.paid !== 'paid') return;

                const date = new Date(task.date);
                if (date.getMonth() === this.currentMonth && date.getFullYear() === this.currentYear) {
                    // Use LOCAL date for grouping, not UTC
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${day}`;

                    if (!grouped[dateKey]) {
                        grouped[dateKey] = { total: 0, completed: 0, pending: 0, items: [] };
                    }

                    const amount = parseFloat(task.amount);
                    grouped[dateKey].total += amount;
                    grouped[dateKey].completed += amount;
                    grouped[dateKey].items.push({ ...task, type: 'task' });
                }
            });

            return grouped;
        },

        calculateAppointmentStats: function(appointments) {
            const now = new Date();
            const monthStart = new Date(this.currentYear, this.currentMonth, 1);
            const monthEnd = new Date(this.currentYear, this.currentMonth + 1, 0);

            const monthAppointments = appointments.filter(apt => {
                if (!apt.date) return false;
                const date = new Date(apt.date);
                return date >= monthStart && date <= monthEnd;
            });

            return {
                total: monthAppointments.length,
                pending: monthAppointments.filter(apt => !apt.completed && new Date(apt.date) >= now).length,
                completed: monthAppointments.filter(apt => apt.completed).length,
                overdue: monthAppointments.filter(apt => !apt.completed && new Date(apt.date) < now).length
            };
        },

        calculateFinanceStats: function(appointments, tasks) {
            const monthStart = new Date(this.currentYear, this.currentMonth, 1);
            const monthEnd = new Date(this.currentYear, this.currentMonth + 1, 0);

            let total = 0; // Completed revenue only
            let potentialRevenue = 0; // Pending revenue
            let completedCount = 0;
            let pendingCount = 0;

            // Process appointments
            appointments.forEach(apt => {
                if (!apt.date || !apt.amount) return;
                const date = new Date(apt.date);
                if (date >= monthStart && date <= monthEnd) {
                    const amount = parseFloat(apt.amount);
                    // Count as completed if marked completed OR payment status is paid
                    if (apt.completed || apt.paid === 'paid') {
                        total += amount;
                        completedCount++;
                    } else if (apt.paid === 'partial') {
                        // For partial payments, add paid amount to total and remaining to potential
                        const amountPaid = parseFloat(apt.amountPaid) || 0;
                        const remaining = amount - amountPaid;
                        total += amountPaid;
                        potentialRevenue += remaining;
                        completedCount++; // Count as completed for stats
                    } else {
                        potentialRevenue += amount;
                        pendingCount++;
                    }
                }
            });

            // Process tasks
            tasks.forEach(task => {
                if (!task.date || !task.amount) return;
                const date = new Date(task.date);
                if (date >= monthStart && date <= monthEnd) {
                    const amount = parseFloat(task.amount);
                    // Count as completed if marked completed OR payment status is paid
                    if (task.completed || task.paid === 'paid') {
                        total += amount;
                        completedCount++;
                    } else {
                        potentialRevenue += amount;
                        pendingCount++;
                    }
                }
            });

            return {
                total, // Completed revenue
                count: completedCount,
                pending: pendingCount,
                potentialRevenue
            };
        },

        // ============================================
        // Utilities
        // ============================================

        getMonthYearString: function() {
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
            return `${months[this.currentMonth]} ${this.currentYear}`;
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
        }
    };

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        .calendar-container { display: flex; flex-direction: column; gap: 24px; }
        .calendar-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .calendar-nav { display: flex; align-items: center; gap: 16px; }
        .calendar-title { font-size: 24px; font-weight: 700; margin: 0; color: var(--text-primary); }
        .calendar-actions { display: flex; gap: 8px; }
        .calendar-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .calendar-grid { background: var(--surface); border-radius: var(--border-radius); padding: 16px; border: 1px solid var(--border); }
        .calendar-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 8px; }
        .weekday { text-align: center; font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; padding: 8px; }
        .calendar-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .calendar-day { min-height: 80px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); padding: 10px; display: flex; flex-direction: column; cursor: pointer; transition: all var(--transition-fast); background: var(--background); }
        .calendar-day.empty { background: transparent; border: none; cursor: default; }
        .calendar-day:not(.empty):hover { border-color: var(--primary-color); box-shadow: var(--shadow-sm); transform: scale(1.02); }
        .calendar-day.today { background: var(--primary-color)11; border-color: var(--primary-color); font-weight: 600; }
        .calendar-day.has-data { background: var(--surface); }
        .day-number { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
        .appointment-indicator { margin-top: auto; text-align: center; font-size: 12px; font-weight: 600; padding: 4px; border-radius: 4px; background: var(--primary-color)22; color: var(--primary-color); }
        .appointment-indicator.completed { background: var(--success)22; color: var(--success); }
        .appointment-indicator.overdue { background: var(--danger)22; color: var(--danger); }
        .finance-amount { margin-top: auto; text-align: center; font-size: 12px; font-weight: 700; color: var(--success); background: var(--success)11; padding: 4px; border-radius: 4px; }
        .day-details-container { display: none; margin-top: 24px; background: var(--surface); border-radius: var(--border-radius); border: 1px solid var(--border); padding: 20px; animation: slideDown 300ms ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .day-appointments, .day-revenue { padding: 0; }
        .day-appointments-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .day-appointments h3, .day-revenue h3, .day-appointments-header h3 { margin: 0; color: var(--text-primary); font-size: 18px; font-weight: 600; }
        .empty-day { text-align: center; padding: 40px 20px; }
        .empty-day p { color: var(--text-secondary); margin-bottom: 16px; }
        .appointments-list { display: flex; flex-direction: column; gap: 12px; }
        .appointment-list-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: var(--border-radius-sm); cursor: pointer; transition: all var(--transition-fast); }
        .appointment-list-item:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
        .appointment-list-item.completed { opacity: 0.6; }
        .appointment-list-item.overdue { border-left: 3px solid var(--danger); }
        .apt-time { font-size: 14px; font-weight: 600; color: var(--text-primary); min-width: 60px; }
        .apt-details { flex: 1; min-width: 0; }
        .apt-name { font-weight: 600; color: var(--text-primary); }
        .apt-desc { font-size: 13px; color: var(--text-secondary); }
        .apt-status { font-size: 20px; }
        .day-revenue-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 20px; padding: 16px; background: var(--background); border-radius: var(--border-radius-sm); }
        .revenue-stat { display: flex; justify-content: space-between; align-items: center; }
        .revenue-items { display: flex; flex-direction: column; gap: 12px; }
        .revenue-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: var(--border-radius-sm); cursor: pointer; transition: all var(--transition-fast); }
        .revenue-item:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
        .revenue-item.completed { opacity: 0.7; }
        .revenue-icon { font-size: 24px; }
        .revenue-details { flex: 1; min-width: 0; }
        .revenue-name { font-weight: 600; color: var(--text-primary); }
        .revenue-time { font-size: 13px; color: var(--text-secondary); }
        .revenue-amount { font-size: 16px; font-weight: 700; color: var(--success); }
        .stat-card { text-align: center; }
        .stat-number { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
        .stat-label { font-size: 13px; color: var(--text-secondary); }
        @media (max-width: 768px) {
            .calendar-header { flex-direction: column; align-items: stretch; }
            .calendar-nav { justify-content: center; }
            .calendar-actions { width: 100%; }
            .calendar-actions button { flex: 1; }
            .calendar-day { padding: 6px; min-height: 60px; }
            .day-number { font-size: 13px; margin-bottom: 4px; }
            .appointment-indicator, .finance-amount { font-size: 10px; padding: 3px; }
            .calendar-stats { grid-template-columns: repeat(2, 1fr); }
            .stat-card { min-width: 0; text-align: center; }
            .stat-number { font-size: 20px; display: block; margin-bottom: 4px; }
            .stat-label { font-size: 11px; display: block; }
        }
    `;
    document.head.appendChild(styles);

    // Initialize when app is ready
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => CalendarViews.init());
        window.SmartAgenda.CalendarViews = CalendarViews;
    }

})();