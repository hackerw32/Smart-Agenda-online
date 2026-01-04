/**
 * Smart Agenda - Clients Module
 * 
 * Manages client data and UI:
 * - CRUD operations
 * - Search and filter
 * - List rendering
 * - Client modal form
 */

(function() {
    'use strict';

    const Clients = {
        // DOM elements
        clientsList: null,
        searchInput: null,
        addButton: null,
        filterButton: null,
        sortButton: null,

        // Virtual scrolling
        virtualScroll: null,

        // State
        currentFilter: 'all', // 'all' or array of type IDs
        filterMode: 'or', // 'or', 'and', or 'or-and' - how to combine multiple filters
        currentSort: 'date', // date (newest first), name
        searchQuery: '',
        hasSearched: true, // Show all clients by default
        itemsToShow: 100, // Initial number of items to show
        itemsPerPage: 100, // Number of items to load when "Load More" is clicked
        lastRenderState: null, // Track last filter/search/sort state to reset pagination

        // ============================================
        // Initialization
        // ============================================

        init: function() {
            this.clientsList = document.getElementById('clients-list');
            this.searchInput = document.getElementById('clients-search');
            this.searchClearBtn = document.getElementById('clients-search-clear');
            this.searchIndicator = document.getElementById('clients-search-indicator');
            this.addButton = document.getElementById('clients-add-btn');
            this.filterButton = document.getElementById('clients-filter-btn');
            this.sortButton = document.getElementById('clients-sort-btn');

            this.bindEvents();
            this.render();
        },

        bindEvents: function() {
            // Add button
            this.addButton?.addEventListener('click', () => this.showClientModal());

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
                    this.hasSearched = true;
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
                    this.hasSearched = true;
                    this.updateSearchUI();
                    this.render();
                }, 300);
            });

            // Search clear button
            this.searchClearBtn?.addEventListener('click', () => {
                this.clearSearch();
            });

            // Filter button
            this.filterButton?.addEventListener('click', () => this.showFilterMenu());

            // Sort button
            this.sortButton?.addEventListener('click', () => this.showSortMenu());

            // Listen to data changes
            if (window.SmartAgenda) {
                window.SmartAgenda.EventBus.on('data:clients:change', () => this.render());
                window.SmartAgenda.EventBus.on('language:change', () => this.render());

                // Re-render when settings (client types) change
                window.SmartAgenda.EventBus.on('settings:clientTypes:change', () => this.render());

                // Clear search when switching tabs/pages
                window.SmartAgenda.EventBus.on('tab:change', (tabName) => {
                    if (tabName === 'clients') {
                        // Refresh virtual scroll when tab becomes visible
                        setTimeout(() => {
                            if (this.virtualScroll) {
                                this.virtualScroll.refresh();
                            }
                        }, 100);
                    } else {
                        this.clearSearch();
                    }
                });
            }
        },

        // ============================================
        // Rendering
        // ============================================

        render: function() {
            if (!this.clientsList) return;

            // If user hasn't searched yet, show a message to start searching
            if (!this.hasSearched) {
                this.clientsList.innerHTML = '';
                const searchPrompt = document.createElement('div');
                searchPrompt.className = 'search-prompt';
                searchPrompt.style.cssText = `
                    text-align: center;
                    padding: 60px 20px;
                    color: var(--text-secondary);
                `;
                searchPrompt.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 16px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Search for Clients</div>
                    <div style="font-size: 14px;">Enter a name or phone number and click search to find clients</div>
                `;
                this.clientsList.appendChild(searchPrompt);
                return;
            }

            // Check if filter/search/sort state has changed - if so, reset pagination
            const currentState = `${this.currentFilter}-${this.currentSort}-${this.searchQuery}`;
            if (this.lastRenderState !== currentState) {
                this.itemsToShow = this.itemsPerPage;
                this.lastRenderState = currentState;
            }

            // Get and filter clients
            let clients = window.SmartAgenda.DataManager.getAll('clients');

            // Apply search
            if (this.searchQuery) {
                clients = window.SmartAgenda.DataManager.search('clients', this.searchQuery);
            }

            // Apply filter
            if (this.currentFilter !== 'all') {
                const selectedTypes = Array.isArray(this.currentFilter) ? this.currentFilter : [this.currentFilter];

                clients = clients.filter(c => {
                    // Get client's types
                    let clientTypesList = [];
                    if (c.clientTypes && Array.isArray(c.clientTypes)) {
                        clientTypesList = c.clientTypes;
                    } else if (c.customerType) {
                        clientTypesList = [c.customerType];
                    }

                    if (clientTypesList.length === 0) return false;

                    // Apply filter logic based on mode
                    if (this.filterMode === 'and') {
                        // AND: client must have ALL selected types
                        return selectedTypes.every(typeId => clientTypesList.includes(typeId));
                    } else if (this.filterMode === 'or-and') {
                        // OR+AND: First 2 types use OR, rest use AND
                        const firstTwo = selectedTypes.slice(0, 2);
                        const rest = selectedTypes.slice(2);

                        // Client must have at least one of the first two
                        const hasFirstTwo = firstTwo.length === 0 || firstTwo.some(typeId => clientTypesList.includes(typeId));

                        // Client must have all of the rest
                        const hasRest = rest.every(typeId => clientTypesList.includes(typeId));

                        return hasFirstTwo && hasRest;
                    } else {
                        // OR: client must have AT LEAST ONE of the selected types
                        return selectedTypes.some(typeId => clientTypesList.includes(typeId));
                    }
                });
            }

            // Apply sorting
            if (this.currentSort === 'date') {
                // Sort by creation date (newest first - descending order)
                clients = clients.sort((a, b) => {
                    // Use epoch (1970) as default for clients without createdAt, so they appear at the end
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    // Descending sort: dateB - dateA (newer dates have higher values, so they come first)
                    const dateDiff = dateB - dateA;
                    // If dates are equal, use ID as tiebreaker (higher ID = newer, so comes first)
                    if (dateDiff === 0) {
                        return (b.id || 0) - (a.id || 0);
                    }
                    return dateDiff;
                });
            } else if (this.currentSort === 'name') {
                // Sort by name alphabetically
                clients = window.SmartAgenda.DataManager.sort(clients, 'name', 'asc');
            }

            // Render with Load More pagination
            this.clientsList.innerHTML = '';

            if (clients.length === 0) {
                this.renderEmptyState();
                return;
            }

            // Show only the first itemsToShow clients
            const clientsToDisplay = clients.slice(0, this.itemsToShow);
            const hasMore = clients.length > this.itemsToShow;

            // Render clients
            clientsToDisplay.forEach(client => {
                const card = this.createClientCard(client);
                this.clientsList.appendChild(card);
            });

            // Add "Load More" button if there are more items
            if (hasMore) {
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.className = 'load-more-btn';
                loadMoreBtn.textContent = `Load More (${clients.length - this.itemsToShow} remaining)`;
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
                this.clientsList.appendChild(loadMoreBtn);
            }
        },

        createClientCard: function(client) {
            const card = document.createElement('div');
            card.className = 'contact-item modern-client-card';
            card.dataset.id = client.id;

            // Get first letter for avatar
            const initial = client.name ? client.name.charAt(0).toUpperCase() : '?';

            // Get primary type color
            const primaryType = this.getPrimaryClientType(client);
            const avatarColor = primaryType ? primaryType.color : '#94a3b8';

            // Get all client types
            const availableTypes = window.SmartAgenda?.Settings?.getClientTypes() || [];
            let clientTypesList = [];
            if (client.clientTypes && Array.isArray(client.clientTypes)) {
                clientTypesList = client.clientTypes;
            } else if (client.customerType) {
                clientTypesList = [client.customerType];
            }

            // Build type badges (max 3)
            const typeBadges = clientTypesList.slice(0, 3).map(typeId => {
                const type = availableTypes.find(t => t.id === typeId);
                if (!type) return '';
                return `<span style="background: ${type.color}18; color: ${type.color}; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;">${this.escapeHtml(type.name)}</span>`;
            }).join('');

            // Build contact details with icons
            const detailsHTML = [];

            if (client.contactName) {
                detailsHTML.push(`
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>${this.escapeHtml(client.contactName)}</span>
                    </div>
                `);
            }

            if (client.phone) {
                detailsHTML.push(`
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>${this.escapeHtml(client.phone)}</span>
                    </div>
                `);
            }

            if (client.email) {
                detailsHTML.push(`
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(client.email)}</span>
                    </div>
                `);
            }

            if (client.address) {
                detailsHTML.push(`
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(client.address)}</span>
                    </div>
                `);
            }

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 600; flex-shrink: 0;">
                        ${initial}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 15px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: ${typeBadges ? '6px' : '4px'};">
                            ${this.escapeHtml(client.name)}
                        </div>
                        ${typeBadges ? `
                            <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
                                ${typeBadges}
                            </div>
                        ` : ''}
                        ${detailsHTML.length > 0 ? `
                            <div style="display: flex; flex-direction: column; gap: 3px;">
                                ${detailsHTML.slice(0, 2).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div style="flex-shrink: 0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            `;

            // Click handler - Show detailed client view instead of edit modal
            card.addEventListener('click', () => {
                // Clear search when opening client detail
                this.clearSearch();

                if (window.SmartAgenda.ClientDetailView) {
                    window.SmartAgenda.ClientDetailView.show(client);
                } else {
                    this.showClientModal(client);
                }
            });

            return card;
        },

        getPrimaryClientType: function(client) {
            // Ensure Settings module is available and has loaded client types
            if (!window.SmartAgenda || !window.SmartAgenda.Settings) return null;

            const availableTypes = window.SmartAgenda.Settings.getClientTypes();

            // If client types haven't loaded yet, return null
            if (!availableTypes || availableTypes.length === 0) return null;

            // Support both old (customerType) and new (clientTypes) format
            if (client.clientTypes && client.clientTypes.length > 0) {
                const primaryTypeId = client.primaryType || client.clientTypes[0];
                return availableTypes.find(t => t.id === primaryTypeId);
            } else if (client.customerType) {
                // Legacy support
                return availableTypes.find(t => t.id === client.customerType);
            }

            return null;
        },

        renderEmptyState: function() {
            const emptyState = window.SmartAgenda.UIComponents.createEmptyState({
                icon: '👥',
                title: window.SmartAgenda.I18n.translate('empty.clients.title'),
                message: window.SmartAgenda.I18n.translate('empty.clients.message'),
                actionText: window.SmartAgenda.I18n.translate('actions.add'),
                onAction: () => this.showClientModal()
            });
            this.clientsList.appendChild(emptyState);
        },

        // ============================================
        // Client Modal
        // ============================================

        showClientModal: function(client = null) {
            // Use new modal if available
            if (window.SmartAgenda?.ClientModalNew) {
                window.SmartAgenda.ClientModalNew.showClientModal(client);
                return;
            }

            // Fallback to old modal
            const isEdit = !!client;
            const i18n = window.SmartAgenda.I18n;

            // Get client types from settings
            const availableTypes = window.SmartAgenda.Settings?.getClientTypes() || [];

            // Define form fields (without clientTypes - we'll add that manually)
            const fields = [
                {
                    name: 'name',
                    label: i18n.translate('client.name'),
                    type: 'text',
                    required: true,
                    placeholder: 'John Doe'
                },
                {
                    name: 'contactName',
                    label: 'Contact Person',
                    type: 'text',
                    placeholder: 'Contact person name (optional)'
                },
                {
                    name: 'phone',
                    label: i18n.translate('client.phone'),
                    type: 'tel',
                    placeholder: '+30 123 456 7890'
                },
                {
                    name: 'email',
                    label: i18n.translate('client.email'),
                    type: 'email',
                    placeholder: 'john@example.com'
                },
                {
                    name: 'address',
                    label: i18n.translate('client.address'),
                    type: 'text',
                    placeholder: 'Street, City, Country'
                },
                {
                    name: 'desc',
                    label: i18n.translate('client.notes'),
                    type: 'textarea',
                    rows: 4,
                    placeholder: 'Additional notes...'
                },
                {
                    name: 'lastContact',
                    label: 'Last Contact',
                    type: 'date',
                    placeholder: ''
                },
                {
                    name: 'nextFollowUp',
                    label: 'Next Follow-up',
                    type: 'date',
                    placeholder: ''
                }
            ];

            // Prepare initial client types
            let initialClientTypes = [];
            let initialPrimaryType = null;

            if (client) {
                // Support both new and old format
                if (client.clientTypes) {
                    initialClientTypes = client.clientTypes;
                    initialPrimaryType = client.primaryType || client.clientTypes[0];
                } else if (client.customerType) {
                    // Migrate from old format
                    initialClientTypes = [client.customerType];
                    initialPrimaryType = client.customerType;
                }
            } else {
                // Default for new clients
                if (availableTypes.length > 0) {
                    initialClientTypes = [availableTypes[0].id];
                    initialPrimaryType = availableTypes[0].id;
                }
            }

            // Create form
            const form = window.SmartAgenda.UIComponents.createForm(fields, client || {});

            // Modal buttons
            const buttons = [
                {
                    label: i18n.translate('actions.cancel'),
                    type: 'secondary',
                    action: 'cancel',
                    onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                },
                {
                    label: i18n.translate('actions.save'),
                    type: 'primary',
                    action: 'save',
                    onClick: (modal) => this.saveClient(modal, form, client, descEditor)
                }
            ];

            // Add delete button for existing clients
            if (isEdit) {
                buttons.unshift({
                    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>`,
                    type: 'danger',
                    action: 'delete',
                    onClick: (modal) => this.deleteClient(modal, client.id)
                });
            }

            // Show modal
            const modal = window.SmartAgenda.UIComponents.showModal({
                title: isEdit ? `Edit ${client.name}` : i18n.translate('actions.add') + ' Client',
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
                client?.desc || ''
            );

            // Store editor reference
            this.currentDescEditor = descEditor;

            // Add client types selector
            this.addClientTypesSelector(modal, availableTypes, initialClientTypes, initialPrimaryType);

            // Add photo upload
            this.addPhotoUpload(modal, client);

            // Add file attachments
            this.addFileAttachments(modal, client);

            // Add map location picker after address field
            this.addMapLocationPicker(modal, client);

            // Add additional contact fields (secondary phone/email, social media, website)
            this.addAdditionalContactFields(modal, client);
        },

        addAdditionalContactFields: function(modal, client) {
            const emailField = modal.querySelector('[name="email"]');
            if (!emailField) return;

            const emailFormGroup = emailField.closest('.form-group');
            if (!emailFormGroup) return;

            // Create additional contacts container
            const additionalContactsContainer = document.createElement('div');
            additionalContactsContainer.className = 'additional-contacts-section';
            additionalContactsContainer.innerHTML = `
                <div class="form-group">
                    <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 15px; color: var(--text-primary);">📞 Additional Contacts</label>

                    <!-- Secondary Phone -->
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500;">Secondary Phone</label>
                        <div style="display: flex; gap: 8px;">
                            <select name="phone2Type" style="flex: 0 0 120px; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                                <option value="home" ${client?.phone2Type === 'home' ? 'selected' : ''}>Home</option>
                                <option value="work" ${client?.phone2Type === 'work' ? 'selected' : ''}>Work</option>
                                <option value="personal" ${client?.phone2Type === 'personal' ? 'selected' : ''}>Personal</option>
                            </select>
                            <input type="tel" name="phone2" placeholder="Secondary phone number" value="${client?.phone2 || ''}"
                                   style="flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                        </div>
                    </div>

                    <!-- Secondary Email -->
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500;">Secondary Email</label>
                        <div style="display: flex; gap: 8px;">
                            <select name="email2Type" style="flex: 0 0 120px; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                                <option value="home" ${client?.email2Type === 'home' ? 'selected' : ''}>Home</option>
                                <option value="work" ${client?.email2Type === 'work' ? 'selected' : ''}>Work</option>
                                <option value="personal" ${client?.email2Type === 'personal' ? 'selected' : ''}>Personal</option>
                            </select>
                            <input type="email" name="email2" placeholder="Secondary email address" value="${client?.email2 || ''}"
                                   style="flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                        </div>
                    </div>

                    <!-- Primary Phone Type (for existing phone) -->
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500;">Primary Phone Type</label>
                        <select name="phoneType" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                            <option value="home" ${client?.phoneType === 'home' ? 'selected' : ''}>Home</option>
                            <option value="work" ${client?.phoneType === 'work' ? 'selected' : ''}>Work</option>
                            <option value="personal" ${client?.phoneType === 'personal' ? 'selected' : ''}>Personal</option>
                        </select>
                    </div>

                    <!-- Primary Email Type (for existing email) -->
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500;">Primary Email Type</label>
                        <select name="emailType" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                            <option value="home" ${client?.emailType === 'home' ? 'selected' : ''}>Home</option>
                            <option value="work" ${client?.emailType === 'work' ? 'selected' : ''}>Work</option>
                            <option value="personal" ${client?.emailType === 'personal' ? 'selected' : ''}>Personal</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 15px; color: var(--text-primary);">🌐 Social Media & Website</label>

                    <!-- Facebook -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500;">Facebook</label>
                        <input type="url" name="facebook" placeholder="https://facebook.com/username" value="${client?.facebook || ''}"
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                    </div>

                    <!-- Instagram -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500;">Instagram</label>
                        <input type="url" name="instagram" placeholder="https://instagram.com/username" value="${client?.instagram || ''}"
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                    </div>

                    <!-- LinkedIn -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500;">LinkedIn</label>
                        <input type="url" name="linkedin" placeholder="https://linkedin.com/in/username" value="${client?.linkedin || ''}"
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                    </div>

                    <!-- Website -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500;">Website</label>
                        <input type="url" name="website" placeholder="https://example.com" value="${client?.website || ''}"
                               style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary); font-size: 14px;">
                    </div>
                </div>
            `;

            // Insert after email field's form group
            emailFormGroup.parentNode.insertBefore(additionalContactsContainer, emailFormGroup.nextSibling);
        },

        addClientTypesSelector: function(modal, availableTypes, selectedTypes, primaryTypeId) {
            const addressField = modal.querySelector('[name="address"]');
            if (!addressField) return;

            const formGroup = addressField.closest('.form-group');
            if (!formGroup) return;

            // Create client types selector
            const typesContainer = document.createElement('div');
            typesContainer.className = 'form-group';
            typesContainer.innerHTML = `
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Client Types</label>
                <div id="client-types-selector" style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${availableTypes.map(type => {
                        const isSelected = selectedTypes.includes(type.id);
                        const isPrimary = type.id === primaryTypeId;
                        return `
                            <div class="type-option ${isSelected ? 'selected' : ''}" data-type-id="${type.id}"
                                 style="display: flex; align-items: center; padding: 8px 12px; border: 2px solid ${isSelected ? type.color : 'var(--border)'};
                                        border-radius: 8px; cursor: pointer; background: ${isSelected ? type.color + '22' : 'var(--surface)'};
                                        transition: all 0.2s;">
                                <span class="type-star" style="font-size: 24px; margin-right: 6px; cursor: pointer; opacity: ${isPrimary ? '1' : '0.3'};">
                                    ${isPrimary ? '⭐' : '☆'}
                                </span>
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: ${type.color}; margin-right: 8px;"></div>
                                <span style="font-weight: 500; color: var(--text-primary);">${this.escapeHtml(type.name)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    Click to select types. Click ⭐ to set primary type (determines avatar color).
                </div>
            `;

            // Insert before address field's form group
            formGroup.parentNode.insertBefore(typesContainer, formGroup);

            // Initialize global temp storage for client types
            if (!window.SmartAgenda.tempClientData) {
                window.SmartAgenda.tempClientData = {};
            }
            window.SmartAgenda.tempClientData.clientTypes = selectedTypes;
            window.SmartAgenda.tempClientData.primaryType = primaryTypeId;

            // Bind click events
            const typeOptions = modal.querySelectorAll('.type-option');
            typeOptions.forEach(option => {
                const typeId = option.dataset.typeId;

                // Click on type badge to toggle selection
                option.addEventListener('click', (e) => {
                    if (e.target.classList.contains('type-star')) return; // Skip if clicking star

                    const wasSelected = option.classList.contains('selected');
                    option.classList.toggle('selected');
                    const type = availableTypes.find(t => t.id === typeId);

                    if (option.classList.contains('selected')) {
                        option.style.borderColor = type.color;
                        option.style.background = type.color + '22';
                    } else {
                        option.style.borderColor = 'var(--border)';
                        option.style.background = 'var(--surface)';

                        // If deselecting, ALWAYS clear the star for this option
                        const star = option.querySelector('.type-star');
                        star.textContent = '☆';
                        star.style.opacity = '0.3';
                    }

                    // Backup current selection state
                    const currentSelected = Array.from(modal.querySelectorAll('.type-option.selected')).map(opt => opt.dataset.typeId);
                    window.SmartAgenda.tempClientData.clientTypes = currentSelected;
                });

                // Click on star to set as primary
                const star = option.querySelector('.type-star');
                star.addEventListener('click', (e) => {
                    e.stopPropagation();

                    // Can only set primary if selected
                    if (!option.classList.contains('selected')) {
                        window.SmartAgenda.Toast.warning('Select the type first');
                        return;
                    }

                    // Clear all other stars
                    modal.querySelectorAll('.type-star').forEach(s => {
                        s.textContent = '☆';
                        s.style.opacity = '0.3';
                    });

                    // Set this as primary
                    star.textContent = '⭐';
                    star.style.opacity = '1';

                    // Backup primary type
                    window.SmartAgenda.tempClientData.primaryType = typeId;
                });
            });
        },

        addPhotoUpload: function(modal, client) {
            const nameField = modal.querySelector('[name="name"]');
            if (!nameField) return;

            const formGroup = nameField.closest('.form-group');
            if (!formGroup) return;

            const photoContainer = document.createElement('div');
            photoContainer.className = 'form-group';
            photoContainer.innerHTML = `
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Client Photo</label>
                <div style="display: flex; gap: 16px; align-items: center;">
                    <div id="client-photo-preview" style="width: 100px; height: 100px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid var(--border);">
                        ${client?.photo ? `<img src="${client.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="font-size: 40px;">👤</span>'}
                    </div>
                    <div style="flex: 1;">
                        <input type="file" id="client-photo-input" accept="image/*" style="display: none;">
                        <button type="button" class="btn-secondary" id="upload-photo-btn" style="margin-bottom: 8px; width: 100%;">
                            <span>Choose Photo</span>
                        </button>
                        ${client?.photo ? '<button type="button" class="btn-danger" id="remove-photo-btn" style="width: 100%;"><span>Remove Photo</span></button>' : ''}
                    </div>
                </div>
            `;

            formGroup.parentNode.insertBefore(photoContainer, formGroup.nextSibling);

            // Handle photo upload
            document.getElementById('upload-photo-btn')?.addEventListener('click', () => {
                document.getElementById('client-photo-input').click();
            });

            document.getElementById('client-photo-input')?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    window.SmartAgenda.Toast.error('Photo must be less than 5MB');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    // Use querySelector on modal to ensure we get the right element
                    const currentModal = document.querySelector('.modal-overlay:not([style*="display: none"]) .modal');
                    if (!currentModal) {
                        console.error('Modal not found when trying to set photo');
                        return;
                    }

                    const preview = currentModal.querySelector('#client-photo-preview');
                    if (!preview) {
                        console.error('Photo preview element not found');
                        return;
                    }

                    const photoData = event.target.result;
                    preview.innerHTML = `<img src="${photoData}" style="width: 100%; height: 100%; object-fit: cover;">`;
                    preview.dataset.photo = photoData;

                    // Store in a global variable as backup
                    if (!window.SmartAgenda.tempClientData) {
                        window.SmartAgenda.tempClientData = {};
                    }
                    window.SmartAgenda.tempClientData.photo = photoData;

                    console.log('Photo uploaded and stored successfully');
                };
                reader.onerror = (error) => {
                    console.error('Error reading file:', error);
                    window.SmartAgenda.Toast.error('Failed to read photo file');
                };
                reader.readAsDataURL(file);
            });

            document.getElementById('remove-photo-btn')?.addEventListener('click', () => {
                const preview = document.getElementById('client-photo-preview');
                preview.innerHTML = '<span style="font-size: 40px;">👤</span>';
                preview.dataset.photo = '';
                document.getElementById('client-photo-input').value = '';

                // Clear global backup
                if (window.SmartAgenda.tempClientData) {
                    delete window.SmartAgenda.tempClientData.photo;
                }
            });
        },

        addFileAttachments: function(modal, client) {
            const descField = modal.querySelector('[name="desc"]').closest('.form-group');
            if (!descField) return;

            const attachmentsContainer = document.createElement('div');
            attachmentsContainer.className = 'form-group';
            attachmentsContainer.innerHTML = `
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">File Attachments</label>
                <div>
                    <input type="file" id="client-attachments-input" multiple style="display: none;">
                    <button type="button" class="btn-secondary" id="add-attachment-btn" style="margin-bottom: 12px;">
                        <span>📎</span>
                        <span>Add Files</span>
                    </button>
                    <div id="attachments-list" style="display: flex; flex-direction: column; gap: 8px;">
                        ${client?.attachments ? client.attachments.map((att, idx) => `
                            <div class="attachment-item" data-index="${idx}" data-filename="${this.escapeHtml(att.name)}" data-filesize="${att.size}" data-file="${att.data}" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; transition: background 0.2s;">
                                <span style="font-size: 20px;">📄</span>
                                <span class="attachment-name" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(att.name)}</span>
                                <span style="font-size: 12px; color: var(--text-secondary);">${this.formatFileSize(att.size)}</span>
                                <button type="button" class="btn-icon remove-attachment-btn" data-index="${idx}" style="color: var(--danger); cursor: pointer; padding: 4px;">✕</button>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>
            `;

            descField.parentNode.insertBefore(attachmentsContainer, descField.nextSibling);

            // Handle file selection
            document.getElementById('add-attachment-btn')?.addEventListener('click', () => {
                document.getElementById('client-attachments-input').click();
            });

            document.getElementById('client-attachments-input')?.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;

                const attachmentsList = document.getElementById('attachments-list');
                const existingCount = attachmentsList.querySelectorAll('.attachment-item').length;

                files.forEach((file, idx) => {
                    if (file.size > 10 * 1024 * 1024) {
                        window.SmartAgenda.Toast.error(`${file.name} is too large (max 10MB)`);
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const attachmentItem = document.createElement('div');
                        attachmentItem.className = 'attachment-item';
                        attachmentItem.dataset.index = existingCount + idx;
                        attachmentItem.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; transition: background 0.2s;';
                        attachmentItem.innerHTML = `
                            <span style="font-size: 20px;">📄</span>
                            <span class="attachment-name" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${this.escapeHtml(file.name)}</span>
                            <span style="font-size: 12px; color: var(--text-secondary);">${this.formatFileSize(file.size)}</span>
                            <button type="button" class="btn-icon remove-attachment-btn" style="color: var(--danger); cursor: pointer; padding: 4px;">✕</button>
                        `;
                        attachmentItem.dataset.file = event.target.result;
                        attachmentItem.dataset.filename = file.name;
                        attachmentItem.dataset.filesize = file.size;

                        attachmentsList.appendChild(attachmentItem);

                        // Bind remove button
                        const removeBtn = attachmentItem.querySelector('.remove-attachment-btn');
                        removeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            attachmentItem.remove();
                        });

                        // Add click handler to download/open attachment
                        attachmentItem.addEventListener('click', (e) => {
                            // Don't trigger if clicking on remove button
                            if (e.target.closest('.remove-attachment-btn')) return;

                            const data = attachmentItem.dataset.file;
                            const filename = attachmentItem.dataset.filename;

                            if (data && filename) {
                                // Create a temporary link and trigger download
                                const link = document.createElement('a');
                                link.href = data;
                                link.download = filename;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        });

                        // Add hover effect
                        attachmentItem.addEventListener('mouseenter', () => {
                            if (!attachmentItem.querySelector('.remove-attachment-btn:hover')) {
                                attachmentItem.style.background = 'var(--border)';
                            }
                        });
                        attachmentItem.addEventListener('mouseleave', () => {
                            attachmentItem.style.background = 'var(--surface)';
                        });
                    };
                    reader.readAsDataURL(file);
                });

                e.target.value = '';
            });

            // Bind existing remove buttons and download handlers
            modal.querySelectorAll('.attachment-item').forEach(item => {
                const removeBtn = item.querySelector('.remove-attachment-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.remove();
                    });
                }

                // Add click handler to download/open attachment
                item.addEventListener('click', (e) => {
                    // Don't trigger if clicking on remove button
                    if (e.target.closest('.remove-attachment-btn')) return;

                    const data = item.dataset.file;
                    const filename = item.dataset.filename;

                    if (data && filename) {
                        // Create a temporary link and trigger download
                        const link = document.createElement('a');
                        link.href = data;
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                });

                // Add hover effect
                item.addEventListener('mouseenter', () => {
                    if (!item.querySelector('.remove-attachment-btn:hover')) {
                        item.style.background = 'var(--border)';
                    }
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'var(--surface)';
                });
            });
        },

        formatFileSize: function(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        },

        addMapLocationPicker: function(modal, client) {
            const addressField = modal.querySelector('[name="address"]');
            if (!addressField) return;

            const formGroup = addressField.closest('.form-group');
            if (!formGroup) return;

            // Create map controls container
            const mapControls = document.createElement('div');
            mapControls.className = 'map-location-picker-controls';
            mapControls.style.cssText = `
                display: flex;
                flex-direction: row;
                gap: 10px;
                margin-top: 10px;
                align-items: stretch;
                width: 100%;
            `;

            // Map button
            const mapButton = document.createElement('button');
            mapButton.type = 'button';
            mapButton.className = 'btn-secondary';
            mapButton.innerHTML = '<span style="margin-right: 6px;">📍</span><span>Pick from Map</span>';
            mapButton.style.cssText = `
                flex: 0 0 auto;
                padding: 8px 16px;
                white-space: nowrap;
                display: flex;
                align-items: center;
            `;

            // Location display
            const locationDisplay = document.createElement('div');
            locationDisplay.className = 'location-display';
            locationDisplay.style.cssText = `
                flex: 1;
                padding: 8px 12px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--border-radius-sm);
                font-size: 13px;
                color: var(--text-secondary);
                min-height: 36px;
                display: flex;
                align-items: center;
            `;

            // Set initial display
            if (client?.lat && client?.lng) {
                locationDisplay.innerHTML = `<span style="color: var(--success);">📌 Location saved</span>`;
            } else {
                locationDisplay.textContent = 'No location selected';
            }

            mapControls.appendChild(mapButton);
            mapControls.appendChild(locationDisplay);
            formGroup.appendChild(mapControls);

            // Store coordinates in hidden inputs
            let latInput = modal.querySelector('[name="lat"]');
            let lngInput = modal.querySelector('[name="lng"]');

            if (!latInput) {
                latInput = document.createElement('input');
                latInput.type = 'hidden';
                latInput.name = 'lat';
                latInput.value = client?.lat || '';
                formGroup.appendChild(latInput);
            }

            if (!lngInput) {
                lngInput = document.createElement('input');
                lngInput.type = 'hidden';
                lngInput.name = 'lng';
                lngInput.value = client?.lng || '';
                formGroup.appendChild(lngInput);
            }

            // Map button click handler
            mapButton.addEventListener('click', () => {
                this.openLocationPicker(modal, addressField, locationDisplay, latInput, lngInput);
            });
        },

        openLocationPicker: function(clientModal, addressField, locationDisplay, latInput, lngInput) {
            // Create location picker modal
            const pickerContent = `
                <div class="location-picker-container" style="height: 500px; display: flex; flex-direction: column;">
                    <div class="location-picker-controls" style="padding: 6px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; gap: 6px;">
                        <input type="text" id="location-search-input" placeholder="Search for a location..."
                               style="flex: 1; padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--border-radius-sm); background: var(--background); color: var(--text-primary);">
                        <button type="button" id="location-search-btn" class="btn-primary" style="padding: 6px 12px;">
                            <span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </span>
                        </button>
                    </div>
                    <div id="location-map" style="flex: 1; background: #e0e0e0;"></div>
                </div>
            `;

            const pickerModal = window.SmartAgenda.UIComponents.showModal({
                title: 'Pick Location from Map',
                content: pickerContent,
                buttons: [
                    {
                        label: 'GPS',
                        type: 'secondary',
                        action: 'gps',
                        id: 'location-gps-btn',
                        onClick: (modal) => {
                            if (navigator.geolocation) {
                                window.SmartAgenda.Toast.info('Getting your location...');
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        const pos = {
                                            lat: position.coords.latitude,
                                            lng: position.coords.longitude
                                        };
                                        this.pickerMap.setCenter(pos);
                                        this.pickerMap.setZoom(16);
                                        this.selectLocationOnMap(new google.maps.LatLng(pos.lat, pos.lng));
                                    },
                                    () => {
                                        window.SmartAgenda.Toast.error('Could not get your location');
                                    }
                                );
                            } else {
                                window.SmartAgenda.Toast.error('Geolocation not supported');
                            }
                        }
                    },
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        action: 'cancel',
                        onClick: (modal) => {
                            this.cleanupLocationPicker();
                            window.SmartAgenda.UIComponents.closeModal(modal);
                        }
                    },
                    {
                        label: 'Confirm',
                        type: 'primary',
                        action: 'confirm',
                        onClick: (modal) => {
                            this.confirmLocationPicker(modal, addressField, locationDisplay, latInput, lngInput);
                        }
                    }
                ],
                size: 'large'
            });

            // Initialize map in the picker
            setTimeout(() => {
                this.initializeLocationPickerMap(pickerModal);
            }, 100);
        },

        initializeLocationPickerMap: function(modal) {
            const mapElement = modal.querySelector('#location-map');
            if (!mapElement || !window.google) return;

            // Create map with Map ID for modern features
            const initialCenter = { lat: 37.9838, lng: 23.7275 }; // Default to Athens
            const MAP_ID = 'de8670acc4bd10699eb9ccb1'; // Same as main map

            this.pickerMap = new google.maps.Map(mapElement, {
                mapId: MAP_ID, // Enable Advanced Markers and modern features
                center: initialCenter,
                zoom: 13,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: false,
                gestureHandling: 'greedy', // Allow 1-finger panning, 2-finger zooming
                zoomControl: true
            });

            this.pickerMarker = null;
            this.selectedPickerLocation = null;

            // Click listener for map
            this.pickerMap.addListener('click', (event) => {
                this.selectLocationOnMap(event.latLng);
            });

            // Search button
            const searchBtn = modal.querySelector('#location-search-btn');
            const searchInput = modal.querySelector('#location-search-input');

            searchBtn?.addEventListener('click', () => {
                const query = searchInput.value.trim();
                if (query && window.geocoder) {
                    window.geocoder.geocode({ address: query }, (results, status) => {
                        if (status === 'OK' && results[0]) {
                            this.pickerMap.setCenter(results[0].geometry.location);
                            this.pickerMap.setZoom(16);
                            this.selectLocationOnMap(results[0].geometry.location);
                        } else {
                            window.SmartAgenda.Toast.error('Location not found');
                        }
                    });
                }
            });

            // Enter key for search
            searchInput?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchBtn.click();
                }
            });
        },

        selectLocationOnMap: async function(latLng) {
            // Remove old marker
            if (this.pickerMarker) {
                // Support both Advanced Markers and old Markers
                if (this.pickerMarker.map !== undefined) {
                    this.pickerMarker.map = null; // Advanced Marker
                } else if (this.pickerMarker.setMap) {
                    this.pickerMarker.setMap(null); // Old Marker
                }
            }

            try {
                // Try to use Advanced Markers API (modern)
                const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

                const pinElement = new PinElement({
                    background: '#FF5722',
                    borderColor: '#ffffff',
                    glyphColor: '#ffffff',
                    scale: 1.3
                });

                this.pickerMarker = new AdvancedMarkerElement({
                    map: this.pickerMap,
                    position: latLng,
                    title: 'Selected Location',
                    content: pinElement.element
                });

                console.log('[Location Picker] Created Advanced Marker');
            } catch (error) {
                // Fallback to old markers if Advanced Markers fail
                console.warn('[Location Picker] Advanced Markers not available, using old markers:', error);
                this.pickerMarker = new google.maps.Marker({
                    position: latLng,
                    map: this.pickerMap,
                    title: 'Selected Location',
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#FF5722',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                    }
                });
            }

            const lat = latLng.lat();
            const lng = latLng.lng();

            // Save selection
            this.selectedPickerLocation = { lat, lng };

            // Reverse geocode to get address
            if (window.geocoder) {
                window.geocoder.geocode({ location: latLng }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const address = results[0].formatted_address;
                        this.selectedPickerLocation.address = address;
                    }
                });
            }
        },

        confirmLocationPicker: function(pickerModal, addressField, locationDisplay, latInput, lngInput) {
            if (!this.selectedPickerLocation) {
                window.SmartAgenda.Toast.warning('Please select a location on the map');
                return;
            }

            // Update form fields
            if (this.selectedPickerLocation.address) {
                addressField.value = this.selectedPickerLocation.address;
            }

            latInput.value = this.selectedPickerLocation.lat;
            lngInput.value = this.selectedPickerLocation.lng;

            // Update location display (with null check)
            if (locationDisplay) {
                locationDisplay.innerHTML = `<span style="color: var(--success);">📌 ${this.selectedPickerLocation.address || 'Location selected'}</span>`;
            }

            // Cleanup and close
            this.cleanupLocationPicker();
            window.SmartAgenda.UIComponents.closeModal(pickerModal);

            window.SmartAgenda.Toast.success('Location saved');
        },

        cleanupLocationPicker: function() {
            if (this.pickerMap) {
                this.pickerMap = null;
            }
            if (this.pickerMarker) {
                this.pickerMarker.setMap(null);
                this.pickerMarker = null;
            }
            this.selectedPickerLocation = null;
        },

        saveClient: function(modal, form, existingClient, descEditor) {
            // Validate form
            if (!form.validate()) {
                window.SmartAgenda.Toast.error('Please fill in all required fields');
                return;
            }

            // Get form values
            const values = form.getValues();

            // Get description from Quill editor
            if (descEditor) {
                values.desc = descEditor.getValue();
            }

            // Get selected client types from DOM
            const selectedTypeOptions = modal.querySelectorAll('.type-option.selected');
            let clientTypes = Array.from(selectedTypeOptions).map(opt => opt.dataset.typeId);

            // Get primary type (the one with star)
            const primaryStar = Array.from(modal.querySelectorAll('.type-star')).find(s => s.textContent.trim() === '⭐');
            let primaryType = primaryStar ? primaryStar.closest('.type-option').dataset.typeId : (clientTypes.length > 0 ? clientTypes[0] : null);

            // If no types found in DOM, use backup from global storage
            if (clientTypes.length === 0 && window.SmartAgenda.tempClientData?.clientTypes?.length > 0) {
                console.log('Restoring client types from backup');
                clientTypes = window.SmartAgenda.tempClientData.clientTypes;
                primaryType = window.SmartAgenda.tempClientData.primaryType || clientTypes[0];
            }

            // Validate at least one type is selected
            if (clientTypes.length === 0) {
                window.SmartAgenda.Toast.error('Please select at least one client type');
                return;
            }

            // Add client types to values
            values.clientTypes = clientTypes;
            values.primaryType = primaryType;

            // Get photo
            const photoPreview = modal.querySelector('#client-photo-preview');
            if (photoPreview?.dataset.photo) {
                // New photo uploaded via dataset
                values.photo = photoPreview.dataset.photo;
            } else if (window.SmartAgenda.tempClientData?.photo) {
                // New photo uploaded (from global backup)
                values.photo = window.SmartAgenda.tempClientData.photo;
            } else if (photoPreview && !photoPreview.querySelector('img')) {
                // No photo (removed or never had one)
                values.photo = null;
            } else if (existingClient?.photo) {
                // Keep existing photo if not changed
                values.photo = existingClient.photo;
            }

            // Clear temp data after saving
            if (window.SmartAgenda.tempClientData) {
                delete window.SmartAgenda.tempClientData.photo;
                delete window.SmartAgenda.tempClientData.clientTypes;
                delete window.SmartAgenda.tempClientData.primaryType;
            }

            // Get attachments
            const attachmentItems = modal.querySelectorAll('#attachments-list .attachment-item');
            values.attachments = Array.from(attachmentItems).map(item => ({
                name: item.dataset.filename || item.querySelector('span:nth-child(2)')?.textContent,
                size: parseInt(item.dataset.filesize) || 0,
                data: item.dataset.file
            }));

            // Get and validate lat/lng from hidden inputs
            const latInput = modal.querySelector('[name="lat"]');
            const lngInput = modal.querySelector('[name="lng"]');
            if (latInput && latInput.value) {
                const lat = parseFloat(latInput.value);
                if (!isNaN(lat)) {
                    values.lat = lat;
                }
            }
            if (lngInput && lngInput.value) {
                const lng = parseFloat(lngInput.value);
                if (!isNaN(lng)) {
                    values.lng = lng;
                }
            }

            // Get additional contact fields
            const phoneTypeInput = modal.querySelector('[name="phoneType"]');
            if (phoneTypeInput) values.phoneType = phoneTypeInput.value;

            const emailTypeInput = modal.querySelector('[name="emailType"]');
            if (emailTypeInput) values.emailType = emailTypeInput.value;

            const phone2Input = modal.querySelector('[name="phone2"]');
            if (phone2Input) values.phone2 = phone2Input.value;

            const phone2TypeInput = modal.querySelector('[name="phone2Type"]');
            if (phone2TypeInput) values.phone2Type = phone2TypeInput.value;

            const email2Input = modal.querySelector('[name="email2"]');
            if (email2Input) values.email2 = email2Input.value;

            const email2TypeInput = modal.querySelector('[name="email2Type"]');
            if (email2TypeInput) values.email2Type = email2TypeInput.value;

            // Validate email addresses
            if (values.email && !this.isValidEmail(values.email)) {
                window.SmartAgenda.Toast.error('Please enter a valid primary email address');
                // Highlight the email field
                const emailInput = modal.querySelector('[name="email"]');
                if (emailInput) {
                    emailInput.style.borderColor = 'var(--danger-color)';
                    emailInput.focus();
                    setTimeout(() => {
                        emailInput.style.borderColor = '';
                    }, 3000);
                }
                return;
            }

            if (values.email2 && !this.isValidEmail(values.email2)) {
                window.SmartAgenda.Toast.error('Please enter a valid secondary email address');
                // Highlight the email2 field
                const email2InputField = modal.querySelector('[name="email2"]');
                if (email2InputField) {
                    email2InputField.style.borderColor = 'var(--danger-color)';
                    email2InputField.focus();
                    setTimeout(() => {
                        email2InputField.style.borderColor = '';
                    }, 3000);
                }
                return;
            }

            // Get social media and website fields
            const facebookInput = modal.querySelector('[name="facebook"]');
            if (facebookInput) values.facebook = facebookInput.value;

            const instagramInput = modal.querySelector('[name="instagram"]');
            if (instagramInput) values.instagram = instagramInput.value;

            const linkedinInput = modal.querySelector('[name="linkedin"]');
            if (linkedinInput) values.linkedin = linkedinInput.value;

            const websiteInput = modal.querySelector('[name="website"]');
            if (websiteInput) values.website = websiteInput.value;

            // Remove old customerType if it exists
            delete values.customerType;

            if (existingClient) {
                // Update existing client
                const updated = window.SmartAgenda.DataManager.update('clients', existingClient.id, values);
                if (updated) {
                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.saved'));
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            } else {
                // Add new client with createdAt timestamp
                values.createdAt = new Date().toISOString();
                const added = window.SmartAgenda.DataManager.add('clients', values);
                if (added) {
                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.saved'));
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            }
        },

        deleteClient: async function(modal, clientId) {
            const confirmed = await window.SmartAgenda.UIComponents.confirm({
                title: 'Delete Client',
                message: window.SmartAgenda.I18n.translate('msg.confirm_delete'),
                confirmText: window.SmartAgenda.I18n.translate('actions.delete'),
                cancelText: window.SmartAgenda.I18n.translate('actions.cancel'),
                type: 'danger'
            });

            if (confirmed) {
                const deleted = window.SmartAgenda.DataManager.delete('clients', clientId);
                if (deleted) {
                    window.SmartAgenda.Toast.success(window.SmartAgenda.I18n.translate('msg.deleted'));
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            }
        },

        // ============================================
        // Filter Menu
        // ============================================

        showFilterMenu: function() {
            const i18n = window.SmartAgenda.I18n;
            const availableTypes = window.SmartAgenda.Settings?.getClientTypes() || [];
            const allClients = window.SmartAgenda.DataManager.getAll('clients');

            // Count clients for each type
            const typeCounts = {};
            typeCounts['all'] = allClients.length;

            availableTypes.forEach(type => {
                typeCounts[type.id] = allClients.filter(c => {
                    if (c.clientTypes && Array.isArray(c.clientTypes)) {
                        return c.clientTypes.includes(type.id);
                    }
                    return c.customerType === type.id;
                }).length;
            });

            // Determine selected types
            const selectedTypes = this.currentFilter === 'all' ? [] : (Array.isArray(this.currentFilter) ? this.currentFilter : [this.currentFilter]);

            const content = `
                <div class="filter-menu" style="padding: 16px;">
                    <!-- Explanation -->
                    <div style="margin-bottom: 16px; padding: 12px; background: var(--surface); border-radius: 6px; font-size: 12px; color: var(--text-secondary);">
                        <div style="margin-bottom: 8px;"><strong>Filter Modes:</strong></div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div>
                                <div style="margin-bottom: 2px;"><span style="font-size: 16px;">⭕</span> <strong>OR</strong></div>
                                <div style="font-size: 11px;">Show clients with ANY of the selected types</div>
                            </div>
                            <div>
                                <div style="margin-bottom: 2px;"><span style="font-size: 16px;">⬜</span> <strong>AND</strong></div>
                                <div style="font-size: 11px;">Show clients with ALL selected types</div>
                            </div>
                            <div>
                                <div style="margin-bottom: 2px;"><span style="font-size: 16px;">🔀</span> <strong>OR+AND</strong></div>
                                <div style="font-size: 11px;">First 2 types use OR, rest use AND</div>
                            </div>
                        </div>
                    </div>

                    <!-- Filter Mode Buttons -->
                    <div style="display: flex; gap: 6px; margin-bottom: 16px;">
                        <button id="filter-mode-or" class="btn-${this.filterMode === 'or' ? 'primary' : 'secondary'}" style="flex: 1; padding: 6px; font-size: 12px;">
                            <span style="font-size: 14px; margin-right: 2px;">⭕</span>
                            <span>OR</span>
                        </button>
                        <button id="filter-mode-and" class="btn-${this.filterMode === 'and' ? 'primary' : 'secondary'}" style="flex: 1; padding: 6px; font-size: 12px;">
                            <span style="font-size: 14px; margin-right: 2px;">⬜</span>
                            <span>AND</span>
                        </button>
                        <button id="filter-mode-or-and" class="btn-${this.filterMode === 'or-and' ? 'primary' : 'secondary'}" style="flex: 1; padding: 6px; font-size: 12px;">
                            <span style="font-size: 14px; margin-right: 2px;">🔀</span>
                            <span>OR+AND</span>
                        </button>
                    </div>

                    <!-- All Clients Option -->
                    <div class="filter-option" data-filter="all" style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; cursor: pointer; border-radius: 6px; background: ${this.currentFilter === 'all' ? 'var(--primary-color)22' : 'var(--surface)'}; border: 1px solid ${this.currentFilter === 'all' ? 'var(--primary-color)' : 'var(--border)'};">
                        <input type="radio" name="filter-all" ${this.currentFilter === 'all' ? 'checked' : ''} style="margin-right: 12px; cursor: pointer;">
                        <span style="flex: 1; font-weight: 500;">All Clients</span>
                        <span style="color: var(--text-secondary); font-size: 13px;">${typeCounts['all']}</span>
                    </div>

                    <!-- Client Types -->
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${availableTypes.map(type => `
                            <div class="filter-type-option" data-type-id="${type.id}" style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; cursor: pointer; border-radius: 6px; background: ${selectedTypes.includes(type.id) ? 'var(--primary-color)22' : 'var(--surface)'}; border: 1px solid ${selectedTypes.includes(type.id) ? 'var(--primary-color)' : 'var(--border)'};">
                                <input type="checkbox" ${selectedTypes.includes(type.id) ? 'checked' : ''} style="margin-right: 12px; cursor: pointer;">
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: ${type.color}; margin-right: 12px;"></div>
                                <span style="flex: 1;">${this.escapeHtml(type.name)}</span>
                                <span style="color: var(--text-secondary); font-size: 13px;">${typeCounts[type.id] || 0}</span>
                            </div>
                        `).join('')}
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
                    },
                    {
                        label: 'Apply Filter',
                        type: 'primary',
                        action: 'apply',
                        onClick: (modal) => {
                            this.render();
                            window.SmartAgenda.UIComponents.closeModal(modal);
                        }
                    }
                ],
                size: 'medium'
            });

            // Bind filter mode buttons
            const orButton = modal.querySelector('#filter-mode-or');
            const andButton = modal.querySelector('#filter-mode-and');
            const orAndButton = modal.querySelector('#filter-mode-or-and');

            orButton?.addEventListener('click', () => {
                this.filterMode = 'or';
                orButton.className = 'btn-primary';
                andButton.className = 'btn-secondary';
                orAndButton.className = 'btn-secondary';
            });

            andButton?.addEventListener('click', () => {
                this.filterMode = 'and';
                andButton.className = 'btn-primary';
                orButton.className = 'btn-secondary';
                orAndButton.className = 'btn-secondary';
            });

            orAndButton?.addEventListener('click', () => {
                this.filterMode = 'or-and';
                orAndButton.className = 'btn-primary';
                orButton.className = 'btn-secondary';
                andButton.className = 'btn-secondary';
            });

            // Bind "All Clients" option
            const allOption = modal.querySelector('[data-filter="all"]');
            allOption?.addEventListener('click', () => {
                this.currentFilter = 'all';
                // Uncheck all type checkboxes
                modal.querySelectorAll('.filter-type-option input[type="checkbox"]').forEach(cb => cb.checked = false);
                modal.querySelectorAll('.filter-type-option').forEach(opt => {
                    opt.style.background = 'var(--surface)';
                    opt.style.borderColor = 'var(--border)';
                });
                // Check radio button
                allOption.querySelector('input[type="radio"]').checked = true;
                allOption.style.background = 'var(--primary-color)22';
                allOption.style.borderColor = 'var(--primary-color)';
            });

            // Bind type options
            modal.querySelectorAll('.filter-type-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const typeId = option.dataset.typeId;
                    const checkbox = option.querySelector('input[type="checkbox"]');

                    // Toggle checkbox
                    checkbox.checked = !checkbox.checked;

                    // Update selectedTypes
                    let selected = [];
                    modal.querySelectorAll('.filter-type-option input[type="checkbox"]:checked').forEach(cb => {
                        const opt = cb.closest('.filter-type-option');
                        selected.push(opt.dataset.typeId);
                    });

                    if (selected.length === 0) {
                        this.currentFilter = 'all';
                        allOption.querySelector('input[type="radio"]').checked = true;
                        allOption.style.background = 'var(--primary-color)22';
                        allOption.style.borderColor = 'var(--primary-color)';
                    } else {
                        this.currentFilter = selected;
                        allOption.querySelector('input[type="radio"]').checked = false;
                        allOption.style.background = 'var(--surface)';
                        allOption.style.borderColor = 'var(--border)';
                    }

                    // Update UI
                    option.style.background = checkbox.checked ? 'var(--primary-color)22' : 'var(--surface)';
                    option.style.borderColor = checkbox.checked ? 'var(--primary-color)' : 'var(--border)';
                });
            });
        },

        // ============================================
        // Sort Menu
        // ============================================

        showSortMenu: function() {
            const i18n = window.SmartAgenda.I18n;

            const content = `
                <div class="filter-menu">
                    <div class="filter-option ${this.currentSort === 'date' ? 'active' : ''}" data-sort="date">
                        <span>📅 By Date (Newest First)</span>
                    </div>
                    <div class="filter-option ${this.currentSort === 'name' ? 'active' : ''}" data-sort="name">
                        <span>🔤 By Name (A-Z)</span>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Sort Clients',
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

            // Bind sort options
            modal.querySelectorAll('.filter-option').forEach(option => {
                option.addEventListener('click', () => {
                    this.currentSort = option.dataset.sort;
                    this.render();
                    window.SmartAgenda.UIComponents.closeModal(modal);
                });
            });
        },

        // ============================================
        // Utilities
        // ============================================

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
        },

        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        /**
         * Validate email address format
         * @param {string} email - Email address to validate
         * @returns {boolean} True if valid, false otherwise
         */
        isValidEmail: function(email) {
            if (!email) return true; // Empty email is valid (optional field)

            // RFC 5322 compliant email regex (simplified version)
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

            return emailRegex.test(email.trim());
        }
    };

    // Add styles for categories and filters
    const styles = document.createElement('style');
    styles.textContent = `
        .category-tag {
            display: inline-block;
            padding: 4px 8px;
            background: var(--primary-color)22;
            color: var(--primary-color);
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }

        .filter-menu {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .filter-option {
            padding: 12px 16px;
            border: 1px solid var(--border);
            border-radius: var(--border-radius-sm);
            cursor: pointer;
            transition: all var(--transition-fast);
        }

        .filter-option:hover {
            background: var(--surface-hover);
        }

        .filter-option.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .item-checkbox {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 20px;
            height: 20px;
            cursor: pointer;
        }

        .item-card {
            position: relative;
        }

        .btn-icon.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }
    `;
    document.head.appendChild(styles);

    // Initialize when app is ready
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            Clients.init();
        });
        window.SmartAgenda.Clients = Clients;
    }

})();
