/**
 * Smart Agenda - Password Modal Component
 * Handles password input for encrypted cloud backups
 *
 * Features:
 * - First-time setup with password confirmation
 * - Password strength indicator
 * - Save password option (encrypted)
 * - No password recovery warning
 */
(function() {
    'use strict';

    const PasswordModal = {
        currentMode: null,  // 'backup' or 'restore'
        savedPasswordHash: null,
        resolveCallback: null,
        rejectCallback: null,

        /**
         * Initialize the service
         */
        init: function() {
            // Load saved password hash if exists
            this.savedPasswordHash = localStorage.getItem('backup_password_hash');
            console.log('✅ Password Modal initialized');
        },

        /**
         * Get password from user
         * @param {string} mode - 'backup' or 'restore'
         * @returns {Promise<string|null>} Password or null if cancelled
         */
        getPassword: function(mode) {
            this.currentMode = mode;

            return new Promise((resolve, reject) => {
                this.resolveCallback = resolve;
                this.rejectCallback = reject;

                // Check if this is first time (no saved password hash)
                const isFirstTime = !this.savedPasswordHash;

                if (isFirstTime) {
                    this.showFirstTimeSetup();
                } else {
                    this.showPasswordInput();
                }
            });
        },

        /**
         * Show first-time password setup modal
         */
        showFirstTimeSetup: function() {
            const i18n = window.SmartAgenda.I18n;

            const content = `
                <div style="padding: 20px;">
                    <div style="background: var(--warning-bg); border-left: 4px solid var(--warning-color); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: start; gap: 12px;">
                            <span style="font-size: 24px;">⚠️</span>
                            <div>
                                <div style="font-weight: 600; margin-bottom: 8px; color: var(--warning-color);">ΣΗΜΑΝΤΙΚΟ: Δεν υπάρχει ανάκτηση κωδικού!</div>
                                <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">
                                    Αυτός ο κωδικός χρησιμοποιείται για να κρυπτογραφήσει τα δεδομένα σας.
                                    Αν τον ξεχάσετε, ΔΕΝ θα μπορείτε να ανακτήσετε τα backups σας.
                                    Παρακαλώ κρατήστε τον σε ασφαλές μέρος.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
                            ${i18n.translate('backup.password')}
                        </label>
                        <div style="position: relative;">
                            <input type="password"
                                   id="backup-password-input"
                                   class="form-control"
                                   placeholder="Εισάγετε κωδικό (τουλάχιστον 8 χαρακτήρες)"
                                   style="width: 100%; padding: 12px; padding-right: 44px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-primary); font-size: 15px;">
                            <button id="toggle-password-btn"
                                    type="button"
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 8px; font-size: 18px; opacity: 0.6;">
                                👁️
                            </button>
                        </div>
                        <div id="password-strength" style="margin-top: 8px; display: none;">
                            <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                                <div class="strength-bar" style="flex: 1; height: 4px; background: var(--border); border-radius: 2px;"></div>
                                <div class="strength-bar" style="flex: 1; height: 4px; background: var(--border); border-radius: 2px;"></div>
                                <div class="strength-bar" style="flex: 1; height: 4px; background: var(--border); border-radius: 2px;"></div>
                                <div class="strength-bar" style="flex: 1; height: 4px; background: var(--border); border-radius: 2px;"></div>
                            </div>
                            <div id="strength-text" style="font-size: 13px; color: var(--text-secondary);"></div>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
                            ${i18n.translate('backup.confirmPassword')}
                        </label>
                        <div style="position: relative;">
                            <input type="password"
                                   id="backup-password-confirm"
                                   class="form-control"
                                   placeholder="Επαναλάβετε τον κωδικό"
                                   style="width: 100%; padding: 12px; padding-right: 44px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-primary); font-size: 15px;">
                            <button id="toggle-confirm-btn"
                                    type="button"
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 8px; font-size: 18px; opacity: 0.6;">
                                👁️
                            </button>
                        </div>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 12px; background: var(--background); border-radius: 6px;">
                            <input type="checkbox" id="save-password-checkbox" style="width: 18px; height: 18px; cursor: pointer;">
                            <span style="font-size: 14px;">Αποθήκευση κωδικού σε αυτήν τη συσκευή (κρυπτογραφημένος)</span>
                        </label>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: '🔐 Ρύθμιση Κωδικού Backup',
                content: content,
                buttons: [
                    {
                        label: i18n.translate('actions.cancel'),
                        type: 'secondary',
                        onClick: () => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            if (this.resolveCallback) this.resolveCallback(null);
                        }
                    },
                    {
                        label: i18n.translate('actions.continue'),
                        type: 'primary',
                        onClick: () => this.handleFirstTimeSubmit(modal)
                    }
                ],
                size: 'medium'
            });

            // Bind event listeners after modal is shown
            setTimeout(() => {
                this.bindFirstTimeEvents();
            }, 100);
        },

        /**
         * Show password input modal (for existing password)
         */
        showPasswordInput: function() {
            const i18n = window.SmartAgenda.I18n;
            const modeText = this.currentMode === 'backup' ? 'Backup' : 'Επαναφορά';

            const content = `
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px; text-align: center; color: var(--text-secondary);">
                        Εισάγετε τον κωδικό για ${modeText.toLowerCase()} των δεδομένων σας
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
                            ${i18n.translate('backup.password')}
                        </label>
                        <div style="position: relative;">
                            <input type="password"
                                   id="backup-password-input"
                                   class="form-control"
                                   placeholder="Εισάγετε τον κωδικό backup"
                                   style="width: 100%; padding: 12px; padding-right: 44px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text-primary); font-size: 15px;">
                            <button id="toggle-password-btn"
                                    type="button"
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 8px; font-size: 18px; opacity: 0.6;">
                                👁️
                            </button>
                        </div>
                    </div>

                    <div style="background: var(--background); padding: 12px; border-radius: 6px; font-size: 13px; color: var(--text-secondary);">
                        💡 Αν ξεχάσατε τον κωδικό σας, δεν υπάρχει τρόπος ανάκτησης των encrypted backups.
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: `🔐 Κωδικός για ${modeText}`,
                content: content,
                buttons: [
                    {
                        label: i18n.translate('actions.cancel'),
                        type: 'secondary',
                        onClick: () => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            if (this.resolveCallback) this.resolveCallback(null);
                        }
                    },
                    {
                        label: i18n.translate('actions.continue'),
                        type: 'primary',
                        onClick: () => this.handlePasswordSubmit(modal)
                    }
                ],
                size: 'small'
            });

            // Bind events
            setTimeout(() => {
                this.bindPasswordInputEvents();
            }, 100);
        },

        /**
         * Bind events for first-time setup
         */
        bindFirstTimeEvents: function() {
            const passwordInput = document.getElementById('backup-password-input');
            const confirmInput = document.getElementById('backup-password-confirm');
            const toggleBtn = document.getElementById('toggle-password-btn');
            const toggleConfirmBtn = document.getElementById('toggle-confirm-btn');
            const strengthDiv = document.getElementById('password-strength');

            // Password visibility toggle
            if (toggleBtn && passwordInput) {
                toggleBtn.addEventListener('click', () => {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        toggleBtn.textContent = '🙈';
                    } else {
                        passwordInput.type = 'password';
                        toggleBtn.textContent = '👁️';
                    }
                });
            }

            if (toggleConfirmBtn && confirmInput) {
                toggleConfirmBtn.addEventListener('click', () => {
                    if (confirmInput.type === 'password') {
                        confirmInput.type = 'text';
                        toggleConfirmBtn.textContent = '🙈';
                    } else {
                        confirmInput.type = 'password';
                        toggleConfirmBtn.textContent = '👁️';
                    }
                });
            }

            // Password strength indicator
            if (passwordInput) {
                passwordInput.addEventListener('input', () => {
                    const password = passwordInput.value;
                    if (password.length > 0 && strengthDiv) {
                        strengthDiv.style.display = 'block';
                        this.updateStrengthIndicator(password);
                    } else if (strengthDiv) {
                        strengthDiv.style.display = 'none';
                    }
                });

                // Focus on password input
                passwordInput.focus();

                // Allow Enter key to submit
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        confirmInput.focus();
                    }
                });
            }

            if (confirmInput) {
                confirmInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const submitBtn = document.querySelector('.modal button[type="primary"]');
                        if (submitBtn) submitBtn.click();
                    }
                });
            }
        },

        /**
         * Bind events for password input
         */
        bindPasswordInputEvents: function() {
            const passwordInput = document.getElementById('backup-password-input');
            const toggleBtn = document.getElementById('toggle-password-btn');

            if (toggleBtn && passwordInput) {
                toggleBtn.addEventListener('click', () => {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        toggleBtn.textContent = '🙈';
                    } else {
                        passwordInput.type = 'password';
                        toggleBtn.textContent = '👁️';
                    }
                });
            }

            if (passwordInput) {
                passwordInput.focus();

                // Allow Enter key to submit
                passwordInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const submitBtn = document.querySelector('.modal .btn-primary');
                        if (submitBtn) submitBtn.click();
                    }
                });
            }
        },

        /**
         * Update password strength indicator
         */
        updateStrengthIndicator: function(password) {
            const strength = window.SmartAgenda.EncryptionService.checkPasswordStrength(password);
            const bars = document.querySelectorAll('.strength-bar');
            const strengthText = document.getElementById('strength-text');

            if (!bars || !strengthText) return;

            // Color map
            const colors = {
                weak: '#f44336',
                medium: '#ff9800',
                strong: '#4caf50'
            };

            const color = colors[strength.level] || colors.weak;

            // Update bars
            bars.forEach((bar, index) => {
                if (index < strength.score) {
                    bar.style.background = color;
                } else {
                    bar.style.background = 'var(--border)';
                }
            });

            // Update text
            strengthText.textContent = strength.feedback;
            strengthText.style.color = color;
        },

        /**
         * Handle first-time password setup submission
         */
        handleFirstTimeSubmit: async function(modal) {
            const passwordInput = document.getElementById('backup-password-input');
            const confirmInput = document.getElementById('backup-password-confirm');
            const saveCheckbox = document.getElementById('save-password-checkbox');

            const password = passwordInput?.value || '';
            const confirm = confirmInput?.value || '';
            const shouldSave = saveCheckbox?.checked || false;

            // Validate
            if (password.length < 8) {
                window.SmartAgenda.Toast.error('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες');
                passwordInput.focus();
                return;
            }

            if (password !== confirm) {
                window.SmartAgenda.Toast.error('Οι κωδικοί δεν ταιριάζουν');
                confirmInput.focus();
                return;
            }

            // Check strength
            const strength = window.SmartAgenda.EncryptionService.checkPasswordStrength(password);
            if (strength.level === 'weak') {
                const confirmed = await window.SmartAgenda.UIComponents.confirm({
                    title: 'Αδύναμος Κωδικός',
                    message: 'Ο κωδικός σας είναι αδύναμος. Θέλετε να συνεχίσετε ούτως ή άλλως;',
                    confirmText: 'Συνέχεια',
                    cancelText: 'Αλλαγή Κωδικού',
                    type: 'warning'
                });

                if (!confirmed) return;
            }

            // Save password hash if requested
            if (shouldSave) {
                try {
                    const hash = await window.SmartAgenda.EncryptionService.hashPassword(password);
                    localStorage.setItem('backup_password_hash', hash);
                    this.savedPasswordHash = hash;
                } catch (error) {
                    console.error('Failed to save password hash:', error);
                }
            }

            // Close modal and resolve
            window.SmartAgenda.UIComponents.closeModal(modal);
            if (this.resolveCallback) this.resolveCallback(password);
        },

        /**
         * Handle password input submission
         */
        handlePasswordSubmit: function(modal) {
            const passwordInput = document.getElementById('backup-password-input');
            const password = passwordInput?.value || '';

            if (!password) {
                window.SmartAgenda.Toast.error('Παρακαλώ εισάγετε τον κωδικό');
                passwordInput.focus();
                return;
            }

            // Close modal and resolve
            window.SmartAgenda.UIComponents.closeModal(modal);
            if (this.resolveCallback) this.resolveCallback(password);
        },

        /**
         * Clear saved password
         */
        clearSavedPassword: function() {
            localStorage.removeItem('backup_password_hash');
            this.savedPasswordHash = null;
            window.SmartAgenda.Toast.success('Ο αποθηκευμένος κωδικός διαγράφηκε');
        }
    };

    // Add to global API
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.PasswordModal = PasswordModal;

})();
