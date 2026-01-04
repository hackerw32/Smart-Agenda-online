/**
 * Smart Agenda - Welcome Screen
 * Displays on first launch to help users set up Google Drive backup
 */
(function() {
    'use strict';

    const WelcomeScreen = {
        /**
         * Check if welcome screen should be shown
         * @returns {boolean} True if this is first launch
         */
        shouldShow: function() {
            // Check if welcome screen has been shown before
            const hasShownWelcome = localStorage.getItem('welcome_screen_shown');

            // Check if there's any data in the app
            const hasData = localStorage.getItem('clients') ||
                           localStorage.getItem('appointments') ||
                           localStorage.getItem('tasks');

            // Show welcome screen if it hasn't been shown AND there's no data
            return !hasShownWelcome && !hasData;
        },

        /**
         * Show welcome screen modal
         */
        /**
         * Get localized content for welcome screen
         */
        getContent: function() {
            const i18n = window.SmartAgenda?.I18n || window.SmartAgenda?.i18n;
            const t = (key) => i18n ? i18n.translate(key) : key;

            return `
                <div style="padding: 12px 8px 16px 8px; text-align: center;">
                    <!-- Welcome Message -->
                    <h2 id="welcome-title" style="margin: 0; font-size: 20px; font-weight: 600; line-height: 1.3;">
                        ${t('welcome.title')}
                    </h2>
                    <p id="welcome-subtitle" style="margin: 8px 0 16px 0; color: var(--text-secondary); font-size: 13px; line-height: 1.3;">
                        ${t('welcome.subtitle')}
                    </p>

                    <!-- Language Selection -->
                    <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px; padding: 9px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; color: var(--text-secondary);">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        <select id="welcome-language-select" style="flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 13px; outline: none; cursor: pointer;">
                            <option value="en">English</option>
                            <option value="el">Ελληνικά (Greek)</option>
                            <option value="ru">Русский (Russian)</option>
                        </select>
                    </div>

                    <!-- Google Drive Backup Button (All-in-one) -->
                    <button id="welcome-setup-gdrive-btn" class="btn-primary" style="width: 100%; padding: 14px 12px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 12px; border-radius: 8px; min-height: 60px; overflow: hidden;">
                        <svg width="36" height="36" viewBox="0 0 87.3 78" style="flex-shrink: 0;">
                            <path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"/>
                            <path fill="#00ac47" d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"/>
                            <path fill="#ea4335" d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"/>
                            <path fill="#00832d" d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"/>
                            <path fill="#2684fc" d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"/>
                            <path fill="#ffba00" d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"/>
                        </svg>
                        <div style="flex: 1; min-width: 0; max-width: 100%; overflow: hidden; text-align: center;">
                            <div id="welcome-gdrive-text" style="font-size: 13px; line-height: 1.4; color: white; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; max-width: 100%;">
                                ${t('welcome.gdriveText')}
                            </div>
                        </div>
                    </button>

                    <!-- Tutorial Option -->
                    <button id="welcome-tutorial-btn" class="btn-secondary" style="width: 100%; padding: 10px; font-size: 13px; margin-bottom: 8px; background: var(--primary-light); color: white; border-color: var(--primary-light); text-align: center;">
                        ${t('welcome.startTutorial')}
                    </button>

                    <!-- Skip Option -->
                    <button id="welcome-skip-btn" class="btn-secondary" style="width: 100%; padding: 10px; font-size: 13px; text-align: center;">
                        ${t('welcome.skip')}
                    </button>

                    <p id="welcome-footer" style="margin: 10px 0 0 0; font-size: 10px; color: var(--text-secondary); line-height: 1.3;">
                        ${t('welcome.footerText')}
                    </p>
                </div>
            `;
        },

        show: async function() {
            const content = this.getContent();

            return new Promise((resolve) => {
                const modal = window.SmartAgenda.UIComponents.showModal({
                    title: '',
                    content: content,
                    buttons: [],
                    size: 'small',
                    closeOnOutsideClick: false,
                    hideCloseButton: true,
                    hideHeader: true
                });

                // Setup Google Drive button
                setTimeout(() => {
                    const setupBtn = document.getElementById('welcome-setup-gdrive-btn');
                    const tutorialBtn = document.getElementById('welcome-tutorial-btn');
                    const skipBtn = document.getElementById('welcome-skip-btn');
                    const languageSelect = document.getElementById('welcome-language-select');

                    // Set current language
                    if (languageSelect) {
                        const currentLang = localStorage.getItem('language') || 'en';
                        languageSelect.value = currentLang;

                        languageSelect.addEventListener('change', (e) => {
                            const newLang = e.target.value;

                            // Apply language change immediately
                            if (window.SmartAgenda?.i18n || window.SmartAgenda?.I18n) {
                                const i18n = window.SmartAgenda.i18n || window.SmartAgenda.I18n;
                                i18n.setLanguage(newLang);
                                console.log('[Welcome] Language changed to:', newLang);

                                // Update welcome screen text
                                const t = (key) => i18n.translate(key);
                                document.getElementById('welcome-title').innerHTML = t('welcome.title');
                                document.getElementById('welcome-subtitle').textContent = t('welcome.subtitle');
                                document.getElementById('welcome-gdrive-text').textContent = t('welcome.gdriveText');
                                document.getElementById('welcome-tutorial-btn').textContent = t('welcome.startTutorial');
                                document.getElementById('welcome-skip-btn').textContent = t('welcome.skip');
                                document.getElementById('welcome-footer').textContent = t('welcome.footerText');
                            }
                        });
                    }

                    if (setupBtn) {
                        setupBtn.addEventListener('click', async () => {
                            try {
                                // Sign in to Google Drive
                                await window.SmartAgenda.GoogleDriveService.signIn();

                                // Mark welcome as shown
                                localStorage.setItem('welcome_screen_shown', 'true');

                                // Close modal
                                window.SmartAgenda.UIComponents.closeModal(modal);

                                // Show success message
                                window.SmartAgenda.Toast.success('Google Drive connected! Your data will be backed up automatically.');

                                // Start tutorial after setup
                                setTimeout(() => {
                                    if (window.SmartAgenda?.Tutorial) {
                                        window.SmartAgenda.Tutorial.start();
                                    }
                                }, 500);

                                resolve('connected');
                            } catch (error) {
                                console.error('Welcome screen sign-in error:', error);
                                window.SmartAgenda.Toast.error('Failed to connect: ' + error.message);
                            }
                        });
                    }

                    if (tutorialBtn) {
                        tutorialBtn.addEventListener('click', () => {
                            // Mark welcome as shown
                            localStorage.setItem('welcome_screen_shown', 'true');

                            // Close modal
                            window.SmartAgenda.UIComponents.closeModal(modal);

                            // Start tutorial
                            setTimeout(() => {
                                if (window.SmartAgenda?.Tutorial) {
                                    window.SmartAgenda.Tutorial.start();
                                } else {
                                    console.error('Tutorial module not loaded');
                                    window.SmartAgenda.Toast.error('Tutorial module not available');
                                }
                            }, 300);

                            resolve('tutorial');
                        });
                    }

                    if (skipBtn) {
                        skipBtn.addEventListener('click', () => {
                            // Mark welcome as shown
                            localStorage.setItem('welcome_screen_shown', 'true');

                            // Close modal
                            window.SmartAgenda.UIComponents.closeModal(modal);

                            resolve('skipped');
                        });
                    }
                }, 100);
            });
        },

        /**
         * Hide loading screen and show app (without emitting welcome:closed)
         */
        hideLoading: function() {
            const loadingScreen = document.getElementById('loading-screen');
            const app = document.getElementById('app');

            if (loadingScreen) loadingScreen.style.display = 'none';
            if (app) app.style.display = 'flex';

            console.log('[Welcome] Loading hidden, app shown');
        },

        /**
         * Hide loading screen and show app, then emit welcome:closed event
         */
        hideLoadingAndShowApp: function() {
            this.hideLoading();

            // Emit event that welcome screen has closed
            if (window.SmartAgenda?.EventBus) {
                window.SmartAgenda.EventBus.emit('welcome:closed');
                console.log('[Welcome] Emitted welcome:closed event');
            }
        },

        /**
         * Initialize welcome screen (show if needed)
         */
        init: function() {
            // Wait for app to be ready
            if (window.SmartAgenda && window.SmartAgenda.EventBus) {
                window.SmartAgenda.EventBus.on('app:ready', () => {
                    // Immediately check if we should show welcome
                    if (this.shouldShow()) {
                        console.log('✨ Showing welcome screen for new user');
                        // Hide loading and show app FIRST, then show welcome modal
                        setTimeout(() => {
                            this.hideLoading();
                            // Small delay to ensure DOM is ready
                            setTimeout(() => {
                                this.show().then(() => {
                                    // Emit welcome:closed event after modal closes
                                    if (window.SmartAgenda?.EventBus) {
                                        window.SmartAgenda.EventBus.emit('welcome:closed');
                                        console.log('[Welcome] Emitted welcome:closed event');
                                    }
                                });
                            }, 100);
                        }, 300);
                    }
                });
            }
        }
    };

    // Add to global API
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.WelcomeScreen = WelcomeScreen;

    // Auto-initialize
    WelcomeScreen.init();

})();
