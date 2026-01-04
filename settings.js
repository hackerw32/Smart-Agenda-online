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
            // Settings Category Buttons
            const appearanceBtn = document.getElementById('settings-appearance-btn');
            const notificationsBtn = document.getElementById('settings-notifications-btn');
            const clientTypesBtn = document.getElementById('settings-client-types-btn');
            const dataBtn = document.getElementById('settings-data-btn');
            const helpBtn = document.getElementById('settings-help-btn');
            const aboutBtn = document.getElementById('settings-about-btn');

            if (appearanceBtn) {
                appearanceBtn.addEventListener('click', () => this.showCategoryModal('appearance'));
            }
            if (notificationsBtn) {
                notificationsBtn.addEventListener('click', () => this.showCategoryModal('notifications'));
            }
            if (clientTypesBtn) {
                clientTypesBtn.addEventListener('click', () => this.showCategoryModal('client-types'));
            }
            if (dataBtn) {
                dataBtn.addEventListener('click', () => this.showCategoryModal('data'));
            }
            if (helpBtn) {
                helpBtn.addEventListener('click', () => this.showCategoryModal('help'));
            }
            if (aboutBtn) {
                aboutBtn.addEventListener('click', () => this.showCategoryModal('about'));
            }

            // Back button
            const backBtn = document.getElementById('settings-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => this.goBackToMainMenu());
            }

            // Header action button (for add client type)
            const headerActionBtn = document.getElementById('add-client-type-header-btn');
            if (headerActionBtn) {
                headerActionBtn.addEventListener('click', () => this.showAddClientTypeModal());
            }

            // Listen for language changes to update header
            if (window.SmartAgenda && window.SmartAgenda.EventBus) {
                window.SmartAgenda.EventBus.on('language:change', () => {
                    // If we're in a category view, update the header
                    if (this.currentCategory) {
                        this.updateHeaderTranslations(this.currentCategory);
                    }
                });
            }

            const exportBtn = document.getElementById('export-data-btn');
            const shareBackupBtn = document.getElementById('share-backup-btn');
            const importBtn = document.getElementById('import-data-btn');
            const fileManagerBtn = document.getElementById('file-manager-btn');
            const clearBtn = document.getElementById('clear-data-btn');

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

            if (shareBackupBtn) {
                shareBackupBtn.addEventListener('click', () => {
                    window.SmartAgenda.DataManager.shareBackup();
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
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                                try {
                                    const data = JSON.parse(event.target.result);
                                    await this.handleBackupImport(data);
                                } catch (error) {
                                    window.SmartAgenda.Toast.error('Invalid JSON file');
                                    console.error('Import error:', error);
                                }
                            };
                            reader.readAsText(file);
                        }
                    };
                    input.click();
                });
            }

            if (fileManagerBtn) {
                fileManagerBtn.addEventListener('click', () => {
                    if (window.SmartAgenda.FileManager) {
                        window.SmartAgenda.FileManager.show();
                    }
                });
            }

            // New Google Drive Backup UI
            const gdriveSigninBtn = document.getElementById('gdrive-signin-btn');
            const gdriveDisconnectBtn = document.getElementById('gdrive-disconnect-btn');
            const gdriveBackupNowBtn = document.getElementById('gdrive-backup-now-btn');
            const gdriveRestoreBtn = document.getElementById('gdrive-restore-btn');
            const gdriveAutoBackupSelect = document.getElementById('gdrive-auto-backup');

            if (gdriveSigninBtn) {
                gdriveSigninBtn.addEventListener('click', async () => {
                    try {
                        await window.SmartAgenda.GoogleDriveService.signIn();
                        const i18n = window.SmartAgenda.I18n;
                        window.SmartAgenda.Toast.success(i18n.translate('gdrive.connected'));
                        this.updateGoogleDriveUI();
                    } catch (error) {
                        console.error('Sign-in error:', error);
                        const i18n = window.SmartAgenda.I18n;
                        window.SmartAgenda.Toast.error(i18n.translate('gdrive.connectionError') + error.message);
                    }
                });
            }

            if (gdriveDisconnectBtn) {
                gdriveDisconnectBtn.addEventListener('click', async () => {
                    const i18n = window.SmartAgenda.I18n;
                    const confirmed = await window.SmartAgenda.UIComponents.confirm({
                        title: i18n.translate('gdrive.disconnectTitle'),
                        message: i18n.translate('gdrive.disconnectMessage'),
                        confirmText: i18n.translate('gdrive.disconnect'),
                        type: 'warning'
                    });
                    if (confirmed && window.SmartAgenda.GoogleDriveService) {
                        window.SmartAgenda.GoogleDriveService.signOut();
                        this.updateGoogleDriveUI();
                    }
                });
            }

            if (gdriveBackupNowBtn) {
                gdriveBackupNowBtn.addEventListener('click', async () => {
                    try {
                        if (!window.SmartAgenda.GoogleDriveService.currentUser) {
                            const i18n = window.SmartAgenda.I18n;
                            window.SmartAgenda.Toast.error(i18n.translate('gdrive.pleaseSignIn'));
                            return;
                        }

                        // Create backup without password
                        await window.SmartAgenda.BackupService.createBackup();
                        this.updateGoogleDriveUI();

                    } catch (error) {
                        console.error('Backup error:', error);
                    }
                });
            }

            if (gdriveRestoreBtn) {
                gdriveRestoreBtn.addEventListener('click', async () => {
                    console.log('🔍 Restore button clicked');
                    const i18n = window.SmartAgenda.I18n;
                    try {
                        // Check authentication
                        if (!window.SmartAgenda.GoogleDriveService.currentUser) {
                            console.log('❌ Not authenticated');
                            window.SmartAgenda.Toast.error(i18n.translate('gdrive.pleaseSignIn'));
                            return;
                        }
                        console.log('✅ User authenticated:', window.SmartAgenda.GoogleDriveService.currentUser.email);

                        // List available backups
                        console.log('📋 Listing available backups...');
                        const backups = await window.SmartAgenda.BackupService.listAvailableBackups();
                        console.log('✅ Found backups:', backups.length, backups);

                        if (backups.length === 0) {
                            console.log('⚠️ No backups found');
                            window.SmartAgenda.Toast.info(i18n.translate('gdrive.noBackupsFound'));
                            return;
                        }

                        // Show backup selection modal
                        console.log('📝 Showing backup selection modal...');
                        const selected = await this.showBackupSelectionModal(backups);
                        console.log('✅ User selected:', selected);
                        if (!selected) {
                            console.log('⚠️ User cancelled selection');
                            return;
                        }

                        // Restore backup without password
                        console.log('🔄 Starting restore for backup:', selected.id);
                        await window.SmartAgenda.BackupService.restoreBackup(selected.id);
                        console.log('✅ Restore completed successfully');

                    } catch (error) {
                        console.error('❌ Restore error:', error);
                        console.error('Error stack:', error.stack);
                        if (window.SmartAgenda && window.SmartAgenda.Toast) {
                            window.SmartAgenda.Toast.error(i18n.translate('gdrive.restoreError') + error.message);
                        }
                    }
                });
            }

            if (gdriveAutoBackupSelect) {
                gdriveAutoBackupSelect.addEventListener('change', (e) => {
                    const frequency = e.target.value;
                    localStorage.setItem('gdrive_auto_backup_frequency', frequency);
                    window.SmartAgenda.Toast.success(`Auto backup: ${frequency}`);

                    // Reschedule auto backup
                    if (window.SmartAgenda.BackupService) {
                        window.SmartAgenda.BackupService.scheduleAutoBackup();
                    }
                });
            }

            // Fancy Graphics toggle
            const fancyGraphicsToggle = document.getElementById('fancy-graphics-toggle');
            if (fancyGraphicsToggle) {
                // Listen for changes on the checkbox
                fancyGraphicsToggle.addEventListener('change', (e) => {
                    const enabled = e.target.checked;
                    console.log('Fancy Graphics toggled:', enabled);

                    if (window.SmartAgenda && window.SmartAgenda.Performance) {
                        window.SmartAgenda.Performance.setFancyGraphics(enabled);
                    }
                });

                // Also handle clicks on the slider (since checkbox is invisible)
                const slider = fancyGraphicsToggle.nextElementSibling;
                if (slider && slider.classList.contains('android-toggle-slider')) {
                    slider.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        fancyGraphicsToggle.checked = !fancyGraphicsToggle.checked;
                        fancyGraphicsToggle.dispatchEvent(new Event('change'));
                    });
                }
            }

            // Update fancy graphics status on page load
            setTimeout(() => {
                this.updateFancyGraphicsStatus();
            }, 100);

            // Restart Tutorial button
            const restartTutorialBtn = document.getElementById('restart-tutorial-btn');
            if (restartTutorialBtn) {
                restartTutorialBtn.addEventListener('click', () => {
                    if (window.SmartAgenda && window.SmartAgenda.Tutorial) {
                        window.SmartAgenda.Tutorial.start();
                    } else {
                        console.error('Tutorial module not loaded');
                        window.SmartAgenda.Toast.error('Tutorial module not available');
                    }
                });
            }

            // Secret ads toggle (5 clicks on About section)
            const aboutSection = document.getElementById('about-settings-content');
            if (aboutSection) {
                let clickCount = 0;
                let clickTimer = null;

                aboutSection.addEventListener('click', () => {
                    clickCount++;

                    // Reset counter after 2 seconds of inactivity
                    clearTimeout(clickTimer);
                    clickTimer = setTimeout(() => {
                        clickCount = 0;
                    }, 2000);

                    if (clickCount === 5) {
                        // Toggle ads
                        const currentState = localStorage.getItem('ads-enabled') !== 'false';
                        const newState = !currentState;
                        localStorage.setItem('ads-enabled', newState.toString());

                        // Reset counter
                        clickCount = 0;

                        // Show toast (brief feedback)
                        if (newState) {
                            window.SmartAgenda.Toast.success('Ads enabled');
                        } else {
                            window.SmartAgenda.Toast.success('Ads disabled');
                        }

                        console.log('[Secret Toggle] Ads toggled to:', newState);
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
                    <button class="edit-type-btn" data-id="${type.id}" style="padding: 8px 12px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    ${type.deletable !== false ? `
                        <button class="delete-type-btn" data-id="${type.id}" style="padding: 8px 12px; background: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                            </svg>
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
        },

        // ============================================
        // Backup Import with Merge/Replace Option
        // ============================================

        handleBackupImport: async function(data) {
            // Check if there's existing data
            const existingClients = window.SmartAgenda.DataManager.getAll('clients');
            const existingAppointments = window.SmartAgenda.DataManager.getAll('appointments');
            const existingTasks = window.SmartAgenda.DataManager.getAll('tasks');

            const hasExistingData = existingClients.length > 0 || existingAppointments.length > 0 || existingTasks.length > 0;

            if (!hasExistingData) {
                // No existing data, just import directly
                window.SmartAgenda.DataManager.importData(data, false);
                location.reload();
                return;
            }

            // Ask user: merge or replace?
            const importMode = await this.showImportModeDialog(data);

            if (!importMode) {
                // User cancelled
                return;
            }

            if (importMode === 'replace') {
                // Replace mode: clear and import
                const confirmed = await window.SmartAgenda.UIComponents.confirm({
                    title: 'Clear and Import',
                    message: 'This will delete all your current data and replace it with the backup. Are you sure?',
                    confirmText: 'Yes, Replace All',
                    type: 'danger'
                });

                if (confirmed) {
                    window.SmartAgenda.DataManager.importData(data, false);
                    location.reload();
                }
            } else if (importMode === 'merge') {
                // Merge mode: check for duplicates
                if (data.clients && data.clients.length > 0) {
                    const { duplicates, newClients } = window.SmartAgenda.DataManager.findDuplicateClients(data.clients);

                    if (duplicates.length > 0) {
                        // Handle duplicates
                        await this.handleBackupDuplicates(duplicates, data, newClients);
                    } else {
                        // No duplicates, merge directly
                        window.SmartAgenda.DataManager.importData(data, true);
                        location.reload();
                    }
                } else {
                    // No clients in backup, just merge
                    window.SmartAgenda.DataManager.importData(data, true);
                    location.reload();
                }
            }
        },

        showImportModeDialog: function(data) {
            return new Promise((resolve) => {
                const backupInfo = `
                    <div style="padding: 12px; background: var(--background); border-radius: 6px; margin-bottom: 16px;">
                        <strong>Backup Contains:</strong><br>
                        Clients: ${data.clients ? data.clients.length : 0}<br>
                        Appointments: ${data.appointments ? data.appointments.length : 0}<br>
                        Tasks: ${data.tasks ? data.tasks.length : 0}<br>
                        Export Date: ${data.exportDate ? new Date(data.exportDate).toLocaleDateString() : 'Unknown'}
                    </div>
                `;

                const content = `
                    <div>
                        <p style="margin-bottom: 16px;">
                            You have existing data in the app. How would you like to import this backup?
                        </p>
                        ${backupInfo}
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="padding: 12px; border: 2px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                                 id="import-mode-replace"
                                 onmouseover="this.style.borderColor='var(--danger-color)'; this.style.background='var(--danger-color)11';"
                                 onmouseout="this.style.borderColor='var(--border)'; this.style.background='transparent';">
                                <div style="font-weight: 600; margin-bottom: 4px;">🗑️ Clear and Replace</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">
                                    Delete all current data and import the backup
                                </div>
                            </div>
                            <div style="padding: 12px; border: 2px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                                 id="import-mode-merge"
                                 onmouseover="this.style.borderColor='var(--success-color)'; this.style.background='var(--success-color)11';"
                                 onmouseout="this.style.borderColor='var(--border)'; this.style.background='transparent';">
                                <div style="font-weight: 600; margin-bottom: 4px;">🔄 Merge with Existing</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">
                                    Keep current data and add new items from backup (handles duplicates)
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const modal = window.SmartAgenda.UIComponents.showModal({
                    title: 'Import Backup',
                    content: content,
                    buttons: [
                        {
                            label: 'Cancel',
                            type: 'secondary',
                            onClick: () => {
                                window.SmartAgenda.UIComponents.closeModal(modal);
                                resolve(null);
                            }
                        }
                    ]
                });

                // Add click handlers for the mode selection cards
                setTimeout(() => {
                    document.getElementById('import-mode-replace')?.addEventListener('click', () => {
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        resolve('replace');
                    });

                    document.getElementById('import-mode-merge')?.addEventListener('click', () => {
                        window.SmartAgenda.UIComponents.closeModal(modal);
                        resolve('merge');
                    });
                }, 100);
            });
        },

        handleBackupDuplicates: async function(duplicates, backupData, newClients) {
            for (const dup of duplicates) {
                const choice = await this.showBackupDuplicateDialog(dup);

                if (choice === 'keep-existing') {
                    // Do nothing, keep existing
                    continue;
                } else if (choice === 'keep-imported') {
                    // Replace existing with imported
                    window.SmartAgenda.DataManager.update('clients', dup.existing.id, {
                        ...dup.imported,
                        id: dup.existing.id // Keep same ID
                    });
                } else if (choice === 'merge') {
                    // Merge: keep existing data, add missing fields from imported
                    const merged = { ...dup.existing };
                    if (!merged.phone && dup.imported.phone) merged.phone = dup.imported.phone;
                    if (!merged.phone2 && dup.imported.phone2) merged.phone2 = dup.imported.phone2;
                    if (!merged.email && dup.imported.email) merged.email = dup.imported.email;
                    if (!merged.email2 && dup.imported.email2) merged.email2 = dup.imported.email2;
                    if (!merged.address && dup.imported.address) merged.address = dup.imported.address;
                    if (!merged.city && dup.imported.city) merged.city = dup.imported.city;
                    if (!merged.website && dup.imported.website) merged.website = dup.imported.website;
                    if (!merged.facebook && dup.imported.facebook) merged.facebook = dup.imported.facebook;
                    if (!merged.instagram && dup.imported.instagram) merged.instagram = dup.imported.instagram;
                    if (!merged.linkedin && dup.imported.linkedin) merged.linkedin = dup.imported.linkedin;
                    if (!merged.notes && dup.imported.notes) merged.notes = dup.imported.notes;

                    window.SmartAgenda.DataManager.update('clients', dup.existing.id, merged);
                }
            }

            // Add new clients (non-duplicates)
            newClients.forEach(client => {
                window.SmartAgenda.DataManager.add('clients', client);
            });

            // Import other data (appointments, tasks) with merge
            const otherData = { ...backupData };
            delete otherData.clients; // We handled clients separately
            window.SmartAgenda.DataManager.importData(otherData, true);

            window.SmartAgenda.Toast.success('Backup merged successfully');
            location.reload();
        },

        showBackupDuplicateDialog: function(duplicate) {
            return new Promise((resolve) => {
                const existingInfo = `
                    <strong>Existing Contact:</strong><br>
                    Name: ${this.escapeHtml(duplicate.existing.name)}<br>
                    Phone: ${this.escapeHtml(duplicate.existing.phone || 'N/A')}<br>
                    Email: ${this.escapeHtml(duplicate.existing.email || 'N/A')}<br>
                    Created: ${duplicate.existing.date ? new Date(duplicate.existing.date).toLocaleDateString() : 'Unknown'}<br>
                    Source: <em>Current Memory</em>
                `;

                const importedInfo = `
                    <strong>Backup Contact:</strong><br>
                    Name: ${this.escapeHtml(duplicate.imported.name)}<br>
                    Phone: ${this.escapeHtml(duplicate.imported.phone || 'N/A')}<br>
                    Email: ${this.escapeHtml(duplicate.imported.email || 'N/A')}<br>
                    Created: ${duplicate.imported.date ? new Date(duplicate.imported.date).toLocaleDateString() : 'Unknown'}<br>
                    Source: <em>Backup File</em>
                `;

                const content = `
                    <div style="margin-bottom: 16px;">
                        <p style="margin-bottom: 12px; font-weight: 600; color: var(--warning-color);">
                            ⚠️ Duplicate contact detected!
                        </p>
                        <div style="padding: 12px; background: var(--background); border-radius: 6px; margin-bottom: 12px;">
                            ${existingInfo}
                        </div>
                        <div style="padding: 12px; background: var(--background); border-radius: 6px;">
                            ${importedInfo}
                        </div>
                        <p style="margin-top: 12px; font-size: 14px; color: var(--text-secondary);">
                            Which version would you like to keep?
                        </p>
                    </div>
                `;

                const modal = window.SmartAgenda.UIComponents.showModal({
                    title: 'Duplicate Contact Found',
                    content: content,
                    buttons: [
                        {
                            label: 'Keep Current',
                            type: 'secondary',
                            onClick: () => {
                                window.SmartAgenda.UIComponents.closeModal(modal);
                                resolve('keep-existing');
                            }
                        },
                        {
                            label: 'Use Backup',
                            type: 'primary',
                            onClick: () => {
                                window.SmartAgenda.UIComponents.closeModal(modal);
                                resolve('keep-imported');
                            }
                        },
                        {
                            label: 'Merge Both',
                            type: 'success',
                            onClick: () => {
                                window.SmartAgenda.UIComponents.closeModal(modal);
                                resolve('merge');
                            }
                        }
                    ]
                });
            });
        },

        /**
         * Show backup selection modal for restore
         * @param {Array} backups - Available backups
         * @returns {Promise<Object|null>} Selected backup or null
         */
        showBackupSelectionModal: function(backups) {
            return new Promise((resolve) => {
                const i18n = window.SmartAgenda.I18n;

                const formatFileSize = (bytes) => {
                    if (!bytes || bytes === 0) return 'N/A';
                    const mb = bytes / (1024 * 1024);
                    return mb.toFixed(2) + ' MB';
                };

                const formatDate = (dateString) => {
                    if (!dateString) return 'N/A';
                    const date = new Date(dateString);
                    return date.toLocaleString('el-GR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                };

                const backupsList = backups.map(backup => `
                    <div class="backup-item" data-backup-id="${backup.id}"
                         style="padding: 16px; border: 2px solid var(--border); border-radius: 8px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;"
                         onmouseover="this.style.borderColor='var(--primary-color)'; this.style.background='var(--primary-color)11';"
                         onmouseout="this.style.borderColor='var(--border)'; this.style.background='transparent';">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div>
                                <div style="font-weight: 600; margin-bottom: 4px;">${this.escapeHtml(backup.name)}</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">
                                    📅 ${formatDate(backup.created)}
                                </div>
                            </div>
                            <div style="text-align: right; font-size: 13px; color: var(--text-secondary);">
                                <div>${formatFileSize(backup.size)}</div>
                                <div>${backup.deviceType || 'unknown'}</div>
                            </div>
                        </div>
                        ${backup.itemCounts ? `
                            <div style="display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary);">
                                <span>${backup.itemCounts.clients || 0} ${i18n.translate('gdrive.clients')}</span>
                                <span>${backup.itemCounts.appointments || 0} ${i18n.translate('gdrive.appointments')}</span>
                                <span>${backup.itemCounts.tasks || 0} ${i18n.translate('gdrive.tasks')}</span>
                                ${backup.hasAttachments ? `<span>${i18n.translate('gdrive.withFiles')}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `).join('');

                const content = `
                    <div style="padding: 16px;">
                        <p style="margin-bottom: 16px; color: var(--text-secondary);">
                            ${i18n.translate('gdrive.selectBackup')}
                        </p>
                        <div style="max-height: 400px; overflow-y: auto;">
                            ${backupsList}
                        </div>
                        <div style="background: var(--warning-bg); border-left: 4px solid var(--warning-color); padding: 12px; border-radius: 6px; margin-top: 16px;">
                            <div style="font-size: 13px; color: var(--text-secondary);">
                                ⚠️ <strong>${i18n.translate('gdrive.warning')}</strong> ${i18n.translate('gdrive.warningMessage')}
                            </div>
                        </div>
                    </div>
                `;

                const modal = window.SmartAgenda.UIComponents.showModal({
                    title: '☁️ ' + i18n.translate('gdrive.selectBackupTitle'),
                    content: content,
                    buttons: [
                        {
                            label: i18n.translate('actions.cancel'),
                            type: 'secondary',
                            onClick: () => {
                                window.SmartAgenda.UIComponents.closeModal(modal);
                                resolve(null);
                            }
                        }
                    ],
                    size: 'medium'
                });

                // Add click listeners to backup items
                setTimeout(() => {
                    document.querySelectorAll('.backup-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const backupId = item.dataset.backupId;
                            const selected = backups.find(b => b.id === backupId);
                            window.SmartAgenda.UIComponents.closeModal(modal);
                            resolve(selected);
                        });
                    });
                }, 100);
            });
        },

        /**
         * Update Google Drive UI based on connection state
         */
        updateGoogleDriveUI: function() {
            const notConnected = document.getElementById('gdrive-not-connected');
            const connected = document.getElementById('gdrive-connected');
            const accountEmail = document.getElementById('gdrive-account-email');
            const lastBackup = document.getElementById('gdrive-last-backup');
            const backupSize = document.getElementById('gdrive-backup-size');
            const autoBackupSelect = document.getElementById('gdrive-auto-backup');
            const backupDocsCheckbox = document.getElementById('gdrive-backup-documents');
            const backupPhotosCheckbox = document.getElementById('gdrive-backup-photos');

            // Check if user is signed in
            const isSignedIn = window.SmartAgenda.GoogleDriveService.currentUser !== null;

            if (isSignedIn) {
                // Show connected state
                if (notConnected) notConnected.style.display = 'none';
                if (connected) connected.style.display = 'block';

                // Update account email
                const user = window.SmartAgenda.GoogleDriveService.currentUser;
                if (accountEmail && user) {
                    accountEmail.textContent = user.email || 'user@gmail.com';
                }

                // Update hamburger menu
                const userName = document.getElementById('user-name');
                const userEmail = document.getElementById('user-email');
                if (userName && user) userName.textContent = user.name || user.email;
                if (userEmail && user) userEmail.textContent = user.email;

                // Load backup metadata
                const metadata = localStorage.getItem('gdrive_last_backup_metadata');
                if (metadata) {
                    try {
                        const data = JSON.parse(metadata);
                        if (lastBackup && data.timestamp) {
                            const date = new Date(data.timestamp);
                            const now = new Date();
                            const diff = now - date;
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const days = Math.floor(hours / 24);

                            let timeAgo = '';
                            if (days > 0) {
                                timeAgo = days === 1 ? 'Yesterday' : `${days} days ago`;
                            } else if (hours > 0) {
                                timeAgo = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
                            } else {
                                timeAgo = 'Just now';
                            }

                            lastBackup.textContent = `Last backup: ${timeAgo}`;
                        }
                        if (backupSize && data.size) {
                            const mb = (data.size / (1024 * 1024)).toFixed(2);
                            backupSize.textContent = `Size: ${mb} MB`;
                        }
                    } catch (e) {
                        console.error('Failed to parse backup metadata:', e);
                    }
                }

                // Load auto backup frequency
                const frequency = localStorage.getItem('gdrive_auto_backup_frequency') || 'daily';
                if (autoBackupSelect) {
                    autoBackupSelect.value = frequency;
                }

                // Load backup options
                const includeDocuments = localStorage.getItem('gdrive_backup_documents') !== 'false';
                const includePhotos = localStorage.getItem('gdrive_backup_photos') !== 'false';
                if (backupDocsCheckbox) backupDocsCheckbox.checked = includeDocuments;
                if (backupPhotosCheckbox) backupPhotosCheckbox.checked = includePhotos;

                // Update backup status indicator in menu
                const backupStatusIndicator = document.getElementById('backup-status-indicator');
                const backupStatusText = document.getElementById('backup-status-text');
                if (backupStatusIndicator) backupStatusIndicator.style.display = 'block';
                if (backupStatusText && metadata) {
                    try {
                        const data = JSON.parse(metadata);
                        if (data.timestamp) {
                            const date = new Date(data.timestamp);
                            const timeStr = date.toLocaleString('el-GR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            backupStatusText.textContent = `Last backup: ${timeStr}`;
                        }
                    } catch (e) {}
                }

            } else {
                // Show not connected state
                if (notConnected) notConnected.style.display = 'block';
                if (connected) connected.style.display = 'none';

                // Reset hamburger menu to guest
                const userName = document.getElementById('user-name');
                const userEmail = document.getElementById('user-email');
                if (userName) userName.textContent = 'Guest User';
                if (userEmail) userEmail.textContent = 'Not signed in';

                // Hide backup status indicator
                const backupStatusIndicator = document.getElementById('backup-status-indicator');
                if (backupStatusIndicator) backupStatusIndicator.style.display = 'none';
            }

            // Save checkbox state changes
            if (backupDocsCheckbox) {
                backupDocsCheckbox.addEventListener('change', (e) => {
                    localStorage.setItem('gdrive_backup_documents', e.target.checked);
                });
            }
            if (backupPhotosCheckbox) {
                backupPhotosCheckbox.addEventListener('change', (e) => {
                    localStorage.setItem('gdrive_backup_photos', e.target.checked);
                });
            }
        },

        /**
         * Update Fancy Graphics status display
         */
        updateFancyGraphicsStatus: function() {
            const toggle = document.getElementById('fancy-graphics-toggle');

            if (!window.SmartAgenda || !window.SmartAgenda.Performance) {
                return;
            }

            const perf = window.SmartAgenda.Performance;
            const fancyEnabled = perf.isFancyGraphicsEnabled();

            // Set toggle state
            if (toggle) {
                toggle.checked = fancyEnabled;
            }

            console.log('Fancy Graphics status updated:', { fancyEnabled});
        },

        /**
         * Show settings category view
         */
        showCategoryModal: function(category) {
            const i18n = window.SmartAgenda.I18n;

            // Category icons, titles and subtitles
            const categories = {
                'appearance': {
                    title: i18n.translate('settings.appearance'),
                    subtitle: i18n.translate('category.appearance_subtitle'),
                    contentId: 'appearance-settings-content',
                    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>`
                },
                'notifications': {
                    title: i18n.translate('notifications.title'),
                    subtitle: i18n.translate('notifications.description'),
                    contentId: 'notifications-settings-content',
                    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>`
                },
                'client-types': {
                    title: i18n.translate('settings.client_types'),
                    subtitle: i18n.translate('settings.client_types_desc'),
                    contentId: 'client-types-settings-content',
                    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>`
                },
                'data': {
                    title: i18n.translate('settings.data'),
                    subtitle: i18n.translate('category.data_subtitle'),
                    contentId: 'data-settings-content',
                    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                    </svg>`
                },
                'help': {
                    title: i18n.translate('help.title'),
                    subtitle: i18n.translate('help.description'),
                    contentId: 'help-settings-content',
                    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>`
                },
                'about': {
                    title: i18n.translate('settings.about'),
                    subtitle: i18n.translate('category.about_subtitle'),
                    contentId: 'about-settings-content',
                    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>`
                }
            };

            const categoryInfo = categories[category];
            if (!categoryInfo) return;

            // Hide main menu
            document.getElementById('settings-main-menu').style.display = 'none';

            // Show header with back button
            const header = document.getElementById('settings-header');
            header.style.display = 'flex';

            // Update header icon, title and subtitle
            document.getElementById('settings-header-icon').innerHTML = categoryInfo.icon;
            document.getElementById('settings-header-title').textContent = categoryInfo.title;
            document.getElementById('settings-header-subtitle').textContent = categoryInfo.subtitle || '';

            // Show/hide header action button based on category
            const headerActionBtn = document.getElementById('add-client-type-header-btn');
            if (headerActionBtn) {
                headerActionBtn.style.display = (category === 'client-types') ? 'flex' : 'none';
            }

            // Hide all views
            document.querySelectorAll('.settings-view').forEach(view => {
                view.style.display = 'none';
            });

            // Show selected view
            const contentElement = document.getElementById(categoryInfo.contentId);
            if (contentElement) {
                contentElement.style.display = 'block';
            }

            // Store current category for back button
            this.currentCategory = category;

            // Re-initialize components for the visible view
            setTimeout(() => {
                if (category === 'client-types') {
                    this.renderClientTypes();
                }
                if (category === 'data') {
                    this.updateGoogleDriveUI();
                }
            }, 50);
        },

        /**
         * Go back to main settings menu
         */
        goBackToMainMenu: function() {
            // Hide header
            document.getElementById('settings-header').style.display = 'none';

            // Hide header action button
            const headerActionBtn = document.getElementById('add-client-type-header-btn');
            if (headerActionBtn) {
                headerActionBtn.style.display = 'none';
            }

            // Hide all views
            document.querySelectorAll('.settings-view').forEach(view => {
                view.style.display = 'none';
            });

            // Show main menu
            document.getElementById('settings-main-menu').style.display = 'flex';

            this.currentCategory = null;
        },

        /**
         * Update header translations when language changes
         */
        updateHeaderTranslations: function(category) {
            const i18n = window.SmartAgenda.I18n;

            // Category icons, titles and subtitles (same as in showCategoryModal)
            const categories = {
                'appearance': {
                    title: i18n.translate('settings.appearance'),
                    subtitle: i18n.translate('category.appearance_subtitle')
                },
                'notifications': {
                    title: i18n.translate('notifications.title'),
                    subtitle: i18n.translate('notifications.description')
                },
                'client-types': {
                    title: i18n.translate('settings.client_types'),
                    subtitle: i18n.translate('settings.client_types_desc')
                },
                'data': {
                    title: i18n.translate('settings.data'),
                    subtitle: i18n.translate('category.data_subtitle')
                },
                'help': {
                    title: i18n.translate('help.title'),
                    subtitle: i18n.translate('help.description')
                },
                'about': {
                    title: i18n.translate('settings.about'),
                    subtitle: i18n.translate('category.about_subtitle')
                }
            };

            const categoryInfo = categories[category];
            if (categoryInfo) {
                // Update header title and subtitle
                const titleElement = document.getElementById('settings-header-title');
                const subtitleElement = document.getElementById('settings-header-subtitle');

                if (titleElement) {
                    titleElement.textContent = categoryInfo.title;
                }
                if (subtitleElement) {
                    subtitleElement.textContent = categoryInfo.subtitle || '';
                }
            }
        }
    };

    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            Settings.init();
            Settings.updateGoogleDriveUI();
        });

        // Listen to tab changes to reset settings view
        window.SmartAgenda.EventBus.on('tab:change', (tab) => {
            if (tab === 'settings') {
                // Reset to main menu when opening settings tab
                Settings.goBackToMainMenu();
            }
        });

        window.SmartAgenda.Settings = Settings;
    }
})();
