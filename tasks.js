/**
 * Smart Agenda - Tasks Module
 * 
 * Complete task management with:
 * - Standalone tasks (no client)
 * - Client-based tasks
 * - Searchable client dropdown
 * - Priority and status filtering
 */

(function() {
    'use strict';

    const Tasks = {
        tasksList: null,
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
            this.tasksList = document.getElementById('tasks-list');
            this.searchInput = document.getElementById('tasks-search');
            this.searchClearBtn = document.getElementById('tasks-search-clear');
            this.searchIndicator = document.getElementById('tasks-search-indicator');
            this.addButton = document.getElementById('tasks-add-btn');
            this.filterButton = document.getElementById('tasks-filter-btn');
            this.bindEvents();
            this.render();
        },

        bindEvents: function() {
            // Add button - creates standalone task by default
            this.addButton?.addEventListener('click', () => this.showTaskModal());

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
                window.SmartAgenda.EventBus.on('data:tasks:change', () => this.render());
                window.SmartAgenda.EventBus.on('language:change', () => this.render());

                // Refresh virtual scroll when tab becomes visible
                window.SmartAgenda.EventBus.on('tab:change', (tabName) => {
                    if (tabName === 'tasks') {
                        setTimeout(() => {
                            if (this.virtualScroll) {
                                this.virtualScroll.refresh();
                            }
                        }, 100);
                    }
                });
            }
        },

        render: function() {
            if (!this.tasksList) return;

            // Check if filter/search state has changed - if so, reset pagination
            const currentState = `${this.currentFilter}-${this.currentPriority}-${this.searchQuery}`;
            if (this.lastRenderState !== currentState) {
                this.itemsToShow = this.itemsPerPage;
                this.lastRenderState = currentState;
            }

            let tasks = window.SmartAgenda.DataManager.getAll('tasks');

            if (this.searchQuery) {
                tasks = window.SmartAgenda.DataManager.search('tasks', this.searchQuery);
            }

            // Apply filter - 'all' now means "all active" (excludes completed)
            tasks = tasks.filter(task => {
                if (this.currentFilter === 'all') return !task.completed; // Show only active
                if (this.currentFilter === 'pending') return !task.completed && !this.isOverdue(task);
                if (this.currentFilter === 'completed') return task.completed;
                if (this.currentFilter === 'overdue') return !task.completed && this.isOverdue(task);
                return true;
            });

            if (this.currentPriority !== 'all') {
                tasks = tasks.filter(t => t.priority === this.currentPriority);
            }

            tasks = tasks.sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const aPriority = priorityOrder[a.priority] ?? 999;
                const bPriority = priorityOrder[b.priority] ?? 999;
                if (aPriority !== bPriority) return aPriority - bPriority;
                if (a.date && b.date) return new Date(a.date) - new Date(b.date);
                return a.date ? -1 : 1;
            });

            // Render with Load More pagination
            this.tasksList.innerHTML = '';

            if (tasks.length === 0) {
                this.renderEmptyState();
                return;
            }

            // Show only the first itemsToShow tasks
            const tasksToDisplay = tasks.slice(0, this.itemsToShow);
            const hasMore = tasks.length > this.itemsToShow;

            // Render tasks
            tasksToDisplay.forEach(task => {
                const card = this.createTaskCard(task);
                this.tasksList.appendChild(card);
            });

            // Add "Load More" button if there are more items
            if (hasMore) {
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.className = 'load-more-btn';
                loadMoreBtn.textContent = `Load More (${tasks.length - this.itemsToShow} remaining)`;
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
                this.tasksList.appendChild(loadMoreBtn);
            }
        },

        createTaskCard: function(task) {
            const card = document.createElement('div');
            card.className = 'task-item';
            card.dataset.id = task.id;

            if (task.completed) card.classList.add('completed');
            if (this.isOverdue(task) && !task.completed) card.classList.add('overdue');

            const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
            const priorityColor = priorityColors[task.priority] || '#94a3b8';

            const clientName = task.clientName || this.getClientName(task.client) || 'Standalone Task';
            const dateDisplay = task.date ? this.formatDate(task.date) : '';

            card.innerHTML = `
                <div class="task-priority-bar" style="background: ${priorityColor}"></div>
                <div class="task-content">
                    <div class="task-header">
                        <div class="task-title">${this.escapeHtml(clientName)}</div>
                        ${dateDisplay ? `<div class="task-date">${dateDisplay}</div>` : ''}
                    </div>
                    ${task.desc ? `<div class="task-description">${this.escapeHtml(this.stripHtml(task.desc).substring(0, 100))}${this.stripHtml(task.desc).length > 100 ? '...' : ''}</div>` : ''}
                    <div class="task-footer">
                        <span class="task-priority" style="color: ${priorityColor}">${task.priority ? task.priority.toUpperCase() : 'MEDIUM'}</span>
                        ${task.amount ? `<span class="task-amount">${window.SmartAgenda.State.get('currentCurrency')}${parseFloat(task.amount).toFixed(2)}</span>` : ''}
                        ${task.isStandalone ? `<span class="task-standalone-badge">📌 Standalone</span>` : ''}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => this.showTaskModal(task));

            return card;
        },

        renderEmptyState: function() {
            const emptyState = window.SmartAgenda.UIComponents.createEmptyState({
                icon: '✓',
                title: window.SmartAgenda.I18n.translate('empty.tasks.title'),
                message: window.SmartAgenda.I18n.translate('empty.tasks.message'),
                actionText: window.SmartAgenda.I18n.translate('actions.add'),
                onAction: () => this.showTaskModal()
            });
            this.tasksList.appendChild(emptyState);
        },

        showTaskModal: function(task = null, preSelectedClient = null, preSelectedDate = null) {
            const isEdit = !!task;
            const i18n = window.SmartAgenda.I18n;

            // Determine if standalone task
            const isStandalone = !preSelectedClient && !task?.client;

            // Get clients for dropdown
            const clients = window.SmartAgenda.DataManager.getAll('clients');
            const clientOptions = [
                { value: '', label: '-- Select Client (or leave empty) --' },
                ...clients.map(c => ({ value: c.id, label: c.name }))
            ];

            // Extract date from task or use preselected date
            let dateValue = '';
            if (task?.date) {
                const d = new Date(task.date);
                dateValue = d.toISOString().split('T')[0];
            } else if (preSelectedDate) {
                // Pre-fill date from calendar selection
                const d = new Date(preSelectedDate);
                dateValue = d.toISOString().split('T')[0];
            }

            // Define form fields
            let fields;
            
            if (isStandalone && !isEdit) {
                // Standalone task - simplified
                fields = [
                    {
                        name: 'clientName',
                        label: 'Task Name',
                        type: 'text',
                        required: true,
                        placeholder: 'e.g., Buy groceries, Call plumber...'
                    },
                    {
                        name: 'date',
                        label: 'Due Date',
                        type: 'date',
                        value: dateValue
                    },
                    {
                        name: 'priority',
                        label: 'Priority',
                        type: 'select',
                        options: [
                            { value: 'low', label: i18n.translate('priority.low') },
                            { value: 'medium', label: i18n.translate('priority.medium') },
                            { value: 'high', label: i18n.translate('priority.high') }
                        ]
                    },
                    {
                        name: 'amount',
                        label: 'Amount (optional)',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01'
                    },
                    {
                        name: 'desc',
                        label: 'Description (optional)',
                        type: 'textarea',
                        rows: 3,
                        placeholder: 'Add details...'
                    }
                ];
            } else {
                // Client-based task - full fields
                fields = [
                    {
                        name: 'client',
                        label: 'Client',
                        type: 'select',
                        options: clientOptions
                    },
                    {
                        name: 'date',
                        label: 'Due Date',
                        type: 'date',
                        value: dateValue
                    },
                    {
                        name: 'priority',
                        label: 'Priority',
                        type: 'select',
                        options: [
                            { value: 'low', label: i18n.translate('priority.low') },
                            { value: 'medium', label: i18n.translate('priority.medium') },
                            { value: 'high', label: i18n.translate('priority.high') }
                        ]
                    },
                    {
                        name: 'amount',
                        label: 'Amount/Weight',
                        type: 'number',
                        placeholder: '0.00',
                        step: '0.01'
                    },
                    {
                        name: 'desc',
                        label: 'Description',
                        type: 'textarea',
                        rows: 4,
                        placeholder: 'Task details...'
                    }
                ];
            }

            // Initial values
            const initialValues = task ? {
                ...task,
                client: task.client || '',
                date: task.date ? task.date.split('T')[0] : ''
            } : {
                client: preSelectedClient || '',
                priority: 'medium',
                completed: false,
                isStandalone: isStandalone
            };

            // Create form
            const form = window.SmartAgenda.UIComponents.createForm(fields, initialValues);

            // Modal buttons
            const buttons = [];

            if (isEdit) {
                // Complete button first when editing
                buttons.push({
                    label: task.completed ? 'Mark as Incomplete' : i18n.translate('actions.complete'),
                    type: task.completed ? 'secondary' : 'success',
                    action: 'complete',
                    onClick: (modal) => {
                        window.SmartAgenda.DataManager.update('tasks', task.id, { completed: !task.completed });
                        window.SmartAgenda.Toast.success(task.completed ? 'Marked as incomplete' : 'Marked as complete');
                        window.SmartAgenda.UIComponents.closeModal(modal);
                    }
                });

                // Delete button for editing
                buttons.push({
                    label: i18n.translate('actions.delete'),
                    type: 'danger',
                    action: 'delete',
                    onClick: (modal) => this.deleteTask(modal, task.id)
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
                onClick: (modal) => this.saveTask(modal, form, task, descEditor, isStandalone)
            });

            // Show modal
            const modal = window.SmartAgenda.UIComponents.showModal({
                title: isEdit ? 'Edit Task' : (isStandalone ? 'Add Standalone Task' : 'Add Task'),
                content: form.element.outerHTML,
                buttons: buttons,
                size: 'medium'
            });

            // Re-attach form reference
            form.element = modal.querySelector('.modal-form');

            // Enhance description field with Quill editor
            const descTextarea = form.element.querySelector('[name="desc"]');
            const descEditor = window.SmartAgenda.UIComponents.enhanceTextareaWithEditor(
                descTextarea,
                task?.desc || ''
            );

            // Add file attachments
            this.addTaskFileAttachments(modal, task);

            // Add checklist functionality
            this.addTaskChecklist(modal, task);

            // Add search functionality to client select if it exists
            const clientSelect = form.element.querySelector('[name="client"]');
            if (clientSelect) {
                this.enhanceSelectWithSearch(clientSelect);

                // Pre-select client if provided
                if (preSelectedClient) {
                    clientSelect.value = preSelectedClient;
                }
            }

            // Add action buttons if editing and has client
            if (isEdit && task.client && !task.isStandalone && window.SmartAgenda?.QuickActions) {
                const client = window.SmartAgenda.DataManager.getById('clients', task.client);
                if (client) {
                    const quickActions = window.SmartAgenda.QuickActions.createTaskActions(task);
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
            this.addNotificationButton(modal, task);
        },

        addTaskFileAttachments: function(modal, task) {
            const descField = modal.querySelector('[name="desc"]').closest('.form-group');
            if (!descField) return;

            const attachmentsContainer = document.createElement('div');
            attachmentsContainer.className = 'form-group';
            attachmentsContainer.innerHTML = `
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">File Attachments</label>
                <div>
                    <input type="file" id="task-attachments-input" multiple style="display: none;">
                    <button type="button" class="btn-secondary" id="add-task-attachment-btn" style="margin-bottom: 12px;">
                        <span>📎</span>
                        <span>Add Files</span>
                    </button>
                    <div id="task-attachments-list" style="display: flex; flex-direction: column; gap: 8px;">
                        ${task?.attachments ? task.attachments.map((att, idx) => `
                            <div class="task-attachment-item" data-index="${idx}" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px;">
                                <span style="font-size: 20px;">📄</span>
                                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(att.name)}</span>
                                <span style="font-size: 12px; color: var(--text-secondary);">${this.formatFileSize(att.size)}</span>
                                <button type="button" class="btn-icon remove-task-attachment-btn" data-index="${idx}" style="color: var(--danger); cursor: pointer;">✕</button>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>
            `;

            descField.parentNode.insertBefore(attachmentsContainer, descField.nextSibling);

            // Handle file selection
            document.getElementById('add-task-attachment-btn')?.addEventListener('click', () => {
                document.getElementById('task-attachments-input').click();
            });

            document.getElementById('task-attachments-input')?.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;

                const attachmentsList = document.getElementById('task-attachments-list');
                const existingCount = attachmentsList.querySelectorAll('.task-attachment-item').length;

                files.forEach((file, idx) => {
                    if (file.size > 10 * 1024 * 1024) {
                        window.SmartAgenda.Toast.error(`${file.name} is too large (max 10MB)`);
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const attachmentItem = document.createElement('div');
                        attachmentItem.className = 'task-attachment-item';
                        attachmentItem.dataset.index = existingCount + idx;
                        attachmentItem.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px;">
                                <span style="font-size: 20px;">📄</span>
                                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(file.name)}</span>
                                <span style="font-size: 12px; color: var(--text-secondary);">${this.formatFileSize(file.size)}</span>
                                <button type="button" class="btn-icon remove-task-attachment-btn" style="color: var(--danger); cursor: pointer;">✕</button>
                            </div>
                        `;
                        attachmentItem.dataset.file = event.target.result;
                        attachmentItem.dataset.filename = file.name;
                        attachmentItem.dataset.filesize = file.size;

                        attachmentsList.appendChild(attachmentItem);

                        // Bind remove button
                        attachmentItem.querySelector('.remove-task-attachment-btn').addEventListener('click', () => {
                            attachmentItem.remove();
                        });
                    };
                    reader.readAsDataURL(file);
                });

                e.target.value = '';
            });

            // Bind existing remove buttons
            modal.querySelectorAll('.remove-task-attachment-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.target.closest('.task-attachment-item').remove();
                });
            });
        },

        formatFileSize: function(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        },

        /**
         * Add checklist functionality to task modal
         */
        addTaskChecklist: function(modal, task) {
            const formElement = modal.querySelector('.modal-form');
            if (!formElement) return;

            const existingChecklist = task?.checklist || [];

            // Create checklist container
            const checklistContainer = document.createElement('div');
            checklistContainer.className = 'form-group';
            checklistContainer.innerHTML = `
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Checklist</label>
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; gap: 8px;">
                        <input type="text"
                               id="task-checklist-input"
                               placeholder="Add checklist item..."
                               style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-primary); font-size: 14px;">
                        <button type="button"
                                id="add-checklist-item-btn"
                                class="btn-primary"
                                style="padding: 8px 16px; white-space: nowrap;">
                            ➕ Add
                        </button>
                    </div>
                </div>
                <div id="task-checklist-items" style="display: flex; flex-direction: column; gap: 8px;">
                    ${existingChecklist.map((item, index) => `
                        <div class="checklist-item" data-index="${index}" style="display: flex; align-items: center; gap: 8px; padding: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px;">
                            <input type="checkbox"
                                   class="checklist-checkbox"
                                   ${item.checked ? 'checked' : ''}
                                   style="width: 18px; height: 18px; cursor: pointer;">
                            <span class="checklist-text" style="flex: 1; color: var(--text-primary); ${item.checked ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${this.escapeHtml(item.text)}</span>
                            <button type="button"
                                    class="remove-checklist-item-btn"
                                    style="padding: 4px 8px; background: var(--danger-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                ✕
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;

            // Find a good place to insert (after attachments or before notifications)
            const notificationSection = formElement.querySelector('.notification-section');
            if (notificationSection) {
                formElement.insertBefore(checklistContainer, notificationSection);
            } else {
                formElement.appendChild(checklistContainer);
            }

            // Bind events
            setTimeout(() => {
                const input = modal.querySelector('#task-checklist-input');
                const addBtn = modal.querySelector('#add-checklist-item-btn');
                const checklistItems = modal.querySelector('#task-checklist-items');

                // Add checklist item
                const addChecklistItem = () => {
                    const text = input.value.trim();
                    if (!text) {
                        window.SmartAgenda.Toast.warning('Please enter checklist item text');
                        return;
                    }

                    const currentItems = checklistItems.querySelectorAll('.checklist-item');
                    const newIndex = currentItems.length;

                    const itemHtml = `
                        <div class="checklist-item" data-index="${newIndex}" style="display: flex; align-items: center; gap: 8px; padding: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px;">
                            <input type="checkbox"
                                   class="checklist-checkbox"
                                   style="width: 18px; height: 18px; cursor: pointer;">
                            <span class="checklist-text" style="flex: 1; color: var(--text-primary);">${this.escapeHtml(text)}</span>
                            <button type="button"
                                    class="remove-checklist-item-btn"
                                    style="padding: 4px 8px; background: var(--danger-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                ✕
                            </button>
                        </div>
                    `;

                    checklistItems.insertAdjacentHTML('beforeend', itemHtml);

                    // Bind events to new item
                    this.bindChecklistItemEvents(checklistItems.lastElementChild);

                    input.value = '';
                    input.focus();
                };

                addBtn.addEventListener('click', addChecklistItem);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addChecklistItem();
                    }
                });

                // Bind events to existing items
                modal.querySelectorAll('.checklist-item').forEach(item => {
                    this.bindChecklistItemEvents(item);
                });
            }, 100);
        },

        /**
         * Bind events to a checklist item
         */
        bindChecklistItemEvents: function(item) {
            const checkbox = item.querySelector('.checklist-checkbox');
            const text = item.querySelector('.checklist-text');
            const removeBtn = item.querySelector('.remove-checklist-item-btn');

            // Toggle checked state
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    text.style.textDecoration = 'line-through';
                    text.style.opacity = '0.6';
                } else {
                    text.style.textDecoration = 'none';
                    text.style.opacity = '1';
                }
            });

            // Remove item
            removeBtn.addEventListener('click', () => {
                item.remove();
            });
        },

        saveTask: function(modal, form, existingTask, descEditor, isStandalone) {
            const values = form.getValues();

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

            // Handle standalone vs client-based tasks
            if (isStandalone && !values.client) {
                // Standalone task
                values.isStandalone = true;
                // clientName is already in the form
            } else {
                // Client-based task
                if (values.client) {
                    const client = window.SmartAgenda.DataManager.getById('clients', values.client);
                    values.clientName = client ? client.name : '';
                }
                values.isStandalone = false;
            }

            // Convert date to ISO string
            if (values.date) {
                values.date = new Date(values.date).toISOString();
            }

            // Get attachments
            const attachmentItems = modal.querySelectorAll('#task-attachments-list .task-attachment-item');
            values.attachments = Array.from(attachmentItems).map(item => ({
                name: item.dataset.filename || item.querySelector('span:nth-child(2)')?.textContent,
                size: parseInt(item.dataset.filesize) || 0,
                data: item.dataset.file
            }));

            // Get checklist items
            const checklistItems = modal.querySelectorAll('#task-checklist-items .checklist-item');
            values.checklist = Array.from(checklistItems).map(item => ({
                text: item.querySelector('.checklist-text').textContent.trim(),
                checked: item.querySelector('.checklist-checkbox').checked
            }));

            // Get notifications from modal's stored data
            const notificationsData = modal.getAttribute('data-notifications');
            if (notificationsData) {
                try {
                    values.notifications = JSON.parse(notificationsData);
                } catch (e) {
                    console.error('Error parsing notifications:', e);
                }
            } else if (existingTask && existingTask.notifications) {
                // Keep existing notifications if not modified
                values.notifications = existingTask.notifications;
            }

            if (existingTask) {
                const updated = window.SmartAgenda.DataManager.update('tasks', existingTask.id, values);
                if (updated) {
                    // Schedule notification for updated task
                    if (window.SmartAgenda.Notifications) {
                        const updatedTask = window.SmartAgenda.DataManager.getById('tasks', existingTask.id);
                        window.SmartAgenda.Notifications.cancelNotification(existingTask.id);
                        window.SmartAgenda.Notifications.scheduleNotification(updatedTask);
                    }

                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.saved'));
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            } else {
                const added = window.SmartAgenda.DataManager.add('tasks', values);
                if (added) {
                    // Schedule notification for new task
                    if (window.SmartAgenda.Notifications) {
                        window.SmartAgenda.Notifications.scheduleNotification(added);
                    }

                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.saved'));
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            }
        },

        deleteTask: async function(modal, taskId) {
            const confirmed = await window.SmartAgenda.UIComponents.confirm({
                title: 'Delete Task',
                message: window.SmartAgenda.I18n.translate('msg.confirm_delete'),
                confirmText: window.SmartAgenda.I18n.translate('actions.delete'),
                cancelText: window.SmartAgenda.I18n.translate('actions.cancel'),
                type: 'danger'
            });

            if (confirmed) {
                // Cancel notifications before deleting
                if (window.SmartAgenda.Notifications) {
                    window.SmartAgenda.Notifications.cancelNotification(taskId);
                }

                const deleted = window.SmartAgenda.DataManager.delete('tasks', taskId);
                if (deleted) {
                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.deleted'));
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            }
        },

        toggleComplete: function(taskId, completed) {
            window.SmartAgenda.DataManager.update('tasks', taskId, { completed });

            // Handle notifications based on completion status
            if (window.SmartAgenda.Notifications) {
                if (completed) {
                    // Task completed - cancel notifications
                    window.SmartAgenda.Notifications.cancelNotification(taskId);
                } else {
                    // Task marked as incomplete - reschedule notifications
                    const task = window.SmartAgenda.DataManager.getById('tasks', taskId);
                    if (task) {
                        window.SmartAgenda.Notifications.scheduleNotification(task);
                    }
                }
            }
        },

        /**
         * Add notification button and management to task modal
         */
        addNotificationButton: function(modal, task) {
            const formElement = modal.querySelector('.modal-form');
            if (!formElement) return;

            const currentNotifications = task?.notifications || [];

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
                        <span>${task ? '✏️ Επεξεργασία' : '➕ Προσθήκη'}</span>
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

            // Bind button event
            setTimeout(() => {
                const manageBtn = modal.querySelector('#manage-notifications-btn');
                if (manageBtn) {
                    manageBtn.addEventListener('click', async () => {
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
                                        <span>${task ? '✏️ Επεξεργασία' : '➕ Προσθήκη'}</span>
                                    </button>
                                `;

                                // Re-bind button
                                const newBtn = headerSection.querySelector('#manage-notifications-btn');
                                if (newBtn) {
                                    newBtn.addEventListener('click', arguments.callee);
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
                    });
                }
            }, 100);
        },

        showFilterMenu: function() {
            const i18n = window.SmartAgenda.I18n;
            
            const content = `
                <div class="filter-menu">
                    <h4>Status</h4>
                    <div class="filter-option ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                        <span>All Active Tasks</span>
                    </div>
                    <div class="filter-option ${this.currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">
                        <span>${i18n.translate('status.pending')}</span>
                    </div>
                    <div class="filter-option ${this.currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">
                        <span>${i18n.translate('status.completed')}</span>
                    </div>
                    <div class="filter-option ${this.currentFilter === 'overdue' ? 'active' : ''}" data-filter="overdue">
                        <span>${i18n.translate('status.overdue')}</span>
                    </div>
                    
                    <h4 style="margin-top: 20px;">Priority</h4>
                    <div class="filter-option ${this.currentPriority === 'all' ? 'active' : ''}" data-priority="all">
                        <span>All Priorities</span>
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
            // Create search wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'searchable-select-wrapper';
            
            // Create search input
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'form-control searchable-select-search';
            searchInput.placeholder = 'Search clients...';
            
            // Insert search input before select
            selectElement.parentNode.insertBefore(wrapper, selectElement);
            wrapper.appendChild(searchInput);
            wrapper.appendChild(selectElement);
            
            // Store all options
            const allOptions = Array.from(selectElement.options);
            
            // Search functionality
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                
                // Clear and re-populate options
                selectElement.innerHTML = '';
                
                allOptions.forEach(option => {
                    if (option.text.toLowerCase().includes(searchTerm) || option.value === '') {
                        selectElement.appendChild(option.cloneNode(true));
                    }
                });
                
                // Restore selected value if it exists in filtered results
                const currentValue = selectElement.dataset.currentValue;
                if (currentValue) {
                    selectElement.value = currentValue;
                }
            });
            
            // Track selected value
            selectElement.addEventListener('change', (e) => {
                selectElement.dataset.currentValue = e.target.value;
            });
        },

        getClientName: function(clientId) {
            if (!clientId) return null;
            const client = window.SmartAgenda.DataManager.getById('clients', clientId);
            return client ? client.name : null;
        },

        isOverdue: function(task) {
            if (!task.date || task.completed) return false;
            return new Date(task.date) < new Date();
        },

        formatDate: function(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            if (dateOnly.getTime() === today.getTime()) return 'Today';
            if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
        .task-item { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: var(--border-radius-sm); padding: 16px; display: flex; gap: 12px; cursor: pointer; transition: all var(--transition-fast); }
        .task-item:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
        .task-item.completed { opacity: 0.6; }
        .task-item.completed .task-title { text-decoration: line-through; }
        .task-item.overdue { border-left: 3px solid var(--danger); }
        .task-priority-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm); }
        .task-content { flex: 1; min-width: 0; }
        .task-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .task-title { font-weight: 600; font-size: 15px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .task-date { font-size: 13px; color: var(--text-tertiary); white-space: nowrap; }
        .task-description { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.4; }
        .task-footer { display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 600; flex-wrap: wrap; }
        .task-priority { text-transform: uppercase; letter-spacing: 0.5px; }
        .task-amount { color: var(--text-tertiary); }
        .task-standalone-badge { padding: 2px 6px; background: var(--info)22; color: var(--info); border-radius: 4px; font-size: 11px; }
        .filter-menu h4 { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .searchable-select-wrapper { display: flex; flex-direction: column; gap: 8px; }
        .searchable-select-search { margin-bottom: 4px; }
    `;
    document.head.appendChild(styles);

    // Initialize when app is ready
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => Tasks.init());
        window.SmartAgenda.Tasks = Tasks;
    }

})();
