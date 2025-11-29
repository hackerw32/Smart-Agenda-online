/**
 * Smart Agenda - Data Management Module
 * 
 * Handles:
 * - localStorage operations
 * - CRUD operations for all data types
 * - Data validation
 * - Import/Export functionality
 */

(function() {
    'use strict';

    const DataManager = {
        // Storage keys
        KEYS: {
            CLIENTS: 'smart_agenda_clients',
            APPOINTMENTS: 'smart_agenda_appointments',
            TASKS: 'smart_agenda_tasks',
            CATEGORIES: 'smart_agenda_categories',
            SETTINGS: 'smart_agenda_settings'
        },

        // ============================================
        // Generic CRUD Operations
        // ============================================
        
        /**
         * Get all items of a type
         * @param {string} type - Data type (clients, appointments, tasks)
         * @returns {Array} Array of items
         */
        getAll: function(type) {
            try {
                const key = this.KEYS[type.toUpperCase()];
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error(`Error getting ${type}:`, error);
                return [];
            }
        },

        /**
         * Get item by ID
         * @param {string} type - Data type
         * @param {string} id - Item ID
         * @returns {Object|null} Item or null if not found
         */
        getById: function(type, id) {
            const items = this.getAll(type);
            return items.find(item => item.id === id) || null;
        },

        /**
         * Alias for getById - get item by ID
         * @param {string} type - Data type
         * @param {string} id - Item ID
         * @returns {Object|null} Item or null if not found
         */
        get: function(type, id) {
            return this.getById(type, id);
        },

        /**
         * Save all items of a type
         * @param {string} type - Data type
         * @param {Array} items - Array of items
         */
        saveAll: function(type, items) {
            try {
                const key = this.KEYS[type.toUpperCase()];
                localStorage.setItem(key, JSON.stringify(items));
                
                // Emit data change event
                if (window.SmartAgenda) {
                    window.SmartAgenda.EventBus.emit('data:change', { type, items });
                    window.SmartAgenda.EventBus.emit(`data:${type}:change`, items);
                }
                
                return true;
            } catch (error) {
                console.error(`Error saving ${type}:`, error);
                
                // Check for quota exceeded error
                if (error.name === 'QuotaExceededError') {
                    if (window.SmartAgenda) {
                        window.SmartAgenda.Toast.error('Storage quota exceeded. Please clear some data.');
                    }
                }
                
                return false;
            }
        },

        /**
         * Add new item
         * @param {string} type - Data type
         * @param {Object} item - Item to add
         * @returns {Object|null} Added item with ID or null on error
         */
        add: function(type, item) {
            try {
                const items = this.getAll(type);
                
                // Generate ID if not present
                if (!item.id) {
                    item.id = Date.now().toString();
                }
                
                // Add timestamp if not present
                if (!item.date && type === 'clients') {
                    item.date = new Date().toISOString();
                }
                
                items.push(item);
                
                if (this.saveAll(type, items)) {
                    // Emit add event
                    if (window.SmartAgenda) {
                        window.SmartAgenda.EventBus.emit(`data:${type}:add`, item);
                    }
                    return item;
                }
                
                return null;
            } catch (error) {
                console.error(`Error adding ${type}:`, error);
                return null;
            }
        },

        /**
         * Update existing item
         * @param {string} type - Data type
         * @param {string} id - Item ID
         * @param {Object} updates - Properties to update
         * @returns {Object|null} Updated item or null on error
         */
        update: function(type, id, updates) {
            try {
                const items = this.getAll(type);
                const index = items.findIndex(item => item.id === id);
                
                if (index === -1) {
                    console.error(`${type} with id ${id} not found`);
                    return null;
                }
                
                // Merge updates
                items[index] = { ...items[index], ...updates };
                
                if (this.saveAll(type, items)) {
                    // Emit update event
                    if (window.SmartAgenda) {
                        window.SmartAgenda.EventBus.emit(`data:${type}:update`, items[index]);
                    }
                    return items[index];
                }
                
                return null;
            } catch (error) {
                console.error(`Error updating ${type}:`, error);
                return null;
            }
        },

        /**
         * Delete item
         * @param {string} type - Data type
         * @param {string} id - Item ID
         * @returns {boolean} Success status
         */
        delete: function(type, id) {
            try {
                const items = this.getAll(type);
                const filtered = items.filter(item => item.id !== id);
                
                if (this.saveAll(type, filtered)) {
                    // Emit delete event
                    if (window.SmartAgenda) {
                        window.SmartAgenda.EventBus.emit(`data:${type}:delete`, id);
                    }
                    return true;
                }
                
                return false;
            } catch (error) {
                console.error(`Error deleting ${type}:`, error);
                return false;
            }
        },

        /**
         * Delete multiple items
         * @param {string} type - Data type
         * @param {Array} ids - Array of item IDs
         * @returns {boolean} Success status
         */
        deleteMultiple: function(type, ids) {
            try {
                const items = this.getAll(type);
                const filtered = items.filter(item => !ids.includes(item.id));
                
                if (this.saveAll(type, filtered)) {
                    // Emit delete event for each
                    if (window.SmartAgenda) {
                        ids.forEach(id => {
                            window.SmartAgenda.EventBus.emit(`data:${type}:delete`, id);
                        });
                    }
                    return true;
                }
                
                return false;
            } catch (error) {
                console.error(`Error deleting multiple ${type}:`, error);
                return false;
            }
        },

        // ============================================
        // Search & Filter
        // ============================================

        /**
         * Search items by query
         * @param {string} type - Data type
         * @param {string} query - Search query
         * @returns {Array} Filtered items
         */
        search: function(type, query) {
            if (!query || query.trim() === '') {
                return this.getAll(type);
            }

            const items = this.getAll(type);

            // Helper function to normalize text for search (Android WebView compatible)
            const normalizeForSearch = (text) => {
                if (!text) return '';

                // Convert to lowercase first
                let normalized = text.toLowerCase();

                // Try both NFC and NFD normalization for broader compatibility
                try {
                    // NFC is better supported on Android than NFD
                    normalized = normalized.normalize('NFC');
                } catch (e) {
                    // Fallback if normalization not supported
                    console.warn('String normalization not supported');
                }

                // Remove common diacritics/accents as fallback
                // This helps with Greek letters and accented characters
                const diacriticMap = {
                    'ά': 'α', 'έ': 'ε', 'ή': 'η', 'ί': 'ι', 'ό': 'ο', 'ύ': 'υ', 'ώ': 'ω',
                    'ΐ': 'ι', 'ΰ': 'υ', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
                    'å': 'a', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i',
                    'î': 'i', 'ï': 'i', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
                    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ñ': 'n', 'ç': 'c'
                };

                for (let [accented, base] of Object.entries(diacriticMap)) {
                    normalized = normalized.replace(new RegExp(accented, 'g'), base);
                }

                return normalized;
            };

            const normalizedQuery = normalizeForSearch(query);

            return items.filter(item => {
                // Search in all string fields
                return Object.values(item).some(value => {
                    if (typeof value === 'string') {
                        const normalizedValue = normalizeForSearch(value);
                        return normalizedValue.includes(normalizedQuery);
                    }
                    return false;
                });
            });
        },

        /**
         * Filter items by criteria
         * @param {string} type - Data type
         * @param {Function} filterFn - Filter function
         * @returns {Array} Filtered items
         */
        filter: function(type, filterFn) {
            const items = this.getAll(type);
            return items.filter(filterFn);
        },

        /**
         * Sort items
         * @param {Array} items - Items to sort
         * @param {string} field - Field to sort by
         * @param {string} order - Sort order ('asc' or 'desc')
         * @returns {Array} Sorted items
         */
        sort: function(items, field, order = 'asc') {
            return [...items].sort((a, b) => {
                let aVal = a[field];
                let bVal = b[field];

                // Handle dates
                if (field === 'date') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                }

                // Handle strings
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (order === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        },

        // ============================================
        // Import / Export
        // ============================================

        /**
         * Export all data to JSON
         * @returns {Object} All data
         */
        exportData: function() {
            // Get settings from localStorage
            const settings = {
                clientTypes: localStorage.getItem('clientTypes'),
                theme: localStorage.getItem('theme'),
                fontSize: localStorage.getItem('fontSize'),
                language: localStorage.getItem('language'),
                currency: localStorage.getItem('currency')
            };

            return {
                clients: this.getAll('clients'),
                appointments: this.getAll('appointments'),
                tasks: this.getAll('tasks'),
                categories: this.getAll('categories'),
                settings: settings,
                exportDate: new Date().toISOString(),
                version: '2.0.0'
            };
        },

        /**
         * Import data from JSON
         * @param {Object} data - Data to import
         * @returns {boolean} Success status
         */
        importData: function(data) {
            try {
                if (data.clients) {
                    this.saveAll('clients', data.clients);
                }
                if (data.appointments) {
                    this.saveAll('appointments', data.appointments);
                }
                if (data.tasks) {
                    this.saveAll('tasks', data.tasks);
                }
                if (data.categories) {
                    this.saveAll('categories', data.categories);
                }

                // Import settings
                if (data.settings) {
                    if (data.settings.clientTypes) {
                        localStorage.setItem('clientTypes', data.settings.clientTypes);
                    }
                    if (data.settings.theme) {
                        localStorage.setItem('theme', data.settings.theme);
                        // Apply theme
                        if (window.SmartAgenda?.ThemeManager) {
                            window.SmartAgenda.ThemeManager.setTheme(data.settings.theme);
                        }
                    }
                    if (data.settings.fontSize) {
                        localStorage.setItem('fontSize', data.settings.fontSize);
                        // Apply font size
                        if (window.SmartAgenda?.FontSizeManager) {
                            window.SmartAgenda.FontSizeManager.setFontSize(data.settings.fontSize);
                        }
                    }
                    if (data.settings.language) {
                        localStorage.setItem('language', data.settings.language);
                        // Apply language
                        if (window.SmartAgenda?.I18n) {
                            window.SmartAgenda.I18n.setLanguage(data.settings.language);
                        }
                    }
                    if (data.settings.currency) {
                        localStorage.setItem('currency', data.settings.currency);
                    }

                    // Emit settings change event
                    if (window.SmartAgenda) {
                        window.SmartAgenda.EventBus.emit('settings:clientTypes:change');
                    }
                }

                // Emit import complete event
                if (window.SmartAgenda) {
                    window.SmartAgenda.EventBus.emit('data:import:complete');
                    window.SmartAgenda.Toast.success('Data and settings imported successfully');
                }

                return true;
            } catch (error) {
                console.error('Error importing data:', error);
                if (window.SmartAgenda) {
                    window.SmartAgenda.Toast.error('Error importing data');
                }
                return false;
            }
        },

        /**
         * Download data as JSON file
         */
        downloadBackup: async function() {
            try {
                const data = this.exportData();
                const json = JSON.stringify(data, null, 2);
                const fileName = `smart-agenda-backup-${new Date().toISOString().split('T')[0]}.json`;

                // Check if running in Capacitor (mobile app)
                if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                    console.log('Running on native platform');

                    try {
                        // Use Filesystem plugin - Google Play compliant method
                        const Filesystem = window.Capacitor.Plugins.Filesystem;

                        if (!Filesystem) {
                            throw new Error('Filesystem plugin not available');
                        }

                        console.log('Using Filesystem plugin for backup export (Share API)...');

                        // Save to app-specific directory (no special permissions needed)
                        // Then use Share API to let user choose where to save (Google Play compliant)
                        const result = await Filesystem.writeFile({
                            path: 'backups/' + fileName,
                            data: json,
                            directory: 'DATA',
                            encoding: 'utf8',
                            recursive: true
                        });

                        console.log('Backup saved to app data:', result);

                        // Use Share API to let user save the file wherever they want
                        // This is Google Play's recommended approach - no MANAGE_EXTERNAL_STORAGE needed
                        const uriResult = await Filesystem.getUri({
                            path: 'backups/' + fileName,
                            directory: 'DATA'
                        });

                        const Share = window.Capacitor.Plugins.Share;
                        if (Share) {
                            await Share.share({
                                title: 'Smart Agenda Backup',
                                text: 'Save your backup file',
                                url: uriResult.uri,
                                dialogTitle: 'Save backup to...'
                            });

                            if (window.SmartAgenda) {
                                window.SmartAgenda.Toast.success('Backup created - choose where to save it');
                            }
                        } else {
                            throw new Error('Share plugin not available');
                        }

                    } catch (error) {
                        console.error('Error saving backup:', error);
                        if (window.SmartAgenda) {
                            window.SmartAgenda.Toast.error('Failed to save backup: ' + error.message);
                        }
                    }
                    return;
                }

                // Web browser fallback removed since we're only in Capacitor now
                if (false) {  // Old FileBackup plugin code (disabled)
                    const { FileBackup } = window.Capacitor.Plugins;

                    try {
                        // Check if we have permissions
                        console.log('Checking storage permissions...');
                        const permStatus = await FileBackup.checkPermissions();
                        console.log('Permission status:', permStatus);

                        if (permStatus.storage !== 'granted') {
                            // Show message to user about permission
                            if (window.SmartAgenda) {
                                window.SmartAgenda.Toast.info('Storage permission required. Please grant access in the next screen.');
                            }

                            console.log('Requesting storage permissions...');
                            const permResult = await FileBackup.requestPermissions();
                            console.log('Permission result:', permResult);

                            if (permResult.storage !== 'granted') {
                                if (window.SmartAgenda) {
                                    window.SmartAgenda.Toast.error('Storage permission denied. Cannot save backup without permission.');
                                }
                                return;
                            }

                            if (window.SmartAgenda) {
                                window.SmartAgenda.Toast.success('Permission granted! Saving backup...');
                            }
                        }

                        // Save file to Downloads/Smart Agenda folder
                        console.log('Saving backup file:', fileName);
                        const result = await FileBackup.saveToDownloads({
                            fileName: fileName,
                            data: json
                        });
                        console.log('Backup saved:', result);

                        if (window.SmartAgenda) {
                            window.SmartAgenda.Toast.success(`Backup saved to ${result.path}`);
                        }

                    } catch (error) {
                        console.error('Error saving backup file:', error);
                        if (window.SmartAgenda) {
                            window.SmartAgenda.Toast.error('Failed to save backup: ' + error.message);
                        }
                    }

                } else {
                    // Web browser fallback - use traditional download method
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    if (window.SmartAgenda) {
                        window.SmartAgenda.Toast.success('Backup downloaded');
                    }
                }
            } catch (error) {
                console.error('Error in downloadBackup:', error);
                if (window.SmartAgenda) {
                    window.SmartAgenda.Toast.error('Failed to create backup');
                }
            }
        },

        /**
         * Clear all data
         * @returns {boolean} Success status
         */
        clearAll: function() {
            try {
                Object.values(this.KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });

                // Emit clear event
                if (window.SmartAgenda) {
                    window.SmartAgenda.EventBus.emit('data:clear');
                    window.SmartAgenda.Toast.success('All data cleared');
                }

                return true;
            } catch (error) {
                console.error('Error clearing data:', error);
                return false;
            }
        },

        // ============================================
        // Statistics
        // ============================================

        /**
         * Get statistics for a data type
         * @param {string} type - Data type
         * @returns {Object} Statistics object
         */
        getStats: function(type) {
            const items = this.getAll(type);
            
            const stats = {
                total: items.length
            };

            if (type === 'clients') {
                stats.existing = items.filter(c => c.customerType === 'existing').length;
                stats.potential = items.filter(c => c.customerType === 'potential').length;
            }

            if (type === 'appointments' || type === 'tasks') {
                stats.completed = items.filter(i => i.completed).length;
                stats.pending = items.filter(i => !i.completed).length;
                
                // Calculate overdue
                const now = new Date();
                stats.overdue = items.filter(i => {
                    if (i.completed) return false;
                    if (!i.date) return false;
                    return new Date(i.date) < now;
                }).length;
            }

            return stats;
        }
    };

    // Add to global API
    if (window.SmartAgenda) {
        window.SmartAgenda.DataManager = DataManager;
    }

})();
