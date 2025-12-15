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
            // Store current client for file operations
            this.currentClient = client;

            // Also store in FileViewer if available
            if (window.SmartAgenda?.FileViewer) {
                window.SmartAgenda.FileViewer.currentClient = client;
            }

            const i18n = window.SmartAgenda.I18n;
            const currency = window.SmartAgenda.State.get('currentCurrency');

            // Get client history
            const appointments = this.getClientAppointments(client.id);
            const tasks = this.getClientTasks(client.id);
            const interactions = this.getClientInteractions(client.id);

            // Calculate totals
            const totalMoney = this.calculateTotalMoney(appointments, tasks);
            const completedAppointments = appointments.filter(a => a.completed).length;
            const completedTasks = tasks.filter(t => t.completed).length;

            // Get last 2 interactions for preview
            const recentInteractions = interactions.slice(0, 2);

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
                            ${client.contactName ? `
                                <div class="info-item">
                                    <div class="info-label">👥 Contact Person</div>
                                    <div class="info-value">${this.escapeHtml(client.contactName)}</div>
                                </div>
                            ` : ''}
                            ${this.getClientTypesHTML(client)}
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
                                    <div class="info-label">📍 Address (Legacy)</div>
                                    <div class="info-value">${this.escapeHtml(client.address)}</div>
                                </div>
                            ` : ''}
                            ${this.getAddressesHTML(client)}
                            ${this.getContactPersonsHTML(client)}
                            ${this.getFilesHTML(client)}
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
                            <div style="margin-top: 20px; padding: 16px; background: var(--background); border-radius: 10px; border: 1px solid var(--border);">
                                <div class="info-label" style="margin: 0 0 12px 0;">📝 Notes</div>
                                <div class="client-notes-content">
                                    ${client.desc}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- History & Statistics Section -->
                    <div class="client-history-section">
                        <h3>📊 History & Statistics</h3>

                        <!-- Top Row: Appointments and Tasks side by side -->
                        <div class="stats-grid-row">
                            <div class="stat-item clickable" id="btn-view-appointments">
                                <div class="stat-number">${appointments.length}</div>
                                <div class="stat-label">📅 Appointments</div>
                                <div class="stat-detail">${completedAppointments} completed</div>
                            </div>
                            <div class="stat-item clickable" id="btn-view-tasks">
                                <div class="stat-number">${tasks.length}</div>
                                <div class="stat-label">✓ Tasks</div>
                                <div class="stat-detail">${completedTasks} completed</div>
                            </div>
                        </div>

                        <!-- Interactions Preview Section -->
                        <div class="interactions-preview-section">
                            <div class="interactions-header">
                                <h4>🤝 Recent Interactions</h4>
                                <button class="btn-add-interaction" id="btn-add-interaction" title="Προσθήκη Interaction">
                                    <span>+</span>
                                </button>
                            </div>
                            <div class="interactions-preview" id="interactions-preview">
                                ${interactions.length === 0 ? `
                                    <div class="interactions-empty">
                                        <span>No interactions yet</span>
                                    </div>
                                ` : recentInteractions.map(interaction => `
                                    <div class="interaction-preview-item">
                                        <div class="interaction-icon">${interaction.type === 'checkin' ? '📍' : '📞'}</div>
                                        <div class="interaction-content">
                                            <div class="interaction-type">${interaction.type === 'checkin' ? 'Check-in' : 'Follow-up'}</div>
                                            <div class="interaction-date">${this.formatDateTime(interaction.date)}</div>
                                            ${interaction.notes ? `<div class="interaction-notes">${this.escapeHtml(interaction.notes).substring(0, 50)}${interaction.notes.length > 50 ? '...' : ''}</div>` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            ${interactions.length > 0 ? `
                                <button class="btn-view-all-interactions" id="btn-view-interactions">
                                    View All ${interactions.length} Interaction${interactions.length > 1 ? 's' : ''} →
                                </button>
                            ` : ''}
                        </div>

                        <!-- Total Revenue -->
                        <div class="stat-item-full">
                            <div class="stat-number">${currency}${totalMoney.toFixed(2)}</div>
                            <div class="stat-label">💰 Total Revenue</div>
                        </div>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: client.name,
                content: content,
                buttons: [
                    {
                        label: 'Αλλαγή Πελάτη',
                        type: 'secondary',
                        action: 'edit',
                        onClick: (parentModal) => {
                            // Hide parent modal temporarily
                            parentModal.style.display = 'none';

                            // Show edit modal
                            window.SmartAgenda.Clients.showClientModal(client);

                            // Listen for modal close events to restore parent modal
                            const checkForEditModalClose = setInterval(() => {
                                // Check if edit modal is closed
                                const editModal = document.querySelector('.modal-overlay:not([style*="display: none"])');
                                if (!editModal) {
                                    clearInterval(checkForEditModalClose);
                                    // Edit modal is closed, refresh and show parent modal
                                    const clientId = client.id;
                                    const updatedClient = window.SmartAgenda.DataManager.getById('clients', clientId);
                                    window.SmartAgenda.UIComponents.closeModal(parentModal);
                                    if (updatedClient) {
                                        this.show(updatedClient);
                                    }
                                }
                            }, 100);
                        }
                    },
                    {
                        label: 'Άκυρο',
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
         * Show appointments history
         */
        showAppointmentsHistory: function(client, parentModal = null) {
            // Hide parent modal temporarily
            if (parentModal) {
                parentModal.style.display = 'none';
            }
            const appointments = this.getClientAppointments(client.id);

            let historyHtml = '<div class="history-list">';

            if (appointments.length === 0) {
                historyHtml += '<div class="history-empty">No appointments yet</div>';
            } else {
                appointments.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : new Date(0);
                    const dateB = b.date ? new Date(b.date) : new Date(0);
                    return dateB - dateA;
                }).forEach(item => {
                    const statusClass = item.completed ? 'completed' : 'pending';
                    const date = item.date ? this.formatDateTime(item.date) : 'Χωρίς ημερομηνία';
                    const amount = item.amount ? `${window.SmartAgenda.State.get('currentCurrency')}${parseFloat(item.amount).toFixed(2)}` : '';

                    historyHtml += `
                        <div class="history-item ${statusClass}" data-type="appointment" data-id="${item.id}">
                            <div class="history-icon">📅</div>
                            <div class="history-content">
                                <div class="history-title">
                                    <span class="history-type">Appointment</span>
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
                title: `Ιστορικό Ραντεβού - ${client.name}`,
                content: historyHtml,
                buttons: [
                    {
                        label: 'Άκυρο',
                        type: 'primary',
                        action: 'close',
                        onClick: (modal) => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            if (parentModal) {
                                // Refresh parent modal with updated data
                                const updatedClient = window.SmartAgenda.DataManager.getById('clients', client.id);
                                window.SmartAgenda.UIComponents.closeModal(parentModal);
                                if (updatedClient) {
                                    this.show(updatedClient);
                                }
                            }
                        }
                    }
                ],
                size: 'large'
            });

            // Make history items clickable
            modal.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    window.SmartAgenda.UIComponents.closeModal(modal);
                    if (parentModal) {
                        parentModal.style.display = '';
                    }
                    const apt = window.SmartAgenda.DataManager.getById('appointments', id);
                    if (apt && window.SmartAgenda.Appointments?.showAppointmentModal) {
                        window.SmartAgenda.Appointments.showAppointmentModal(apt);
                    }
                });
            });
        },

        /**
         * Show tasks history
         */
        showTasksHistory: function(client, parentModal = null) {
            // Hide parent modal temporarily
            if (parentModal) {
                parentModal.style.display = 'none';
            }
            const tasks = this.getClientTasks(client.id);

            let historyHtml = '<div class="history-list">';

            if (tasks.length === 0) {
                historyHtml += '<div class="history-empty">No tasks yet</div>';
            } else {
                tasks.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : new Date(0);
                    const dateB = b.date ? new Date(b.date) : new Date(0);
                    return dateB - dateA;
                }).forEach(item => {
                    const statusClass = item.completed ? 'completed' : 'pending';
                    const date = item.date ? this.formatDateTime(item.date) : 'Χωρίς ημερομηνία';
                    const amount = item.amount ? `${window.SmartAgenda.State.get('currentCurrency')}${parseFloat(item.amount).toFixed(2)}` : '';

                    historyHtml += `
                        <div class="history-item ${statusClass}" data-type="task" data-id="${item.id}">
                            <div class="history-icon">✓</div>
                            <div class="history-content">
                                <div class="history-title">
                                    <span class="history-type">Task</span>
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
                title: `Ιστορικό Tasks - ${client.name}`,
                content: historyHtml,
                buttons: [
                    {
                        label: 'Άκυρο',
                        type: 'primary',
                        action: 'close',
                        onClick: (modal) => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            if (parentModal) {
                                // Refresh parent modal with updated data
                                const updatedClient = window.SmartAgenda.DataManager.getById('clients', client.id);
                                window.SmartAgenda.UIComponents.closeModal(parentModal);
                                if (updatedClient) {
                                    this.show(updatedClient);
                                }
                            }
                        }
                    }
                ],
                size: 'large'
            });

            // Make history items clickable
            modal.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    window.SmartAgenda.UIComponents.closeModal(modal);
                    if (parentModal) {
                        parentModal.style.display = '';
                    }
                    const task = window.SmartAgenda.DataManager.getById('tasks', id);
                    if (task) {
                        window.SmartAgenda.Tasks.showTaskModal(task);
                    }
                });
            });
        },

        /**
         * Show interactions history
         */
        showInteractionsHistory: function(client, parentModal = null) {
            // Hide parent modal temporarily
            if (parentModal) {
                parentModal.style.display = 'none';
            }
            const interactions = this.getClientInteractions(client.id);

            let historyHtml = '<div class="history-list">';

            if (interactions.length === 0) {
                historyHtml += '<div class="history-empty">No interactions yet</div>';
            } else {
                interactions.forEach(interaction => {
                    const icon = interaction.type === 'checkin' ? '📍' : '📞';
                    const typeLabel = interaction.type === 'checkin' ? 'Check-in' : 'Follow-up';
                    const date = interaction.date ? this.formatDateTime(interaction.date) : 'Χωρίς ημερομηνία';

                    // Show status badge if completed
                    const statusBadge = interaction.status === 'completed'
                        ? `<span style="background: #4CAF50; color: white; padding: 2px 6px; border-radius: 8px; font-size: 11px; margin-left: 8px;">✅ Ολοκληρωμένο</span>`
                        : '';

                    // Show notification count if interaction has notifications
                    const notifBadge = interaction.notifications?.length > 0
                        ? `<span style="background: var(--primary-color)22; color: var(--primary-color); padding: 2px 6px; border-radius: 8px; font-size: 11px; margin-left: 8px;">🔔 ${interaction.notifications.length}</span>`
                        : '';

                    // Complete/Uncomplete button
                    const statusClass = interaction.status === 'completed' ? 'completed' : 'pending';
                    const completeBtn = (!interaction.status || interaction.status === 'pending')
                        ? `<button class="btn-complete-interaction" data-interaction-id="${interaction.id}" style="padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;" title="Mark as completed">✅</button>`
                        : `<button class="btn-uncomplete-interaction" data-interaction-id="${interaction.id}" style="padding: 8px; background: #FF9800; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;" title="Mark as pending">⏳</button>`;

                    historyHtml += `
                        <div class="history-item ${statusClass}" data-id="${interaction.id}">
                            <div class="history-icon">${icon}</div>
                            <div class="history-content">
                                <div class="history-title">
                                    <span class="history-type">${typeLabel}</span>
                                    ${statusBadge}
                                    ${notifBadge}
                                </div>
                                ${interaction.notes ? `<div class="history-desc">${this.escapeHtml(interaction.notes)}</div>` : '<div class="history-desc" style="color: var(--text-tertiary); font-style: italic;">Χωρίς σημειώσεις</div>'}
                                <div class="history-meta">
                                    <span>${date}</span>
                                </div>
                            </div>
                            <div style="margin-left: auto; display: flex; gap: 8px;">
                                ${completeBtn}
                                <button class="btn-edit-interaction" data-interaction-id="${interaction.id}" style="padding: 8px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                                    ✏️
                                </button>
                                <button class="btn-delete-interaction" data-interaction-id="${interaction.id}" style="padding: 8px; background: var(--danger); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `;
                });
            }

            historyHtml += '</div>';

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: `Ιστορικό Interactions - ${client.name}`,
                content: historyHtml,
                hideCloseButton: true,
                buttons: [
                    {
                        label: 'Προσθήκη Interaction',
                        type: 'secondary',
                        action: 'add',
                        onClick: (modal) => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            this.showAddInteractionModal(client, {}, parentModal);
                        }
                    },
                    {
                        label: 'Άκυρο',
                        type: 'primary',
                        action: 'close',
                        onClick: (modal) => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            if (parentModal) {
                                // Refresh parent modal with updated data
                                const updatedClient = window.SmartAgenda.DataManager.getById('clients', client.id);
                                window.SmartAgenda.UIComponents.closeModal(parentModal);
                                if (updatedClient) {
                                    this.show(updatedClient);
                                }
                            }
                        }
                    }
                ],
                size: 'large'
            });

            // Bind complete buttons
            modal.querySelectorAll('.btn-complete-interaction').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const interactionId = btn.dataset.interactionId;
                    const interaction = window.SmartAgenda.DataManager.getById('interactions', interactionId);

                    if (interaction) {
                        // Update status to completed
                        window.SmartAgenda.DataManager.update('interactions', interactionId, {
                            status: 'completed'
                        });

                        // Cancel notifications
                        if (window.SmartAgenda.Notifications) {
                            await window.SmartAgenda.Notifications.cancelNotification(interaction);
                        }

                        window.SmartAgenda.Toast.success('Το interaction ολοκληρώθηκε');
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        this.showInteractionsHistory(client, parentModal);
                    }
                });
            });

            // Bind uncomplete buttons
            modal.querySelectorAll('.btn-uncomplete-interaction').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const interactionId = btn.dataset.interactionId;

                    // Update status back to pending
                    window.SmartAgenda.DataManager.update('interactions', interactionId, {
                        status: 'pending'
                    });

                    // Reschedule notifications
                    const interaction = window.SmartAgenda.DataManager.getById('interactions', interactionId);
                    if (interaction && window.SmartAgenda.Notifications) {
                        await window.SmartAgenda.Notifications.scheduleNotification(interaction);
                    }

                    window.SmartAgenda.Toast.success('Το interaction επανήλθε σε εκκρεμές');
                    window.SmartAgenda.UIComponents.closeModal(modal);
                    this.showInteractionsHistory(client, parentModal);
                });
            });

            // Bind edit buttons
            modal.querySelectorAll('.btn-edit-interaction').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const interactionId = btn.dataset.interactionId;
                    const interaction = window.SmartAgenda.DataManager.getById('interactions', interactionId);

                    if (interaction) {
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        this.showEditInteractionModal(client, interaction, parentModal);
                    }
                });
            });

            // Bind delete buttons
            modal.querySelectorAll('.btn-delete-interaction').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const interactionId = btn.dataset.interactionId;

                    const confirmed = await window.SmartAgenda.UIComponents.confirm({
                        title: 'Διαγραφή Interaction',
                        message: 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το interaction;',
                        confirmText: 'Διαγραφή',
                        cancelText: 'Ακύρωση',
                        type: 'danger'
                    });

                    if (confirmed) {
                        // Get the interaction before deleting
                        const interaction = window.SmartAgenda.DataManager.getById('interactions', interactionId);

                        // Delete the interaction
                        window.SmartAgenda.DataManager.delete('interactions', interactionId);

                        // Cancel notifications if any exist
                        if (interaction && window.SmartAgenda.Notifications) {
                            window.SmartAgenda.Notifications.cancelNotification(interaction);
                        }

                        window.SmartAgenda.Toast.success('Το interaction διαγράφηκε');
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        this.showInteractionsHistory(client, parentModal);
                    }
                });
            });
        },

        /**
         * Show add interaction modal
         */
        showAddInteractionModal: function(client, prefilledData = {}, parentModal = null) {
            // Hide parent modal temporarily
            if (parentModal) {
                parentModal.style.display = 'none';
            }
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

            const content = `
                <div style="padding: 16px;" id="interaction-form-container">
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Τύπος *</label>
                        <select id="interaction-type" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--text-primary); font-size: 14px;">
                            <option value="checkin" ${prefilledData.type === 'checkin' ? 'selected' : ''}>📍 Check-in</option>
                            <option value="followup" ${prefilledData.type === 'followup' ? 'selected' : ''}>📞 Follow-up</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Ημερομηνία *</label>
                        <input type="date" id="interaction-date" value="${prefilledData.date || dateStr}"
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--text-primary); font-size: 14px;">
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Ώρα (προαιρετικό)</label>
                        <input type="time" id="interaction-time" value="${prefilledData.time || timeStr}"
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--text-primary); font-size: 14px;">
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Σημειώσεις (προαιρετικό)</label>
                        <textarea id="interaction-notes" rows="4" placeholder="Τι συνέβη κατά τη διάρκεια αυτού του interaction;"
                                  style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; resize: vertical; font-family: inherit; background: var(--background); color: var(--text-primary); font-size: 14px;">${prefilledData.notes || ''}</textarea>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: `Προσθήκη Interaction - ${client.name}`,
                content: content,
                hideCloseButton: true,
                buttons: [
                    {
                        label: 'Ακύρωση',
                        type: 'secondary',
                        action: 'cancel',
                        onClick: (modal) => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            if (parentModal) {
                                parentModal.style.display = '';
                            }
                        }
                    },
                    {
                        label: 'Αποθήκευση',
                        type: 'primary',
                        action: 'save',
                        onClick: (modal) => {
                            const type = document.getElementById('interaction-type').value;
                            const date = document.getElementById('interaction-date').value;
                            const time = document.getElementById('interaction-time').value;
                            const notes = document.getElementById('interaction-notes').value;

                            if (!date) {
                                window.SmartAgenda.Toast.error('Η ημερομηνία είναι υποχρεωτική');
                                return;
                            }

                            // Combine date and time
                            let fullDate = date;
                            if (time) {
                                fullDate = `${date}T${time}:00`;
                            }

                            const interaction = {
                                id: Date.now().toString(),
                                clientId: client.id,
                                type: type,
                                date: fullDate,
                                notes: notes,
                                status: 'pending', // Default status: pending
                                createdAt: new Date().toISOString()
                            };

                            // Get notifications from modal's stored data
                            const notificationsData = modal.getAttribute('data-notifications');
                            if (notificationsData) {
                                try {
                                    interaction.notifications = JSON.parse(notificationsData);
                                } catch (e) {
                                    console.error('Error parsing notifications:', e);
                                }
                            }

                            const added = window.SmartAgenda.DataManager.add('interactions', interaction);

                            // Schedule notification if there are notifications set
                            if (added && window.SmartAgenda.Notifications) {
                                window.SmartAgenda.Notifications.scheduleNotification(added);
                            }

                            window.SmartAgenda.Toast.success('Το interaction προστέθηκε επιτυχώς');
                            window.SmartAgenda.UIComponents.closeModal(modal);

                            // Update client's lastContact
                            window.SmartAgenda.DataManager.update('clients', client.id, {
                                lastContact: fullDate
                            });

                            // Restore parent modal and refresh it
                            if (parentModal) {
                                parentModal.style.display = '';
                                // Refresh the client view to show the new interaction
                                const clientId = client.id;
                                const updatedClient = window.SmartAgenda.DataManager.getById('clients', clientId);
                                window.SmartAgenda.UIComponents.closeModal(parentModal);
                                this.show(updatedClient);
                            }
                        }
                    }
                ],
                size: 'medium'
            });

            // Add notification button after modal is fully loaded
            setTimeout(() => {
                if (!window.SmartAgenda?.Notifications) {
                    console.warn('Notifications service not available');
                }
                this.addNotificationButtonToInteraction(modal, prefilledData);
            }, 100);
        },

        /**
         * Add notification button to interaction modal (for both check-ins and follow-ups)
         */
        addNotificationButtonToInteraction: function(modal, interaction) {
            const formContainer = modal.querySelector('#interaction-form-container');
            if (!formContainer) {
                console.error('interaction-form-container not found in modal');
                return;
            }

            console.log('Adding notification button to interaction modal');
            const currentNotifications = interaction?.notifications || [];

            // Create notification section
            const notificationSection = document.createElement('div');
            notificationSection.className = 'notification-section';
            notificationSection.id = 'interaction-notification-section';
            notificationSection.style.cssText = 'margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);';

            // Count active notifications
            const notifCount = currentNotifications.length;
            const countBadge = notifCount > 0 ? ` <span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${notifCount}</span>` : '';

            let summaryHtml = '';
            if (notifCount > 0 && window.SmartAgenda?.Notifications) {
                const notificationBadges = currentNotifications.map(n => {
                    const timeText = window.SmartAgenda.Notifications.formatNotificationTime(n.minutes);
                    return `<span style="padding: 4px 10px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 16px; font-size: 12px; font-weight: 500;">${timeText}</span>`;
                }).join('');

                summaryHtml = `
                    <div id="interaction-notifications-summary" style="margin-top: 12px; padding: 12px; background: var(--background); border-radius: 6px; border: 1px solid var(--border);">
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Ενεργές ειδοποιήσεις:</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${notificationBadges}
                        </div>
                    </div>
                `;
            }

            notificationSection.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 500; color: var(--text-primary);">Ειδοποιήσεις</span>
                        ${countBadge}
                    </div>
                    <button type="button" id="manage-interaction-notifications-btn"
                            style="padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                        <span>${interaction && interaction.id ? '✏️ Επεξεργασία' : '➕ Προσθήκη'}</span>
                    </button>
                </div>
                ${summaryHtml}
            `;

            // Append to form
            formContainer.appendChild(notificationSection);

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
                            <button type="button" id="manage-interaction-notifications-btn"
                                    style="padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                                <span>${interaction && interaction.id ? '✏️ Επεξεργασία' : '➕ Προσθήκη'}</span>
                            </button>
                        `;

                        // Re-bind button with the same handler
                        const newBtn = headerSection.querySelector('#manage-interaction-notifications-btn');
                        if (newBtn) {
                            newBtn.addEventListener('click', handleManageNotifications);
                        }
                    }

                    // Update or create summary
                    let summaryDiv = notificationSection.querySelector('#interaction-notifications-summary');
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
                            summaryDiv.id = 'interaction-notifications-summary';
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
                const manageBtn = modal.querySelector('#manage-interaction-notifications-btn');
                if (manageBtn) {
                    manageBtn.addEventListener('click', handleManageNotifications);
                }
            }, 100);
        },


        /**
         * Show edit interaction modal
         */
        showEditInteractionModal: function(client, interaction, parentModal = null) {
            // Hide parent modal temporarily
            if (parentModal) {
                parentModal.style.display = 'none';
            }

            // Extract date and time from interaction
            let dateStr = '';
            let timeStr = '';
            if (interaction.date) {
                const d = new Date(interaction.date);
                dateStr = d.toISOString().split('T')[0];
                timeStr = d.toTimeString().substring(0, 5);
            }

            const content = `
                <div style="padding: 16px;" id="interaction-form-container">
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Τύπος *</label>
                        <select id="interaction-type" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--text-primary); font-size: 14px;">
                            <option value="checkin" ${interaction.type === 'checkin' ? 'selected' : ''}>📍 Check-in</option>
                            <option value="followup" ${interaction.type === 'followup' ? 'selected' : ''}>📞 Follow-up</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Ημερομηνία *</label>
                        <input type="date" id="interaction-date" value="${dateStr}"
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--text-primary); font-size: 14px;">
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Ώρα (προαιρετικό)</label>
                        <input type="time" id="interaction-time" value="${timeStr}"
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--text-primary); font-size: 14px;">
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Σημειώσεις (προαιρετικό)</label>
                        <textarea id="interaction-notes" rows="4" placeholder="Τι συνέβη κατά τη διάρκεια αυτού του interaction;"
                                  style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; resize: vertical; font-family: inherit; background: var(--background); color: var(--text-primary); font-size: 14px;">${interaction.notes || ''}</textarea>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: `Αλλαγή Interaction - ${client.name}`,
                content: content,
                hideCloseButton: true,
                buttons: [
                    {
                        label: 'Ακύρωση',
                        type: 'secondary',
                        action: 'cancel',
                        onClick: (modal) => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            if (parentModal) {
                                parentModal.style.display = '';
                            }
                        }
                    },
                    {
                        label: 'Αποθήκευση',
                        type: 'primary',
                        action: 'save',
                        onClick: (modal) => {
                            const type = document.getElementById('interaction-type').value;
                            const date = document.getElementById('interaction-date').value;
                            const time = document.getElementById('interaction-time').value;
                            const notes = document.getElementById('interaction-notes').value;

                            if (!date) {
                                window.SmartAgenda.Toast.error('Η ημερομηνία είναι υποχρεωτική');
                                return;
                            }

                            // Combine date and time
                            let fullDate = date;
                            if (time) {
                                fullDate = `${date}T${time}:00`;
                            }

                            const updatedData = {
                                type: type,
                                date: fullDate,
                                notes: notes
                            };

                            // Get notifications from modal's stored data
                            const notificationsData = modal.getAttribute('data-notifications');
                            if (notificationsData) {
                                try {
                                    updatedData.notifications = JSON.parse(notificationsData);
                                } catch (e) {
                                    console.error('Error parsing notifications:', e);
                                }
                            }

                            // Update the interaction
                            const updated = window.SmartAgenda.DataManager.update('interactions', interaction.id, updatedData);

                            if (updated) {
                                // Cancel old notifications and schedule new ones
                                if (window.SmartAgenda.Notifications) {
                                    window.SmartAgenda.Notifications.cancelNotification(interaction);
                                    window.SmartAgenda.Notifications.scheduleNotification(updated);
                                }

                                window.SmartAgenda.Toast.success('Το interaction ενημερώθηκε επιτυχώς');
                                window.SmartAgenda.UIComponents.closeModal(modal);

                                // Update client's lastContact
                                window.SmartAgenda.DataManager.update('clients', client.id, {
                                    lastContact: fullDate
                                });

                                // Restore parent modal and refresh it
                                if (parentModal) {
                                    parentModal.style.display = '';
                                    // Refresh the client view to show the updated interaction
                                    const clientId = client.id;
                                    const updatedClient = window.SmartAgenda.DataManager.getById('clients', clientId);
                                    window.SmartAgenda.UIComponents.closeModal(parentModal);
                                    this.show(updatedClient);
                                }
                            }
                        }
                    }
                ],
                size: 'medium'
            });

            // Add notification button after modal is fully loaded
            setTimeout(() => {
                this.addNotificationButtonToInteraction(modal, interaction);
            }, 100);
        },

        /**
         * Show full history modal (DEPRECATED - keeping for backwards compatibility)
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
                    const date = item.date ? this.formatDateTime(item.date) : 'Χωρίς ημερομηνία';
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
                        label: 'Άκυρο',
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

            // View Appointments History
            const btnViewAppointments = modal.querySelector('#btn-view-appointments');
            btnViewAppointments?.addEventListener('click', () => {
                this.showAppointmentsHistory(client, modal);
            });

            // View Tasks History
            const btnViewTasks = modal.querySelector('#btn-view-tasks');
            btnViewTasks?.addEventListener('click', () => {
                this.showTasksHistory(client, modal);
            });

            // Add Interaction
            const btnAddInteraction = modal.querySelector('#btn-add-interaction');
            btnAddInteraction?.addEventListener('click', () => {
                this.showAddInteractionModal(client, {}, modal);
            });

            // View All Interactions
            const btnViewInteractions = modal.querySelector('#btn-view-interactions');
            btnViewInteractions?.addEventListener('click', () => {
                this.showInteractionsHistory(client, modal);
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

        getClientInteractions: function(clientId) {
            const interactions = window.SmartAgenda.DataManager.getAll('interactions') || [];
            return interactions.filter(i => i.clientId == clientId).sort((a, b) => {
                return new Date(b.date) - new Date(a.date); // Newest first
            });
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

        getClientTypesHTML: function(client) {
            // Get available types from settings
            const availableTypes = window.SmartAgenda.Settings?.getClientTypes() || [];

            if (availableTypes.length === 0) {
                return '';
            }

            // Get client's types (support both old and new format)
            let clientTypeIds = [];
            let primaryTypeId = null;

            if (client.clientTypes && client.clientTypes.length > 0) {
                clientTypeIds = client.clientTypes;
                primaryTypeId = client.primaryType || client.clientTypes[0];
            } else if (client.customerType) {
                // Legacy format
                clientTypeIds = [client.customerType];
                primaryTypeId = client.customerType;
            }

            if (clientTypeIds.length === 0) {
                return '';
            }

            // Build HTML for types
            let typesHTML = '<div class="info-item full-width"><div class="info-label">🏷️ Categories</div><div class="info-value" style="display: flex; flex-wrap: wrap; gap: 8px;">';

            clientTypeIds.forEach(typeId => {
                const type = availableTypes.find(t => t.id === typeId);
                if (type) {
                    const isPrimary = typeId === primaryTypeId;
                    const starIcon = isPrimary ? '⭐ ' : '';

                    typesHTML += `
                        <span style="
                            background: ${type.color}22;
                            color: ${type.color};
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 13px;
                            font-weight: ${isPrimary ? '700' : '600'};
                            border: 2px solid ${isPrimary ? type.color : 'transparent'};
                        ">
                            ${starIcon}${this.escapeHtml(type.name)}
                        </span>
                    `;
                }
            });

            typesHTML += '</div></div>';
            return typesHTML;
        },

        getAddressesHTML: function(client) {
            if (!client.addresses || client.addresses.length === 0) {
                return '';
            }

            let html = `
                <div class="info-item full-width">
                    <div class="info-label">📍 Addresses</div>
                    <div class="info-value" style="display: flex; flex-direction: column; gap: 12px;">
            `;

            client.addresses.forEach((address, index) => {
                const label = address.label ? `<strong>${this.escapeHtml(address.label)}:</strong> ` : '';
                const typeIcon = address.type === 'map' ? '🗺️ ' : '';

                if (address.type === 'map' && address.lat && address.lng) {
                    // Map address with clickable link
                    const mapsUrl = `https://www.google.com/maps?q=${address.lat},${address.lng}`;
                    html += `
                        <div>
                            ${label}${typeIcon}<a href="${mapsUrl}" target="_blank" class="info-link">${this.escapeHtml(address.value)}</a>
                        </div>
                    `;
                } else {
                    // Text address
                    html += `
                        <div>
                            ${label}${this.escapeHtml(address.value)}
                        </div>
                    `;
                }
            });

            html += `
                    </div>
                </div>
            `;

            return html;
        },

        getContactPersonsHTML: function(client) {
            if (!client.contactPersons || client.contactPersons.length === 0) {
                return '';
            }

            let html = `
                <div class="info-item full-width">
                    <div class="info-label">👥 Contact Persons</div>
                    <div class="info-value" style="display: flex; flex-direction: column; gap: 12px;">
            `;

            client.contactPersons.forEach((person, index) => {
                html += '<div style="padding: 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">';

                // Name and Position
                html += `<div style="font-weight: 600; margin-bottom: 6px;">${this.escapeHtml(person.name)}`;
                if (person.position) {
                    html += ` <span style="color: var(--text-secondary); font-weight: 400; font-size: 13px;">(${this.escapeHtml(person.position)})</span>`;
                }
                html += '</div>';

                // Phone and Email
                const contactDetails = [];
                if (person.phone) {
                    contactDetails.push(`<a href="tel:${person.phone}" class="info-link">📞 ${this.escapeHtml(person.phone)}</a>`);
                }
                if (person.email) {
                    contactDetails.push(`<a href="mailto:${person.email}" class="info-link">📧 ${this.escapeHtml(person.email)}</a>`);
                }

                if (contactDetails.length > 0) {
                    html += `<div style="font-size: 13px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">`;
                    contactDetails.forEach(detail => {
                        html += `<div>${detail}</div>`;
                    });
                    html += '</div>';
                }

                html += '</div>';
            });

            html += `
                    </div>
                </div>
            `;

            return html;
        },

        getFilesHTML: function(client) {
            if (!client.files || client.files.length === 0) {
                return '';
            }

            return `
                <div class="info-item full-width">
                    <div class="info-label">📎 File Attachments</div>
                    <button onclick="window.SmartAgenda.FileViewer.showFilesModal()"
                            style="padding: 12px 20px; background: var(--primary-color); color: white; border: none;
                                   border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
                                   display: flex; align-items: center; gap: 8px; transition: all 0.2s; width: 100%;">
                        <span>📁 View Files</span>
                        <span style="background: rgba(255,255,255,0.3); padding: 2px 10px; border-radius: 12px; font-size: 12px; margin-left: auto;">
                            ${client.files.length}
                        </span>
                    </button>
                </div>
            `;
        },

        getFileIcon: function(type) {
            if (!type) return '📄';

            if (type.startsWith('image/')) return '🖼️';
            if (type === 'application/pdf') return '📕';
            if (type.includes('word') || type.includes('document')) return '📘';
            if (type.includes('sheet') || type.includes('excel')) return '📗';
            if (type.includes('presentation') || type.includes('powerpoint')) return '📙';
            if (type === 'text/plain') return '📃';
            if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return '📦';

            return '📄';
        },

        formatFileSize: function(bytes) {
            if (!bytes || bytes === 0) return '0 B';

            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
        },

        openFile: function(fileIndex) {
            // Get current client
            if (!this.currentClient || !this.currentClient.files || !this.currentClient.files[fileIndex]) {
                return;
            }

            const file = this.currentClient.files[fileIndex];
            const isImage = file.type?.startsWith('image/');

            if (isImage) {
                // Show image in modal
                const content = `
                    <div style="text-align: center;">
                        <img src="${file.data}" style="max-width: 100%; max-height: 60vh; border-radius: 8px;">
                    </div>
                `;

                window.SmartAgenda.UIComponents.showModal({
                    title: file.name,
                    content: content,
                    buttons: [
                        {
                            label: 'Download',
                            type: 'primary',
                            onClick: () => {
                                const link = document.createElement('a');
                                link.href = file.data;
                                link.download = file.name;
                                link.click();
                            }
                        },
                        {
                            label: 'Άκυρο',
                            type: 'secondary',
                            onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                        }
                    ],
                    size: 'large'
                });
            } else {
                // Download or open in new tab
                const link = document.createElement('a');
                link.href = file.data;
                link.download = file.name;
                link.target = '_blank';
                link.click();
            }
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

        /* New styles for interactions */
        .stats-grid-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 20px;
        }

        .stat-item.clickable {
            cursor: pointer;
        }

        .stat-item.clickable:hover {
            transform: translateY(-6px);
            border-color: var(--success);
        }

        .stat-item-full {
            text-align: center;
            padding: 24px 16px;
            background: linear-gradient(135deg, var(--surface), var(--background));
            border-radius: 16px;
            border: 2px solid var(--border);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            margin-top: 20px;
        }

        .interactions-preview-section {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
        }

        .interactions-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .interactions-header h4 {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
        }

        .btn-add-interaction {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            border: none;
            font-size: 20px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .btn-add-interaction:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .interactions-preview {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .interactions-empty {
            text-align: center;
            padding: 30px 20px;
            color: var(--text-secondary);
            font-size: 14px;
            font-style: italic;
        }

        .interaction-preview-item {
            display: flex;
            gap: 12px;
            padding: 12px;
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 8px;
            transition: all 0.2s;
        }

        .interaction-preview-item:hover {
            border-color: var(--primary-color);
            transform: translateX(2px);
        }

        .interaction-icon {
            font-size: 20px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--surface);
            border-radius: 8px;
            flex-shrink: 0;
        }

        .interaction-content {
            flex: 1;
            min-width: 0;
        }

        .interaction-type {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 14px;
            margin-bottom: 4px;
        }

        .interaction-date {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 4px;
        }

        .interaction-notes {
            font-size: 13px;
            color: var(--text-tertiary);
            line-height: 1.4;
        }

        .btn-view-all-interactions {
            width: 100%;
            padding: 10px;
            margin-top: 10px;
            background: transparent;
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--primary-color);
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-view-all-interactions:hover {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .file-attachment-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-color: var(--primary-color);
        }

        .client-notes-content {
            line-height: 1.6;
            color: var(--text-secondary);
            white-space: pre-line;
            word-wrap: break-word;
            margin: 0;
            padding: 0;
            text-indent: 0;
        }

        .client-notes-content p,
        .client-notes-content div {
            margin: 0 !important;
            padding: 0 !important;
            text-indent: 0 !important;
        }

        .client-notes-content p:first-child,
        .client-notes-content div:first-child {
            margin-top: 0 !important;
            padding-top: 0 !important;
            text-indent: 0 !important;
        }

        .client-notes-content br {
            display: block;
            content: "";
            margin-top: 0;
        }
    `;
    document.head.appendChild(styles);

    // Add to global API
    if (window.SmartAgenda) {
        window.SmartAgenda.ClientDetailView = ClientDetailView;
    }

})();
