/**
 * Smart Agenda - Core Module
 * 
 * This module provides:
 * - Event system for module communication
 * - State management
 * - App initialization
 * - Navigation handling
 * - Theme management
 */

(function() {
    'use strict';

    // ============================================
    // Event System
    // ============================================
    const EventBus = {
        events: {},
        
        /**
         * Subscribe to an event
         * @param {string} event - Event name
         * @param {function} callback - Callback function
         */
        on: function(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        },
        
        /**
         * Unsubscribe from an event
         * @param {string} event - Event name
         * @param {function} callback - Callback function to remove
         */
        off: function(event, callback) {
            if (!this.events[event]) return;
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        },
        
        /**
         * Emit an event
         * @param {string} event - Event name
         * @param {*} data - Data to pass to callbacks
         */
        emit: function(event, data) {
            if (!this.events[event]) return;
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    };

    // ============================================
    // State Management
    // ============================================
    const State = {
        data: {
            currentTab: 'home',
            currentTheme: 'light',
            currentLanguage: 'en',
            currentCurrency: '€',
            user: null,
            isMenuOpen: false
        },
        
        /**
         * Get state value
         * @param {string} key - State key
         * @returns {*} State value
         */
        get: function(key) {
            return this.data[key];
        },
        
        /**
         * Set state value and emit change event
         * @param {string} key - State key
         * @param {*} value - State value
         */
        set: function(key, value) {
            const oldValue = this.data[key];
            this.data[key] = value;
            EventBus.emit('state:change', { key, value, oldValue });
            EventBus.emit(`state:${key}`, value);
        },
        
        /**
         * Update multiple state values
         * @param {object} updates - Object with key-value pairs
         */
        update: function(updates) {
            Object.keys(updates).forEach(key => {
                this.set(key, updates[key]);
            });
        }
    };

    // ============================================
    // Toast Notifications
    // ============================================
    const Toast = {
        container: null,
        
        init: function() {
            this.container = document.getElementById('toast-container');
        },
        
        /**
         * Show a toast notification
         * @param {string} message - Toast message
         * @param {string} type - Toast type (success, error, info)
         * @param {number} duration - Duration in milliseconds
         */
        show: function(message, type = 'info', duration = 3000) {
            if (!this.container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            this.container.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideOut 200ms ease forwards';
                setTimeout(() => toast.remove(), 200);
            }, duration);
        },
        
        success: function(message, duration) {
            this.show(message, 'success', duration);
        },

        error: function(message, duration) {
            this.show(message, 'error', duration);
        },

        info: function(message, duration) {
            this.show(message, 'info', duration);
        },

        warning: function(message, duration) {
            this.show(message, 'info', duration);
        }
    };

    // ============================================
    // Navigation
    // ============================================
    const Navigation = {
        menuButton: null,
        navMenu: null,
        menuOverlay: null,
        navItems: null,
        
        init: function() {
            this.menuButton = document.getElementById('menu-button');
            this.navMenu = document.getElementById('nav-menu');
            this.menuOverlay = document.getElementById('menu-overlay');
            this.navItems = document.querySelectorAll('.nav-item[data-tab]');

            this.bindEvents();
            this.restoreActiveTab();

            // Listen for language changes and update header title
            EventBus.on('language:change', () => {
                const currentTab = State.get('currentTab');
                if (currentTab) {
                    this.updateHeaderTitle(currentTab);
                }
            });
        },
        
        bindEvents: function() {
            // Menu toggle
            this.menuButton.addEventListener('click', () => this.toggleMenu());
            this.menuOverlay.addEventListener('click', () => this.closeMenu());
            
            // Navigation items
            this.navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const tab = item.dataset.tab;
                    this.switchTab(tab);
                    this.closeMenu();
                });
            });
            
            // Handle browser back button
            window.addEventListener('popstate', () => {
                const hash = window.location.hash.slice(1) || 'clients';
                this.switchTab(hash, false);
            });

            // Header add button
            const headerAddButton = document.getElementById('header-add-button');
            if (headerAddButton) {
                headerAddButton.addEventListener('click', () => {
                    const currentTab = State.get('currentTab');

                    if (currentTab === 'clients' && window.SmartAgenda?.Clients) {
                        window.SmartAgenda.Clients.showClientModal();
                    } else if (currentTab === 'appointments' && window.SmartAgenda?.Appointments) {
                        window.SmartAgenda.Appointments.showAppointmentModal();
                    } else if (currentTab === 'tasks' && window.SmartAgenda?.Tasks) {
                        window.SmartAgenda.Tasks.showTaskModal();
                    }
                });
            }
        },
        
        toggleMenu: function() {
            const isOpen = !State.get('isMenuOpen');
            State.set('isMenuOpen', isOpen);
            
            if (isOpen) {
                this.openMenu();
            } else {
                this.closeMenu();
            }
        },
        
        openMenu: function() {
            this.navMenu.classList.add('open');
            this.menuOverlay.classList.add('active');
            this.menuButton.classList.add('active');
            // Prevent background scrolling when menu is open
            document.body.style.overflow = 'hidden';
        },

        closeMenu: function() {
            this.navMenu.classList.remove('open');
            this.menuOverlay.classList.remove('active');
            this.menuButton.classList.remove('active');
            State.set('isMenuOpen', false);
            // Re-enable scrolling when menu closes
            document.body.style.overflow = '';
        },
        
        /**
         * Switch to a different tab
         * @param {string} tabName - Tab name to switch to
         * @param {boolean} updateHistory - Whether to update browser history
         */
        switchTab: function(tabName, updateHistory = true) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab
            const selectedTab = document.getElementById(`${tabName}-tab`);
            if (selectedTab) {
                selectedTab.classList.add('active');
            }

            // Update nav items
            this.navItems.forEach(item => {
                if (item.dataset.tab === tabName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Update state
            State.set('currentTab', tabName);

            // Update header title
            this.updateHeaderTitle(tabName);

            // Update URL
            if (updateHistory) {
                window.history.pushState({}, '', `#${tabName}`);
            }

            // Show/hide map menu button
            const mapMenuButton = document.getElementById('map-menu-button');
            if (mapMenuButton) {
                if (tabName === 'map') {
                    mapMenuButton.style.display = 'flex';
                } else {
                    mapMenuButton.style.display = 'none';
                }
            }

            // Show/hide header add button based on active tab
            const headerAddButton = document.getElementById('header-add-button');
            if (headerAddButton) {
                if (tabName === 'clients' || tabName === 'appointments' || tabName === 'tasks') {
                    headerAddButton.style.display = 'flex';
                } else {
                    headerAddButton.style.display = 'none';
                }
            }

            // Initialize map when switching to map tab
            if (tabName === 'map') {
                setTimeout(() => {
                    this.initializeMapIfNeeded();
                }, 100);
            }

            // Emit tab change event
            EventBus.emit('tab:change', tabName);
        },

        initializeMapIfNeeded: function() {
            // Check if map is already initialized
            if (window.map) {
                // Map already initialized, just refresh markers
                if (typeof window.loadCustomerMarkers === 'function') {
                    window.loadCustomerMarkers();
                }
                // Trigger resize to fix display issues
                if (window.google && window.google.maps) {
                    google.maps.event.trigger(window.map, 'resize');
                }
                return;
            }

            // Initialize map
            if (typeof window.initMapSystem === 'function') {
                console.log('Initializing map from tab switch...');
                window.initMapSystem();
            } else if (typeof window.initializeGoogleMap === 'function') {
                console.log('Initializing Google Map from tab switch...');
                window.initializeGoogleMap();
            } else {
                console.warn('Map initialization functions not found');
            }
        },
        
        updateHeaderTitle: function(tabName) {
            // Use i18n for translations
            const i18n = window.SmartAgenda?.I18n || window.SmartAgenda?.i18n;
            const t = (key) => i18n ? i18n.translate(key) : key;

            const titleKeys = {
                home: 'nav.home',
                clients: 'nav.clients',
                appointments: 'nav.appointments',
                tasks: 'nav.tasks',
                map: 'nav.map',
                finance: 'nav.finance',
                calendar: 'nav.calendar',
                interactions: 'nav.interactions',
                advanced: 'nav.advanced',
                settings: 'nav.settings'
            };

            const icons = {
                home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
                clients: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
                appointments: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
                tasks: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
                map: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>',
                finance: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
                calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><rect x="7" y="14" width="3" height="3"></rect></svg>',
                interactions: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>',
                advanced: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
                settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
            };

            const headerTitle = document.getElementById('header-title');
            if (headerTitle) {
                const titleKey = titleKeys[tabName];
                const titleText = titleKey ? t(titleKey) : 'Smart Agenda';
                headerTitle.textContent = titleText;

                const headerIcon = document.querySelector('.header-icon');
                if (headerIcon) {
                    headerIcon.innerHTML = icons[tabName] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>';
                }
            }
        },
        
        restoreActiveTab: function() {
            const hash = window.location.hash.slice(1);
            if (hash) {
                this.switchTab(hash, false);
            } else {
                this.switchTab('home', false);
            }
        }
    };

    // ============================================
    // Theme Manager
    // ============================================
    const ThemeManager = {
        themeToggle: null,
        themeSelect: null,
        
        init: function() {
            this.themeToggle = document.getElementById('theme-toggle');
            this.themeSelect = document.getElementById('theme-select');
            
            this.loadTheme();
            this.bindEvents();
        },
        
        bindEvents: function() {
            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', () => this.toggleTheme());
            }
            
            if (this.themeSelect) {
                this.themeSelect.addEventListener('change', (e) => {
                    this.setTheme(e.target.value);
                });
            }
        },
        
        loadTheme: function() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            this.setTheme(savedTheme, false);
        },
        
        setTheme: function(theme, save = true) {
            // If switching away from colorful theme, clear its styles
            if (theme !== 'colorful' && window.SmartAgenda.ColorfulThemeManager) {
                window.SmartAgenda.ColorfulThemeManager.clearColorfulThemeStyles();
            }

            document.documentElement.setAttribute('data-theme', theme);
            State.set('currentTheme', theme);

            // Update theme toggle icon
            if (this.themeToggle) {
                const icon = this.themeToggle.querySelector('.theme-icon');
                if (icon) {
                    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
                }
            }

            // Update select value
            if (this.themeSelect) {
                this.themeSelect.value = theme;
            }

            if (save) {
                localStorage.setItem('theme', theme);
            }
        },
        
        toggleTheme: function() {
            const currentTheme = State.get('currentTheme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        }
    };

    // ============================================
    // Font Size Manager
    // ============================================
    const FontSizeManager = {
        fontSizeSelect: null,

        init: function() {
            this.fontSizeSelect = document.getElementById('font-size-select');
            this.loadFontSize();
            this.bindEvents();
        },

        bindEvents: function() {
            if (this.fontSizeSelect) {
                this.fontSizeSelect.addEventListener('change', (e) => {
                    this.setFontSize(e.target.value);
                });
            }
        },

        loadFontSize: function() {
            const savedFontSize = localStorage.getItem('fontSize') || 'medium';
            this.setFontSize(savedFontSize, false);
        },

        setFontSize: function(size, save = true) {
            // Remove all font size classes
            document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');

            // Add the selected font size class
            document.body.classList.add(`font-${size}`);

            State.set('currentFontSize', size);

            // Update select value
            if (this.fontSizeSelect) {
                this.fontSizeSelect.value = size;
            }

            if (save) {
                localStorage.setItem('fontSize', size);
            }
        }
    };

    // ============================================
    // Mobile Keyboard Handler
    // ============================================
    const KeyboardHandler = {
        activeInput: null,
        originalViewportHeight: window.innerHeight,
        isKeyboardVisible: false,
        scrollTimeout: null,

        init: function() {
            // Handle viewport resize (keyboard show/hide)
            window.addEventListener('resize', () => this.handleResize());

            // Global focus handler for all inputs
            document.addEventListener('focusin', (e) => {
                const target = e.target;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                    this.handleInputFocus(target);
                }
            }, true);

            // Global blur handler
            document.addEventListener('focusout', (e) => {
                const target = e.target;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                    this.handleInputBlur(target);
                }
            }, true);

            console.log('[KeyboardHandler] Initialized');
        },

        handleResize: function() {
            const currentHeight = window.innerHeight;
            const heightDifference = this.originalViewportHeight - currentHeight;

            // Keyboard is considered visible if viewport shrunk by more than 150px
            const wasKeyboardVisible = this.isKeyboardVisible;
            this.isKeyboardVisible = heightDifference > 150;

            if (this.isKeyboardVisible && !wasKeyboardVisible) {
                console.log('[KeyboardHandler] Keyboard shown');
                if (this.activeInput) {
                    this.scrollToInput(this.activeInput);
                }
            } else if (!this.isKeyboardVisible && wasKeyboardVisible) {
                console.log('[KeyboardHandler] Keyboard hidden');
                this.originalViewportHeight = currentHeight;
            }
        },

        handleInputFocus: function(input) {
            this.activeInput = input;
            console.log('[KeyboardHandler] Input focused:', input.id || input.name || input.type);

            // Clear any pending scroll
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }

            // Scroll to input after a short delay to allow keyboard to start appearing
            this.scrollTimeout = setTimeout(() => {
                this.scrollToInput(input);
            }, 300);
        },

        handleInputBlur: function(input) {
            if (this.activeInput === input) {
                this.activeInput = null;
            }
            console.log('[KeyboardHandler] Input blurred:', input.id || input.name || input.type);
        },

        scrollToInput: function(input) {
            if (!input) return;

            try {
                const rect = input.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const keyboardHeight = this.isKeyboardVisible ?
                    (this.originalViewportHeight - viewportHeight) : 300; // Estimate 300px if not detected

                // Calculate if input is covered by keyboard
                const inputBottom = rect.bottom;
                const visibleBottom = viewportHeight - keyboardHeight;

                if (inputBottom > visibleBottom - 20) { // 20px padding
                    console.log('[KeyboardHandler] Scrolling to input');

                    // Scroll the input into view
                    input.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });

                    // For inputs in modals, also scroll the modal body
                    const modalBody = input.closest('.modal-body');
                    if (modalBody) {
                        setTimeout(() => {
                            const modalRect = input.getBoundingClientRect();
                            const modalBodyRect = modalBody.getBoundingClientRect();
                            const relativeTop = modalRect.top - modalBodyRect.top;
                            const scrollTop = modalBody.scrollTop + relativeTop - 100; // 100px from top

                            modalBody.scrollTo({
                                top: Math.max(0, scrollTop),
                                behavior: 'smooth'
                            });
                        }, 100);
                    }
                }
            } catch (error) {
                console.error('[KeyboardHandler] Error scrolling to input:', error);
            }
        }
    };

    // ============================================
    // App Initialization
    // ============================================
    const App = {
        init: function() {
            console.log('🚀 Initializing Smart Agenda...');

            // Initialize core components
            Toast.init();
            ThemeManager.init();
            FontSizeManager.init();
            Navigation.init();
            KeyboardHandler.init();

            // Hide loading screen (unless welcome screen will show)
            setTimeout(() => {
                // Check if welcome screen should show
                const willShowWelcome = window.SmartAgenda?.WelcomeScreen?.shouldShow();

                if (!willShowWelcome) {
                    // Normal startup - hide loading and show app
                    document.getElementById('loading-screen').style.display = 'none';
                    document.getElementById('app').style.display = 'flex';
                } else {
                    // Welcome screen will show - keep loading visible, hide app
                    console.log('📋 Welcome screen will be shown - keeping loading screen');
                }

                // Emit app ready event (welcome screen listens to this)
                EventBus.emit('app:ready');

                console.log('✅ Smart Agenda is ready!');
            }, 500);
        }
    };

    // ============================================
    // Global API
    // ============================================
    window.SmartAgenda = {
        init: App.init.bind(App),
        EventBus: EventBus,
        State: State,
        Toast: Toast,
        Navigation: Navigation,
        ThemeManager: ThemeManager,
        FontSizeManager: FontSizeManager
    };

})();

// Add CSS for slideOut animation
const slideOutStyle = document.createElement('style');
slideOutStyle.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(slideOutStyle);
