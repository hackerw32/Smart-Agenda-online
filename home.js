/**
 * Smart Agenda - Home/Dashboard Module
 * 
 * Displays overview of today's activities:
 * - Appointments count
 * - Tasks count
 * - Revenue
 * - Upcoming items
 */

(function() {
    'use strict';

    const Home = {
        init: function() {
            this.bindEvents();
            this.render();
        },

        bindEvents: function() {
            // Listen to data changes
            if (window.SmartAgenda) {
                window.SmartAgenda.EventBus.on('data:change', () => this.render());
                window.SmartAgenda.EventBus.on('language:change', () => this.render());
                window.SmartAgenda.EventBus.on('tab:change', (tab) => {
                    if (tab === 'home') {
                        this.render();
                    }
                });
            }
        },

        render: function() {
            this.renderStats();
            this.renderRevenueForecast();
            this.renderUpcomingAppointments();
            this.renderPendingTasks();
            this.renderRecentClients();
            this.renderAnalytics();
        },

        // ============================================
        // Today's Statistics
        // ============================================

        renderStats: function() {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get today's appointments
            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const todayAppointments = appointments.filter(apt => {
                if (!apt.date) return false;
                const aptDate = new Date(apt.date);
                return aptDate >= today && aptDate < tomorrow;
            });

            // Get today's tasks
            const tasks = window.SmartAgenda.DataManager.getAll('tasks');
            const todayTasks = tasks.filter(task => {
                if (!task.date) return false;
                const taskDate = new Date(task.date);
                return taskDate >= today && taskDate < tomorrow;
            });

            // Calculate today's revenue - only count paid and partial payments
            const todayRevenue = todayAppointments.reduce((sum, apt) => {
                if (!apt.amount) return sum;
                if (apt.paid === 'paid') {
                    return sum + (parseFloat(apt.amount) || 0);
                } else if (apt.paid === 'partial') {
                    return sum + (parseFloat(apt.amountPaid) || 0);
                }
                return sum; // unpaid = 0
            }, 0);

            // Update UI
            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';
            
            document.getElementById('today-appointments').textContent = todayAppointments.length;
            document.getElementById('today-tasks').textContent = todayTasks.length;
            document.getElementById('today-revenue').textContent = `${currency}${todayRevenue.toFixed(2)}`;
        },

        // ============================================
        // Revenue Forecast
        // ============================================

        renderRevenueForecast: function() {
            const container = document.getElementById('revenue-forecast');
            if (!container) return;

            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const tasks = window.SmartAgenda.DataManager.getAll('tasks');

            // Get ALL pending/active appointments with money
            const pendingAppointments = appointments.filter(apt => {
                if (!apt.amount) return false;
                if (apt.status === 'cancelled' || apt.status === 'completed') return false;
                return true;
            });

            // Get ALL pending tasks with money
            const pendingTasks = tasks.filter(task => {
                if (!task.amount) return false;
                if (task.completed) return false;
                return true;
            });

            const appointmentsRevenue = pendingAppointments.reduce((total, apt) => total + (parseFloat(apt.amount) || 0), 0);
            const tasksRevenue = pendingTasks.reduce((total, task) => total + (parseFloat(task.amount) || 0), 0);

            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';

            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
                    <div id="appointments-revenue-card" style="padding: 16px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Appointments (${pendingAppointments.length})</div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">${currency}${appointmentsRevenue.toFixed(2)}</div>
                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">Click to view details</div>
                    </div>
                    <div id="tasks-revenue-card" style="padding: 16px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Tasks (${pendingTasks.length})</div>
                        <div style="font-size: 24px; font-weight: 700; color: var(--success);">${currency}${tasksRevenue.toFixed(2)}</div>
                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">Click to view details</div>
                    </div>
                </div>
            `;

            // Bind click events to show modals
            const appointmentsCard = document.getElementById('appointments-revenue-card');
            const tasksCard = document.getElementById('tasks-revenue-card');

            appointmentsCard?.addEventListener('click', () => {
                this.showRevenueDetailsModal('appointments');
            });

            tasksCard?.addEventListener('click', () => {
                this.showRevenueDetailsModal('tasks');
            });
        },

        // ============================================
        // Upcoming Appointments
        // ============================================

        renderUpcomingAppointments: function() {
            const container = document.getElementById('dashboard-appointments');
            if (!container) return;

            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const now = new Date();

            // Get upcoming appointments (next 7 days, not completed)
            const upcoming = appointments
                .filter(apt => {
                    if (apt.completed) return false;
                    if (!apt.date) return false;
                    const aptDate = new Date(apt.date);
                    const daysDiff = Math.ceil((aptDate - now) / (1000 * 60 * 60 * 24));
                    return daysDiff >= 0 && daysDiff <= 7;
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5);

            container.innerHTML = '';

            if (upcoming.length === 0) {
                container.innerHTML = `
                    <div class="dashboard-empty">
                        <p>No upcoming appointments</p>
                    </div>
                `;
                return;
            }

            upcoming.forEach(apt => {
                const item = this.createDashboardItem({
                    icon: '📅',
                    title: apt.clientName || 'Appointment',
                    subtitle: this.stripHtml(apt.desc || ''),
                    meta: this.formatDate(apt.date),
                    onClick: () => {
                        // Switch to appointments tab and open the specific appointment
                        if (window.SmartAgenda?.Navigation) {
                            window.SmartAgenda.Navigation.switchTab('appointments');
                        }
                        // After a short delay, open the appointment modal
                        setTimeout(() => {
                            if (window.SmartAgenda.Appointments) {
                                window.SmartAgenda.Appointments.showAppointmentModal(apt);
                            }
                        }, 200);
                    }
                });
                container.appendChild(item);
            });
        },

        // ============================================
        // Pending Tasks
        // ============================================

        renderPendingTasks: function() {
            const container = document.getElementById('dashboard-tasks');
            if (!container) return;

            const tasks = window.SmartAgenda.DataManager.getAll('tasks');

            // Get pending tasks (not completed)
            const pending = tasks
                .filter(task => !task.completed)
                .sort((a, b) => {
                    // Sort by date
                    if (a.date && b.date) {
                        return new Date(a.date) - new Date(b.date);
                    }
                    if (a.date) return -1;
                    if (b.date) return 1;
                    return 0;
                })
                .slice(0, 5);

            container.innerHTML = '';

            if (pending.length === 0) {
                container.innerHTML = `
                    <div class="dashboard-empty">
                        <p>No pending tasks</p>
                    </div>
                `;
                return;
            }

            pending.forEach(task => {
                const priorityColors = {
                    high: '🔴',
                    medium: '🟡',
                    low: '🟢'
                };

                const item = this.createDashboardItem({
                    icon: priorityColors[task.priority] || '✓',
                    title: task.clientName || this.stripHtml(task.desc || '') || 'Task',
                    subtitle: task.clientName ? this.stripHtml(task.desc || '') : '',
                    meta: task.date ? this.formatDate(task.date) : '',
                    onClick: () => {
                        // Switch to tasks tab and open the specific task
                        if (window.SmartAgenda?.Navigation) {
                            window.SmartAgenda.Navigation.switchTab('tasks');
                        }
                        // After a short delay, open the task modal
                        setTimeout(() => {
                            if (window.SmartAgenda.Tasks) {
                                window.SmartAgenda.Tasks.showTaskModal(task);
                            }
                        }, 200);
                    }
                });
                container.appendChild(item);
            });
        },

        // ============================================
        // Recent Clients
        // ============================================

        renderRecentClients: function() {
            const container = document.getElementById('dashboard-clients');
            if (!container) return;

            const clients = window.SmartAgenda.DataManager.getAll('clients');

            // Get most recent clients
            const recent = clients
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            container.innerHTML = '';

            if (recent.length === 0) {
                container.innerHTML = `
                    <div class="dashboard-empty">
                        <p>No clients yet</p>
                    </div>
                `;
                return;
            }

            recent.forEach(client => {
                const item = this.createDashboardItem({
                    icon: '👤',
                    title: client.name,
                    subtitle: client.phone || client.email || client.address || '',
                    meta: client.customerType === 'existing' ? 'Existing' : 'Potential',
                    onClick: () => {
                        window.SmartAgenda.Navigation.switchTab('clients');
                    }
                });
                container.appendChild(item);
            });
        },

        // ============================================
        // Analytics
        // ============================================

        renderAnalytics: function() {
            this.renderTopClients();
            this.renderRevenueChart();
        },

        renderTopClients: function() {
            const container = document.getElementById('top-clients-list');
            if (!container) return;

            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const clients = window.SmartAgenda.DataManager.getAll('clients');

            // Calculate revenue per client - only count paid and partial payments
            const clientRevenue = {};
            appointments.forEach(apt => {
                if (apt.client && apt.amount) {
                    if (!clientRevenue[apt.client]) {
                        clientRevenue[apt.client] = 0;
                    }
                    // Only count paid and partial payments
                    if (apt.paid === 'paid') {
                        clientRevenue[apt.client] += parseFloat(apt.amount) || 0;
                    } else if (apt.paid === 'partial') {
                        clientRevenue[apt.client] += parseFloat(apt.amountPaid) || 0;
                    }
                }
            });

            // Get top 5 clients
            const topClients = Object.entries(clientRevenue)
                .map(([clientId, revenue]) => {
                    const client = clients.find(c => String(c.id) === String(clientId));
                    return {
                        client: client,
                        revenue: revenue
                    };
                })
                .filter(item => item.client)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            container.innerHTML = '';

            if (topClients.length === 0) {
                container.innerHTML = `
                    <div class="dashboard-empty">
                        <p>No revenue data yet</p>
                    </div>
                `;
                return;
            }

            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';
            const maxRevenue = topClients[0].revenue;

            topClients.forEach((item, index) => {
                const percentage = (item.revenue / maxRevenue) * 100;
                const clientItem = document.createElement('div');
                clientItem.className = 'top-client-item';
                clientItem.style.cssText = 'margin-bottom: 16px;';
                clientItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 600; color: var(--primary-color);">#${index + 1}</span>
                            <span style="font-weight: 500;">${this.escapeHtml(item.client.name)}</span>
                        </div>
                        <span style="font-weight: 600; color: var(--success);">${currency}${item.revenue.toFixed(2)}</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, var(--primary-color), var(--success)); transition: width 0.3s ease;"></div>
                    </div>
                `;
                container.appendChild(clientItem);
            });
        },

        renderRevenueChart: function() {
            const container = document.getElementById('revenue-chart');
            if (!container) return;

            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';

            // Get last 7 days
            const days = [];
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                days.push(date);
            }

            // Calculate revenue per day
            const revenueByDay = days.map(day => {
                const nextDay = new Date(day);
                nextDay.setDate(nextDay.getDate() + 1);

                const dayRevenue = appointments
                    .filter(apt => {
                        if (!apt.date || !apt.amount) return false;
                        const aptDate = new Date(apt.date);
                        return aptDate >= day && aptDate < nextDay;
                    })
                    .reduce((sum, apt) => sum + (parseFloat(apt.amount) || 0), 0);

                return {
                    date: day,
                    revenue: dayRevenue
                };
            });

            const maxRevenue = Math.max(...revenueByDay.map(d => d.revenue), 100);

            container.innerHTML = '';
            container.style.cssText = 'display: flex; align-items: flex-end; gap: 8px; height: 150px; padding: 16px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);';

            revenueByDay.forEach(item => {
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const bar = document.createElement('div');
                bar.style.cssText = `
                    flex: 1;
                    background: linear-gradient(180deg, var(--primary-color), var(--primary-color)CC);
                    border-radius: 4px 4px 0 0;
                    height: ${height}%;
                    min-height: 2px;
                    position: relative;
                    transition: all 0.3s ease;
                    cursor: pointer;
                `;

                bar.title = `${item.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: ${currency}${item.revenue.toFixed(2)}`;

                bar.addEventListener('mouseenter', function() {
                    this.style.background = 'linear-gradient(180deg, var(--success), var(--success)CC)';
                    this.style.transform = 'scale(1.05)';
                });

                bar.addEventListener('mouseleave', function() {
                    this.style.background = 'linear-gradient(180deg, var(--primary-color), var(--primary-color)CC)';
                    this.style.transform = 'scale(1)';
                });

                const label = document.createElement('div');
                label.style.cssText = `
                    position: absolute;
                    bottom: -20px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 10px;
                    color: var(--text-secondary);
                    white-space: nowrap;
                `;
                label.textContent = item.date.toLocaleDateString(undefined, { weekday: 'short' }).substring(0, 1);
                bar.appendChild(label);

                container.appendChild(bar);
            });
        },

        // ============================================
        // Revenue Details Modal
        // ============================================

        showRevenueDetailsModal: function(type) {
            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const tasks = window.SmartAgenda.DataManager.getAll('tasks');
            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';

            let filteredItems = [];
            let title = '';
            let itemType = '';

            if (type === 'appointments') {
                // ALL pending/active appointments with money
                title = 'Pending Appointments';
                itemType = 'appointment';
                filteredItems = appointments.filter(apt => {
                    if (!apt.amount) return false;
                    if (apt.status === 'cancelled' || apt.status === 'completed') return false;
                    return true;
                }).map(apt => ({ ...apt, type: 'appointment' }));
            } else if (type === 'tasks') {
                // ALL pending tasks with money
                title = 'Pending Tasks';
                itemType = 'task';
                filteredItems = tasks.filter(task => {
                    if (!task.amount) return false;
                    if (task.completed) return false;
                    return true;
                }).map(task => ({ ...task, type: 'task' }));
            }

            // Sort by date (items with date first, then items without date)
            filteredItems.sort((a, b) => {
                if (a.date && !b.date) return -1;
                if (!a.date && b.date) return 1;
                if (a.date && b.date) return new Date(a.date) - new Date(b.date);
                return 0;
            });

            // Build content - Mobile-optimized card layout
            let content = '';
            if (filteredItems.length === 0) {
                content = `
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                        <div>No ${itemType}s found</div>
                    </div>
                `;
            } else {
                const totalAmount = filteredItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

                content = `
                    <div style="max-height: 500px; overflow-y: auto; padding: 8px;">
                        ${filteredItems.map(item => {
                            const amount = parseFloat(item.amount) || 0;
                            const itemName = item.type === 'appointment' ? (item.clientName || 'Unknown') : (item.title || item.desc || 'Task');

                            let dateTimeStr = '';
                            if (item.date) {
                                const date = new Date(item.date);
                                const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                                dateTimeStr = `${dateStr} ${timeStr}`;
                            } else {
                                dateTimeStr = 'No due date';
                            }

                            let statusBadge = '';
                            if (item.type === 'appointment') {
                                statusBadge = item.paid === 'paid' ? '<span style="background: var(--success); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">PAID</span>' :
                                             item.paid === 'partial' ? '<span style="background: var(--warning); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">PARTIAL</span>' :
                                             '<span style="background: var(--danger); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">UNPAID</span>';
                            } else {
                                const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
                                const priorityColor = priorityColors[item.priority] || '#94a3b8';
                                statusBadge = `<span style="background: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${(item.priority || 'medium').toUpperCase()}</span>`;
                            }

                            return `
                                <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;"
                                     onclick="window.SmartAgenda.Home.viewItem('${item.type}', '${item.id}')"
                                     onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
                                     onmouseout="this.style.transform=''; this.style.boxShadow='';">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                        <div style="flex: 1; min-width: 0;">
                                            <div style="font-weight: 600; font-size: 15px; color: var(--text-primary); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(itemName)}</div>
                                            <div style="font-size: 12px; color: var(--text-secondary);">📅 ${dateTimeStr}</div>
                                        </div>
                                        <div style="font-size: 18px; font-weight: 700; color: var(--success); margin-left: 12px; white-space: nowrap;">${currency}${amount.toFixed(2)}</div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        ${statusBadge}
                                        <div style="font-size: 11px; color: var(--text-tertiary);">Tap for details →</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="border-top: 2px solid var(--border); padding: 16px; background: var(--surface); display: flex; justify-content: space-between; align-items: center; border-radius: 0 0 8px 8px;">
                        <div style="font-weight: 600; font-size: 14px;">Total:</div>
                        <div style="font-weight: 700; font-size: 20px; color: var(--success);">${currency}${totalAmount.toFixed(2)}</div>
                    </div>
                `;
            }

            // Show modal
            window.SmartAgenda.UIComponents.showModal({
                title: title,
                content: content,
                buttons: [
                    {
                        label: 'Close',
                        type: 'secondary',
                        action: 'close',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'large'
            });
        },

        viewItem: function(itemType, itemId) {
            // Close the revenue modal
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => window.SmartAgenda.UIComponents.closeModal(modal));

            if (itemType === 'appointment') {
                // Switch to appointments tab and show the appointment
                if (window.SmartAgenda?.Navigation) {
                    window.SmartAgenda.Navigation.switchTab('appointments');
                }

                // After a short delay, open the appointment modal
                setTimeout(() => {
                    const appointment = window.SmartAgenda.DataManager.getById('appointments', itemId);
                    if (appointment && window.SmartAgenda.Appointments) {
                        window.SmartAgenda.Appointments.showAppointmentModal(appointment);
                    }
                }, 200);
            } else if (itemType === 'task') {
                // Switch to tasks tab and show the task
                if (window.SmartAgenda?.Navigation) {
                    window.SmartAgenda.Navigation.switchTab('tasks');
                }

                // After a short delay, open the task modal
                setTimeout(() => {
                    const task = window.SmartAgenda.DataManager.getById('tasks', itemId);
                    if (task && window.SmartAgenda.Tasks) {
                        window.SmartAgenda.Tasks.showTaskModal(task);
                    }
                }, 200);
            }
        },

        // ============================================
        // Helper Functions
        // ============================================

        createDashboardItem: function(options) {
            const { icon, title, subtitle, meta, onClick } = options;

            const item = document.createElement('div');
            item.className = 'dashboard-item';
            item.innerHTML = `
                <div class="dashboard-item-icon">${icon}</div>
                <div class="dashboard-item-content">
                    <div class="dashboard-item-title">${this.escapeHtml(title)}</div>
                    ${subtitle ? `<div class="dashboard-item-subtitle">${this.escapeHtml(subtitle)}</div>` : ''}
                </div>
                ${meta ? `<div class="dashboard-item-meta">${this.escapeHtml(meta)}</div>` : ''}
            `;

            if (onClick) {
                item.addEventListener('click', onClick);
            }

            return item;
        },

        formatDate: function(dateString) {
            if (!dateString) return '';

            const date = new Date(dateString);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            if (dateOnly.getTime() === today.getTime()) {
                return 'Today';
            } else if (dateOnly.getTime() === tomorrow.getTime()) {
                return 'Tomorrow';
            } else {
                // Format as "Nov 8" or "8 Nov" based on locale
                const options = { month: 'short', day: 'numeric' };
                return date.toLocaleDateString(undefined, options);
            }
        },

        stripHtml: function(html) {
            if (!html) return '';
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent || div.innerText || '';
        },

        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Initialize when app is ready
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            Home.init();
        });
        window.SmartAgenda.Home = Home;
    }

})();
