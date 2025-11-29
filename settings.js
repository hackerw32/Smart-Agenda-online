/**
 * Smart Agenda - Settings Module
 * Handles settings UI and data export/import
 */
(function() {
    'use strict';

    // Available colors for client types
    const AVAILABLE_COLORS = [
        { name: 'Green', value: '#4CAF50' },
        { name: 'Orange', value: '#FF9800' },
        { name: 'Blue', value: '#2196F3' },
        { name: 'Red', value: '#F44336' },
        { name: 'Purple', value: '#9C27B0' },
        { name: 'Teal', value: '#009688' },
        { name: 'Pink', value: '#E91E63' },
        { name: 'Yellow', value: '#FFC107' }
    ];

    const Settings = {
        clientTypes: [],

        init: function() {
            console.log('Settings module loaded');
            this.loadClientTypes();
            this.bindEvents();
            this.renderClientTypes();
        },

        bindEvents: function() {
            const exportBtn = document.getElementById('export-data-btn');
            const importBtn = document.getElementById('import-data-btn');
            const clearBtn = document.getElementById('clear-data-btn');
            const addClientTypeBtn = document.getElementById('add-client-type-btn');

            // Firebase Auth buttons
            const signinBtn = document.getElementById('signin-btn');
            const createAccountBtn = document.getElementById('create-account-btn');
            const signoutBtn = document.getElementById('signout-btn');
            const backupBtn = document.getElementById('backup-data-btn');
            const restoreBtn = document.getElementById('restore-data-btn');

            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    window.SmartAgenda.DataManager.downloadBackup();
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', async () => {
                    const confirmed = await window.SmartAgenda.UIComponents.confirm({
                        title: 'Clear All Data',
                        message: 'Are you sure? This action cannot be undone!',
                        confirmText: 'Clear All',
                        type: 'danger'
                    });
                    if (confirmed) {
                        window.SmartAgenda.DataManager.clearAll();
                        location.reload();
                    }
                });
            }

            if (importBtn) {
                importBtn.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                try {
                                    const data = JSON.parse(event.target.result);
                                    window.SmartAgenda.DataManager.importData(data);
                                    location.reload();
                                } catch (error) {
                                    window.SmartAgenda.Toast.error('Invalid JSON file');
                                }
                            };
                            reader.readAsText(file);
                        }
                    };
                    input.click();
                });
            }

            if (addClientTypeBtn) {
                addClientTypeBtn.addEventListener('click', () => this.showAddClientTypeModal());
            }

            // Firebase Auth event listeners
            if (signinBtn) {
                signinBtn.addEventListener('click', () => this.showSignInModal());
            }

            if (createAccountBtn) {
                createAccountBtn.addEventListener('click', () => this.showCreateAccountModal());
            }

            if (signoutBtn) {
                signoutBtn.addEventListener('click', async () => {
                    const confirmed = await window.SmartAgenda.UIComponents.confirm({
                        title: 'Sign Out',
                        message: 'Are you sure you want to sign out?',
                        confirmText: 'Sign Out',
                        type: 'warning'
                    });
                    if (confirmed && window.SmartAgenda.FirebaseService) {
                        await window.SmartAgenda.FirebaseService.signOut();
                    }
                });
            }

            if (backupBtn) {
                backupBtn.addEventListener('click', async () => {
                    if (window.SmartAgenda.FirebaseService) {
                        await window.SmartAgenda.FirebaseService.backupAllData();
                    }
                });
            }

            if (restoreBtn) {
                restoreBtn.addEventListener('click', async () => {
                    if (window.SmartAgenda.FirebaseService) {
                        await window.SmartAgenda.FirebaseService.restoreBackup();
                    }
                });
            }

            // Listen for language changes to re-render
            if (window.SmartAgenda) {
                window.SmartAgenda.EventBus.on('language:change', () => this.renderClientTypes());
            }
        },

        // Client Types Management
        loadClientTypes: function() {
            try {
                const saved = localStorage.getItem('clientTypes');
                if (saved) {
                    this.clientTypes = JSON.parse(saved);
                } else {
                    // Default types
                    this.clientTypes = [
                        { id: 'existing', name: 'Existing', color: '#4CAF50', deletable: true },
                        { id: 'potential', name: 'Potential', color: '#FF9800', deletable: true }
                    ];
                    this.saveClientTypes();
                }
                // Emit event after loading to notify other modules
                if (window.SmartAgenda && window.SmartAgenda.EventBus) {
                    // Use setTimeout to ensure the event is emitted after all modules have initialized
                    setTimeout(() => {
                        window.SmartAgenda.EventBus.emit('settings:clientTypes:change', this.clientTypes);
                    }, 100);
                }
            } catch (error) {
                console.error('Error loading client types:', error);
                this.clientTypes = [
                    { id: 'existing', name: 'Existing', color: '#4CAF50', deletable: true },
                    { id: 'potential', name: 'Potential', color: '#FF9800', deletable: true }
                ];
            }
        },

        saveClientTypes: function() {
            try {
                localStorage.setItem('clientTypes', JSON.stringify(this.clientTypes));
                // Emit event for other modules to update
                if (window.SmartAgenda && window.SmartAgenda.EventBus) {
                    window.SmartAgenda.EventBus.emit('settings:clientTypes:change', this.clientTypes);
                }
            } catch (error) {
                console.error('Error saving client types:', error);
            }
        },

        renderClientTypes: function() {
            const container = document.getElementById('client-types-list');
            if (!container) return;

            container.innerHTML = '';

            if (this.clientTypes.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No client types yet</p>';
                return;
            }

            this.clientTypes.forEach(type => {
                const typeItem = document.createElement('div');
                typeItem.className = 'client-type-item';
                typeItem.style.cssText = `
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    border: 1px solid var(--border);
                    border-radius: var(--border-radius-sm);
                    margin-bottom: 8px;
                    background: var(--surface);
                `;

                const i18n = window.SmartAgenda.I18n;
                typeItem.innerHTML = `
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ${type.color}; margin-right: 12px;"></div>
                    <div style="flex: 1; font-weight: 500;">${this.escapeHtml(type.name)}</div>
                    <button class="edit-type-btn" data-id="${type.id}" style="padding: 6px 12px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                        ${i18n.translate('actions.edit')}
                    </button>
                    ${type.deletable !== false ? `
                        <button class="delete-type-btn" data-id="${type.id}" style="padding: 6px 12px; background: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer;">
                            ${i18n.translate('actions.delete')}
                        </button>
                    ` : ''}
                `;

                container.appendChild(typeItem);
            });

            // Bind edit and delete buttons
            container.querySelectorAll('.edit-type-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const typeId = btn.dataset.id;
                    const type = this.clientTypes.find(t => t.id === typeId);
                    if (type) this.showEditClientTypeModal(type);
                });
            });

            container.querySelectorAll('.delete-type-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const typeId = btn.dataset.id;
                    const confirmed = await window.SmartAgenda.UIComponents.confirm({
                        title: 'Delete Client Type',
                        message: 'Are you sure you want to delete this client type?',
                        confirmText: 'Delete',
                        type: 'danger'
                    });
                    if (confirmed) {
                        this.deleteClientType(typeId);
                    }
                });
            });

            // Update add button visibility
            const addBtn = document.getElementById('add-client-type-btn');
            if (addBtn) {
                if (this.clientTypes.length >= 6) {
                    addBtn.disabled = true;
                    addBtn.style.opacity = '0.5';
                    addBtn.style.cursor = 'not-allowed';
                } else {
                    addBtn.disabled = false;
                    addBtn.style.opacity = '1';
                    addBtn.style.cursor = 'pointer';
                }
            }
        },

        showAddClientTypeModal: function() {
            if (this.clientTypes.length >= 6) {
                window.SmartAgenda.Toast.warning('Maximum of 6 client types reached');
                return;
            }

            // Get colors that are already in use
            const usedColors = this.clientTypes.map(t => t.color);

            // Filter to only available colors
            const availableColors = AVAILABLE_COLORS.filter(color => !usedColors.includes(color.value));

            if (availableColors.length === 0) {
                window.SmartAgenda.Toast.error('No available colors left');
                return;
            }

            // Auto-select the first available color
            const defaultColor = availableColors[0].value;

            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Type Name</label>
                        <input type="text" id="client-type-name" class="form-control" placeholder="e.g., VIP, Partner..." style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--text-primary);">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Color</label>
                        <div id="color-picker" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                            ${availableColors.map((color, index) => `
                                <div class="color-option" data-color="${color.value}" ${index === 0 ? 'data-selected="true"' : ''} style="width: 100%; aspect-ratio: 1; background: ${color.value}; border-radius: 8px; cursor: pointer; border: 3px solid ${index === 0 ? 'var(--primary-color)' : 'transparent'}; transition: all 0.2s;"
                                     onmouseover="this.style.transform='scale(1.1)'"
                                     onmouseout="this.style.transform='scale(1)'"
                                     onclick="document.querySelectorAll('.color-option').forEach(el => {el.style.border='3px solid transparent'; el.removeAttribute('data-selected');}); this.style.border='3px solid var(--primary-color)'; this.dataset.selected='true';">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            const i18n = window.SmartAgenda.I18n;
            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Add Client Type',
                content: content,
                buttons: [
                    {
                        label: i18n.translate('actions.cancel'),
                        type: 'secondary',
                        action: 'cancel',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    },
                    {
                        label: i18n.translate('actions.add'),
                        type: 'primary',
                        action: 'add',
                        onClick: (modal) => {
                            const name = document.getElementById('client-type-name')?.value.trim();
                            const selectedColor = modal.querySelector('.color-option[data-selected="true"]');

                            if (!name) {
                                window.SmartAgenda.Toast.error('Please enter a type name');
                                return;
                            }

                            if (!selectedColor) {
                                window.SmartAgenda.Toast.error('Please select a color');
                                return;
                            }

                            const color = selectedColor.dataset.color;
                            window.SmartAgenda.Settings.addClientType(name, color);
                            window.SmartAgenda.UIComponents.closeModal(modal);
                        }
                    }
                ],
                size: 'small'
            });
        },

        showEditClientTypeModal: function(type) {
            // Get colors that are already in use by OTHER client types (not this one)
            const usedColors = this.clientTypes
                .filter(t => t.id !== type.id)
                .map(t => t.color);

            // Filter to available colors (current color + unused colors)
            const availableColors = AVAILABLE_COLORS.filter(color =>
                color.value === type.color || !usedColors.includes(color.value)
            );

            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Type Name</label>
                        <input type="text" id="client-type-name" class="form-control" value="${this.escapeHtml(type.name)}" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--text-primary);">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Color</label>
                        <div id="color-picker" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                            ${availableColors.map(color => `
                                <div class="color-option" data-color="${color.value}" ${color.value === type.color ? 'data-selected="true"' : ''}
                                     style="width: 100%; aspect-ratio: 1; background: ${color.value}; border-radius: 8px; cursor: pointer; border: 3px solid ${color.value === type.color ? 'var(--primary-color)' : 'transparent'}; transition: all 0.2s;"
                                     onmouseover="this.style.transform='scale(1.1)'"
                                     onmouseout="this.style.transform='scale(1)'"
                                     onclick="document.querySelectorAll('.color-option').forEach(el => {el.style.border='3px solid transparent'; el.removeAttribute('data-selected');}); this.style.border='3px solid var(--primary-color)'; this.dataset.selected='true';">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            const i18n = window.SmartAgenda.I18n;
            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Edit Client Type',
                content: content,
                buttons: [
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
                        onClick: (modal) => {
                            const name = document.getElementById('client-type-name')?.value.trim();
                            const selectedColor = modal.querySelector('.color-option[data-selected="true"]');

                            if (!name) {
                                window.SmartAgenda.Toast.error('Please enter a type name');
                                return;
                            }

                            if (!selectedColor) {
                                window.SmartAgenda.Toast.error('Please select a color');
                                return;
                            }

                            const color = selectedColor.dataset.color;
                            window.SmartAgenda.Settings.updateClientType(type.id, name, color);
                            window.SmartAgenda.UIComponents.closeModal(modal);
                        }
                    }
                ],
                size: 'small'
            });
        },

        addClientType: function(name, color) {
            const newType = {
                id: Date.now().toString(),
                name: name,
                color: color,
                deletable: true
            };

            this.clientTypes.push(newType);
            this.saveClientTypes();
            this.renderClientTypes();
            window.SmartAgenda.Toast.success('Client type added');
        },

        updateClientType: function(id, name, color) {
            const type = this.clientTypes.find(t => t.id === id);
            if (type) {
                type.name = name;
                type.color = color;
                this.saveClientTypes();
                this.renderClientTypes();
                window.SmartAgenda.Toast.success('Client type updated');
            }
        },

        deleteClientType: function(id) {
            this.clientTypes = this.clientTypes.filter(t => t.id !== id);
            this.saveClientTypes();
            this.renderClientTypes();
            window.SmartAgenda.Toast.success('Client type deleted');
        },

        getClientTypes: function() {
            return this.clientTypes;
        },

        // Firebase Authentication Modals
        showSignInModal: function() {
            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Email</label>
                        <input type="email" id="signin-email"
                               style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 15px; background: var(--surface); color: var(--text);"
                               placeholder="Enter your email">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Password</label>
                        <div style="position: relative;">
                            <input type="password" id="signin-password"
                                   style="width: 100%; padding: 12px; padding-right: 44px; border: 1px solid var(--border); border-radius: 6px; font-size: 15px; background: var(--surface); color: var(--text);"
                                   placeholder="Enter your password">
                            <button id="signin-toggle-password" type="button"
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 8px; font-size: 18px;">
                                👁️
                            </button>
                        </div>
                    </div>
                </div>
            `;

            window.SmartAgenda.UIComponents.showModal({
                title: '🔐 Sign In',
                content: content,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        onClick: (modal) => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                        }
                    },
                    {
                        label: 'Sign In',
                        type: 'primary',
                        onClick: async (modal) => {
                            const email = document.getElementById('signin-email').value.trim();
                            const password = document.getElementById('signin-password').value;

                            if (!email || !password) {
                                window.SmartAgenda.Toast.error('Please fill in all fields');
                                return;
                            }

                            if (window.SmartAgenda.FirebaseService) {
                                const result = await window.SmartAgenda.FirebaseService.signIn(email, password);
                                if (result.success) {
                                    window.SmartAgenda.UIComponents.closeModal(modal);
                                }
                            }
                        }
                    }
                ]
            });

            // Add toggle password visibility
            setTimeout(() => {
                const toggleBtn = document.getElementById('signin-toggle-password');
                const passwordInput = document.getElementById('signin-password');
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
            }, 100);
        },

        showCreateAccountModal: function() {
            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Email</label>
                        <input type="email" id="create-email"
                               style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 15px; background: var(--surface); color: var(--text);"
                               placeholder="Enter your email">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Password</label>
                        <div style="position: relative;">
                            <input type="password" id="create-password"
                                   style="width: 100%; padding: 12px; padding-right: 44px; border: 1px solid var(--border); border-radius: 6px; font-size: 15px; background: var(--surface); color: var(--text);"
                                   placeholder="Enter password (min 6 characters)">
                            <button id="create-toggle-password" type="button"
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 8px; font-size: 18px;">
                                👁️
                            </button>
                        </div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Confirm Password</label>
                        <div style="position: relative;">
                            <input type="password" id="create-password-confirm"
                                   style="width: 100%; padding: 12px; padding-right: 44px; border: 1px solid var(--border); border-radius: 6px; font-size: 15px; background: var(--surface); color: var(--text);"
                                   placeholder="Re-enter your password">
                            <button id="create-toggle-password-confirm" type="button"
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 8px; font-size: 18px;">
                                👁️
                            </button>
                        </div>
                    </div>
                    <div style="padding: 12px; background: var(--background); border-radius: 6px; margin-bottom: 8px;">
                        <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">
                            ℹ️ Your data will be automatically backed up to the cloud after creating your account.
                        </p>
                    </div>
                </div>
            `;

            window.SmartAgenda.UIComponents.showModal({
                title: '✨ Create Account',
                content: content,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        onClick: (modal) => {
                            window.SmartAgenda.UIComponents.closeModal(modal);
                        }
                    },
                    {
                        label: 'Create Account',
                        type: 'primary',
                        onClick: async (modal) => {
                            const email = document.getElementById('create-email').value.trim();
                            const password = document.getElementById('create-password').value;
                            const confirmPassword = document.getElementById('create-password-confirm').value;

                            if (!email || !password || !confirmPassword) {
                                window.SmartAgenda.Toast.error('Please fill in all fields');
                                return;
                            }

                            if (password !== confirmPassword) {
                                window.SmartAgenda.Toast.error('Passwords do not match');
                                return;
                            }

                            if (password.length < 6) {
                                window.SmartAgenda.Toast.error('Password must be at least 6 characters');
                                return;
                            }

                            if (window.SmartAgenda.FirebaseService) {
                                const result = await window.SmartAgenda.FirebaseService.createAccount(email, password);
                                if (result.success) {
                                    window.SmartAgenda.UIComponents.closeModal(modal);
                                }
                            }
                        }
                    }
                ]
            });

            // Add toggle password visibility for both password fields
            setTimeout(() => {
                const toggleBtn = document.getElementById('create-toggle-password');
                const passwordInput = document.getElementById('create-password');
                const toggleBtnConfirm = document.getElementById('create-toggle-password-confirm');
                const passwordInputConfirm = document.getElementById('create-password-confirm');

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

                if (toggleBtnConfirm && passwordInputConfirm) {
                    toggleBtnConfirm.addEventListener('click', () => {
                        if (passwordInputConfirm.type === 'password') {
                            passwordInputConfirm.type = 'text';
                            toggleBtnConfirm.textContent = '🙈';
                        } else {
                            passwordInputConfirm.type = 'password';
                            toggleBtnConfirm.textContent = '👁️';
                        }
                    });
                }
            }, 100);
        },

        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => Settings.init());
        window.SmartAgenda.Settings = Settings;
    }
})();
