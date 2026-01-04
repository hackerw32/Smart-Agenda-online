/**
 * Smart Agenda - Advanced Operations Module
 *
 * Provides:
 * - Bulk operations for clients and appointments
 * - Data management tools
 * - Storage statistics
 */

(function() {
    'use strict';

    const Advanced = {
        // Selected items for bulk operations
        selectedClients: new Set(),
        selectedAppointments: new Set(),

        // ============================================
        // Initialization
        // ============================================

        init: function() {
            this.bindEvents();
            this.render();
        },

        bindEvents: function() {
            // Clients bulk operations
            document.getElementById('bulk-export-clients-btn')?.addEventListener('click', () => this.bulkExportClients());
            document.getElementById('bulk-export-vcf-btn')?.addEventListener('click', () => this.bulkExportVCF());
            document.getElementById('bulk-import-vcf-btn')?.addEventListener('click', () => this.bulkImportVCF());
            document.getElementById('bulk-import-xls-btn')?.addEventListener('click', () => this.bulkImportXLS());
            document.getElementById('bulk-delete-clients-btn')?.addEventListener('click', () => this.bulkDeleteClients());
            document.getElementById('bulk-update-type-btn')?.addEventListener('click', () => this.bulkUpdateClientType());

            // Appointments bulk operations
            document.getElementById('bulk-export-appointments-btn')?.addEventListener('click', () => this.bulkExportAppointments());
            document.getElementById('bulk-update-status-btn')?.addEventListener('click', () => this.bulkUpdateAppointmentStatus());
            document.getElementById('bulk-delete-appointments-btn')?.addEventListener('click', () => this.bulkDeleteAppointments());

            // Ads toggle for debugging
            const adsToggle = document.getElementById('ads-toggle');
            if (adsToggle) {
                // Load saved state
                const adsEnabled = localStorage.getItem('ads-enabled') !== 'false'; // Default to true
                adsToggle.checked = adsEnabled;

                // Handle toggle change
                adsToggle.addEventListener('change', (e) => {
                    const enabled = e.target.checked;
                    localStorage.setItem('ads-enabled', enabled ? 'true' : 'false');

                    // Update AdMob service
                    if (window.SmartAgenda?.AdMobService) {
                        if (enabled) {
                            window.SmartAgenda.AdMobService.init();
                            window.SmartAgenda.Toast.success('Ads enabled. Please restart the app for full effect.');
                        } else {
                            window.SmartAgenda.AdMobService.hideBanner();
                            window.SmartAgenda.Toast.info('Ads disabled. Please restart the app for full effect.');
                        }
                    }
                });
            }

            // Listen to data changes
            if (window.SmartAgenda) {
                window.SmartAgenda.EventBus.on('data:change', () => this.render());
                window.SmartAgenda.EventBus.on('tab:change', (tab) => {
                    if (tab === 'advanced') {
                        this.render();
                    }
                });
            }
        },

        // ============================================
        // Rendering
        // ============================================

        render: function() {
            this.renderClientsList();
            this.renderAppointmentsList();
            this.renderDatabaseStats();
            this.renderStorageUsage();
        },

        renderClientsList: function() {
            const container = document.getElementById('clients-bulk-list');
            if (!container) return;

            // Save scroll position before re-render
            const scrollContainer = container.querySelector('div[style*="overflow-y"]');
            const scrollTop = scrollContainer?.scrollTop || 0;

            const clients = window.SmartAgenda.DataManager.getAll('clients');

            if (clients.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); padding: 16px; text-align: center;">No clients found</p>';
                return;
            }

            const allSelected = this.selectedClients.size === clients.length && clients.length > 0;

            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; background: var(--background); border-radius: 6px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="select-all-clients" ${allSelected ? 'checked' : ''} style="cursor: pointer;">
                        <label for="select-all-clients" style="cursor: pointer; font-weight: 500;">Select All (${clients.length})</label>
                    </div>
                    <button id="select-inverse-clients" style="padding: 4px 12px; font-size: 13px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; color: var(--text-primary);">Select Inverse</button>
                    <span style="margin-left: auto; color: var(--text-secondary); font-size: 13px;">${this.selectedClients.size} selected</span>
                </div>
                <div id="clients-scroll-container" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px;">
                    ${clients.map(client => this.renderClientCheckboxItem(client)).join('')}
                </div>
            `;

            // Restore scroll position after re-render
            const newScrollContainer = document.getElementById('clients-scroll-container');
            if (newScrollContainer && scrollTop > 0) {
                newScrollContainer.scrollTop = scrollTop;
            }

            // Bind select all (toggle)
            document.getElementById('select-all-clients')?.addEventListener('change', (e) => {
                if (e.target.checked) {
                    clients.forEach(c => this.selectedClients.add(c.id));
                } else {
                    this.selectedClients.clear();
                }
                this.renderClientsList();
            });

            // Bind select inverse
            document.getElementById('select-inverse-clients')?.addEventListener('click', () => {
                clients.forEach(client => {
                    if (this.selectedClients.has(client.id)) {
                        this.selectedClients.delete(client.id);
                    } else {
                        this.selectedClients.add(client.id);
                    }
                });
                this.renderClientsList();
            });

            // Bind individual checkboxes
            clients.forEach(client => {
                document.getElementById(`client-checkbox-${client.id}`)?.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectedClients.add(client.id);
                    } else {
                        this.selectedClients.delete(client.id);
                    }
                    this.renderClientsList();
                });
            });
        },

        renderClientCheckboxItem: function(client) {
            const isChecked = this.selectedClients.has(client.id);
            return `
                <div style="padding: 12px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; background: ${isChecked ? 'var(--primary-color)11' : 'var(--surface)'};">
                    <input type="checkbox" id="client-checkbox-${client.id}" ${isChecked ? 'checked' : ''} style="cursor: pointer;">
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${this.escapeHtml(client.name)}</div>
                        ${client.phone ? `<div style="font-size: 13px; color: var(--text-secondary);">${this.escapeHtml(client.phone)}</div>` : ''}
                    </div>
                </div>
            `;
        },

        renderAppointmentsList: function() {
            const container = document.getElementById('appointments-bulk-list');
            if (!container) return;

            // Save scroll position before re-render
            const scrollContainer = container.querySelector('div[style*="overflow-y"]');
            const scrollTop = scrollContainer?.scrollTop || 0;

            const appointments = window.SmartAgenda.DataManager.getAll('appointments');

            if (appointments.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); padding: 16px; text-align: center;">No appointments found</p>';
                return;
            }

            const allSelected = this.selectedAppointments.size === appointments.length && appointments.length > 0;

            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; background: var(--background); border-radius: 6px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="select-all-appointments" ${allSelected ? 'checked' : ''} style="cursor: pointer;">
                        <label for="select-all-appointments" style="cursor: pointer; font-weight: 500;">Select All (${appointments.length})</label>
                    </div>
                    <button id="select-inverse-appointments" style="padding: 4px 12px; font-size: 13px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; color: var(--text-primary);">Select Inverse</button>
                    <span style="margin-left: auto; color: var(--text-secondary); font-size: 13px;">${this.selectedAppointments.size} selected</span>
                </div>
                <div id="appointments-scroll-container" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px;">
                    ${appointments.map(apt => this.renderAppointmentCheckboxItem(apt)).join('')}
                </div>
            `;

            // Restore scroll position after re-render
            const newScrollContainer = document.getElementById('appointments-scroll-container');
            if (newScrollContainer && scrollTop > 0) {
                newScrollContainer.scrollTop = scrollTop;
            }

            // Bind select all (toggle)
            document.getElementById('select-all-appointments')?.addEventListener('change', (e) => {
                if (e.target.checked) {
                    appointments.forEach(apt => this.selectedAppointments.add(apt.id));
                } else {
                    this.selectedAppointments.clear();
                }
                this.renderAppointmentsList();
            });

            // Bind select inverse
            document.getElementById('select-inverse-appointments')?.addEventListener('click', () => {
                appointments.forEach(apt => {
                    if (this.selectedAppointments.has(apt.id)) {
                        this.selectedAppointments.delete(apt.id);
                    } else {
                        this.selectedAppointments.add(apt.id);
                    }
                });
                this.renderAppointmentsList();
            });

            // Bind individual checkboxes
            appointments.forEach(apt => {
                document.getElementById(`appointment-checkbox-${apt.id}`)?.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectedAppointments.add(apt.id);
                    } else {
                        this.selectedAppointments.delete(apt.id);
                    }
                    this.renderAppointmentsList();
                });
            });
        },

        renderAppointmentCheckboxItem: function(apt) {
            const isChecked = this.selectedAppointments.has(apt.id);
            const clientName = apt.clientName || 'Standalone Appointment';
            const status = apt.status || 'pending';
            return `
                <div style="padding: 12px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; background: ${isChecked ? 'var(--primary-color)11' : 'var(--surface)'};">
                    <input type="checkbox" id="appointment-checkbox-${apt.id}" ${isChecked ? 'checked' : ''} style="cursor: pointer;">
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${this.escapeHtml(clientName)}</div>
                        <div style="font-size: 13px; color: var(--text-secondary); display: flex; gap: 8px;">
                            ${apt.date ? `<span>${apt.date}</span>` : ''}
                            <span style="text-transform: uppercase; font-weight: 600;">${status}</span>
                        </div>
                    </div>
                </div>
            `;
        },

        renderDatabaseStats: function() {
            const container = document.getElementById('database-stats');
            if (!container) return;

            const clients = window.SmartAgenda.DataManager.getAll('clients');
            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const tasks = window.SmartAgenda.DataManager.getAll('tasks');

            container.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Clients:</span>
                        <strong>${clients.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Appointments:</span>
                        <strong>${appointments.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Tasks:</span>
                        <strong>${tasks.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border);">
                        <span>Total Records:</span>
                        <strong>${clients.length + appointments.length + tasks.length}</strong>
                    </div>
                </div>
            `;
        },

        renderStorageUsage: function() {
            const container = document.getElementById('storage-usage');
            if (!container) return;

            // Calculate approximate storage size
            const data = {
                clients: window.SmartAgenda.DataManager.getAll('clients'),
                appointments: window.SmartAgenda.DataManager.getAll('appointments'),
                tasks: window.SmartAgenda.DataManager.getAll('tasks')
            };

            const dataString = JSON.stringify(data);
            const sizeInBytes = new Blob([dataString]).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

            const displaySize = sizeInBytes > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`;

            container.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Data Size:</span>
                        <strong>${displaySize}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Format:</span>
                        <strong>JSON</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Storage:</span>
                        <strong>localStorage</strong>
                    </div>
                </div>
            `;
        },

        // ============================================
        // Helper Functions
        // ============================================

        /**
         * Save JSON data to file using Capacitor Filesystem or browser download
         */
        saveJsonToFile: async function(data, fileName) {
            const json = JSON.stringify(data, null, 2);

            // Check if running in Capacitor (mobile app)
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                const { Filesystem } = window.Capacitor.Plugins;

                try {
                    // Request permissions first
                    const permissions = await Filesystem.requestPermissions();

                    if (permissions.publicStorage !== 'granted') {
                        // Show dialog asking user to grant permission
                        const shouldOpenSettings = confirm(
                            'Storage permission is required to save files to Downloads folder.\n\n' +
                            'Please grant "All files access" permission in the next screen.\n\n' +
                            'Go to Settings > Apps > Smart Agenda > Permissions > Files and media > Allow management of all files'
                        );

                        if (shouldOpenSettings) {
                            // Try to open app settings
                            if (window.Capacitor.Plugins.App) {
                                try {
                                    await window.Capacitor.Plugins.App.openSettings();
                                } catch (e) {
                                    console.error('Could not open settings:', e);
                                }
                            }
                        }

                        window.SmartAgenda.Toast.error('Storage permission required. Please enable it in Settings.');
                        return false;
                    }

                    // Save directly to Download/Smart Agenda folder
                    const downloadPath = `Download/Smart Agenda/${fileName}`;

                    const result = await Filesystem.writeFile({
                        path: downloadPath,
                        data: json,
                        directory: 'EXTERNAL_STORAGE',
                        encoding: 'utf8',
                        recursive: true
                    });

                    window.SmartAgenda.Toast.success(`Saved to Download/Smart Agenda/${fileName}`);
                    return true;

                } catch (error) {
                    console.error('Error saving file:', error);
                    window.SmartAgenda.Toast.error('Failed to save file: ' + error.message);
                    return false;
                }

            } else {
                // Web browser fallback
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(url);
                return true;
            }
        },

        /**
         * Save data as Excel file using SheetJS library
         */
        saveExcelToFile: async function(data, fileName, sheetName = 'Sheet1') {
            try {
                // Create a new workbook
                const wb = XLSX.utils.book_new();

                // Convert data to worksheet
                const ws = XLSX.utils.json_to_sheet(data);

                // Auto-size columns
                const colWidths = [];
                if (data.length > 0) {
                    Object.keys(data[0]).forEach((key, i) => {
                        const maxLen = Math.max(
                            key.length,
                            ...data.map(row => (row[key] ? String(row[key]).length : 0))
                        );
                        colWidths.push({ wch: Math.min(maxLen + 2, 50) });
                    });
                    ws['!cols'] = colWidths;
                }

                // Add worksheet to workbook
                XLSX.utils.book_append_sheet(wb, ws, sheetName);

                // Generate Excel file as binary string
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

                // Check if running in Capacitor (mobile app)
                if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                    const { Filesystem } = window.Capacitor.Plugins;

                    try {
                        // Request permissions first
                        const permissions = await Filesystem.requestPermissions();

                        if (permissions.publicStorage !== 'granted') {
                            // Show dialog asking user to grant permission
                            const shouldOpenSettings = confirm(
                                'Storage permission is required to save files to Downloads folder.\n\n' +
                                'Please grant "All files access" permission in the next screen.\n\n' +
                                'Go to Settings > Apps > Smart Agenda > Permissions > Files and media > Allow management of all files'
                            );

                            if (shouldOpenSettings) {
                                // Try to open app settings
                                if (window.Capacitor.Plugins.App) {
                                    try {
                                        await window.Capacitor.Plugins.App.openSettings();
                                    } catch (e) {
                                        console.error('Could not open settings:', e);
                                    }
                                }
                            }

                            window.SmartAgenda.Toast.error('Storage permission required. Please enable it in Settings.');
                            return false;
                        }

                        // Save directly to Download/Smart Agenda folder
                        const downloadPath = `Download/Smart Agenda/${fileName}`;

                        const result = await Filesystem.writeFile({
                            path: downloadPath,
                            data: wbout,
                            directory: 'EXTERNAL_STORAGE',
                            recursive: true
                        });

                        window.SmartAgenda.Toast.success(`Saved to Download/Smart Agenda/${fileName}`);
                        return true;

                    } catch (error) {
                        console.error('Error saving Excel file:', error);
                        window.SmartAgenda.Toast.error('Failed to save file: ' + error.message);
                        return false;
                    }

                } else {
                    // Web browser fallback - use binary output
                    const wboutBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    const blob = new Blob([wboutBinary], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    link.click();
                    URL.revokeObjectURL(url);
                    return true;
                }
            } catch (error) {
                console.error('Error creating Excel file:', error);
                window.SmartAgenda.Toast.error('Failed to create Excel file: ' + error.message);
                return false;
            }
        },

        // ============================================
        // Bulk Operations - Clients
        // ============================================

        bulkExportClients: async function() {
            if (this.selectedClients.size === 0) {
                window.SmartAgenda.Toast.warning('Please select clients to export');
                return;
            }

            const clients = window.SmartAgenda.DataManager.getAll('clients')
                .filter(c => this.selectedClients.has(c.id));

            // Prepare Excel data with proper columns
            const excelData = clients.map(client => {
                const availableTypes = window.SmartAgenda.Settings?.getClientTypes() || [];

                // Get all client types as comma-separated string
                let clientTypesString = '';
                if (client.clientTypes && Array.isArray(client.clientTypes) && client.clientTypes.length > 0) {
                    const typeNames = client.clientTypes.map(typeId => {
                        const type = availableTypes.find(t => t.id === typeId);
                        return type ? type.name : '';
                    }).filter(name => name !== '');
                    clientTypesString = typeNames.join(', ');
                } else if (client.customerType) {
                    // Legacy support
                    const type = availableTypes.find(t => t.id === client.customerType);
                    clientTypesString = type ? type.name : '';
                }

                return {
                    'Name': client.name || '',
                    'Phone': client.phone || '',
                    'Phone Type': client.phoneType || '',
                    'Phone 2': client.phone2 || '',
                    'Phone 2 Type': client.phone2Type || '',
                    'Email': client.email || '',
                    'Email Type': client.emailType || '',
                    'Email 2': client.email2 || '',
                    'Email 2 Type': client.email2Type || '',
                    'Address': client.address || '',
                    'City': client.city || '',
                    'Client Types': clientTypesString,
                    'Facebook': client.facebook || '',
                    'Instagram': client.instagram || '',
                    'LinkedIn': client.linkedin || '',
                    'Website': client.website || '',
                    'Notes': client.notes || '',
                    'Created Date': client.createdAt || '',
                    'Latitude': client.latitude || '',
                    'Longitude': client.longitude || ''
                };
            });

            const fileName = `clients-export-${new Date().toISOString().split('T')[0]}.xlsx`;
            const success = await this.saveExcelToFile(excelData, fileName, 'Clients');

            if (success) {
                window.SmartAgenda.Toast.success(`Exported ${clients.length} clients to Excel`);
            }
        },

        bulkExportVCF: async function() {
            if (this.selectedClients.size === 0) {
                window.SmartAgenda.Toast.warning('Please select clients to export');
                return;
            }

            const clients = window.SmartAgenda.DataManager.getAll('clients')
                .filter(c => this.selectedClients.has(c.id));

            // Generate VCF content for all selected clients
            let vcfContent = '';
            clients.forEach(client => {
                vcfContent += this.generateVCard(client);
            });

            const fileName = `contacts-export-${new Date().toISOString().split('T')[0]}.vcf`;
            const success = await this.saveVCFToFile(vcfContent, fileName);

            if (success) {
                window.SmartAgenda.Toast.success(`Exported ${clients.length} contacts to VCF`);
            }
        },

        generateVCard: function(client) {
            // Generate vCard 3.0 format
            let vcard = 'BEGIN:VCARD\n';
            vcard += 'VERSION:3.0\n';

            // Name (required)
            vcard += `FN:${this.escapeVCard(client.name || 'Unknown')}\n`;
            vcard += `N:${this.escapeVCard(client.name || 'Unknown')};;;;\n`;

            // Phone numbers
            if (client.phone) {
                const phoneType = client.phoneType ? client.phoneType.toUpperCase() : 'CELL';
                vcard += `TEL;TYPE=${phoneType}:${this.escapeVCard(client.phone)}\n`;
            }
            if (client.phone2) {
                const phone2Type = client.phone2Type ? client.phone2Type.toUpperCase() : 'VOICE';
                vcard += `TEL;TYPE=${phone2Type}:${this.escapeVCard(client.phone2)}\n`;
            }

            // Email addresses
            if (client.email) {
                const emailType = client.emailType ? client.emailType.toUpperCase() : 'INTERNET';
                vcard += `EMAIL;TYPE=${emailType}:${this.escapeVCard(client.email)}\n`;
            }
            if (client.email2) {
                const email2Type = client.email2Type ? client.email2Type.toUpperCase() : 'INTERNET';
                vcard += `EMAIL;TYPE=${email2Type}:${this.escapeVCard(client.email2)}\n`;
            }

            // Address
            if (client.address || client.city) {
                const street = this.escapeVCard(client.address || '');
                const city = this.escapeVCard(client.city || '');
                vcard += `ADR;TYPE=WORK:;;${street};${city};;;;\n`;
            }

            // URLs
            if (client.website) {
                vcard += `URL:${this.escapeVCard(client.website)}\n`;
            }
            if (client.facebook) {
                vcard += `URL:${this.escapeVCard(client.facebook)}\n`;
            }
            if (client.instagram) {
                vcard += `URL:${this.escapeVCard(client.instagram)}\n`;
            }
            if (client.linkedin) {
                vcard += `URL:${this.escapeVCard(client.linkedin)}\n`;
            }

            // Notes
            if (client.notes) {
                vcard += `NOTE:${this.escapeVCard(client.notes)}\n`;
            }

            // Organization (use client type if available)
            const availableTypes = window.SmartAgenda.Settings?.getClientTypes() || [];
            if (client.clientTypes && Array.isArray(client.clientTypes) && client.clientTypes.length > 0) {
                const typeNames = client.clientTypes.map(typeId => {
                    const type = availableTypes.find(t => t.id === typeId);
                    return type ? type.name : '';
                }).filter(name => name !== '');
                if (typeNames.length > 0) {
                    vcard += `ORG:${this.escapeVCard(typeNames.join(', '))}\n`;
                }
            }

            vcard += 'END:VCARD\n';
            return vcard;
        },

        escapeVCard: function(text) {
            if (!text) return '';
            // Escape special characters for vCard format
            return text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
        },

        saveVCFToFile: async function(vcfContent, fileName) {
            // Check if running in Capacitor (mobile app)
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                const { Filesystem } = window.Capacitor.Plugins;

                try {
                    // Request permissions first
                    const permissions = await Filesystem.requestPermissions();

                    if (permissions.publicStorage !== 'granted') {
                        const shouldOpenSettings = confirm(
                            'Storage permission is required to save files to Downloads folder.\n\n' +
                            'Please grant "All files access" permission in the next screen.\n\n' +
                            'Go to Settings > Apps > Smart Agenda > Permissions > Files and media > Allow management of all files'
                        );

                        if (shouldOpenSettings) {
                            if (window.Capacitor.Plugins.App) {
                                try {
                                    await window.Capacitor.Plugins.App.openSettings();
                                } catch (e) {
                                    console.error('Could not open settings:', e);
                                }
                            }
                        }

                        window.SmartAgenda.Toast.error('Storage permission required. Please enable it in Settings.');
                        return false;
                    }

                    // Save directly to Download/Smart Agenda folder
                    const downloadPath = `Download/Smart Agenda/${fileName}`;

                    const result = await Filesystem.writeFile({
                        path: downloadPath,
                        data: vcfContent,
                        directory: 'EXTERNAL_STORAGE',
                        encoding: 'utf8',
                        recursive: true
                    });

                    window.SmartAgenda.Toast.success(`Saved to Download/Smart Agenda/${fileName}`);
                    return true;

                } catch (error) {
                    console.error('Error saving VCF file:', error);
                    window.SmartAgenda.Toast.error('Failed to save file: ' + error.message);
                    return false;
                }

            } else {
                // Web browser fallback
                const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(url);
                return true;
            }
        },

        bulkDeleteClients: function() {
            if (this.selectedClients.size === 0) {
                window.SmartAgenda.Toast.warning('Please select clients to delete');
                return;
            }

            const count = this.selectedClients.size;
            const confirmed = confirm(`Are you sure you want to delete ${count} client(s)? This action cannot be undone.`);

            if (!confirmed) return;

            this.selectedClients.forEach(clientId => {
                window.SmartAgenda.DataManager.delete('clients', clientId);
            });

            this.selectedClients.clear();
            window.SmartAgenda.Toast.success(`Deleted ${count} clients`);
            this.render();
        },

        bulkUpdateClientType: function() {
            if (this.selectedClients.size === 0) {
                window.SmartAgenda.Toast.warning('Please select clients to update');
                return;
            }

            const availableTypes = window.SmartAgenda.Settings?.getClientTypes() || [];
            if (availableTypes.length === 0) {
                window.SmartAgenda.Toast.error('No client types available');
                return;
            }

            const content = `
                <div>
                    <p style="margin-bottom: 16px;">Select new client type for ${this.selectedClients.size} selected client(s):</p>
                    <select id="bulk-client-type-select" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface);">
                        ${availableTypes.map(type => `<option value="${type.id}">${type.name}</option>`).join('')}
                    </select>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Update Client Type',
                content: content,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        action: 'cancel',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    },
                    {
                        label: 'Update',
                        type: 'primary',
                        action: 'update',
                        onClick: (modal) => {
                            const select = document.getElementById('bulk-client-type-select');
                            const newTypeId = select.value;

                            let updated = 0;
                            this.selectedClients.forEach(clientId => {
                                const client = window.SmartAgenda.DataManager.getById('clients', clientId);
                                if (client) {
                                    window.SmartAgenda.DataManager.update('clients', clientId, {
                                        clientTypes: [newTypeId],
                                        primaryType: newTypeId
                                    });
                                    updated++;
                                }
                            });

                            window.SmartAgenda.UIComponents.closeModal(modal);
                            window.SmartAgenda.Toast.success(`Updated ${updated} client(s)`);
                            this.selectedClients.clear();
                            this.render();
                        }
                    }
                ]
            });
        },

        // ============================================
        // Bulk Operations - Appointments
        // ============================================

        bulkExportAppointments: async function() {
            if (this.selectedAppointments.size === 0) {
                window.SmartAgenda.Toast.warning('Please select appointments to export');
                return;
            }

            const appointments = window.SmartAgenda.DataManager.getAll('appointments')
                .filter(apt => this.selectedAppointments.has(apt.id));

            // Prepare Excel data with proper columns
            const excelData = appointments.map(apt => {
                return {
                    'Client Name': apt.clientName || '',
                    'Date': apt.date || '',
                    'Time': apt.time || '',
                    'Service': apt.service || '',
                    'Duration (minutes)': apt.duration || '',
                    'Status': apt.status || 'pending',
                    'Price': apt.price || '',
                    'Completed': apt.completed ? 'Yes' : 'No',
                    'Notes': apt.notes || '',
                    'Created Date': apt.createdAt || ''
                };
            });

            const fileName = `appointments-export-${new Date().toISOString().split('T')[0]}.xlsx`;
            const success = await this.saveExcelToFile(excelData, fileName, 'Appointments');

            if (success) {
                window.SmartAgenda.Toast.success(`Exported ${appointments.length} appointments to Excel`);
            }
        },

        bulkUpdateAppointmentStatus: function() {
            if (this.selectedAppointments.size === 0) {
                window.SmartAgenda.Toast.warning('Please select appointments to update');
                return;
            }

            const content = `
                <div>
                    <p style="margin-bottom: 16px;">Select new status for ${this.selectedAppointments.size} selected appointment(s):</p>
                    <select id="bulk-appointment-status-select" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface);">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Update Appointment Status',
                content: content,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    },
                    {
                        label: 'Update',
                        type: 'primary',
                        onClick: (modal) => {
                            const select = document.getElementById('bulk-appointment-status-select');
                            const newStatus = select.value;

                            this.selectedAppointments.forEach(aptId => {
                                window.SmartAgenda.DataManager.update('appointments', aptId, {
                                    status: newStatus,
                                    completed: newStatus === 'completed'
                                });
                            });

                            window.SmartAgenda.UIComponents.closeModal(modal);
                            window.SmartAgenda.Toast.success(`Updated ${this.selectedAppointments.size} appointments`);
                            this.selectedAppointments.clear();
                            this.render();
                        }
                    }
                ]
            });
        },

        bulkDeleteAppointments: function() {
            if (this.selectedAppointments.size === 0) {
                window.SmartAgenda.Toast.warning('Please select appointments to delete');
                return;
            }

            const count = this.selectedAppointments.size;
            const confirmed = confirm(`Are you sure you want to delete ${count} appointment(s)? This action cannot be undone.`);

            if (!confirmed) return;

            this.selectedAppointments.forEach(aptId => {
                window.SmartAgenda.DataManager.delete('appointments', aptId);
            });

            this.selectedAppointments.clear();
            window.SmartAgenda.Toast.success(`Deleted ${count} appointments`);
            this.render();
        },

        // ============================================
        // VCF Import Functionality
        // ============================================

        bulkImportVCF: function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.vcf';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const vcfContent = event.target.result;
                            await this.parseAndImportVCF(vcfContent);
                        } catch (error) {
                            window.SmartAgenda.Toast.error('Error importing VCF file: ' + error.message);
                            console.error('VCF import error:', error);
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        },

        parseAndImportVCF: async function(vcfContent) {
            // Parse VCF content
            const contacts = this.parseVCF(vcfContent);

            if (contacts.length === 0) {
                window.SmartAgenda.Toast.warning('No contacts found in VCF file');
                return;
            }

            // Check for duplicates
            const existingClients = window.SmartAgenda.DataManager.getAll('clients');
            const duplicates = [];
            const newContacts = [];

            contacts.forEach(contact => {
                const duplicate = existingClients.find(client =>
                    this.normalizeString(client.name) === this.normalizeString(contact.name)
                );

                if (duplicate) {
                    duplicates.push({
                        imported: contact,
                        existing: duplicate
                    });
                } else {
                    newContacts.push(contact);
                }
            });

            // Import new contacts immediately
            let importedCount = 0;
            newContacts.forEach(contact => {
                const client = this.vcfContactToClient(contact);
                window.SmartAgenda.DataManager.add('clients', client);
                importedCount++;
            });

            // Handle duplicates if any
            if (duplicates.length > 0) {
                await this.handleDuplicateContacts(duplicates);
                importedCount += duplicates.length;
            }

            window.SmartAgenda.Toast.success(`Imported ${importedCount} contact(s) from VCF`);
            this.render();
        },

        parseVCF: function(vcfContent) {
            const contacts = [];
            const vCards = vcfContent.split('BEGIN:VCARD');

            vCards.forEach(vCardText => {
                if (!vCardText.trim()) return;

                const contact = {
                    name: '',
                    phone: '',
                    phone2: '',
                    email: '',
                    email2: '',
                    address: '',
                    city: '',
                    notes: '',
                    website: ''
                };

                const lines = vCardText.split('\n');
                let phoneCount = 0;
                let emailCount = 0;

                lines.forEach(line => {
                    line = line.trim();

                    // Parse name (FN = Formatted Name)
                    if (line.startsWith('FN:')) {
                        contact.name = this.unescapeVCard(line.substring(3));
                    }

                    // Parse phone numbers
                    if (line.startsWith('TEL')) {
                        const phoneMatch = line.match(/TEL[^:]*:(.*)/);
                        if (phoneMatch) {
                            const phone = this.unescapeVCard(phoneMatch[1]);
                            if (phoneCount === 0) {
                                contact.phone = phone;
                                const typeMatch = line.match(/TYPE=([^:;]+)/i);
                                if (typeMatch) {
                                    contact.phoneType = typeMatch[1].toLowerCase();
                                }
                            } else if (phoneCount === 1) {
                                contact.phone2 = phone;
                                const typeMatch = line.match(/TYPE=([^:;]+)/i);
                                if (typeMatch) {
                                    contact.phone2Type = typeMatch[1].toLowerCase();
                                }
                            }
                            phoneCount++;
                        }
                    }

                    // Parse email addresses
                    if (line.startsWith('EMAIL')) {
                        const emailMatch = line.match(/EMAIL[^:]*:(.*)/);
                        if (emailMatch) {
                            const email = this.unescapeVCard(emailMatch[1]);
                            if (emailCount === 0) {
                                contact.email = email;
                                const typeMatch = line.match(/TYPE=([^:;]+)/i);
                                if (typeMatch) {
                                    contact.emailType = typeMatch[1].toLowerCase();
                                }
                            } else if (emailCount === 1) {
                                contact.email2 = email;
                                const typeMatch = line.match(/TYPE=([^:;]+)/i);
                                if (typeMatch) {
                                    contact.email2Type = typeMatch[1].toLowerCase();
                                }
                            }
                            emailCount++;
                        }
                    }

                    // Parse address
                    if (line.startsWith('ADR')) {
                        const adrMatch = line.match(/ADR[^:]*:([^;]*;[^;]*;)?([^;]*);([^;]*)/);
                        if (adrMatch) {
                            if (adrMatch[2]) contact.address = this.unescapeVCard(adrMatch[2]);
                            if (adrMatch[3]) contact.city = this.unescapeVCard(adrMatch[3]);
                        }
                    }

                    // Parse notes
                    if (line.startsWith('NOTE:')) {
                        contact.notes = this.unescapeVCard(line.substring(5));
                    }

                    // Parse URL/Website
                    if (line.startsWith('URL:')) {
                        const url = this.unescapeVCard(line.substring(4));
                        if (!contact.website) {
                            contact.website = url;
                        }
                    }
                });

                // Only add contact if it has at least a name
                if (contact.name) {
                    contacts.push(contact);
                }
            });

            return contacts;
        },

        unescapeVCard: function(text) {
            if (!text) return '';
            return text
                .replace(/\\n/g, '\n')
                .replace(/\\,/g, ',')
                .replace(/\\;/g, ';')
                .trim();
        },

        vcfContactToClient: function(contact) {
            return {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                name: contact.name,
                phone: contact.phone,
                phoneType: contact.phoneType || 'personal',
                phone2: contact.phone2,
                phone2Type: contact.phone2Type || 'home',
                email: contact.email,
                emailType: contact.emailType || 'work',
                email2: contact.email2,
                email2Type: contact.email2Type || 'personal',
                address: contact.address,
                city: contact.city,
                notes: contact.notes,
                website: contact.website,
                clientTypes: ['existing'],
                primaryType: 'existing',
                date: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
        },

        handleDuplicateContacts: async function(duplicates) {
            for (const dup of duplicates) {
                const choice = await this.showDuplicateDialog(dup);

                if (choice === 'keep-existing') {
                    // Do nothing, keep existing
                    continue;
                } else if (choice === 'keep-imported') {
                    // Replace existing with imported
                    const newClient = this.vcfContactToClient(dup.imported);
                    newClient.id = dup.existing.id; // Keep same ID
                    window.SmartAgenda.DataManager.update('clients', dup.existing.id, newClient);
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
                    if (!merged.notes && dup.imported.notes) merged.notes = dup.imported.notes;

                    window.SmartAgenda.DataManager.update('clients', dup.existing.id, merged);
                }
            }
        },

        showDuplicateDialog: function(duplicate) {
            return new Promise((resolve) => {
                const existingInfo = `
                    <strong>Existing Contact:</strong><br>
                    Name: ${this.escapeHtml(duplicate.existing.name)}<br>
                    Phone: ${this.escapeHtml(duplicate.existing.phone || 'N/A')}<br>
                    Email: ${this.escapeHtml(duplicate.existing.email || 'N/A')}<br>
                    Source: <em>In Memory</em>
                `;

                const importedInfo = `
                    <strong>Imported Contact:</strong><br>
                    Name: ${this.escapeHtml(duplicate.imported.name)}<br>
                    Phone: ${this.escapeHtml(duplicate.imported.phone || 'N/A')}<br>
                    Email: ${this.escapeHtml(duplicate.imported.email || 'N/A')}<br>
                    Source: <em>VCF Import</em>
                `;

                const content = `
                    <div style="margin-bottom: 16px;">
                        <p style="margin-bottom: 12px; font-weight: 600; color: var(--warning-color);">
                            Duplicate contact detected!
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
                            label: 'Keep Existing',
                            type: 'secondary',
                            onClick: () => {
                                window.SmartAgenda.UIComponents.closeModal(modal);
                                resolve('keep-existing');
                            }
                        },
                        {
                            label: 'Keep Imported',
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

        normalizeString: function(str) {
            if (!str) return '';
            return str.toLowerCase().trim();
        },

        // ============================================
        // XLS Import Placeholder
        // ============================================

        bulkImportXLS: function() {
            window.SmartAgenda.Toast.info('Excel import feature coming soon! This will intelligently read any Excel file with customer data.');

            // Show info modal
            const content = `
                <div style="padding: 16px;">
                    <p style="margin-bottom: 12px;">
                        <strong>Excel Import (Coming Soon)</strong>
                    </p>
                    <p style="margin-bottom: 12px; color: var(--text-secondary);">
                        This feature will allow you to import contacts from any Excel file format.
                        The system will intelligently detect columns for:
                    </p>
                    <ul style="color: var(--text-secondary); margin-left: 20px;">
                        <li>Names</li>
                        <li>Phone numbers</li>
                        <li>Email addresses</li>
                        <li>Addresses</li>
                        <li>Custom fields</li>
                    </ul>
                    <p style="margin-top: 12px; color: var(--text-secondary);">
                        Stay tuned for this powerful feature!
                    </p>
                </div>
            `;

            window.SmartAgenda.UIComponents.showModal({
                title: 'Excel Import',
                content: content,
                buttons: [
                    {
                        label: 'OK',
                        type: 'primary',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ]
            });
        },

        // ============================================
        // Helper Functions
        // ============================================

        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Initialize when app is ready
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            Advanced.init();
        });
        window.SmartAgenda.Advanced = Advanced;
    }

})();
