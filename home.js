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
            // Removed renderStats() - today's overview section was removed
            this.renderRevenueForecast();
            this.renderUpcomingAppointments();
            this.renderPendingTasks();
            // Removed renderRecentClients() - recent clients section was removed
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
            const clients = window.SmartAgenda.DataManager.getAll('clients');

            // Get ALL pending/active appointments with money
            const pendingAppointments = appointments.filter(apt => {
                if (!apt.amount) return false;
                if (apt.status === 'cancelled' || apt.status === 'completed') return false;
                return true;
            });

            // Get today's appointments
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayAppointments = appointments.filter(apt => {
                if (!apt.date) return false;
                const aptDate = new Date(apt.date);
                return aptDate >= today && aptDate < tomorrow;
            });

            // Get pending tasks
            const pendingTasks = tasks.filter(task => {
                if (!task.amount) return false;
                if (task.completed) return false;
                return true;
            });

            // Get today's tasks
            const todayTasks = tasks.filter(task => {
                if (!task.date) return false;
                const taskDate = new Date(task.date);
                return taskDate >= today && taskDate < tomorrow;
            });

            // Calculate revenue (τζίρος) - always use amount
            const appointmentsRevenue = pendingAppointments.reduce((total, apt) => total + (parseFloat(apt.amount) || 0), 0);
            const tasksRevenue = pendingTasks.reduce((total, task) => total + (parseFloat(task.amount) || 0), 0);

            // Calculate profit (κέρδος) - use profit if exists, otherwise amount
            const appointmentsProfit = pendingAppointments.reduce((total, apt) => {
                const profit = apt.profit ? parseFloat(apt.profit) : parseFloat(apt.amount);
                return total + (profit || 0);
            }, 0);
            const tasksProfit = pendingTasks.reduce((total, task) => {
                const profit = task.profit ? parseFloat(task.profit) : parseFloat(task.amount);
                return total + (profit || 0);
            }, 0);

            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';
            const totalRevenue = appointmentsRevenue + tasksRevenue;
            const totalProfit = appointmentsProfit + tasksProfit;

            // Compact dashboard with grid layout
            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 12px;">
                    <!-- Today Stats -->
                    <div style="padding: 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Σήμερα</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${todayAppointments.length}</div>
                                <div style="font-size: 10px; color: var(--text-tertiary);">Ραντεβού</div>
                            </div>
                            <div>
                                <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${todayTasks.length}</div>
                                <div style="font-size: 10px; color: var(--text-tertiary);">Tasks</div>
                            </div>
                        </div>
                    </div>

                    <!-- Total Clients -->
                    <div style="padding: 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                            </svg>
                            <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Πελάτες</span>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${clients.length}</div>
                            <div style="font-size: 10px; color: var(--text-tertiary);">Συνολικοί</div>
                        </div>
                    </div>

                    <!-- Revenue Card -->
                    <div style="padding: 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Τζίρος</span>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: 700; color: var(--primary-color);">${currency}${totalRevenue.toFixed(0)}</div>
                            <div style="font-size: 10px; color: var(--text-tertiary);">Αναμενόμενος</div>
                        </div>
                    </div>

                    <!-- Profit Card -->
                    <div style="padding: 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Κέρδος</span>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: 700; color: var(--success);">${currency}${totalProfit.toFixed(0)}</div>
                            <div style="font-size: 10px; color: var(--text-tertiary);">Αναμενόμενο</div>
                        </div>
                    </div>
                </div>
            `;
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
                .slice(0, 3);

            container.innerHTML = '';

            if (upcoming.length === 0) {
                container.innerHTML = `
                    <div style="padding: 12px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
                        Δεν υπάρχουν ραντεβού
                    </div>
                `;
                return;
            }

            upcoming.forEach(apt => {
                const item = this.createCompactDashboardItem({
                    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
                    title: apt.clientName || 'Appointment',
                    subtitle: this.stripHtml(apt.desc || '').substring(0, 40) + '...',
                    meta: this.formatDate(apt.date),
                    color: '#2196F3',
                    onClick: () => {
                        if (window.SmartAgenda?.Navigation) {
                            window.SmartAgenda.Navigation.switchTab('appointments');
                        }
                        setTimeout(() => {
                            if (window.SmartAgenda.Appointments) {
                                window.SmartAgenda.Appointments.showAppointmentModal(apt);
                            }
                        }, 200);
                    }
                });
                container.appendChild(item);
            });

            // Add "View All" button
            const viewAllBtn = document.createElement('div');
            viewAllBtn.style.cssText = 'padding: 8px; text-align: center; color: var(--primary-color); font-size: 12px; font-weight: 600; cursor: pointer; border-top: 1px solid var(--border); margin-top: 8px;';
            viewAllBtn.textContent = `Δείτε όλα (${appointments.filter(apt => !apt.completed).length})`;
            viewAllBtn.onclick = () => {
                if (window.SmartAgenda?.Navigation) {
                    window.SmartAgenda.Navigation.switchTab('appointments');
                }
            };
            container.appendChild(viewAllBtn);
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
                    // Sort by priority first, then date
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    const aPriority = priorityOrder[a.priority] ?? 3;
                    const bPriority = priorityOrder[b.priority] ?? 3;

                    if (aPriority !== bPriority) {
                        return aPriority - bPriority;
                    }

                    if (a.date && b.date) {
                        return new Date(a.date) - new Date(b.date);
                    }
                    if (a.date) return -1;
                    if (b.date) return 1;
                    return 0;
                })
                .slice(0, 3);

            container.innerHTML = '';

            if (pending.length === 0) {
                container.innerHTML = `
                    <div style="padding: 12px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
                        Δεν υπάρχουν εκκρεμή tasks
                    </div>
                `;
                return;
            }

            pending.forEach(task => {
                const priorityConfig = {
                    high: { icon: '🔴', color: '#ef4444' },
                    medium: { icon: '🟠', color: '#f59e0b' },
                    low: { icon: '🟢', color: '#10b981' }
                };

                const priority = priorityConfig[task.priority] || { icon: '⚪', color: '#6b7280' };

                const item = this.createCompactDashboardItem({
                    icon: `<span style="font-size: 14px;">${priority.icon}</span>`,
                    title: task.clientName || this.stripHtml(task.desc || '').substring(0, 30) || 'Task',
                    subtitle: task.clientName ? this.stripHtml(task.desc || '').substring(0, 30) : (task.date ? this.formatDate(task.date) : ''),
                    meta: task.date && !task.clientName ? '' : (task.date ? this.formatDate(task.date) : ''),
                    color: priority.color,
                    onClick: () => {
                        if (window.SmartAgenda?.Navigation) {
                            window.SmartAgenda.Navigation.switchTab('tasks');
                        }
                        setTimeout(() => {
                            if (window.SmartAgenda.Tasks) {
                                window.SmartAgenda.Tasks.showTaskModal(task);
                            }
                        }, 200);
                    }
                });
                container.appendChild(item);
            });

            // Add "View All" button
            const viewAllBtn = document.createElement('div');
            viewAllBtn.style.cssText = 'padding: 8px; text-align: center; color: var(--primary-color); font-size: 12px; font-weight: 600; cursor: pointer; border-top: 1px solid var(--border); margin-top: 8px;';
            viewAllBtn.textContent = `Δείτε όλα (${tasks.filter(t => !t.completed).length})`;
            viewAllBtn.onclick = () => {
                if (window.SmartAgenda?.Navigation) {
                    window.SmartAgenda.Navigation.switchTab('tasks');
                }
            };
            container.appendChild(viewAllBtn);
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
                    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
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

        renderTopClients: function(mode = 'revenue') {
            const container = document.getElementById('top-clients-list');
            if (!container) return;

            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const clients = window.SmartAgenda.DataManager.getAll('clients');

            // Calculate revenue and profit per client
            const clientData = {};
            appointments.forEach(apt => {
                if (apt.client && apt.amount) {
                    if (!clientData[apt.client]) {
                        clientData[apt.client] = { revenue: 0, profit: 0 };
                    }
                    // Only count paid and partial payments
                    if (apt.paid === 'paid') {
                        const amount = parseFloat(apt.amount) || 0;
                        clientData[apt.client].revenue += amount;
                        // Use profit if exists, otherwise amount
                        const profit = apt.profit ? parseFloat(apt.profit) : amount;
                        clientData[apt.client].profit += profit;
                    } else if (apt.paid === 'partial') {
                        const amountPaid = parseFloat(apt.amountPaid) || 0;
                        clientData[apt.client].revenue += amountPaid;
                        // For partial, calculate proportional profit
                        const fullAmount = parseFloat(apt.amount) || 0;
                        const profitValue = apt.profit ? parseFloat(apt.profit) : fullAmount;
                        const proportionalProfit = (profitValue / fullAmount) * amountPaid;
                        clientData[apt.client].profit += proportionalProfit;
                    }
                }
            });

            // Get top 5 clients based on selected mode
            const sortKey = mode === 'profit' ? 'profit' : 'revenue';
            const topClients = Object.entries(clientData)
                .map(([clientId, data]) => {
                    const client = clients.find(c => String(c.id) === String(clientId));
                    return {
                        client: client,
                        revenue: data.revenue,
                        profit: data.profit
                    };
                })
                .filter(item => item.client)
                .sort((a, b) => b[sortKey] - a[sortKey])
                .slice(0, 5);

            container.innerHTML = '';

            // Add toggle button at the top
            const toggleContainer = document.createElement('div');
            toggleContainer.style.cssText = 'display: flex; justify-content: center; margin-bottom: 16px;';
            toggleContainer.innerHTML = `
                <div style="display: inline-flex; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 4px;">
                    <button id="toggle-revenue" style="padding: 6px 16px; border: none; background: ${mode === 'revenue' ? 'var(--primary-color)' : 'transparent'}; color: ${mode === 'revenue' ? 'white' : 'var(--text-primary)'}; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
                        Τζίρος
                    </button>
                    <button id="toggle-profit" style="padding: 6px 16px; border: none; background: ${mode === 'profit' ? 'var(--success)' : 'transparent'}; color: ${mode === 'profit' ? 'white' : 'var(--text-primary)'}; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
                        Κέρδος
                    </button>
                </div>
            `;
            container.appendChild(toggleContainer);

            // Bind toggle events
            const revenueBtn = container.querySelector('#toggle-revenue');
            const profitBtn = container.querySelector('#toggle-profit');
            revenueBtn.addEventListener('click', () => this.renderTopClients('revenue'));
            profitBtn.addEventListener('click', () => this.renderTopClients('profit'));

            if (topClients.length === 0) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'dashboard-empty';
                emptyDiv.innerHTML = '<p>No revenue data yet</p>';
                container.appendChild(emptyDiv);
                return;
            }

            const currency = window.SmartAgenda.State.get('currentCurrency') || '€';
            const maxValue = topClients[0][sortKey];

            topClients.forEach((item, index) => {
                const value = item[sortKey];
                const percentage = (value / maxValue) * 100;
                const clientItem = document.createElement('div');
                clientItem.className = 'top-client-item';
                clientItem.style.cssText = 'margin-bottom: 16px;';
                clientItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 600; color: var(--primary-color);">#${index + 1}</span>
                            <span style="font-weight: 500;">${this.escapeHtml(item.client.name)}</span>
                        </div>
                        <span style="font-weight: 600; color: var(--success);">${currency}${value.toFixed(2)}</span>
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
                        <div style="margin-bottom: 16px;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                        </div>
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
                                            <div style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                                <span>${dateTimeStr}</span>
                                            </div>
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

        /**
         * Create a compact dashboard item (smaller, condensed)
         */
        createCompactDashboardItem: function(options) {
            const { icon, title, subtitle, meta, color, onClick } = options;

            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                padding: 10px 12px;
                background: var(--surface);
                border-radius: 8px;
                border: 1px solid var(--border);
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;

            item.innerHTML = `
                <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; background: ${color ? color + '15' : 'var(--primary-light)'}; color: ${color || 'var(--primary-color)'}; margin-right: 12px; flex-shrink: 0;">
                    ${icon}
                </div>
                <div style="flex: 1; min-width: 0; overflow: hidden;">
                    <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${this.escapeHtml(title)}
                    </div>
                    ${subtitle ? `<div style="font-size: 11px; color: var(--text-tertiary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(subtitle)}</div>` : ''}
                </div>
                ${meta ? `<div style="font-size: 11px; color: var(--text-secondary); margin-left: 8px; flex-shrink: 0;">${this.escapeHtml(meta)}</div>` : ''}
            `;

            // Hover effect
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(4px)';
                item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                item.style.borderColor = color || 'var(--primary-color)';
            });

            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateX(0)';
                item.style.boxShadow = 'none';
                item.style.borderColor = 'var(--border)';
            });

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
