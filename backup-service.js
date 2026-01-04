/**
 * Smart Agenda - Backup Service
 * Orchestrates encrypted cloud backups to Google Drive
 *
 * Features:
 * - Create encrypted backups
 * - Restore from encrypted backups
 * - List and manage backups
 * - Handle mobile file attachments with ZIP
 * - Progress tracking and error handling
 */
(function() {
    'use strict';

    const BackupService = {
        isBackingUp: false,
        isRestoring: false,
        currentProgress: 0,
        progressModal: null,

        /**
         * Initialize the service
         */
        init: function() {
            console.log('✅ Backup Service initialized');
        },

        /**
         * Create backup and upload to Google Drive (no password required)
         * @returns {Promise<Object>} Backup result
         */
        createBackup: async function() {
            if (this.isBackingUp) {
                throw new Error('Backup already in progress');
            }

            if (!window.SmartAgenda.GoogleDriveService.currentUser) {
                throw new Error('Not signed in to Google Drive');
            }

            this.isBackingUp = true;
            this.currentProgress = 0;

            // Show progress modal
            this.progressModal = null;
            if (window.SmartAgenda && window.SmartAgenda.UIComponents) {
                this.progressModal = window.SmartAgenda.UIComponents.showProgressModal('☁️ Google Drive Backup');
            }

            try {
                // Step 1: Collect data (10%)
                this.updateProgress(10, 'Συλλογή δεδομένων...');
                const backupData = this.prepareBackupData();

                // Check user preferences for what to include
                const includeDocuments = localStorage.getItem('gdrive_backup_documents') !== 'false';
                const includePhotos = localStorage.getItem('gdrive_backup_photos') !== 'false';

                // Filter data based on preferences
                if (!includePhotos && backupData.data.clients) {
                    backupData.data.clients = backupData.data.clients.map(client => ({
                        ...client,
                        photo: null
                    }));
                }

                // Step 2: Check if mobile with attachments (20%)
                this.updateProgress(20, 'Έλεγχος attachments...');
                const hasAttachments = includeDocuments && this.checkHasAttachments(backupData);
                let attachmentsBackup = null;

                if (hasAttachments && window.Capacitor?.isNativePlatform()) {
                    // Step 3: Bundle attachments (40%)
                    this.updateProgress(30, 'Συλλογή αρχείων...');
                    const password = this.generatePasswordFromUser();
                    attachmentsBackup = await this.bundleAttachments(backupData, password);
                }

                // Step 4: Encrypt main data (60%)
                this.updateProgress(hasAttachments ? 50 : 40, 'Κρυπτογράφηση δεδομένων...');
                const password = this.generatePasswordFromUser();
                const encryptedData = await this.encryptBackupData(backupData, password);

                // Step 5: Upload to Google Drive (90%)
                const uploadPercent = hasAttachments ? 70 : 60;
                this.updateProgress(uploadPercent, 'Μεταφόρτωση στο Google Drive...', { pulsing: true });

                const timestamp = new Date().toISOString().split('T')[0];
                const fileName = `smart-agenda-backup-${timestamp}.enc`;

                const uploadResult = await window.SmartAgenda.GoogleDriveService.uploadFile(
                    fileName,
                    JSON.stringify(encryptedData),
                    'application/json'
                );

                // Stop pulsing after upload
                this.updateProgress(hasAttachments ? 75 : 80, 'Μεταφόρτωση ολοκληρώθηκε', { pulsing: false });

                // Step 6: Upload attachments if exists
                if (attachmentsBackup) {
                    const attachmentsFileName = `smart-agenda-attachments-${timestamp}.zip.enc`;

                    // Start simulated progress for upload (with pulsing animation)
                    let uploadProgress = 80;
                    this.updateProgress(80, 'Μεταφόρτωση αρχείων...', { pulsing: true });

                    const progressInterval = setInterval(() => {
                        if (uploadProgress < 94) {
                            uploadProgress += 2;
                            this.updateProgress(uploadProgress, 'Μεταφόρτωση αρχείων...', { pulsing: true });
                        }
                    }, 2000); // Update every 2 seconds

                    try {
                        await window.SmartAgenda.GoogleDriveService.uploadFile(
                            attachmentsFileName,
                            attachmentsBackup,
                            'application/zip'
                        );
                    } finally {
                        clearInterval(progressInterval);
                        // Remove pulsing animation when done
                        this.updateProgress(95, 'Αποθήκευση metadata...', { pulsing: false });
                    }
                }

                // Step 7: Save backup metadata locally and to Google Drive
                this.updateProgress(95, 'Αποθήκευση metadata...');
                const metadata = {
                    id: uploadResult.id,
                    fileName: fileName,
                    timestamp: new Date().toISOString(),
                    size: new Blob([JSON.stringify(encryptedData)]).size,
                    hasAttachments: !!attachmentsBackup,
                    deviceType: window.Capacitor?.isNativePlatform() ? 'mobile' : 'desktop',
                    itemCounts: {
                        clients: backupData.data.clients.length,
                        appointments: backupData.data.appointments.length,
                        tasks: backupData.data.tasks.length
                    }
                };
                this.saveBackupMetadata(metadata);

                // Also save metadata to Google Drive so other devices can see stats
                await this.syncMetadataToGoogleDrive();

                // Save last backup info for UI
                localStorage.setItem('gdrive_last_backup_metadata', JSON.stringify(metadata));
                localStorage.setItem('gdrive_last_backup_time', new Date().toISOString());

                // Clean up old backups (keep last 10)
                await this.cleanupOldBackups();

                // Done!
                this.updateProgress(100, 'Ολοκληρώθηκε!');

                if (window.SmartAgenda && window.SmartAgenda.Toast) {
                    window.SmartAgenda.Toast.success('Backup ολοκληρώθηκε με επιτυχία!');
                }

                // Update UI
                if (window.SmartAgenda && window.SmartAgenda.Settings) {
                    window.SmartAgenda.Settings.updateGoogleDriveUI();
                }

                return {
                    success: true,
                    fileId: uploadResult.id,
                    fileName: fileName,
                    hasAttachments: !!attachmentsBackup
                };

            } catch (error) {
                console.error('❌ Backup error:', error);

                if (window.SmartAgenda && window.SmartAgenda.Toast) {
                    window.SmartAgenda.Toast.error('Backup απέτυχε: ' + error.message);
                }

                throw error;

            } finally {
                // Close progress modal
                if (this.progressModal) {
                    setTimeout(() => {
                        this.progressModal.close();
                        this.progressModal = null;
                    }, 1000); // Wait 1 second so user can see 100%
                }

                this.isBackingUp = false;
                this.currentProgress = 0;
            }
        },

        /**
         * Restore from backup (no password required)
         * @param {string} backupId - Google Drive file ID
         * @returns {Promise<Object>} Restore result
         */
        restoreBackup: async function(backupId) {
            console.log('🔄 BackupService.restoreBackup() called with backupId:', backupId);

            if (this.isRestoring) {
                console.log('❌ Restore already in progress');
                throw new Error('Restore already in progress');
            }

            if (!window.SmartAgenda.GoogleDriveService.currentUser) {
                console.log('❌ Not signed in to Google Drive');
                throw new Error('Not signed in to Google Drive');
            }

            console.log('✅ User authenticated:', window.SmartAgenda.GoogleDriveService.currentUser.email);
            this.isRestoring = true;
            this.currentProgress = 0;

            // Show progress modal
            this.progressModal = null;
            if (window.SmartAgenda && window.SmartAgenda.UIComponents) {
                this.progressModal = window.SmartAgenda.UIComponents.showProgressModal('📥 Επαναφορά Backup');
            }

            try {
                // Step 1: Download from Google Drive (20%)
                console.log('📥 Step 1: Downloading from Google Drive...');
                this.updateProgress(10, 'Λήψη από Google Drive...');
                const encryptedContent = await window.SmartAgenda.GoogleDriveService.downloadFile(backupId);
                console.log('✅ Downloaded content, length:', encryptedContent?.length);

                // Step 2: Parse encrypted data (30%)
                console.log('📋 Step 2: Parsing encrypted data...');
                this.updateProgress(25, 'Ανάλυση δεδομένων...');
                const encryptedData = JSON.parse(encryptedContent);
                console.log('✅ Parsed encrypted data:', Object.keys(encryptedData));

                // Step 3: Decrypt (50%)
                console.log('🔓 Step 3: Decrypting...');
                this.updateProgress(35, 'Αποκρυπτογράφηση...');
                let decryptedData;

                try {
                    const password = this.generatePasswordFromUser();
                    console.log('🔑 Generated password from user');
                    decryptedData = await this.decryptBackupData(encryptedData, password);
                    console.log('✅ Decrypted successfully');
                } catch (error) {
                    console.error('❌ Decryption failed:', error);
                    if (error.message === 'WRONG_PASSWORD') {
                        throw new Error('Αδυναμία αποκρυπτογράφησης. Το backup μπορεί να έχει δημιουργηθεί από διαφορετικό λογαριασμό.');
                    }
                    throw error;
                }

                // Step 4: Validate data structure
                console.log('✓ Step 4: Validating data structure...');
                this.updateProgress(55, 'Επικύρωση δεδομένων...');
                this.validateBackupData(decryptedData);
                console.log('✅ Data validated');

                // Step 5: Check for attachments backup
                console.log('📎 Step 5: Checking for attachments...');
                const metadata = this.getBackupMetadata(backupId);
                console.log('Metadata:', metadata);
                if (metadata && metadata.hasAttachments) {
                    // Try to restore attachments
                    console.log('📂 Restoring attachments...');
                    this.updateProgress(65, 'Αποκατάσταση αρχείων...');
                    const password = this.generatePasswordFromUser();
                    await this.restoreAttachments(backupId, password);
                    console.log('✅ Attachments restored');
                } else {
                    console.log('ℹ️ No attachments to restore');
                }

                // Step 6: Import data (80%)
                console.log('💾 Step 6: Importing data...');
                this.updateProgress(75, 'Εισαγωγή δεδομένων...');
                await this.importBackupData(decryptedData);
                console.log('✅ Data imported');

                // Done!
                console.log('🎉 Restore completed successfully!');
                this.updateProgress(100, 'Ολοκληρώθηκε!');

                if (window.SmartAgenda && window.SmartAgenda.Toast) {
                    window.SmartAgenda.Toast.success('Επαναφορά ολοκληρώθηκε! Η εφαρμογή θα επαναφορτωθεί...');
                }

                // Reload app after 2 seconds
                setTimeout(() => {
                    console.log('🔄 Reloading app...');
                    window.location.reload();
                }, 2000);

                return {
                    success: true,
                    itemsRestored: {
                        clients: decryptedData.data.clients.length,
                        appointments: decryptedData.data.appointments.length,
                        tasks: decryptedData.data.tasks.length
                    }
                };

            } catch (error) {
                console.error('❌ Restore error:', error);
                console.error('Error stack:', error.stack);

                if (window.SmartAgenda && window.SmartAgenda.Toast) {
                    window.SmartAgenda.Toast.error('Επαναφορά απέτυχε: ' + error.message);
                }

                throw error;

            } finally {
                console.log('🔚 Restore process ended, cleaning up...');

                // Close progress modal
                if (this.progressModal) {
                    setTimeout(() => {
                        this.progressModal.close();
                        this.progressModal = null;
                    }, 1000); // Wait 1 second so user can see 100%
                }

                this.isRestoring = false;
                this.currentProgress = 0;
            }
        },

        /**
         * List available backups from Google Drive
         * @returns {Promise<Array>} Array of backup info
         */
        listAvailableBackups: async function() {
            console.log('📋 BackupService.listAvailableBackups() called');
            try {
                // First, load metadata from Google Drive to sync with other devices
                console.log('☁️ Loading metadata from Google Drive...');
                await this.loadMetadataFromGoogleDrive();

                console.log('🔍 Fetching files from Google Drive...');
                const driveFiles = await window.SmartAgenda.GoogleDriveService.listBackups();
                console.log('✅ Google Drive returned', driveFiles.length, 'files:', driveFiles);

                console.log('📂 Loading local metadata...');
                const localMetadata = this.getAllBackupMetadata();
                console.log('✅ Local metadata:', localMetadata);

                // Combine Drive data with local metadata
                const backups = driveFiles.map(file => {
                    const metadata = localMetadata[file.id] || {};
                    console.log(`📄 Processing file ${file.name} (${file.id}):`, metadata);

                    return {
                        id: file.id,
                        name: file.name,
                        size: file.size,
                        created: file.createdTime,
                        modified: file.modifiedTime,
                        deviceType: metadata.deviceType || 'unknown',
                        hasAttachments: metadata.hasAttachments || false,
                        itemCounts: metadata.itemCounts || {}
                    };
                });

                console.log('✅ Processed backups:', backups);
                return backups;

            } catch (error) {
                console.error('❌ List backups error:', error);
                console.error('Error stack:', error.stack);
                throw error;
            }
        },

        /**
         * Delete backup from Google Drive
         * @param {string} backupId - Google Drive file ID
         * @returns {Promise<boolean>} Success status
         */
        deleteBackup: async function(backupId) {
            try {
                // Delete from Google Drive
                await window.SmartAgenda.GoogleDriveService.deleteFile(backupId);

                // Delete local metadata
                this.deleteBackupMetadata(backupId);

                if (window.SmartAgenda && window.SmartAgenda.Toast) {
                    window.SmartAgenda.Toast.success('Backup διαγράφηκε');
                }

                return true;

            } catch (error) {
                console.error('❌ Delete backup error:', error);
                throw error;
            }
        },

        /**
         * Prepare backup data from DataManager
         * @returns {Object} Backup data structure
         */
        prepareBackupData: function() {
            const DataManager = window.SmartAgenda.DataManager;

            return {
                version: '3.0.0',
                timestamp: new Date().toISOString(),
                data: {
                    clients: DataManager.getAll('clients'),
                    appointments: DataManager.getAll('appointments'),
                    tasks: DataManager.getAll('tasks'),
                    categories: DataManager.getAll('categories') || [],
                    interactions: DataManager.getAll('interactions') || [],
                    settings: {
                        clientTypes: localStorage.getItem('clientTypes'),
                        theme: localStorage.getItem('theme'),
                        fontSize: localStorage.getItem('fontSize'),
                        language: localStorage.getItem('language'),
                        currency: localStorage.getItem('currency')
                    }
                },
                metadata: {
                    deviceType: window.Capacitor?.isNativePlatform() ? 'mobile' : 'desktop',
                    appVersion: '3.0.0'
                }
            };
        },

        /**
         * Check if backup has attachments
         * @param {Object} backupData - Backup data
         * @returns {boolean} True if has attachments
         */
        checkHasAttachments: function(backupData) {
            const clients = backupData.data.clients || [];
            return clients.some(client =>
                client.files &&
                client.files.length > 0 &&
                client.files.some(file => file.storedInFilesystem === true)
            );
        },

        /**
         * Bundle mobile attachments into encrypted ZIP
         * @param {Object} backupData - Backup data
         * @param {string} password - Encryption password
         * @returns {Promise<string>} Encrypted ZIP as base64
         */
        bundleAttachments: async function(backupData, password) {
            if (!window.JSZip) {
                console.warn('JSZip not available, skipping attachments');
                return null;
            }

            try {
                const Filesystem = window.Capacitor?.Plugins?.Filesystem;
                if (!Filesystem) {
                    console.warn('Filesystem plugin not available');
                    return null;
                }

                const zip = new JSZip();
                const clients = backupData.data.clients || [];

                // Count total files first
                let totalFiles = 0;
                for (const client of clients) {
                    if (client.files && client.files.length > 0) {
                        totalFiles += client.files.filter(f => f.storedInFilesystem && f.path).length;
                    }
                }

                console.log(`📂 Bundling ${totalFiles} attachment files...`);

                // Collect all files with progress
                let processedFiles = 0;
                for (const client of clients) {
                    if (!client.files || client.files.length === 0) continue;

                    for (const file of client.files) {
                        if (!file.storedInFilesystem || !file.path) continue;

                        try {
                            // Read file from filesystem
                            const fileData = await Filesystem.readFile({
                                path: file.path,
                                directory: 'DOCUMENTS'
                            });

                            // Add to ZIP
                            zip.file(file.path, fileData.data, { base64: true });

                            // Update progress (30% to 50% range)
                            processedFiles++;
                            const progressPercent = 30 + Math.floor((processedFiles / totalFiles) * 20);
                            this.updateProgress(progressPercent, `Συλλογή αρχείων (${processedFiles}/${totalFiles})...`);

                        } catch (error) {
                            console.warn(`Failed to read file: ${file.path}`, error);
                        }
                    }
                }

                // Generate ZIP
                const zipBlob = await zip.generateAsync({ type: 'blob' });

                // Convert to ArrayBuffer
                const arrayBuffer = await zipBlob.arrayBuffer();

                // Encrypt ZIP
                const encryptedZip = await window.SmartAgenda.EncryptionService.encryptFile(
                    arrayBuffer,
                    password
                );

                // Convert encrypted data to base64 for upload
                const encryptedBase64 = window.SmartAgenda.EncryptionService.arrayBufferToBase64(
                    encryptedZip.encrypted
                );

                // Create final package
                const finalPackage = {
                    encrypted: encryptedBase64,
                    salt: encryptedZip.salt,
                    iv: encryptedZip.iv,
                    algorithm: encryptedZip.algorithm,
                    iterations: encryptedZip.iterations
                };

                return JSON.stringify(finalPackage);

            } catch (error) {
                console.error('❌ Bundle attachments error:', error);
                throw error;
            }
        },

        /**
         * Restore mobile attachments from encrypted ZIP
         * @param {string} backupId - Main backup ID
         * @param {string} password - Decryption password
         * @returns {Promise<void>}
         */
        restoreAttachments: async function(backupId, password) {
            try {
                // Find attachments file (should be named similar to main backup but with .zip.enc)
                const backups = await window.SmartAgenda.GoogleDriveService.listBackups();
                const mainBackup = backups.find(b => b.id === backupId);

                if (!mainBackup) {
                    console.warn('Main backup not found');
                    return;
                }

                // Look for corresponding attachments file
                const timestamp = mainBackup.name.match(/\d{4}-\d{2}-\d{2}/)?.[0];
                const attachmentsFile = backups.find(b =>
                    b.name.includes('attachments') &&
                    b.name.includes(timestamp) &&
                    b.name.endsWith('.zip.enc')
                );

                if (!attachmentsFile) {
                    console.warn('Attachments file not found');
                    return;
                }

                // Download encrypted ZIP
                const encryptedContent = await window.SmartAgenda.GoogleDriveService.downloadFile(
                    attachmentsFile.id
                );

                // Parse encrypted package
                const encryptedPackage = JSON.parse(encryptedContent);

                // Convert base64 back to ArrayBuffer
                const encryptedBuffer = window.SmartAgenda.EncryptionService.base64ToArrayBuffer(
                    encryptedPackage.encrypted
                );

                // Decrypt ZIP
                const decryptedBuffer = await window.SmartAgenda.EncryptionService.decryptFile({
                    encrypted: encryptedBuffer,
                    salt: encryptedPackage.salt,
                    iv: encryptedPackage.iv,
                    iterations: encryptedPackage.iterations
                }, password);

                // Load ZIP
                const zip = await JSZip.loadAsync(decryptedBuffer);

                // Extract files
                const Filesystem = window.Capacitor?.Plugins?.Filesystem;
                if (!Filesystem) {
                    console.warn('Filesystem plugin not available');
                    return;
                }

                // Restore each file
                for (const [path, file] of Object.entries(zip.files)) {
                    if (file.dir) continue;

                    const content = await file.async('base64');

                    // Write to filesystem
                    await Filesystem.writeFile({
                        path: path,
                        data: content,
                        directory: 'DOCUMENTS',
                        recursive: true
                    });
                }

                console.log('✅ Attachments restored successfully');

            } catch (error) {
                console.warn('⚠️ Attachments restore failed (non-fatal):', error);
                // Don't throw - attachments are optional
            }
        },

        /**
         * Encrypt backup data
         * @param {Object} backupData - Backup data
         * @param {string} password - Encryption password
         * @returns {Promise<Object>} Encrypted data
         */
        encryptBackupData: async function(backupData, password) {
            const plaintext = JSON.stringify(backupData);
            const encrypted = await window.SmartAgenda.EncryptionService.encrypt(plaintext, password);
            return encrypted;
        },

        /**
         * Decrypt backup data
         * @param {Object} encryptedData - Encrypted data
         * @param {string} password - Decryption password
         * @returns {Promise<Object>} Decrypted backup data
         */
        decryptBackupData: async function(encryptedData, password) {
            const plaintext = await window.SmartAgenda.EncryptionService.decrypt(encryptedData, password);
            return JSON.parse(plaintext);
        },

        /**
         * Validate backup data structure
         * @param {Object} backupData - Backup data to validate
         * @throws {Error} If data is invalid
         */
        validateBackupData: function(backupData) {
            if (!backupData.version || !backupData.data) {
                throw new Error('Invalid backup data structure');
            }

            if (!backupData.data.clients || !Array.isArray(backupData.data.clients)) {
                throw new Error('Invalid clients data');
            }

            // Add more validation as needed
            console.log('✅ Backup data validated');
        },

        /**
         * Import backup data into app
         * @param {Object} backupData - Backup data to import
         * @returns {Promise<void>}
         */
        importBackupData: async function(backupData) {
            const DataManager = window.SmartAgenda.DataManager;

            // Import all data (replace mode)
            DataManager.importData(backupData.data, false);

            console.log('✅ Data imported successfully');
        },

        /**
         * Update progress (emits event for UI)
         * @param {number} percent - Progress percentage (0-100)
         * @param {string} message - Status message
         * @param {Object} options - Additional options (e.g., { pulsing: true })
         */
        updateProgress: function(percent, message, options = {}) {
            this.currentProgress = percent;

            // Update progress modal if it exists
            if (this.progressModal) {
                this.progressModal.update(percent, message, options);
            }

            // Emit event
            if (window.SmartAgenda && window.SmartAgenda.EventBus) {
                window.SmartAgenda.EventBus.emit('backup:progress', {
                    percent: percent,
                    message: message,
                    options: options
                });
            }

            console.log(`Progress: ${percent}% - ${message}${options.pulsing ? ' (simulated)' : ''}`);
        },

        /**
         * Save backup metadata locally
         * @param {Object} metadata - Backup metadata
         */
        saveBackupMetadata: function(metadata) {
            const allMetadata = this.getAllBackupMetadata();
            allMetadata[metadata.id] = metadata;
            localStorage.setItem('backup_metadata', JSON.stringify(allMetadata));
        },

        /**
         * Get backup metadata
         * @param {string} backupId - Backup ID
         * @returns {Object|null} Metadata or null
         */
        getBackupMetadata: function(backupId) {
            const allMetadata = this.getAllBackupMetadata();
            return allMetadata[backupId] || null;
        },

        /**
         * Get all backup metadata
         * @returns {Object} All metadata
         */
        getAllBackupMetadata: function() {
            const stored = localStorage.getItem('backup_metadata');
            return stored ? JSON.parse(stored) : {};
        },

        /**
         * Sync metadata to Google Drive
         * Saves all backup metadata to a file in Google Drive
         */
        syncMetadataToGoogleDrive: async function() {
            try {
                const allMetadata = this.getAllBackupMetadata();
                const metadataJson = JSON.stringify(allMetadata, null, 2);

                // Check if metadata file exists
                const existingFiles = await window.SmartAgenda.GoogleDriveService.listFiles(
                    "name = 'smart-agenda-metadata.json'"
                );

                if (existingFiles.length > 0) {
                    // Update existing file
                    await window.SmartAgenda.GoogleDriveService.updateFile(
                        existingFiles[0].id,
                        metadataJson,
                        'application/json'
                    );
                } else {
                    // Create new metadata file
                    await window.SmartAgenda.GoogleDriveService.uploadFile(
                        'smart-agenda-metadata.json',
                        metadataJson,
                        'application/json'
                    );
                }

                console.log('✅ Metadata synced to Google Drive');
            } catch (error) {
                console.warn('⚠️ Failed to sync metadata to Google Drive:', error);
                // Don't throw - this is not critical
            }
        },

        /**
         * Load metadata from Google Drive
         * Downloads and merges metadata from Google Drive
         */
        loadMetadataFromGoogleDrive: async function() {
            try {
                const files = await window.SmartAgenda.GoogleDriveService.listFiles(
                    "name = 'smart-agenda-metadata.json'"
                );

                if (files.length === 0) {
                    console.log('ℹ️ No metadata file found in Google Drive');
                    return;
                }

                const metadataContent = await window.SmartAgenda.GoogleDriveService.downloadFile(
                    files[0].id
                );

                const driveMetadata = JSON.parse(metadataContent);
                const localMetadata = this.getAllBackupMetadata();

                // Merge: Drive metadata takes precedence
                const merged = { ...localMetadata, ...driveMetadata };
                localStorage.setItem('backup_metadata', JSON.stringify(merged));

                console.log('✅ Metadata loaded from Google Drive');
            } catch (error) {
                console.warn('⚠️ Failed to load metadata from Google Drive:', error);
                // Don't throw - this is not critical
            }
        },

        /**
         * Delete backup metadata
         * @param {string} backupId - Backup ID
         */
        deleteBackupMetadata: function(backupId) {
            const allMetadata = this.getAllBackupMetadata();
            delete allMetadata[backupId];
            localStorage.setItem('backup_metadata', JSON.stringify(allMetadata));
        },

        /**
         * Clean up old backups (keep only the last N backups)
         * @param {number} keepCount - Number of backups to keep (default: 10)
         */
        cleanupOldBackups: async function(keepCount = 10) {
            try {
                console.log(`🧹 Cleaning up old backups (keeping last ${keepCount})...`);

                // Get all backup files from Google Drive
                const allFiles = await window.SmartAgenda.GoogleDriveService.listBackups();

                // Filter only main backup files (not attachments or metadata)
                const backupFiles = allFiles.filter(file =>
                    file.name.startsWith('smart-agenda-backup-') &&
                    file.name.endsWith('.enc') &&
                    !file.name.includes('attachments') &&
                    !file.name.includes('metadata')
                );

                console.log(`📁 Found ${backupFiles.length} backup files`);

                if (backupFiles.length <= keepCount) {
                    console.log(`✅ No cleanup needed (${backupFiles.length} <= ${keepCount})`);
                    return;
                }

                // Sort by modification time (newest first)
                backupFiles.sort((a, b) =>
                    new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
                );

                // Get files to delete (everything after keepCount)
                const filesToDelete = backupFiles.slice(keepCount);

                console.log(`🗑️ Deleting ${filesToDelete.length} old backups...`);

                for (const file of filesToDelete) {
                    try {
                        // Find associated attachments file
                        const timestamp = file.name.match(/\d{4}-\d{2}-\d{2}/)?.[0];
                        if (timestamp) {
                            const attachmentsFile = allFiles.find(f =>
                                f.name.includes('attachments') &&
                                f.name.includes(timestamp)
                            );

                            if (attachmentsFile) {
                                console.log(`🗑️ Deleting attachments: ${attachmentsFile.name}`);
                                await window.SmartAgenda.GoogleDriveService.deleteFile(attachmentsFile.id);
                            }
                        }

                        // Delete main backup file
                        console.log(`🗑️ Deleting backup: ${file.name}`);
                        await window.SmartAgenda.GoogleDriveService.deleteFile(file.id);

                        // Delete local metadata
                        this.deleteBackupMetadata(file.id);

                    } catch (error) {
                        console.warn(`⚠️ Failed to delete ${file.name}:`, error);
                    }
                }

                // Sync updated metadata to Google Drive
                await this.syncMetadataToGoogleDrive();

                console.log(`✅ Cleanup completed`);

            } catch (error) {
                console.error('❌ Cleanup error:', error);
                // Don't throw - this is not critical
            }
        },

        /**
         * Generate password from Google user (for encryption without user password)
         * @returns {string} Derived password
         */
        generatePasswordFromUser: function() {
            const user = window.SmartAgenda.GoogleDriveService.currentUser;
            if (!user || !user.id) {
                throw new Error('No user signed in');
            }

            // Use Google user ID + a salt to generate consistent password
            // This ensures only the same Google account can decrypt the backup
            const salt = 'SmartAgenda-v3.0-backup';
            return `${user.id}-${salt}`;
        },

        /**
         * Schedule automatic backup based on user preference
         */
        scheduleAutoBackup: function() {
            // Clear any existing interval
            if (this.autoBackupInterval) {
                clearInterval(this.autoBackupInterval);
                this.autoBackupInterval = null;
            }

            // Check if user is signed in
            if (!window.SmartAgenda.GoogleDriveService.currentUser) {
                console.log('Auto-backup disabled: not signed in');
                return;
            }

            // Get frequency setting
            const frequency = localStorage.getItem('gdrive_auto_backup_frequency') || 'daily';

            if (frequency === 'off') {
                console.log('Auto-backup disabled by user');
                return;
            }

            // Calculate interval in milliseconds
            let intervalMs;
            switch (frequency) {
                case 'daily':
                    intervalMs = 24 * 60 * 60 * 1000; // 24 hours
                    break;
                case 'weekly':
                    intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days
                    break;
                case 'monthly':
                    intervalMs = 30 * 24 * 60 * 60 * 1000; // 30 days
                    break;
                default:
                    intervalMs = 24 * 60 * 60 * 1000;
            }

            // Check if we should do a backup now
            const lastBackupTime = localStorage.getItem('gdrive_last_backup_time');
            const now = Date.now();

            // Check if there's any data to backup
            const hasData = localStorage.getItem('clients') ||
                           localStorage.getItem('appointments') ||
                           localStorage.getItem('tasks');

            if (!hasData) {
                console.log('Auto-backup skipped: no data to backup yet');
                // Still schedule the interval for future backups
                this.autoBackupInterval = setInterval(() => {
                    const lastBackup = localStorage.getItem('gdrive_last_backup_time');
                    const currentTime = Date.now();
                    const hasDataNow = localStorage.getItem('clients') ||
                                      localStorage.getItem('appointments') ||
                                      localStorage.getItem('tasks');

                    if (hasDataNow && (!lastBackup || (currentTime - new Date(lastBackup).getTime() >= intervalMs))) {
                        console.log('Auto-backup: time for backup');
                        this.createBackup().catch(err => {
                            console.error('Auto-backup failed:', err);
                        });
                    }
                }, 60 * 60 * 1000); // Check every hour
                return;
            }

            if (!lastBackupTime || (now - new Date(lastBackupTime).getTime() >= intervalMs)) {
                // Time to backup!
                console.log('Auto-backup: performing backup now');
                this.createBackup().catch(err => {
                    console.error('Auto-backup failed:', err);
                });
            }

            // Schedule next check (check every hour)
            this.autoBackupInterval = setInterval(() => {
                const lastBackup = localStorage.getItem('gdrive_last_backup_time');
                const currentTime = Date.now();

                if (!lastBackup || (currentTime - new Date(lastBackup).getTime() >= intervalMs)) {
                    console.log('Auto-backup: time for backup');
                    this.createBackup().catch(err => {
                        console.error('Auto-backup failed:', err);
                    });
                }
            }, 60 * 60 * 1000); // Check every hour

            console.log(`✅ Auto-backup scheduled: ${frequency}`);
        }
    };

    // Add to global API
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.BackupService = BackupService;

    // Initialize auto-backup when app is ready
    if (window.SmartAgenda && window.SmartAgenda.EventBus) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            BackupService.init();
            // Wait a bit for Google Drive service to initialize
            setTimeout(() => {
                BackupService.scheduleAutoBackup();
            }, 2000);
        });
    }

})();
