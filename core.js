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
        },
        
        closeMenu: function() {
            this.navMenu.classList.remove('open');
            this.menuOverlay.classList.remove('active');
            this.menuButton.classList.remove('active');
            State.set('isMenuOpen', false);
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
            const titles = {
                home: '🏠 Home',
                clients: '👥 Clients',
                appointments: '📅 Appointments',
                tasks: '✓ Tasks',
                map: '🗺️ Map',
                finance: '💰 Finance',
                calendar: '📆 Calendar',
                settings: '⚙️ Settings'
            };
            
            const headerTitle = document.getElementById('header-title');
            if (headerTitle) {
                const titleText = titles[tabName] || 'Smart Agenda';
                headerTitle.textContent = titleText.split(' ')[1] || titleText;
                
                const headerIcon = document.querySelector('.header-icon');
                if (headerIcon) {
                    headerIcon.textContent = titles[tabName]?.split(' ')[0] || '📊';
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

            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('app').style.display = 'flex';

                // Emit app ready event
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
