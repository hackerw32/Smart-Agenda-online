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
                    // Also update finance calendar when appointments change
                    if (this.currentView === 'finance') {
                        this.renderFinanceCalendar();
                    }
                });

                window.SmartAgenda.EventBus.on('data:tasks:change', () => {
                    // Update finance calendar when tasks change
                    if (this.currentView === 'finance') {
                        this.renderFinanceCalendar();
                    }
                });

                window.SmartAgenda.EventBus.on('data:change', () => {
                    if (this.currentView === 'finance') {
                        this.renderFinanceCalendar();
                    }
                });
            }

            // Listen to orientation changes to re-render calendar
            window.matchMedia('(orientation: landscape)').addEventListener('change', () => {
                if (this.currentView === 'appointments') {
                    this.renderAppointmentsCalendar();
                } else if (this.currentView === 'finance') {
                    this.renderFinanceCalendar();
                }
            });
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

            // Get selected date (default to today)
            if (!this.selectedDate) {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                this.selectedDate = `${year}-${month}-${day}`;
            }

            container.innerHTML = `
                <div class="gcal-container">
                    <!-- Modern Stats Row -->
                    <div class="gcal-compact-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                        <div class="modern-stat-card" style="padding: 16px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--primary-color)22; display: flex; align-items: center; justify-content: center;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${window.SmartAgenda.I18n.translate('calendar.total')}</div>
                                    <div style="font-size: 28px; font-weight: 700; color: var(--text-primary);">${stats.total}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modern-stat-card" style="padding: 16px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: #f59e0b22; display: flex; align-items: center; justify-content: center;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${window.SmartAgenda.I18n.translate('calendar.pending')}</div>
                                    <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${stats.pending}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modern-stat-card" style="padding: 16px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: #10b98122; display: flex; align-items: center; justify-content: center;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${window.SmartAgenda.I18n.translate('calendar.completed')}</div>
                                    <div style="font-size: 28px; font-weight: 700; color: #10b981;">${stats.completed}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modern-stat-card" style="padding: 16px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: #ef444422; display: flex; align-items: center; justify-content: center;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${window.SmartAgenda.I18n.translate('calendar.overdue')}</div>
                                    <div style="font-size: 28px; font-weight: 700; color: #ef4444;">${stats.overdue}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Compact Calendar Row -->
                    <div class="gcal-compact-calendar">
                        <div class="gcal-calendar-nav">
                            <button class="btn-icon" id="prev-month-apt">‹</button>
                            <h2 class="gcal-month-title" id="calendar-month-apt">${this.getMonthYearString()}</h2>
                            <button class="btn-icon" id="next-month-apt">›</button>
                        </div>
                        <div class="gcal-mini-grid">
                            <div class="gcal-mini-weekdays">
                                <div class="gcal-mini-weekday">S</div>
                                <div class="gcal-mini-weekday">M</div>
                                <div class="gcal-mini-weekday">T</div>
                                <div class="gcal-mini-weekday">W</div>
                                <div class="gcal-mini-weekday">T</div>
                                <div class="gcal-mini-weekday">F</div>
                                <div class="gcal-mini-weekday">S</div>
                            </div>
                            <div class="gcal-mini-days" id="calendar-days-apt">
                                ${this.renderCompactCalendarDays(appointmentsByDate)}
                            </div>
                        </div>
                    </div>
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

            // Mini calendar day clicks - Open day view modal
            document.querySelectorAll('.gcal-mini-day:not(.empty)').forEach(day => {
                day.addEventListener('click', () => {
                    const dateKey = day.dataset.date;
                    if (dateKey) {
                        this.selectedDate = dateKey;
                        this.showDayViewModal(dateKey, appointmentsByDate);
                    }
                });
            });
        },

        showDayViewModal: function(dateKey, appointmentsByDate) {
            // Store the active day view for refresh capability
            window.SmartAgenda._activeDayView = { dateKey, appointmentsByDate };

            const date = new Date(dateKey);
            const dateStr = date.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const appointments = appointmentsByDate[dateKey] || [];

            // Generate timeline HTML (time slots only)
            let hoursHtml = '';
            for (let hour = 0; hour < 24; hour++) {
                for (let quarter = 0; quarter < 4; quarter++) {
                    const minute = quarter * 15;
                    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

                    const isFullHour = minute === 0;
                    const slotClass = isFullHour ? 'gcal-time-slot full-hour' : 'gcal-time-slot';

                    hoursHtml += `
                        <div class="${slotClass}" data-time="${timeStr}" data-date="${dateKey}">
                            <div class="gcal-time-label">${isFullHour ? timeStr : ''}</div>
                            <div class="gcal-events-column" data-slot="${timeStr}"></div>
                        </div>
                    `;
                }
            }

            // Render positioned events
            const pixelsPerHour = 120;
            const pixelsPerMinute = pixelsPerHour / 60;
            let eventsHtml = '';
            appointments.forEach(apt => {
                const startDate = this.parseLocalDate(apt.date);
                const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
                const top = startMinutes * pixelsPerMinute;

                let height = 30; // Default height (15 minutes)
                if (apt.endDate) {
                    const endDate = this.parseLocalDate(apt.endDate);
                    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
                    const duration = endMinutes - startMinutes;
                    height = duration * pixelsPerMinute;
                }

                eventsHtml += this.renderAgendaEventPositioned(apt, top, height);
            });

            const content = `
                <div class="gcal-day-modal-content">
                    <div class="gcal-day-header">
                        <h3 class="gcal-day-title">${dateStr}</h3>
                    </div>
                    <div class="gcal-timeline-container" id="gcal-timeline" style="position: relative;">
                        ${hoursHtml}
                        ${eventsHtml}
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Day View',
                content: content,
                buttons: [
                    {
                        label: 'Close',
                        type: 'secondary',
                        action: 'close',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'large',
                fullHeight: true
            });

            // Add time block selection functionality
            this.initTimeBlockSelection(modal, dateKey);

            // Store modal reference for refresh
            window.SmartAgenda._activeDayViewModal = modal;

            // Bind event clicks
            modal.querySelectorAll('.gcal-event').forEach(event => {
                event.addEventListener('click', () => {
                    const aptId = event.dataset.id;
                    const apt = window.SmartAgenda.DataManager.getById('appointments', aptId);
                    if (apt && window.SmartAgenda.Appointments) {
                        // Mark that we're opening from day view
                        window.SmartAgenda._fromDayView = true;
                        window.SmartAgenda.Appointments.showAppointmentModal(apt);
                    }
                });
            });

            // Clear reference when modal closes
            const originalClose = modal.querySelector('.modal-close');
            if (originalClose) {
                originalClose.addEventListener('click', () => {
                    delete window.SmartAgenda._activeDayView;
                    delete window.SmartAgenda._activeDayViewModal;
                    delete window.SmartAgenda._fromDayView;
                });
            }
        },

        refreshDayView: function() {
            if (!window.SmartAgenda._activeDayView || !window.SmartAgenda._activeDayViewModal) {
                return;
            }

            const { dateKey } = window.SmartAgenda._activeDayView;
            const currentModal = window.SmartAgenda._activeDayViewModal;

            // Clear references BEFORE closing modal (to prevent cleanup from triggering)
            delete window.SmartAgenda._activeDayView;
            delete window.SmartAgenda._activeDayViewModal;
            delete window.SmartAgenda._fromDayView;

            // Get fresh appointments data
            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const appointmentsByDate = {};
            appointments.forEach(apt => {
                const d = this.parseLocalDate(apt.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const key = `${year}-${month}-${day}`;
                if (!appointmentsByDate[key]) {
                    appointmentsByDate[key] = [];
                }
                appointmentsByDate[key].push(apt);
            });

            // Close current modal
            window.SmartAgenda.UIComponents.closeModal(currentModal);

            // Small delay to ensure clean modal closure
            setTimeout(() => {
                // Reopen with fresh data
                this.showDayViewModal(dateKey, appointmentsByDate);
            }, 50);
        },

        initTimeBlockSelection: function(modal, dateKey) {
            const timeline = modal.querySelector('#gcal-timeline');
            if (!timeline) return;

            let selectedBlock = null;
            let isDragging = false;
            let dragHandle = null;
            let startY = 0;
            let startTime = null;
            let endTime = null;

            // Click on time slot to create block
            modal.querySelectorAll('.gcal-events-column').forEach(column => {
                column.addEventListener('click', (e) => {
                    // Don't create block if clicking on existing event
                    if (e.target.closest('.gcal-event')) return;
                    // Don't create block if there's already one
                    if (selectedBlock) return;

                    const slot = column.closest('.gcal-time-slot');
                    const time = slot.dataset.time;
                    if (!time) return;

                    // Create time block (default 1 hour)
                    const [hours, minutes] = time.split(':').map(Number);
                    startTime = { hours, minutes };
                    endTime = { hours: hours + 1, minutes };

                    this.renderTimeBlock(timeline, dateKey, startTime, endTime);
                });
            });
        },

        renderTimeBlock: function(timeline, dateKey, startTime, endTime) {
            // Remove existing block if any
            const existingBlock = timeline.querySelector('.gcal-time-block');
            if (existingBlock) existingBlock.remove();

            // Calculate position and height
            const startMinutes = startTime.hours * 60 + startTime.minutes;
            const endMinutes = endTime.hours * 60 + endTime.minutes;
            const duration = endMinutes - startMinutes;

            // Each hour = full-hour slot (60px) + 3 quarter slots (20px each) = 120px total
            // Each 15-minute slot = 120px / 4 = 30px
            const pixelsPerHour = 120;
            const pixelsPerMinute = pixelsPerHour / 60;
            const top = startMinutes * pixelsPerMinute;
            const height = duration * pixelsPerMinute;

            const startStr = `${String(startTime.hours).padStart(2, '0')}:${String(startTime.minutes).padStart(2, '0')}`;
            const endStr = `${String(endTime.hours).padStart(2, '0')}:${String(endTime.minutes).padStart(2, '0')}`;

            const blockHtml = `
                <div class="gcal-time-block" style="top: ${top}px; height: ${height}px;">
                    <div class="gcal-resize-handle top"></div>
                    <div class="gcal-block-content">
                        <div class="gcal-block-time">${startStr} - ${endStr}</div>
                        <button class="gcal-block-add-btn" title="Add appointment">+</button>
                    </div>
                    <div class="gcal-resize-handle bottom"></div>
                </div>
            `;

            // Insert block
            timeline.insertAdjacentHTML('beforeend', blockHtml);

            const block = timeline.querySelector('.gcal-time-block');
            this.initBlockInteractions(block, timeline, dateKey, startTime, endTime);
        },

        initBlockInteractions: function(block, timeline, dateKey, startTime, endTime) {
            const addBtn = block.querySelector('.gcal-block-add-btn');
            const topHandle = block.querySelector('.gcal-resize-handle.top');
            const bottomHandle = block.querySelector('.gcal-resize-handle.bottom');

            // Add button click
            addBtn.addEventListener('click', () => {
                // Parse dateKey correctly to avoid timezone issues
                const [year, month, day] = dateKey.split('-').map(Number);
                const startDateTime = new Date(year, month - 1, day, startTime.hours, startTime.minutes, 0, 0);
                const endDateTime = new Date(year, month - 1, day, endTime.hours, endTime.minutes, 0, 0);

                this.showQuickAddWithTimeRange(dateKey, startDateTime, endDateTime);
            });

            // Resize functionality
            let isResizing = false;
            let resizeType = null;
            let startY = 0;
            let originalTop = 0;
            let originalHeight = 0;

            const startResize = (e, type) => {
                isResizing = true;
                resizeType = type;
                startY = e.clientY || e.touches[0].clientY;
                originalTop = parseInt(block.style.top);
                originalHeight = parseInt(block.style.height);
                e.preventDefault();
                e.stopPropagation();
            };

            const doResize = (e) => {
                if (!isResizing) return;
                const currentY = e.clientY || e.touches[0].clientY;
                const deltaY = currentY - startY;

                // Snap to 15-minute increments (30px per 15 min)
                const pixelsPerHour = 120;
                const pixelsPer15Min = pixelsPerHour / 4; // 30px
                const pixelsPerMinute = pixelsPerHour / 60; // 2px
                const snappedDelta = Math.round(deltaY / pixelsPer15Min) * pixelsPer15Min;

                if (resizeType === 'top') {
                    const newTop = originalTop + snappedDelta;
                    const newHeight = originalHeight - snappedDelta;
                    const minDuration = pixelsPer15Min * 2; // Minimum 30 minutes
                    if (newHeight >= minDuration) {
                        block.style.top = newTop + 'px';
                        block.style.height = newHeight + 'px';

                        // Update start time
                        const newStartMinutes = newTop / pixelsPerMinute;
                        startTime.hours = Math.floor(newStartMinutes / 60);
                        startTime.minutes = newStartMinutes % 60;
                        this.updateBlockTime(block, startTime, endTime);
                    }
                } else if (resizeType === 'bottom') {
                    const newHeight = originalHeight + snappedDelta;
                    const minDuration = pixelsPer15Min * 2; // Minimum 30 minutes
                    if (newHeight >= minDuration) {
                        block.style.height = newHeight + 'px';

                        // Update end time
                        const totalMinutes = originalTop / pixelsPerMinute + newHeight / pixelsPerMinute;
                        endTime.hours = Math.floor(totalMinutes / 60);
                        endTime.minutes = totalMinutes % 60;
                        this.updateBlockTime(block, startTime, endTime);
                    }
                }
            };

            const endResize = () => {
                isResizing = false;
                resizeType = null;
            };

            topHandle.addEventListener('mousedown', (e) => startResize(e, 'top'));
            topHandle.addEventListener('touchstart', (e) => startResize(e, 'top'));
            bottomHandle.addEventListener('mousedown', (e) => startResize(e, 'bottom'));
            bottomHandle.addEventListener('touchstart', (e) => startResize(e, 'bottom'));

            document.addEventListener('mousemove', doResize);
            document.addEventListener('touchmove', doResize);
            document.addEventListener('mouseup', endResize);
            document.addEventListener('touchend', endResize);
        },

        updateBlockTime: function(block, startTime, endTime) {
            const startStr = `${String(startTime.hours).padStart(2, '0')}:${String(startTime.minutes).padStart(2, '0')}`;
            const endStr = `${String(endTime.hours).padStart(2, '0')}:${String(endTime.minutes).padStart(2, '0')}`;
            const timeDisplay = block.querySelector('.gcal-block-time');
            if (timeDisplay) {
                timeDisplay.textContent = `${startStr} - ${endStr}`;
            }
        },

        showQuickAddWithTimeRange: function(dateKey, startDateTime, endDateTime) {
            // This will use the existing Quick Add but with both start and end times
            const clients = window.SmartAgenda.DataManager.getAll('clients');

            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Search Client (Optional)</label>
                        <input type="text" id="quick-client-search" placeholder="Search by name or phone number..."
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary);">
                    </div>
                    <div id="quick-client-results" style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                        <!-- Results will be populated here -->
                    </div>
                    <div style="padding-top: 16px; border-top: 1px solid var(--border);">
                        <button class="btn-primary" id="create-standalone-quick" style="width: 100%;">
                            Create Without Client
                        </button>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Quick Add',
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

            let selectedType = 'appointment';
            let selectedClientId = null;

            const searchInput = modal.querySelector('#quick-client-search');
            const resultsContainer = modal.querySelector('#quick-client-results');
            const standaloneBtn = modal.querySelector('#create-standalone-quick');

            let currentSearchTerm = '';

            // Function to render search results
            const renderResults = (query) => {
                currentSearchTerm = query;
                let filtered;

                if (query) {
                    // When searching, show all matching results
                    filtered = clients.filter(c => {
                        const nameMatch = c.name && c.name.toLowerCase().includes(query.toLowerCase());
                        const phoneMatch = c.phone && c.phone.includes(query);
                        return nameMatch || phoneMatch;
                    });
                } else {
                    // When not searching, show ALL clients (no pagination)
                    filtered = clients;
                }

                if (filtered.length === 0) {
                    resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No clients found</div>';
                    return;
                }

                resultsContainer.innerHTML = filtered.map(client => `
                    <div class="quick-client-item" data-client-id="${client.id}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: var(--border-radius-sm); cursor: pointer; transition: all var(--transition-fast);">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(client.name)}</div>
                            ${client.phone ? `<div style="font-size: 13px; color: var(--text-secondary);">${this.escapeHtml(client.phone)}</div>` : ''}
                        </div>
                        <div style="color: var(--primary-color);">→</div>
                    </div>
                `).join('');

                // Bind click events
                modal.querySelectorAll('.quick-client-item').forEach(item => {
                    item.addEventListener('click', () => {
                        selectedClientId = item.dataset.clientId;
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        this.createQuickEntryWithTimeRange(selectedType, selectedClientId, startDateTime, endDateTime);
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

            // Search input listener
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
                this.createQuickEntryWithTimeRange(selectedType, null, startDateTime, endDateTime);
            });
        },

        toLocalISOString: function(date) {
            // Convert Date to ISO string format WITHOUT timezone conversion
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000`;
        },

        createQuickEntryWithTimeRange: function(type, clientId, startDateTime, endDateTime) {
            // Only handle appointments
            if (type === 'appointment' && window.SmartAgenda.Appointments) {
                // Store the time range for the appointment modal to use (as local time, not UTC)
                window.SmartAgenda._tempTimeRange = {
                    start: this.toLocalISOString(startDateTime),
                    end: this.toLocalISOString(endDateTime)
                };
                // Mark that we're opening from day view
                window.SmartAgenda._fromDayView = true;
                window.SmartAgenda.Appointments.showAppointmentModal(null, clientId, this.toLocalISOString(startDateTime));
            }
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
                            <button class="btn-primary" id="create-apt-for-day" style="width: 100%;">+ Create Appointment</button>
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
                    const time = this.parseLocalDate(apt.date).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const statusClass = apt.completed ? 'completed' : (this.parseLocalDate(apt.date) < new Date() ? 'overdue' : 'pending');
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

        showQuickAddAppointment: function(dateKey, timeStr) {
            const clients = window.SmartAgenda.DataManager.getAll('clients');

            // Parse date and time
            const date = new Date(dateKey);
            let dateTimeStr = dateKey;
            if (timeStr) {
                const [hours, minutes] = timeStr.split(':');
                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                dateTimeStr = date.toISOString();
            }

            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Search Client (Optional)</label>
                        <input type="text" id="quick-client-search" placeholder="Search by name or phone number..."
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary);">
                    </div>
                    <div id="quick-client-results" style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                        <!-- Results will be populated here -->
                    </div>
                    <div style="padding-top: 16px; border-top: 1px solid var(--border);">
                        <button class="btn-primary" id="create-standalone-quick" style="width: 100%;">
                            Create Without Client
                        </button>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Quick Add',
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

            let selectedType = 'appointment';
            let selectedClientId = null;

            const searchInput = modal.querySelector('#quick-client-search');
            const resultsContainer = modal.querySelector('#quick-client-results');
            const standaloneBtn = modal.querySelector('#create-standalone-quick');

            // Function to render search results
            const renderResults = (query) => {
                const filtered = query ? clients.filter(c => {
                    const nameMatch = c.name && c.name.toLowerCase().includes(query.toLowerCase());
                    const phoneMatch = c.phone && c.phone.includes(query);
                    return nameMatch || phoneMatch;
                }) : clients.slice(0, 10);

                if (filtered.length === 0) {
                    resultsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No clients found</div>';
                    return;
                }

                resultsContainer.innerHTML = filtered.map(client => `
                    <div class="quick-client-item" data-client-id="${client.id}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--background); border: 1px solid var(--border); border-radius: var(--border-radius-sm); cursor: pointer; transition: all var(--transition-fast);">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(client.name)}</div>
                            ${client.phone ? `<div style="font-size: 13px; color: var(--text-secondary);">${this.escapeHtml(client.phone)}</div>` : ''}
                        </div>
                        <div style="color: var(--primary-color);">→</div>
                    </div>
                `).join('');

                // Bind click events
                modal.querySelectorAll('.quick-client-item').forEach(item => {
                    item.addEventListener('click', () => {
                        selectedClientId = item.dataset.clientId;
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        this.createQuickEntry(selectedType, selectedClientId, dateTimeStr, timeStr);
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

            // Search input listener
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
                this.createQuickEntry(selectedType, null, dateTimeStr, timeStr);
            });
        },

        createQuickEntry: function(type, clientId, dateTimeStr, timeStr) {
            if (type === 'appointment' && window.SmartAgenda.Appointments) {
                window.SmartAgenda.Appointments.showAppointmentModal(null, clientId, dateTimeStr);
            } else if (type === 'task' && window.SmartAgenda.Tasks) {
                window.SmartAgenda.Tasks.showTaskModal(null, clientId, dateTimeStr);
            } else if (type === 'interaction' && window.SmartAgenda.Clients) {
                // Interactions are typically added from client details
                if (clientId) {
                    const client = window.SmartAgenda.DataManager.getById('clients', clientId);
                    if (client) {
                        // You may want to add a showInteractionModal function
                        window.SmartAgenda.Toast.info('Please add interactions from the client details page.');
                    }
                } else {
                    window.SmartAgenda.Toast.info('Please select a client to add an interaction.');
                }
            }
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
                <div class="gcal-container">
                    <!-- Modern Stats Row -->
                    <div class="gcal-compact-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                        <div class="modern-stat-card" style="padding: 16px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--primary-color)22; display: flex; align-items: center; justify-content: center;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2">
                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Τζίρος</div>
                                    <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">${currency}${stats.revenue.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modern-stat-card" style="padding: 16px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: #10b98122; display: flex; align-items: center; justify-content: center;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                    </svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Κέρδος</div>
                                    <div style="font-size: 24px; font-weight: 700; color: #10b981;">${currency}${stats.profit.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modern-stat-card" style="padding: 16px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: #f59e0b22; display: flex; align-items: center; justify-content: center;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Εκρεμή</div>
                                    <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${stats.pendingCount}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modern-stat-card" style="padding: 16px; background: var(--surface); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--text-tertiary)22; display: flex; align-items: center; justify-content: center;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                    </svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Δυνητικά</div>
                                    <div style="font-size: 24px; font-weight: 700; color: var(--text-tertiary);">${currency}${stats.potentialRevenue.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Compact Calendar Row -->
                    <div class="gcal-compact-calendar">
                        <div class="gcal-calendar-nav">
                            <button class="btn-icon" id="prev-month-fin">‹</button>
                            <h2 class="gcal-month-title" id="calendar-month-fin">${this.getMonthYearString()}</h2>
                            <button class="btn-icon" id="next-month-fin">›</button>
                        </div>
                        <div class="gcal-mini-grid">
                            <div class="gcal-mini-weekdays">
                                <div class="gcal-mini-weekday">S</div>
                                <div class="gcal-mini-weekday">M</div>
                                <div class="gcal-mini-weekday">T</div>
                                <div class="gcal-mini-weekday">W</div>
                                <div class="gcal-mini-weekday">T</div>
                                <div class="gcal-mini-weekday">F</div>
                                <div class="gcal-mini-weekday">S</div>
                            </div>
                            <div class="gcal-mini-days" id="calendar-days-fin">
                                ${this.renderCompactCalendarDays(revenueByDate, 'finance')}
                            </div>
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

            // Day click events - use gcal-mini-day instead of calendar-day
            document.querySelectorAll('.gcal-mini-day:not(.empty)').forEach(day => {
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
                            <span>Τζίρος:</span>
                            <strong style="color: var(--primary-color)">${currency}${data.revenue.toFixed(2)}</strong>
                        </div>
                        <div class="revenue-stat">
                            <span>Κέρδος:</span>
                            <strong style="color: var(--success)">${currency}${data.profit.toFixed(2)}</strong>
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
        // Compact Calendar Rendering
        // ============================================

        renderCompactCalendarDays: function(data, mode = 'appointments') {
            const firstDay = new Date(this.currentYear, this.currentMonth, 1);
            const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const selectedDate = this.selectedDate ? new Date(this.selectedDate) : null;
            if (selectedDate) selectedDate.setHours(0, 0, 0, 0);

            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';
            let html = '';

            // Empty cells before first day
            for (let i = 0; i < startingDayOfWeek; i++) {
                html += '<div class="gcal-mini-day empty"></div>';
            }

            // Days of month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(this.currentYear, this.currentMonth, day);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const dayStr = String(date.getDate()).padStart(2, '0');
                const dateKey = `${year}-${month}-${dayStr}`;
                const isToday = date.getTime() === today.getTime();
                const isSelected = selectedDate && date.getTime() === selectedDate.getTime();

                let dayClass = 'gcal-mini-day';
                if (isToday) dayClass += ' today';
                if (isSelected) dayClass += ' selected';

                let previewHtml = '';
                let count = 0;

                if (mode === 'finance') {
                    // Finance mode - show revenue/profit
                    const revenueData = data[dateKey];
                    if (revenueData && (revenueData.revenue > 0 || revenueData.profit > 0)) {
                        dayClass += ' has-events';

                        // Check if revenue and profit are the same
                        const revenueRounded = Math.round(revenueData.revenue * 100) / 100;
                        const profitRounded = Math.round(revenueData.profit * 100) / 100;
                        const areSame = Math.abs(revenueRounded - profitRounded) < 0.01;

                        if (areSame) {
                            // Show only profit with success color
                            count = revenueData.profit;
                            previewHtml = `
                                <div class="gcal-mini-preview">
                                    <div class="gcal-preview-item" style="font-weight: 600; color: var(--success); font-size: 11px;">
                                        ${currency}${revenueData.profit.toFixed(0)}
                                    </div>
                                </div>
                            `;
                        } else {
                            // Show both vertically - revenue (primary) then profit (success)
                            count = revenueData.revenue;
                            previewHtml = `
                                <div class="gcal-mini-preview" style="display: flex; flex-direction: column; gap: 1px;">
                                    <div class="gcal-preview-item" style="font-weight: 600; color: var(--primary-color); font-size: 10px;">
                                        ${currency}${revenueData.revenue.toFixed(0)}
                                    </div>
                                    <div class="gcal-preview-item" style="font-weight: 600; color: var(--success); font-size: 10px;">
                                        ${currency}${revenueData.profit.toFixed(0)}
                                    </div>
                                </div>
                            `;
                        }
                    }
                } else {
                    // Appointments mode
                    const appointments = data[dateKey] || [];
                    count = appointments.length;
                    if (count > 0) {
                        dayClass += ' has-events';

                        const isLandscape = window.matchMedia('(orientation: landscape)').matches;
                        const maxPreview = isLandscape ? appointments.length : Math.min(5, appointments.length);

                        const previews = appointments.slice(0, maxPreview).map(apt => {
                            const name = apt.clientName || 'Untitled';
                            return name;
                        });

                        previewHtml = `
                            <div class="gcal-mini-preview">
                                ${previews.map(p => `<div class="gcal-preview-item">${this.escapeHtml(p)}</div>`).join('')}
                            </div>
                        `;
                    }
                }

                html += `
                    <div class="${dayClass}" data-date="${dateKey}">
                        <div class="gcal-mini-day-header">
                            <span class="gcal-mini-day-num">${day}</span>
                            ${mode !== 'finance' && count > 0 ? `<span class="gcal-mini-count">${count}</span>` : ''}
                        </div>
                        ${previewHtml}
                    </div>
                `;
            }

            return html;
        },

        // ============================================
        // Day/Agenda View (Google Calendar Style)
        // ============================================

        renderDayAgendaView: function(dateKey, appointmentsByDate) {
            const date = new Date(dateKey);
            const dateStr = date.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const appointments = appointmentsByDate[dateKey] || [];

            // Group appointments by hour
            const appointmentsByHour = {};
            appointments.forEach(apt => {
                const aptDate = this.parseLocalDate(apt.date);
                const hour = aptDate.getHours();
                const minute = aptDate.getMinutes();
                const quarterSlot = Math.floor(minute / 15); // 0, 1, 2, 3
                const slotKey = `${hour}:${quarterSlot * 15}`;

                if (!appointmentsByHour[slotKey]) {
                    appointmentsByHour[slotKey] = [];
                }
                appointmentsByHour[slotKey].push(apt);
            });

            // Generate 24 hours with 15-minute intervals
            let hoursHtml = '';
            for (let hour = 0; hour < 24; hour++) {
                for (let quarter = 0; quarter < 4; quarter++) {
                    const minute = quarter * 15;
                    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    const slotKey = `${hour}:${minute}`;
                    const slotAppointments = appointmentsByHour[slotKey] || [];

                    const isFullHour = minute === 0;
                    const slotClass = isFullHour ? 'gcal-time-slot full-hour' : 'gcal-time-slot';

                    hoursHtml += `
                        <div class="${slotClass}" data-time="${timeStr}" data-date="${dateKey}">
                            <div class="gcal-time-label">${isFullHour ? timeStr : ''}</div>
                            <div class="gcal-events-column">
                                ${slotAppointments.map(apt => this.renderAgendaEvent(apt)).join('')}
                                ${slotAppointments.length === 0 && isFullHour ? `<div class="gcal-empty-slot"></div>` : ''}
                            </div>
                        </div>
                    `;
                }
            }

            return `
                <div class="gcal-day-header">
                    <h3 class="gcal-day-title">${dateStr}</h3>
                    <button class="btn-primary" id="quick-add-apt">+ Quick Add</button>
                </div>
                <div class="gcal-timeline-container">
                    ${hoursHtml}
                </div>
            `;
        },

        renderAgendaEvent: function(apt) {
            const startDate = this.parseLocalDate(apt.date);
            const endDate = apt.endDate ? this.parseLocalDate(apt.endDate) : null;

            const time = startDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Calculate duration if endDate exists
            let durationText = '';
            if (endDate) {
                const endTime = endDate.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                durationText = `${time} - ${endTime}`;
            } else {
                durationText = time;
            }

            const statusClass = apt.completed ? 'completed' : (startDate < new Date() ? 'overdue' : 'pending');
            const statusColors = {
                completed: '#10b981',
                overdue: '#ef4444',
                pending: '#3b82f6'
            };

            return `
                <div class="gcal-event" data-id="${apt.id}" style="border-left: 3px solid ${statusColors[statusClass]}">
                    <div class="gcal-event-time">${durationText}</div>
                    <div class="gcal-event-title">${this.escapeHtml(apt.clientName || 'Untitled')}</div>
                    ${apt.desc ? `<div class="gcal-event-desc">${this.escapeHtml(this.stripHtml(apt.desc).substring(0, 50))}...</div>` : ''}
                </div>
            `;
        },

        renderAgendaEventPositioned: function(apt, top, height) {
            const startDate = this.parseLocalDate(apt.date);
            const endDate = apt.endDate ? this.parseLocalDate(apt.endDate) : null;

            const time = startDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Calculate duration if endDate exists
            let durationText = '';
            if (endDate) {
                const endTime = endDate.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                durationText = `${time} - ${endTime}`;
            } else {
                durationText = time;
            }

            const statusClass = apt.completed ? 'completed' : (startDate < new Date() ? 'overdue' : 'pending');
            const statusColors = {
                completed: '#10b981',
                overdue: '#ef4444',
                pending: '#3b82f6'
            };

            return `
                <div class="gcal-event gcal-event-positioned"
                     data-id="${apt.id}"
                     style="position: absolute; left: 60px; right: 8px; top: ${top}px; height: ${height}px; border-left: 3px solid ${statusColors[statusClass]}; z-index: 5;">
                    <div class="gcal-event-time">${durationText}</div>
                    <div class="gcal-event-title">${this.escapeHtml(apt.clientName || 'Untitled')}</div>
                    ${apt.desc && height > 60 ? `<div class="gcal-event-desc">${this.escapeHtml(this.stripHtml(apt.desc).substring(0, 50))}...</div>` : ''}
                </div>
            `;
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
                    const hasOverdue = data.some(apt => !apt.completed && this.parseLocalDate(apt.date) < new Date());
                    const allCompleted = data.every(apt => apt.completed);

                    let indicatorClass = 'appointment-indicator';
                    if (hasOverdue) indicatorClass += ' overdue';
                    else if (allCompleted) indicatorClass += ' completed';
                    
                    dataDisplay = `<div class="${indicatorClass}">${count}</div>`;
                } else if (viewType === 'finance' && data) {
                    const currency = window.SmartAgenda.State.get('currentCurrency') || '€';
                    const revenue = data.revenue || 0;
                    const profit = data.profit || 0;
                    dataDisplay = `
                        <div class="finance-amount">
                            <div style="font-size: 10px; font-weight: 600; color: var(--primary-color);">${currency}${revenue.toFixed(0)}</div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--success);">${currency}${profit.toFixed(0)}</div>
                        </div>
                    `;
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

        parseLocalDate: function(dateStr) {
            // Parse date string as local time (no timezone conversion)
            // Format: "2024-12-13T01:00:00.000" or "2024-12-13T01:00:00"
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

        groupAppointmentsByDate: function(appointments) {
            const grouped = {};

            // Filter for current month
            appointments.forEach(apt => {
                if (!apt.date) return;

                const date = this.parseLocalDate(apt.date);
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

                const date = this.parseLocalDate(apt.date);
                if (date.getMonth() === this.currentMonth && date.getFullYear() === this.currentYear) {
                    // Use LOCAL date for grouping, not UTC
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${day}`;

                    if (!grouped[dateKey]) {
                        grouped[dateKey] = { total: 0, revenue: 0, profit: 0, completed: 0, pending: 0, items: [] };
                    }

                    // Calculate amount - use amountPaid for partial payments
                    let amount;
                    if (apt.paid === 'paid' || apt.completed) {
                        amount = parseFloat(apt.amount);
                    } else if (apt.paid === 'partial') {
                        amount = parseFloat(apt.amountPaid) || 0;
                    }

                    // Calculate profit - use profit if exists, otherwise amount
                    const profit = apt.profit ? parseFloat(apt.profit) : amount;

                    grouped[dateKey].total += amount;  // Keep for backward compatibility
                    grouped[dateKey].revenue += parseFloat(apt.amount) || 0;  // Always use full amount for revenue
                    grouped[dateKey].profit += profit || 0;  // Use profit if exists
                    grouped[dateKey].completed += amount;
                    grouped[dateKey].items.push({ ...apt, type: 'appointment' });
                }
            });

            // Process tasks - COMPLETED or PAID
            tasks.forEach(task => {
                if (!task.amount) return;
                if (!task.date) return; // Skip tasks without a date

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
                        grouped[dateKey] = { total: 0, revenue: 0, profit: 0, completed: 0, pending: 0, items: [] };
                    }

                    const amount = parseFloat(task.amount);
                    // Calculate profit - use profit if exists, otherwise amount
                    const profit = task.profit ? parseFloat(task.profit) : amount;

                    grouped[dateKey].total += amount;  // Keep for backward compatibility
                    grouped[dateKey].revenue += amount;  // Always use amount for revenue
                    grouped[dateKey].profit += profit || 0;  // Use profit if exists
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
                const date = this.parseLocalDate(apt.date);
                return date >= monthStart && date <= monthEnd;
            });

            return {
                total: monthAppointments.length,
                pending: monthAppointments.filter(apt => !apt.completed && this.parseLocalDate(apt.date) >= now).length,
                completed: monthAppointments.filter(apt => apt.completed).length,
                overdue: monthAppointments.filter(apt => !apt.completed && this.parseLocalDate(apt.date) < now).length
            };
        },

        calculateFinanceStats: function(appointments, tasks) {
            const monthStart = new Date(this.currentYear, this.currentMonth, 1);
            const monthEnd = new Date(this.currentYear, this.currentMonth + 1, 0);

            let revenue = 0; // Τζίρος - completed/paid amounts
            let profit = 0; // Κέρδος - completed/paid profit
            let pendingCount = 0; // Εκρεμή - count of pending items (including partial)
            let potentialRevenue = 0; // Δυνητικά - potential pending revenue

            // Process appointments
            appointments.forEach(apt => {
                if (!apt.date || !apt.amount) return;
                const date = this.parseLocalDate(apt.date);
                if (date >= monthStart && date <= monthEnd) {
                    const amount = parseFloat(apt.amount);

                    if (apt.completed || apt.paid === 'paid') {
                        // Fully paid
                        revenue += amount;
                        const profitValue = apt.profit ? parseFloat(apt.profit) : amount;
                        profit += profitValue;
                    } else if (apt.paid === 'partial') {
                        // Partially paid
                        const amountPaid = parseFloat(apt.amountPaid) || 0;
                        const remaining = amount - amountPaid;

                        revenue += amountPaid;
                        potentialRevenue += remaining;
                        pendingCount++; // Count partial as pending

                        // Calculate proportional profit
                        const fullProfit = apt.profit ? parseFloat(apt.profit) : amount;
                        const proportionalProfit = (fullProfit / amount) * amountPaid;
                        profit += proportionalProfit;
                    } else {
                        // Unpaid
                        potentialRevenue += amount;
                        pendingCount++;
                    }
                }
            });

            // Process tasks
            tasks.forEach(task => {
                if (!task.amount) return;
                if (!task.date) return;

                const date = new Date(task.date);
                if (date >= monthStart && date <= monthEnd) {
                    const amount = parseFloat(task.amount);

                    if (task.completed || task.paid === 'paid') {
                        // Fully paid
                        revenue += amount;
                        const profitValue = task.profit ? parseFloat(task.profit) : amount;
                        profit += profitValue;
                    } else if (task.paid === 'partial') {
                        // Partially paid
                        const amountPaid = parseFloat(task.amountPaid) || 0;
                        const remaining = amount - amountPaid;

                        revenue += amountPaid;
                        potentialRevenue += remaining;
                        pendingCount++;

                        // Calculate proportional profit
                        const fullProfit = task.profit ? parseFloat(task.profit) : amount;
                        const proportionalProfit = (fullProfit / amount) * amountPaid;
                        profit += proportionalProfit;
                    } else {
                        // Unpaid
                        potentialRevenue += amount;
                        pendingCount++;
                    }
                }
            });

            return {
                revenue,           // Τζίρος
                profit,            // Κέρδος
                pendingCount,      // Εκρεμή (αριθμός)
                potentialRevenue   // Δυνητικά (ποσό)
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
        /* Google Calendar Style Container */
        .gcal-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            height: 100%;
        }

        /* Compact Stats Row */
        .gcal-compact-stats {
            display: flex;
            gap: 12px;
            padding: 12px;
            background: var(--surface);
            border-radius: var(--border-radius-sm);
            border: 1px solid var(--border);
            overflow-x: auto;
        }

        .gcal-stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            min-width: 80px;
        }

        .gcal-stat-label {
            font-size: 11px;
            color: var(--text-secondary);
            text-align: center;
        }

        .gcal-stat-number {
            font-size: 20px;
            font-weight: 700;
        }

        /* Compact Calendar */
        .gcal-compact-calendar {
            background: var(--surface);
            border-radius: var(--border-radius-sm);
            padding: 12px;
            border: 1px solid var(--border);
        }

        .gcal-calendar-nav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 12px;
        }

        .gcal-month-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
            color: var(--text-primary);
        }

        .gcal-mini-grid {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .gcal-mini-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }

        .gcal-mini-weekday {
            text-align: center;
            font-size: 10px;
            font-weight: 600;
            color: var(--text-secondary);
            padding: 4px;
        }

        .gcal-mini-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }

        .gcal-mini-day {
            min-height: 45px;
            padding: 4px;
            border: 1px solid var(--border);
            border-radius: 4px;
            cursor: pointer;
            transition: all var(--transition-fast);
            background: var(--background);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .gcal-mini-day.empty {
            background: transparent;
            border: none;
            cursor: default;
        }

        .gcal-mini-day:not(.empty):hover {
            border-color: var(--primary-color);
            box-shadow: var(--shadow-sm);
        }

        .gcal-mini-day.today {
            background: var(--primary-color)11;
            border-color: var(--primary-color);
        }

        .gcal-mini-day.selected {
            background: var(--primary-color);
            color: white;
        }

        .gcal-mini-day.has-events {
            background: var(--surface);
        }

        .gcal-mini-day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2px;
        }

        .gcal-mini-day-num {
            font-size: 11px;
            font-weight: 600;
        }

        .gcal-mini-count {
            font-size: 9px;
            background: var(--primary-color)22;
            color: var(--primary-color);
            padding: 1px 4px;
            border-radius: 3px;
        }

        .gcal-mini-day.selected .gcal-mini-count {
            background: rgba(255, 255, 255, 0.3);
            color: white;
        }

        .gcal-mini-preview {
            display: flex;
            flex-direction: column;
            gap: 1px;
            margin-top: 2px;
        }

        .gcal-preview-item {
            font-size: 9px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--text-secondary);
            background: var(--background);
            padding: 1px 2px;
            border-radius: 2px;
        }

        .gcal-mini-day.selected .gcal-preview-item {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }

        /* Day/Agenda View */
        .gcal-day-view {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--surface);
            border-radius: var(--border-radius-sm);
            border: 1px solid var(--border);
            overflow: hidden;
        }

        .gcal-day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid var(--border);
            gap: 16px;
        }

        .gcal-day-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: var(--text-primary);
        }

        .gcal-timeline-container {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .gcal-time-slot {
            display: grid;
            grid-template-columns: 60px 1fr;
            min-height: 20px;
            border-bottom: 1px solid var(--border);
            transition: background-color var(--transition-fast);
        }

        .gcal-time-slot.full-hour {
            min-height: 60px;
            border-bottom: 1px solid var(--border-hover);
        }

        .gcal-time-slot:hover {
            background: var(--background);
        }

        .gcal-time-label {
            padding: 4px 8px;
            font-size: 11px;
            color: var(--text-secondary);
            text-align: right;
            border-right: 1px solid var(--border);
        }

        .gcal-events-column {
            padding: 2px 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .gcal-empty-slot {
            min-height: 40px;
        }

        .gcal-event {
            padding: 8px;
            background: var(--background);
            border-radius: 4px;
            cursor: pointer;
            transition: all var(--transition-fast);
            border-left: 3px solid var(--primary-color);
            border: 1px solid var(--border);
            border-left: 3px solid var(--primary-color);
        }

        .gcal-event:hover {
            box-shadow: var(--shadow-sm);
            transform: translateY(-1px);
        }

        .gcal-event-time {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 2px;
        }

        .gcal-event-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 2px;
        }

        .gcal-event-desc {
            font-size: 11px;
            color: var(--text-secondary);
        }

        /* Time Block Selection (Google Calendar Style) */
        .gcal-timeline-container {
            position: relative;
        }

        .gcal-time-block {
            position: absolute;
            left: 60px;
            right: 8px;
            background: var(--primary-color)22;
            border: 2px solid var(--primary-color);
            border-radius: 4px;
            z-index: 10;
            cursor: move;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .gcal-resize-handle {
            width: 100%;
            height: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: ns-resize;
            position: relative;
            z-index: 11;
        }

        .gcal-resize-handle::before {
            content: '';
            width: 30px;
            height: 4px;
            background: var(--primary-color);
            border-radius: 2px;
            opacity: 0.7;
        }

        .gcal-resize-handle:hover::before {
            opacity: 1;
            height: 6px;
        }

        .gcal-resize-handle.top {
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
        }

        .gcal-resize-handle.bottom {
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
        }

        .gcal-block-content {
            flex: 1;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
        }

        .gcal-block-time {
            font-size: 13px;
            font-weight: 600;
            color: var(--primary-color);
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
        }

        .gcal-block-add-btn {
            position: absolute;
            bottom: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: var(--primary-color);
            color: white;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow);
            transition: all var(--transition-fast);
            z-index: 12;
        }

        .gcal-block-add-btn:hover {
            transform: scale(1.1);
            box-shadow: var(--shadow-lg);
        }

        .gcal-block-add-btn:active {
            transform: scale(0.95);
        }

        /* Day Modal Styles */
        .gcal-day-modal-content {
            display: flex;
            flex-direction: column;
            height: 100%;
            max-height: 80vh;
        }

        .gcal-day-modal-content .gcal-day-header {
            padding: 16px;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
        }

        .gcal-day-modal-content .gcal-timeline-container {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        /* OLD CALENDAR STYLES (kept for finance calendar) */
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

        /* Landscape support */
        @media (orientation: landscape) {
            .gcal-mini-day {
                min-height: 60px;
            }
            .gcal-preview-item {
                font-size: 10px;
            }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .gcal-compact-stats {
                padding: 8px;
            }
            .gcal-stat-item {
                min-width: 70px;
            }
            .gcal-stat-label {
                font-size: 10px;
            }
            .gcal-stat-number {
                font-size: 16px;
            }
            .gcal-mini-day {
                min-height: 40px;
            }
            .gcal-day-header {
                flex-direction: column;
                align-items: stretch;
            }
            .gcal-day-title {
                font-size: 16px;
            }
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