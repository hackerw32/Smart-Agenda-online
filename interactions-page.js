/**
 * Smart Agenda - Interactions Page
 *
 * Comprehensive interactions management page with:
 * - All interactions list view
 * - Search by notes and client information
 * - Filters: type (all, check-in, follow-up), date range, sorting
 * - Counter badges
 * - Color coding
 * - View/Edit interaction modal
 * - Navigate to client card
 */

(function() {
    'use strict';

    const InteractionsPage = {
        currentFilters: {
            type: 'all', // 'all', 'checkin', 'followup'
            status: 'pending', // 'all', 'pending', 'completed' - DEFAULT: pending
            sortOrder: 'newest', // 'newest', 'oldest'
            dateRange: 'all', // 'all', 'today', 'week', 'month', 'custom'
            customDateStart: null,
            customDateEnd: null,
            searchQuery: ''
        },

        /**
         * Initialize the interactions page
         */
        init: function() {
            console.log('Initializing Interactions Page');
            this.bindEvents();
            this.render();
        },

        /**
         * Bind event listeners
         */
        bindEvents: function() {
            // Search functionality
            const searchInput = document.getElementById('interactions-search');
            const searchClearBtn = document.getElementById('interactions-search-clear');

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.currentFilters.searchQuery = e.target.value;
                    this.render();

                    // Show/hide clear button
                    if (searchClearBtn) {
                        searchClearBtn.style.display = e.target.value ? 'flex' : 'none';
                    }

                    // Show/hide search indicator
                    const indicator = document.getElementById('interactions-search-indicator');
                    if (indicator) {
                        indicator.style.display = e.target.value ? 'block' : 'none';
                    }
                });
            }

            if (searchClearBtn) {
                searchClearBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    this.currentFilters.searchQuery = '';
                    searchClearBtn.style.display = 'none';
                    document.getElementById('interactions-search-indicator').style.display = 'none';
                    this.render();
                });
            }

            // Filter button
            const filterBtn = document.getElementById('interactions-filter-btn');
            if (filterBtn) {
                filterBtn.addEventListener('click', () => {
                    this.showFilterModal();
                });
            }
        },

        /**
         * Show filter modal
         */
        showFilterModal: function() {
            // Get counts for filter buttons
            const allInteractions = this.getAllInteractions();
            const totalCount = allInteractions.length;
            const checkinCount = allInteractions.filter(i => i.type === 'checkin').length;
            const followupCount = allInteractions.filter(i => i.type === 'followup').length;
            const pendingCount = allInteractions.filter(i => !i.status || i.status === 'pending').length;
            const completedCount = allInteractions.filter(i => i.status === 'completed').length;

            const content = `
                <div style="padding: 16px;">
                    <!-- Status Filter -->
                    <div class="filter-group" style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Κατάσταση
                        </label>
                        <div class="filter-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button class="filter-btn ${this.currentFilters.status === 'all' ? 'active' : ''}" data-filter-status="all" style="flex: 1; min-width: 100px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.status === 'all' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.status === 'all' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="20" x2="18" y2="10"></line>
                                        <line x1="12" y1="20" x2="12" y2="4"></line>
                                        <line x1="6" y1="20" x2="6" y2="14"></line>
                                    </svg>
                                    Όλα
                                </div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">(${totalCount})</div>
                            </button>
                            <button class="filter-btn ${this.currentFilters.status === 'pending' ? 'active' : ''}" data-filter-status="pending" style="flex: 1; min-width: 100px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.status === 'pending' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.status === 'pending' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    Εκκρεμή
                                </div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">(${pendingCount})</div>
                            </button>
                            <button class="filter-btn ${this.currentFilters.status === 'completed' ? 'active' : ''}" data-filter-status="completed" style="flex: 1; min-width: 100px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.status === 'completed' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.status === 'completed' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Ολοκληρωμένα
                                </div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">(${completedCount})</div>
                            </button>
                        </div>
                    </div>

                    <!-- Type Filter -->
                    <div class="filter-group" style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            </svg>
                            Τύπος
                        </label>
                        <div class="filter-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button class="filter-btn ${this.currentFilters.type === 'all' ? 'active' : ''}" data-filter-type="all" style="flex: 1; min-width: 100px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.type === 'all' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.type === 'all' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="20" x2="18" y2="10"></line>
                                        <line x1="12" y1="20" x2="12" y2="4"></line>
                                        <line x1="6" y1="20" x2="6" y2="14"></line>
                                    </svg>
                                    Όλα
                                </div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">(${totalCount})</div>
                            </button>
                            <button class="filter-btn ${this.currentFilters.type === 'checkin' ? 'active' : ''}" data-filter-type="checkin" style="flex: 1; min-width: 100px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.type === 'checkin' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.type === 'checkin' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    Check-in
                                </div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">(${checkinCount})</div>
                            </button>
                            <button class="filter-btn ${this.currentFilters.type === 'followup' ? 'active' : ''}" data-filter-type="followup" style="flex: 1; min-width: 100px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.type === 'followup' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.type === 'followup' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                    Follow-up
                                </div>
                                <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">(${followupCount})</div>
                            </button>
                        </div>
                    </div>

                    <!-- Sort Order Filter -->
                    <div class="filter-group" style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14"></line>
                                <line x1="4" y1="10" x2="4" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12" y2="3"></line>
                                <line x1="20" y1="21" x2="20" y2="16"></line>
                                <line x1="20" y1="12" x2="20" y2="3"></line>
                                <line x1="1" y1="14" x2="7" y2="14"></line>
                                <line x1="9" y1="8" x2="15" y2="8"></line>
                                <line x1="17" y1="16" x2="23" y2="16"></line>
                            </svg>
                            Ταξινόμηση
                        </label>
                        <div class="filter-buttons" style="display: flex; gap: 8px;">
                            <button class="filter-btn ${this.currentFilters.sortOrder === 'newest' ? 'active' : ''}" data-sort-order="newest" style="flex: 1; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.sortOrder === 'newest' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.sortOrder === 'newest' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <polyline points="19 12 12 19 5 12"></polyline>
                                    </svg>
                                    Νεότερα Πρώτα
                                </div>
                            </button>
                            <button class="filter-btn ${this.currentFilters.sortOrder === 'oldest' ? 'active' : ''}" data-sort-order="oldest" style="flex: 1; padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.sortOrder === 'oldest' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.sortOrder === 'oldest' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="12" y1="19" x2="12" y2="5"></line>
                                        <polyline points="5 12 12 5 19 12"></polyline>
                                    </svg>
                                    Παλαιότερα Πρώτα
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Date Range Filter -->
                    <div class="filter-group" style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Εύρος Ημερομηνίας
                        </label>
                        <div class="filter-buttons" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            <button class="filter-btn ${this.currentFilters.dateRange === 'all' ? 'active' : ''}" data-date-range="all" style="padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.dateRange === 'all' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.dateRange === 'all' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="20" x2="18" y2="10"></line>
                                        <line x1="12" y1="20" x2="12" y2="4"></line>
                                        <line x1="6" y1="20" x2="6" y2="14"></line>
                                    </svg>
                                    Όλες
                                </div>
                            </button>
                            <button class="filter-btn ${this.currentFilters.dateRange === 'today' ? 'active' : ''}" data-date-range="today" style="padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.dateRange === 'today' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.dateRange === 'today' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    Σήμερα
                                </div>
                            </button>
                            <button class="filter-btn ${this.currentFilters.dateRange === 'week' ? 'active' : ''}" data-date-range="week" style="padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.dateRange === 'week' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.dateRange === 'week' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    7 Ημέρες
                                </div>
                            </button>
                            <button class="filter-btn ${this.currentFilters.dateRange === 'month' ? 'active' : ''}" data-date-range="month" style="padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.dateRange === 'month' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.dateRange === 'month' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    30 Ημέρες
                                </div>
                            </button>
                            <button class="filter-btn ${this.currentFilters.dateRange === 'custom' ? 'active' : ''}" data-date-range="custom" style="padding: 12px; border: 2px solid var(--border); border-radius: 8px; background: ${this.currentFilters.dateRange === 'custom' ? 'var(--primary-color)' : 'var(--surface)'}; color: ${this.currentFilters.dateRange === 'custom' ? 'white' : 'var(--text-primary)'}; cursor: pointer; font-weight: 600; transition: all 0.2s; grid-column: 1 / -1;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="22" y1="12" x2="18" y2="12"></line>
                                        <line x1="6" y1="12" x2="2" y2="12"></line>
                                        <line x1="12" y1="6" x2="12" y2="2"></line>
                                        <line x1="12" y1="22" x2="12" y2="18"></line>
                                    </svg>
                                    Προσαρμοσμένο
                                </div>
                            </button>
                        </div>
                        <div id="custom-date-range" style="display: ${this.currentFilters.dateRange === 'custom' ? 'block' : 'none'}; margin-top: 12px; padding: 16px; background: var(--background); border-radius: 8px; border: 1px solid var(--border);">
                            <div style="margin-bottom: 12px;">
                                <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px;">Από:</label>
                                <input type="date" id="custom-date-start" value="${this.currentFilters.customDateStart || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-primary); font-size: 14px;">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px;">Έως:</label>
                                <input type="date" id="custom-date-end" value="${this.currentFilters.customDateEnd || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-primary); font-size: 14px;">
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Φίλτρα',
                content: content,
                buttons: [
                    {
                        label: 'Επαναφορά',
                        type: 'secondary',
                        action: 'reset',
                        onClick: (modalElement) => {
                            this.currentFilters = {
                                type: 'all',
                                status: 'pending', // Reset to default: pending
                                sortOrder: 'newest',
                                dateRange: 'all',
                                customDateStart: null,
                                customDateEnd: null,
                                searchQuery: this.currentFilters.searchQuery
                            };
                            this.render();
                            window.SmartAgenda.UIComponents.closeModal(modalElement);
                        }
                    },
                    {
                        label: 'Εφαρμογή',
                        type: 'primary',
                        action: 'apply',
                        onClick: (modalElement) => {
                            // Save custom date range if selected
                            if (this.currentFilters.dateRange === 'custom') {
                                const startInput = modalElement.querySelector('#custom-date-start');
                                const endInput = modalElement.querySelector('#custom-date-end');
                                if (startInput && endInput) {
                                    this.currentFilters.customDateStart = startInput.value;
                                    this.currentFilters.customDateEnd = endInput.value;
                                }
                            }
                            this.render();
                            window.SmartAgenda.UIComponents.closeModal(modalElement);
                        }
                    }
                ],
                size: 'medium'
            });

            // Bind filter button clicks
            modal.querySelectorAll('[data-filter-status]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentFilters.status = btn.dataset.filterStatus;
                    modal.querySelectorAll('[data-filter-status]').forEach(b => {
                        b.style.background = 'var(--surface)';
                        b.style.color = 'var(--text-primary)';
                        b.classList.remove('active');
                    });
                    btn.style.background = 'var(--primary-color)';
                    btn.style.color = 'white';
                    btn.classList.add('active');
                });
            });

            modal.querySelectorAll('[data-filter-type]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentFilters.type = btn.dataset.filterType;
                    modal.querySelectorAll('[data-filter-type]').forEach(b => {
                        b.style.background = 'var(--surface)';
                        b.style.color = 'var(--text-primary)';
                        b.classList.remove('active');
                    });
                    btn.style.background = 'var(--primary-color)';
                    btn.style.color = 'white';
                    btn.classList.add('active');
                });
            });

            modal.querySelectorAll('[data-sort-order]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentFilters.sortOrder = btn.dataset.sortOrder;
                    modal.querySelectorAll('[data-sort-order]').forEach(b => {
                        b.style.background = 'var(--surface)';
                        b.style.color = 'var(--text-primary)';
                        b.classList.remove('active');
                    });
                    btn.style.background = 'var(--primary-color)';
                    btn.style.color = 'white';
                    btn.classList.add('active');
                });
            });

            modal.querySelectorAll('[data-date-range]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentFilters.dateRange = btn.dataset.dateRange;
                    modal.querySelectorAll('[data-date-range]').forEach(b => {
                        b.style.background = 'var(--surface)';
                        b.style.color = 'var(--text-primary)';
                        b.classList.remove('active');
                    });
                    btn.style.background = 'var(--primary-color)';
                    btn.style.color = 'white';
                    btn.classList.add('active');

                    // Show/hide custom date range
                    const customDiv = modal.querySelector('#custom-date-range');
                    if (customDiv) {
                        customDiv.style.display = btn.dataset.dateRange === 'custom' ? 'block' : 'none';
                    }
                });
            });
        },

        /**
         * Get all interactions with client information
         */
        getAllInteractions: function() {
            const interactions = window.SmartAgenda.DataManager.getAll('interactions') || [];
            const clients = window.SmartAgenda.DataManager.getAll('clients') || [];

            return interactions.map(interaction => {
                const client = clients.find(c => c.id === interaction.clientId);
                return {
                    ...interaction,
                    client: client || null
                };
            });
        },

        /**
         * Filter interactions based on current filters
         */
        filterInteractions: function(interactions) {
            let filtered = [...interactions];

            // Status filter (default: pending only)
            if (this.currentFilters.status === 'pending') {
                filtered = filtered.filter(i => !i.status || i.status === 'pending');
            } else if (this.currentFilters.status === 'completed') {
                filtered = filtered.filter(i => i.status === 'completed');
            }
            // if 'all', don't filter by status

            // Type filter
            if (this.currentFilters.type !== 'all') {
                filtered = filtered.filter(i => i.type === this.currentFilters.type);
            }

            // Date range filter
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            switch (this.currentFilters.dateRange) {
                case 'today':
                    filtered = filtered.filter(i => {
                        const interactionDate = new Date(i.date);
                        const interactionDay = new Date(interactionDate.getFullYear(), interactionDate.getMonth(), interactionDate.getDate());
                        return interactionDay.getTime() === today.getTime();
                    });
                    break;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    filtered = filtered.filter(i => new Date(i.date) >= weekAgo);
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    filtered = filtered.filter(i => new Date(i.date) >= monthAgo);
                    break;
                case 'custom':
                    if (this.currentFilters.customDateStart && this.currentFilters.customDateEnd) {
                        const startDate = new Date(this.currentFilters.customDateStart);
                        const endDate = new Date(this.currentFilters.customDateEnd);
                        endDate.setHours(23, 59, 59, 999); // Include the end date
                        filtered = filtered.filter(i => {
                            const interactionDate = new Date(i.date);
                            return interactionDate >= startDate && interactionDate <= endDate;
                        });
                    }
                    break;
            }

            // Search filter
            if (this.currentFilters.searchQuery) {
                const query = this.currentFilters.searchQuery.toLowerCase();
                filtered = filtered.filter(i => {
                    // Search in notes
                    const notesMatch = i.notes && i.notes.toLowerCase().includes(query);

                    // Search in client information
                    if (i.client) {
                        const nameMatch = i.client.name && i.client.name.toLowerCase().includes(query);
                        const phoneMatch = i.client.phone && i.client.phone.includes(query);
                        const phone2Match = i.client.phone2 && i.client.phone2.includes(query);
                        const emailMatch = i.client.email && i.client.email.toLowerCase().includes(query);
                        const contactMatch = i.client.contactName && i.client.contactName.toLowerCase().includes(query);

                        return notesMatch || nameMatch || phoneMatch || phone2Match || emailMatch || contactMatch;
                    }

                    return notesMatch;
                });
            }

            // Sort
            filtered.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);

                if (this.currentFilters.sortOrder === 'newest') {
                    return dateB - dateA;
                } else {
                    return dateA - dateB;
                }
            });

            return filtered;
        },

        /**
         * Render the interactions page
         */
        render: function() {
            const allInteractions = this.getAllInteractions();
            const filteredInteractions = this.filterInteractions(allInteractions);

            // Render stats
            this.renderStats(allInteractions);

            // Render list
            this.renderList(filteredInteractions);
        },

        /**
         * Render stats summary - only shows active filter indicators
         */
        renderStats: function(interactions) {
            const statsContainer = document.getElementById('interactions-stats');
            if (!statsContainer) return;

            // Get all interactions for totals
            const allInteractions = this.getAllInteractions();
            const totalCount = allInteractions.length;

            // Filtered count
            const filteredCount = interactions.length;

            // Check if filters are active (status 'pending' is default, not considered active)
            const hasActiveFilters = this.currentFilters.type !== 'all' ||
                                     this.currentFilters.status !== 'pending' ||
                                     this.currentFilters.dateRange !== 'all' ||
                                     this.currentFilters.sortOrder !== 'newest' ||
                                     this.currentFilters.searchQuery;

            // Only show active filters indicator if filters are active
            if (hasActiveFilters) {
                statsContainer.innerHTML = `
                    <div style="padding: 12px 16px; background: var(--surface); border-bottom: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 12px; background: var(--background); border-radius: 8px; border: 1px solid var(--border);">
                            <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                </svg>
                                Ενεργά φίλτρα:
                            </span>
                            ${this.currentFilters.searchQuery ? `<span style="padding: 4px 10px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                                "${this.currentFilters.searchQuery}"</span>` : ''}
                            ${this.currentFilters.status === 'all' ? `<span style="padding: 4px 10px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="20" x2="18" y2="10"></line>
                                    <line x1="12" y1="20" x2="12" y2="4"></line>
                                    <line x1="6" y1="20" x2="6" y2="14"></line>
                                </svg>
                                Όλες οι Καταστάσεις</span>` : ''}
                            ${this.currentFilters.status === 'completed' ? `<span style="padding: 4px 10px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Ολοκληρωμένα</span>` : ''}
                            ${this.currentFilters.type !== 'all' ? `<span style="padding: 4px 10px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">${this.currentFilters.type === 'checkin' ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Check-in` : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> Follow-up`}</span>` : ''}
                            ${this.currentFilters.dateRange !== 'all' ? `<span style="padding: 4px 10px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                ${this.getDateRangeLabel()}</span>` : ''}
                            ${this.currentFilters.sortOrder !== 'newest' ? `<span style="padding: 4px 10px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="19" x2="12" y2="5"></line>
                                    <polyline points="5 12 12 5 19 12"></polyline>
                                </svg>
                                Παλαιότερα πρώτα</span>` : ''}
                            <button onclick="window.SmartAgenda.InteractionsPage.clearFilters()" style="padding: 4px 10px; background: var(--danger-color); color: white; border: none; border-radius: 12px; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: auto; display: inline-flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Καθαρισμός
                            </button>
                            <span style="font-size: 12px; color: var(--text-tertiary);">Εμφάνιση ${filteredCount} από ${totalCount}</span>
                        </div>
                    </div>
                `;
            } else {
                // No filters active - show nothing or minimal info
                statsContainer.innerHTML = '';
            }
        },

        /**
         * Quick filter by type (from stat cards)
         */
        quickFilter: function(type) {
            this.currentFilters.type = type;
            this.render();
        },

        /**
         * Clear all filters
         */
        clearFilters: function() {
            this.currentFilters = {
                type: 'all',
                status: 'pending', // Reset to default: pending
                sortOrder: 'newest',
                dateRange: 'all',
                customDateStart: null,
                customDateEnd: null,
                searchQuery: ''
            };

            // Clear search input
            const searchInput = document.getElementById('interactions-search');
            if (searchInput) {
                searchInput.value = '';
            }

            const searchClearBtn = document.getElementById('interactions-search-clear');
            if (searchClearBtn) {
                searchClearBtn.style.display = 'none';
            }

            const indicator = document.getElementById('interactions-search-indicator');
            if (indicator) {
                indicator.style.display = 'none';
            }

            this.render();
            window.SmartAgenda.Toast.success('Τα φίλτρα καθαρίστηκαν');
        },

        /**
         * Get human-readable label for current date range
         */
        getDateRangeLabel: function() {
            switch(this.currentFilters.dateRange) {
                case 'today': return 'Σήμερα';
                case 'week': return 'Τελευταίες 7 ημέρες';
                case 'month': return 'Τελευταίες 30 ημέρες';
                case 'custom':
                    if (this.currentFilters.customDateStart && this.currentFilters.customDateEnd) {
                        return `${this.currentFilters.customDateStart} - ${this.currentFilters.customDateEnd}`;
                    }
                    return 'Προσαρμοσμένο';
                default: return 'Όλες';
            }
        },

        /**
         * Render interactions list with enhanced UI
         */
        renderList: function(interactions) {
            const listContainer = document.getElementById('interactions-list');
            if (!listContainer) return;

            if (interactions.length === 0) {
                const emptyMessage = this.currentFilters.searchQuery ||
                                   this.currentFilters.type !== 'all' ||
                                   this.currentFilters.dateRange !== 'all'
                    ? 'Δεν βρέθηκαν interactions με αυτά τα φίλτρα'
                    : 'Δεν υπάρχουν interactions ακόμα';

                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                        <div style="margin-bottom: 16px; opacity: 0.5;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">${emptyMessage}</div>
                        <div style="font-size: 14px;">Δοκίμασε να αλλάξεις τα φίλτρα ή την αναζήτηση</div>
                    </div>
                `;
                return;
            }

            listContainer.innerHTML = interactions.map(interaction => {
                const iconSvg = interaction.type === 'checkin'
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
                const typeLabel = interaction.type === 'checkin' ? 'Check-in' : 'Follow-up';
                const typeColor = interaction.type === 'checkin' ? '#4CAF50' : '#2196F3';
                const date = this.formatDateTime(interaction.date);
                const clientName = interaction.client ? interaction.client.name : 'Άγνωστος Πελάτης';
                const notesPreview = interaction.notes ? this.escapeHtml(interaction.notes).substring(0, 100) + (interaction.notes.length > 100 ? '...' : '') : 'Χωρίς σημειώσεις';

                // Show status badge if completed
                const statusBadge = interaction.status === 'completed'
                    ? `<span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Ολοκληρωμένο</span>`
                    : '';

                // Show notification badge if interaction has notifications
                const notifBadge = interaction.notifications && interaction.notifications.length > 0
                    ? `<span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            ${interaction.notifications.length}</span>`
                    : '';

                // Client phone if available
                const clientPhone = interaction.client && interaction.client.phone
                    ? `<span style="font-size: 13px; color: var(--text-tertiary); margin-left: 8px; display: inline-flex; align-items: center; gap: 4px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            ${this.escapeHtml(interaction.client.phone)}</span>`
                    : '';

                return `
                    <div class="interaction-item modern-interaction-card"
                         data-interaction-id="${interaction.id}"
                         style="display: flex; gap: 12px; padding: 12px; background: var(--surface); border: 1px solid var(--border); border-left: 4px solid ${typeColor}; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 8px;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
                                <span style="font-weight: 700; color: ${typeColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; display: inline-flex; align-items: center; gap: 6px;">${iconSvg} ${typeLabel}</span>
                                ${statusBadge}
                                ${notifBadge}
                                <span style="font-size: 12px; color: var(--text-tertiary); margin-left: auto; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    ${date}
                                </span>
                            </div>
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 17px; margin-bottom: 6px; display: flex; align-items: center; flex-wrap: wrap;">
                                <span style="display: inline-flex; align-items: center; gap: 6px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    ${this.escapeHtml(clientName)}
                                </span>
                                ${clientPhone}
                            </div>
                            <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; padding-left: 20px; position: relative;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 0; top: 2px;">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                ${notesPreview}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Bind click events
            listContainer.querySelectorAll('.interaction-item').forEach(item => {
                item.addEventListener('click', () => {
                    const interactionId = item.dataset.interactionId;
                    const interaction = interactions.find(i => i.id === interactionId);
                    if (interaction) {
                        this.showInteractionModal(interaction);
                    }
                });
            });
        },

        /**
         * Show interaction detail modal with edit capability
         */
        showInteractionModal: function(interaction) {
            const client = interaction.client;
            if (!client) {
                window.SmartAgenda.Toast.error('Client not found');
                return;
            }

            const iconSvg = interaction.type === 'checkin'
                ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
                : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
            const typeLabel = interaction.type === 'checkin' ? 'Check-in' : 'Follow-up';
            const typeColor = interaction.type === 'checkin' ? '#4CAF50' : '#2196F3';
            const date = this.formatDateTime(interaction.date);

            const content = `
                <div style="padding: 0;">
                    <!-- Header -->
                    <div style="padding: 20px; background: linear-gradient(135deg, ${typeColor}22, ${typeColor}11); border-bottom: 2px solid ${typeColor};">
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                            <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); color: ${typeColor};">
                                ${iconSvg}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 18px; font-weight: 700; color: ${typeColor}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                                    ${typeLabel}
                                </div>
                                <div style="font-size: 14px; color: var(--text-secondary); font-weight: 500;">
                                    ${date}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Client Info -->
                    <div style="padding: 20px; border-bottom: 1px solid var(--border);">
                        <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Πελάτης
                        </div>
                        <div id="view-client-box" style="display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--background); border-radius: 12px; border: 2px solid var(--border); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='var(--surface)'; this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';" onmouseout="this.style.background='var(--background)'; this.style.borderColor='var(--border)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            <div style="color: var(--primary-color);">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; font-size: 16px; color: var(--text-primary); margin-bottom: 4px;">
                                    ${this.escapeHtml(client.name)}
                                </div>
                                ${client.phone ? `<div style="font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                    ${this.escapeHtml(client.phone)}
                                </div>` : ''}
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-tertiary);">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </div>
                    </div>

                    <!-- Notes -->
                    <div style="padding: 20px;">
                        <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Σημειώσεις
                        </div>
                        <div style="padding: 16px; background: var(--background); border-radius: 12px; border: 1px solid var(--border); min-height: 100px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap; word-wrap: break-word;">
                            ${interaction.notes ? this.escapeHtml(interaction.notes) : '<span style="color: var(--text-tertiary); font-style: italic;">Χωρίς σημειώσεις</span>'}
                        </div>
                    </div>

                    <!-- Notifications -->
                    ${interaction.notifications && interaction.notifications.length > 0 ? `
                        <div style="padding: 0 20px 20px 20px;">
                            <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                                Ειδοποιήσεις
                            </div>
                            <div style="padding: 16px; background: var(--background); border-radius: 12px; border: 1px solid var(--border);">
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${interaction.notifications.map(n => {
                                        const timeText = window.SmartAgenda.Notifications?.formatNotificationTime(n.minutes) || `${n.minutes} min`;
                                        return `<span style="padding: 6px 12px; background: var(--primary-color)22; color: var(--primary-color); border-radius: 16px; font-size: 12px; font-weight: 600;">${timeText}</span>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            // Check if interaction is pending (add complete button)
            const buttons = [];

            // Add complete/uncomplete button if interaction is pending or completed
            if (!interaction.status || interaction.status === 'pending') {
                buttons.push({
                    label: 'Ολοκλήρωση',
                    type: 'success',
                    action: 'mark-completed',
                    onClick: async (modalElement) => {
                        // Update interaction status to completed
                        window.SmartAgenda.DataManager.update('interactions', interaction.id, {
                            status: 'completed'
                        });

                        // Cancel all pending notifications
                        if (window.SmartAgenda.Notifications) {
                            await window.SmartAgenda.Notifications.cancelNotification(interaction);
                        }

                        window.SmartAgenda.Toast.success('Το interaction ολοκληρώθηκε');

                        // Close modal and refresh
                        window.SmartAgenda.UIComponents.closeModal(modalElement);
                        this.render();
                    }
                });
            } else if (interaction.status === 'completed') {
                buttons.push({
                    label: 'Επαναφορά',
                    type: 'secondary',
                    action: 'mark-pending',
                    onClick: async (modalElement) => {
                        // Update interaction status back to pending
                        window.SmartAgenda.DataManager.update('interactions', interaction.id, {
                            status: 'pending'
                        });

                        // Reschedule notifications if needed
                        const updatedInteraction = window.SmartAgenda.DataManager.getById('interactions', interaction.id);
                        if (updatedInteraction && window.SmartAgenda.Notifications) {
                            await window.SmartAgenda.Notifications.scheduleNotification(updatedInteraction);
                        }

                        window.SmartAgenda.Toast.success('Το interaction επανήλθε σε εκκρεμές');

                        // Close modal and refresh
                        window.SmartAgenda.UIComponents.closeModal(modalElement);
                        this.render();
                    }
                });
            }

            buttons.push(
                {
                    label: 'Αλλαγή',
                    type: 'secondary',
                    action: 'edit-interaction',
                        onClick: (modalElement) => {
                            // Hide the modal instead of closing it
                            modalElement.style.display = 'none';

                            // Use the edit modal from ClientDetailView
                            if (window.SmartAgenda.ClientDetailView) {
                                // Show the edit modal
                                window.SmartAgenda.ClientDetailView.showEditInteractionModal(client, interaction, null);

                                // Check periodically if the edit modal has been closed
                                const checkInterval = setInterval(() => {
                                    const editModals = document.querySelectorAll('.modal-overlay');
                                    // If only our hidden modal remains (no other modals visible)
                                    let visibleModals = 0;
                                    editModals.forEach(m => {
                                        if (m !== modalElement && m.style.display !== 'none') {
                                            visibleModals++;
                                        }
                                    });

                                    if (visibleModals === 0) {
                                        clearInterval(checkInterval);
                                        // Get updated interaction data
                                        const updatedInteraction = window.SmartAgenda.DataManager.getById('interactions', interaction.id);
                                        if (updatedInteraction) {
                                            // Close current modal and show updated one
                                            window.SmartAgenda.UIComponents.closeModal(modalElement);
                                            this.showInteractionModal({...updatedInteraction, client: client});
                                        } else {
                                            // Interaction was deleted, just close
                                            window.SmartAgenda.UIComponents.closeModal(modalElement);
                                        }
                                    }
                                }, 300);
                            }
                        }
                    },
                    {
                        label: 'Άκυρο',
                        type: 'primary',
                        action: 'close',
                        onClick: (modalElement) => {
                            window.SmartAgenda.UIComponents.closeModal(modalElement);
                        }
                    }
                );

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: `Λεπτομέρειες Interaction`,
                content: content,
                buttons: buttons,
                size: 'large'
            });

            // Bind View Client box click
            const viewClientBox = modal.querySelector('#view-client-box');
            if (viewClientBox) {
                viewClientBox.addEventListener('click', () => {
                    // Hide the modal instead of closing it
                    modal.style.display = 'none';

                    // Show client detail view
                    if (window.SmartAgenda.ClientDetailView) {
                        window.SmartAgenda.ClientDetailView.show(client);

                        // Check periodically if the client card modal has been closed
                        const checkInterval = setInterval(() => {
                            const clientModals = document.querySelectorAll('.modal-overlay');
                            // If only our hidden modal remains (no other modals visible)
                            let visibleModals = 0;
                            clientModals.forEach(m => {
                                if (m !== modal && m.style.display !== 'none') {
                                    visibleModals++;
                                }
                            });

                            if (visibleModals === 0) {
                                clearInterval(checkInterval);
                                // Get updated interaction data
                                const updatedInteraction = window.SmartAgenda.DataManager.getById('interactions', interaction.id);
                                if (updatedInteraction) {
                                    // Close current modal and show updated one
                                    window.SmartAgenda.UIComponents.closeModal(modal);
                                    this.showInteractionModal({...updatedInteraction, client: client});
                                } else {
                                    // Interaction was deleted, just close
                                    window.SmartAgenda.UIComponents.closeModal(modal);
                                }
                            }
                        }, 300);
                    }
                });
            }
        },

        /**
         * Format date time
         */
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

        /**
         * Escape HTML
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Add to global API
    if (window.SmartAgenda) {
        window.SmartAgenda.InteractionsPage = InteractionsPage;

        // Initialize when switching to interactions tab
        let isInitialized = false;
        window.SmartAgenda.EventBus.on('tab:change', (tabName) => {
            if (tabName === 'interactions') {
                if (!isInitialized) {
                    InteractionsPage.init();
                    isInitialized = true;
                } else {
                    // Just re-render if already initialized
                    InteractionsPage.render();
                }
            }
        });
    }

})();
