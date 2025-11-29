/**
 * Smart Agenda - Client Detail View
 * 
 * Enhanced client view with:
 * - Action buttons (Appointment, Task, Maps, SMS)
 * - Client information
 * - Edit button
 * - History (tasks, appointments, totals)
 */

(function() {
    'use strict';

    const ClientDetailView = {
        /**
         * Show detailed client view
         * @param {Object} client - Client object
         */
        show: function(client) {
            const i18n = window.SmartAgenda.I18n;
            const currency = window.SmartAgenda.State.get('currentCurrency');

            // Get client history
            const appointments = this.getClientAppointments(client.id);
            const tasks = this.getClientTasks(client.id);
            
            // Calculate totals
            const totalMoney = this.calculateTotalMoney(appointments, tasks);
            const completedAppointments = appointments.filter(a => a.completed).length;
            const completedTasks = tasks.filter(t => t.completed).length;

            const content = `
                <div class="client-detail-view">
                    <!-- Action Buttons -->
                    <div class="client-actions">
                        <button class="action-btn" id="btn-new-appointment">
                            <span class="action-icon">📅</span>
                            <span>New Appointment</span>
                        </button>
                        <button class="action-btn" id="btn-new-task">
                            <span class="action-icon">✓</span>
                            <span>New Task</span>
                        </button>
                        <button class="action-btn" id="btn-maps">
                            <span class="action-icon">🗺️</span>
                            <span>Maps</span>
                        </button>
                        <button class="action-btn" id="btn-sms">
                            <span class="action-icon">💬</span>
                            <span>SMS</span>
                        </button>
                    </div>

                    <!-- Client Information -->
                    <div class="client-info-section">
                        <h3>📋 Client Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">👤 Name</div>
                                <div class="info-value">${this.escapeHtml(client.name)}</div>
                            </div>
                            ${client.customerType ? `
                                <div class="info-item">
                                    <div class="info-label">🏷️ Type</div>
                                    <div class="info-value">
                                        <span class="contact-type ${client.customerType}">
                                            ${client.customerType === 'existing' ? 'Existing Client' : 'Potential Client'}
                                        </span>
                                    </div>
                                </div>
                            ` : ''}
                            ${client.phone ? `
                                <div class="info-item">
                                    <div class="info-label">📞 Phone${client.phoneType ? ' (' + client.phoneType.charAt(0).toUpperCase() + client.phoneType.slice(1) + ')' : ''}</div>
                                    <div class="info-value">
                                        <a href="tel:${client.phone}" class="info-link">${this.escapeHtml(client.phone)}</a>
                                    </div>
                                </div>
                            ` : ''}
                            ${client.phone2 ? `
                                <div class="info-item">
                                    <div class="info-label">📞 Phone 2${client.phone2Type ? ' (' + client.phone2Type.charAt(0).toUpperCase() + client.phone2Type.slice(1) + ')' : ''}</div>
                                    <div class="info-value">
                                        <a href="tel:${client.phone2}" class="info-link">${this.escapeHtml(client.phone2)}</a>
                                    </div>
                                </div>
                            ` : ''}
                            ${client.email ? `
                                <div class="info-item">
                                    <div class="info-label">📧 Email${client.emailType ? ' (' + client.emailType.charAt(0).toUpperCase() + client.emailType.slice(1) + ')' : ''}</div>
                                    <div class="info-value">
                                        <a href="mailto:${client.email}" class="info-link">${this.escapeHtml(client.email)}</a>
                                    </div>
                                </div>
                            ` : ''}
                            ${client.email2 ? `
                                <div class="info-item">
                                    <div class="info-label">📧 Email 2${client.email2Type ? ' (' + client.email2Type.charAt(0).toUpperCase() + client.email2Type.slice(1) + ')' : ''}</div>
                                    <div class="info-value">
                                        <a href="mailto:${client.email2}" class="info-link">${this.escapeHtml(client.email2)}</a>
                                    </div>
                                </div>
                            ` : ''}
                            ${client.address ? `
                                <div class="info-item full-width">
                                    <div class="info-label">📍 Address</div>
                                    <div class="info-value">${this.escapeHtml(client.address)}</div>
                                </div>
                            ` : ''}
                            ${client.facebook || client.instagram || client.linkedin || client.website ? `
                                <div class="info-item full-width">
                                    <div class="info-label">🌐 Social Media & Website</div>
                                    <div class="info-value" style="display: flex; flex-direction: column; gap: 8px;">
                                        ${client.facebook ? `
                                            <div>
                                                <strong>Facebook:</strong>
                                                <a href="${this.escapeHtml(client.facebook)}" target="_blank" class="info-link" style="word-break: break-all;">${this.escapeHtml(client.facebook)}</a>
                                            </div>
                                        ` : ''}
                                        ${client.instagram ? `
                                            <div>
                                                <strong>Instagram:</strong>
                                                <a href="${this.escapeHtml(client.instagram)}" target="_blank" class="info-link" style="word-break: break-all;">${this.escapeHtml(client.instagram)}</a>
                                            </div>
                                        ` : ''}
                                        ${client.linkedin ? `
                                            <div>
                                                <strong>LinkedIn:</strong>
                                                <a href="${this.escapeHtml(client.linkedin)}" target="_blank" class="info-link" style="word-break: break-all;">${this.escapeHtml(client.linkedin)}</a>
                                            </div>
                                        ` : ''}
                                        ${client.website ? `
                                            <div>
                                                <strong>Website:</strong>
                                                <a href="${this.escapeHtml(client.website)}" target="_blank" class="info-link" style="word-break: break-all;">${this.escapeHtml(client.website)}</a>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        ${client.desc ? `
                            <div class="info-item full-width" style="margin-top: 20px;">
                                <div class="info-label">📝 Notes</div>
                                <div class="client-notes">${client.desc}</div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- History Section -->
                    <div class="client-history-section">
                        <div class="history-header">
                            <h3>📊 History & Statistics</h3>
                            <button class="btn-link" id="btn-view-history">
                                View Full History →
                            </button>
                        </div>
                        <div class="stats-summary">
                            <div class="stat-item">
                                <div class="stat-number">${appointments.length}</div>
                                <div class="stat-label">Appointments</div>
                                <div class="stat-detail">${completedAppointments} completed</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${tasks.length}</div>
                                <div class="stat-label">Tasks</div>
                                <div class="stat-detail">${completedTasks} completed</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${currency}${totalMoney.toFixed(2)}</div>
                                <div class="stat-label">Total Revenue</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: client.name,
                content: content,
                buttons: [
                    {
                        label: 'Edit Client',
                        type: 'secondary',
                        action: 'edit',
                        onClick: (modal) => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            window.SmartAgenda.Clients.showClientModal(client);
                        }
                    },
                    {
                        label: 'Close',
                        type: 'primary',
                        action: 'close',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'large'
            });

            // Bind action buttons
            this.bindActionButtons(modal, client);
        },

        /**
         * Show full history modal
         */
        showHistory: function(client) {
            const appointments = this.getClientAppointments(client.id);
            const tasks = this.getClientTasks(client.id);

            // Combine and sort by date
            const history = [
                ...appointments.map(a => ({ ...a, type: 'appointment' })),
                ...tasks.map(t => ({ ...t, type: 'task' }))
            ].sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA; // Newest first
            });

            let historyHtml = '<div class="history-list">';

            if (history.length === 0) {
                historyHtml += '<div class="history-empty">No history yet</div>';
            } else {
                history.forEach(item => {
                    const icon = item.type === 'appointment' ? '📅' : '✓';
                    const typeLabel = item.type === 'appointment' ? 'Appointment' : 'Task';
                    const statusClass = item.completed ? 'completed' : 'pending';
                    const date = item.date ? this.formatDateTime(item.date) : 'No date';
                    const amount = item.amount ? `${window.SmartAgenda.State.get('currentCurrency')}${parseFloat(item.amount).toFixed(2)}` : '';

                    historyHtml += `
                        <div class="history-item ${statusClass}" data-type="${item.type}" data-id="${item.id}">
                            <div class="history-icon">${icon}</div>
                            <div class="history-content">
                                <div class="history-title">
                                    <span class="history-type">${typeLabel}</span>
                                    ${item.completed ? '<span class="history-badge completed">✓ Completed</span>' : ''}
                                </div>
                                ${item.desc ? `<div class="history-desc">${this.stripHtml(item.desc).substring(0, 100)}</div>` : ''}
                                <div class="history-meta">
                                    <span>${date}</span>
                                    ${amount ? `<span class="history-amount">${amount}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

            historyHtml += '</div>';

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: `History - ${client.name}`,
                content: historyHtml,
                buttons: [
                    {
                        label: 'Close',
                        type: 'primary',
                        action: 'close',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'large'
            });

            // Make history items clickable
            modal.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    const type = item.dataset.type;
                    window.SmartAgenda.UIComponents.closeModal(modal);
                    
                    if (type === 'appointment') {
                        const apt = window.SmartAgenda.DataManager.getById('appointments', id);
                        if (apt && window.SmartAgenda.Appointments?.showAppointmentModal) {
                            window.SmartAgenda.Appointments.showAppointmentModal(apt);
                        }
                    } else {
                        const task = window.SmartAgenda.DataManager.getById('tasks', id);
                        if (task) {
                            window.SmartAgenda.Tasks.showTaskModal(task);
                        }
                    }
                });
            });
        },

        bindActionButtons: function(modal, client) {
            // New Appointment
            const btnAppointment = modal.querySelector('#btn-new-appointment');
            btnAppointment?.addEventListener('click', () => {
                window.SmartAgenda.UIComponents.closeModal(modal);
                if (window.SmartAgenda.Appointments?.showAppointmentModal) {
                    window.SmartAgenda.Appointments.showAppointmentModal(null, client.id);
                } else {
                    window.SmartAgenda.Toast.error('Appointments module not loaded');
                }
            });

            // New Task
            const btnTask = modal.querySelector('#btn-new-task');
            btnTask?.addEventListener('click', () => {
                window.SmartAgenda.UIComponents.closeModal(modal);
                window.SmartAgenda.Tasks.showTaskModal(null, client.id);
            });

            // Maps
            const btnMaps = modal.querySelector('#btn-maps');
            btnMaps?.addEventListener('click', () => {
                if (client.lat && client.lng) {
                    // Close this modal and show client on internal map page
                    window.SmartAgenda.UIComponents.closeModal(modal);

                    // Switch to map tab
                    if (window.SmartAgenda?.Navigation) {
                        window.SmartAgenda.Navigation.switchTab('map');

                        // After a brief delay, center map on client and open info window
                        setTimeout(() => {
                            if (window.SmartAgenda?.Maps) {
                                window.SmartAgenda.Maps.showClientOnMap(client.id);
                            }
                        }, 300);
                    }
                } else if (client.address) {
                    window.SmartAgenda.Toast.warning('Client has address but no coordinates. Please update location.');
                } else {
                    window.SmartAgenda.Toast.error('No location available for this client');
                }
            });

            // SMS
            const btnSms = modal.querySelector('#btn-sms');
            btnSms?.addEventListener('click', () => {
                if (client.phone) {
                    const smsUrl = `sms:${client.phone}`;
                    window.location.href = smsUrl;
                } else {
                    window.SmartAgenda.Toast.error('No phone number for this client');
                }
            });

            // View History
            const btnHistory = modal.querySelector('#btn-view-history');
            btnHistory?.addEventListener('click', () => {
                window.SmartAgenda.UIComponents.closeModal(modal);
                this.showHistory(client);
            });
        },

        getClientAppointments: function(clientId) {
            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            return appointments.filter(a => a.client == clientId);
        },

        getClientTasks: function(clientId) {
            const tasks = window.SmartAgenda.DataManager.getAll('tasks');
            return tasks.filter(t => t.client == clientId);
        },

        calculateTotalMoney: function(appointments, tasks) {
            let total = 0;
            appointments.forEach(a => {
                if (a.amount) total += parseFloat(a.amount);
            });
            tasks.forEach(t => {
                if (t.amount) total += parseFloat(t.amount);
            });
            return total;
        },

        formatDateTime: function(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, { 
                year: 'numeric',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
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
        .client-detail-view {
            padding: 0;
        }

        .client-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 24px;
            padding: 0;
        }

        .action-btn {
            padding: 16px 12px;
            border: 2px solid var(--border);
            border-radius: 12px;
            background: var(--surface);
            color: var(--text-primary);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            position: relative;
            overflow: hidden;
        }

        .action-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.1));
            opacity: 0;
            transition: opacity 0.2s;
        }

        .action-btn:hover {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-btn:hover::before {
            opacity: 1;
        }

        .action-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .action-icon {
            font-size: 24px;
            transition: transform 0.2s;
        }

        .action-btn:hover .action-icon {
            transform: scale(1.1);
        }

        .client-info-section, .client-history-section {
            background: linear-gradient(to bottom, var(--surface), var(--background));
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .client-info-section h3, .client-history-section h3 {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--text-primary);
            padding-bottom: 12px;
            border-bottom: 2px solid var(--border);
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            background: var(--background);
            border-radius: 10px;
            border: 1px solid var(--border);
            transition: all 0.2s;
        }

        .info-item:hover {
            border-color: var(--primary-color);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transform: translateY(-1px);
        }

        .info-item.full-width {
            grid-column: 1 / -1;
        }

        .info-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-secondary);
            letter-spacing: 1px;
            margin-bottom: 4px;
        }

        .info-value {
            font-size: 16px;
            color: var(--text-primary);
            font-weight: 500;
            line-height: 1.5;
        }

        .info-link {
            color: var(--primary-color);
            text-decoration: none;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
        }

        .info-link:hover {
            opacity: 0.8;
            transform: translateX(2px);
        }

        .client-notes {
            line-height: 1.8;
            margin-top: 8px;
            padding: 16px;
            background: var(--background);
            border-radius: 10px;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .history-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .stats-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .stat-item {
            text-align: center;
            padding: 24px 16px;
            background: linear-gradient(135deg, var(--surface), var(--background));
            border-radius: 16px;
            border: 2px solid var(--border);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .stat-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color), var(--success));
            opacity: 0;
            transition: opacity 0.3s;
        }

        .stat-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
            border-color: var(--primary-color);
        }

        .stat-item:hover::before {
            opacity: 1;
        }

        .stat-number {
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary-color), var(--success));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            line-height: 1;
        }

        .stat-label {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-primary);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
        }

        .stat-detail {
            font-size: 12px;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .history-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 60vh;
            overflow-y: auto;
            padding-right: 4px;
        }

        .history-list::-webkit-scrollbar {
            width: 6px;
        }

        .history-list::-webkit-scrollbar-track {
            background: var(--background);
            border-radius: 10px;
        }

        .history-list::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 10px;
        }

        .history-list::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }

        .history-item {
            display: flex;
            gap: 16px;
            padding: 16px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .history-item:hover {
            border-color: var(--primary-color);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transform: translateX(4px);
        }

        .history-item.completed {
            opacity: 0.7;
        }

        .history-icon {
            font-size: 24px;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--surface), var(--background));
            border-radius: 12px;
            flex-shrink: 0;
            border: 1px solid var(--border);
        }

        .history-content {
            flex: 1;
            min-width: 0;
        }

        .history-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 6px;
            flex-wrap: wrap;
        }

        .history-type {
            font-weight: 700;
            color: var(--text-primary);
            font-size: 15px;
        }

        .history-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }

        .history-badge.completed {
            background: var(--success)22;
            color: var(--success);
        }

        .history-desc {
            font-size: 14px;
            color: var(--text-secondary);
            margin-bottom: 8px;
            line-height: 1.5;
        }

        .history-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 13px;
            color: var(--text-tertiary);
            font-weight: 500;
        }

        .history-amount {
            font-weight: 700;
            color: var(--primary-color);
            font-size: 14px;
        }

        .history-empty {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-secondary);
            font-size: 16px;
            font-weight: 500;
        }

        .btn-link {
            background: transparent;
            border: none;
            color: var(--primary-color);
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .btn-link:hover {
            background: var(--primary-color)15;
            transform: translateX(4px);
        }

        .contact-type {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
        }

        .contact-type.existing {
            background: var(--success)22;
            color: var(--success);
        }

        .contact-type.potential {
            background: var(--primary-color)22;
            color: var(--primary-color);
        }
    `;
    document.head.appendChild(styles);

    // Add to global API
    if (window.SmartAgenda) {
        window.SmartAgenda.ClientDetailView = ClientDetailView;
    }

})();
