/**
 * Smart Agenda - Firebase Service
 * Handles Firebase Authentication and Cloud Backup
 */
(function() {
    'use strict';

    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyD5O66ahdt_Ay9VTVsF7x74JO7tmeXduO0",
        authDomain: "our-agenda-android.firebaseapp.com",
        projectId: "our-agenda-android",
        storageBucket: "our-agenda-android.firebasestorage.app",
        messagingSenderId: "97535632409",
        appId: "1:97535632409:web:055162782a1d0fa2bdf688",
        measurementId: "G-TQMC8ZN6R9"
    };

    const FirebaseService = {
        app: null,
        auth: null,
        db: null,
        storage: null,
        currentUser: null,

        /**
         * Initialize Firebase - DEPRECATED
         *
         * ⚠️ This service is deprecated. Cloud backup has moved to Google Drive.
         * Please use GoogleDriveService instead.
         */
        init: function() {
            console.warn('⚠️ Firebase Service is DEPRECATED');
            console.log('ℹ️ Cloud backup has moved to Google Drive for better security and privacy.');
            console.log('ℹ️ Your local data is safe. Please sign in with Google Drive and create a new backup.');

            // Show migration notice to user
            setTimeout(() => {
                this.showMigrationNotice();
            }, 3000);  // Show after 3 seconds

            // DO NOT initialize Firebase
            return false;
        },

        /**
         * Show migration notice to user
         */
        showMigrationNotice: function() {
            if (window.SmartAgenda && window.SmartAgenda.Toast) {
                window.SmartAgenda.Toast.info(
                    'Το cloud backup μεταφέρθηκε στο Google Drive για καλύτερη ασφάλεια. Παρακαλώ συνδεθείτε στο Google Drive και δημιουργήστε νέο backup.',
                    { duration: 8000 }
                );
            }
        },

        /**
         * Update UI based on auth state - DEPRECATED
         */
        updateUIForAuthState: function(user) {
            const userNameEl = document.getElementById('user-name');
            const userEmailEl = document.getElementById('user-email');
            const signinBtn = document.getElementById('signin-btn');
            const signoutBtn = document.getElementById('signout-btn');
            const createAccountBtn = document.getElementById('create-account-btn');
            const backupBtn = document.getElementById('backup-data-btn');
            const restoreBtn = document.getElementById('restore-data-btn');

            if (user) {
                // User is signed in
                if (userNameEl) userNameEl.textContent = user.displayName || user.email.split('@')[0];
                if (userEmailEl) userEmailEl.textContent = user.email;

                if (signinBtn) signinBtn.style.display = 'none';
                if (createAccountBtn) createAccountBtn.style.display = 'none';
                if (signoutBtn) signoutBtn.style.display = 'block';
                if (backupBtn) backupBtn.style.display = 'inline-flex';
                if (restoreBtn) restoreBtn.style.display = 'inline-flex';
            } else {
                // User is signed out
                if (userNameEl) userNameEl.textContent = 'Guest User';
                if (userEmailEl) userEmailEl.textContent = 'Not signed in';

                if (signinBtn) signinBtn.style.display = 'block';
                if (createAccountBtn) createAccountBtn.style.display = 'block';
                if (signoutBtn) signoutBtn.style.display = 'none';
                if (backupBtn) backupBtn.style.display = 'none';
                if (restoreBtn) restoreBtn.style.display = 'none';
            }
        },

        /**
         * Create new account with email and password
         */
        createAccount: async function(email, password) {
            try {
                const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
                window.SmartAgenda.Toast.success('Account created successfully!');

                // Auto-backup after account creation
                setTimeout(() => {
                    this.backupAllData();
                }, 1000);

                return { success: true, user: userCredential.user };
            } catch (error) {
                console.error('Account creation error:', error);
                let errorMessage = 'Failed to create account';

                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'This email is already in use';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password should be at least 6 characters';
                        break;
                }

                window.SmartAgenda.Toast.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        },

        /**
         * Sign in with email and password
         */
        signIn: async function(email, password) {
            try {
                const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
                return { success: true, user: userCredential.user };
            } catch (error) {
                console.error('Sign in error:', error);
                let errorMessage = 'Failed to sign in';

                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Incorrect password';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address';
                        break;
                }

                window.SmartAgenda.Toast.error(errorMessage);
                return { success: false, error: errorMessage };
            }
        },

        /**
         * Sign out
         */
        signOut: async function() {
            try {
                await this.auth.signOut();
                window.SmartAgenda.Toast.success('Signed out successfully');
                return { success: true };
            } catch (error) {
                console.error('Sign out error:', error);
                window.SmartAgenda.Toast.error('Failed to sign out');
                return { success: false, error: error.message };
            }
        },

        /**
         * Backup all data to Firestore and Storage
         */
        backupAllData: async function() {
            if (!this.currentUser) {
                window.SmartAgenda.Toast.error('Please sign in to backup data');
                return { success: false, error: 'Not authenticated' };
            }

            try {
                window.SmartAgenda.Toast.info('Starting backup...');

                const userId = this.currentUser.uid;

                // Get all local data
                const clients = window.SmartAgenda.DataManager.getAll('clients') || [];
                const appointments = window.SmartAgenda.DataManager.getAll('appointments') || [];
                const tasks = window.SmartAgenda.DataManager.getAll('tasks') || [];
                const settings = {
                    clientTypes: localStorage.getItem('clientTypes'),
                    theme: localStorage.getItem('theme'),
                    language: localStorage.getItem('language'),
                    currency: localStorage.getItem('currency'),
                    fontSize: localStorage.getItem('fontSize')
                };

                // Upload files to Firebase Storage
                const uploadedFiles = await this.uploadClientFiles(userId, clients);

                // Update clients with cloud file URLs
                const clientsWithCloudFiles = clients.map(client => ({
                    ...client,
                    cloudFiles: uploadedFiles[client.id] || []
                }));

                // Save to Firestore
                const backupData = {
                    clients: clientsWithCloudFiles,
                    appointments,
                    tasks,
                    settings,
                    lastBackup: firebase.firestore.FieldValue.serverTimestamp(),
                    version: '2.0.0'
                };

                await this.db.collection('users').doc(userId).collection('backups').doc('latest').set(backupData);

                window.SmartAgenda.Toast.success('Backup completed successfully!');
                return { success: true };
            } catch (error) {
                console.error('Backup error:', error);
                window.SmartAgenda.Toast.error('Backup failed: ' + error.message);
                return { success: false, error: error.message };
            }
        },

        /**
         * Upload client files to Firebase Storage
         */
        uploadClientFiles: async function(userId, clients) {
            const uploadedFiles = {};

            for (const client of clients) {
                if (!client.files || client.files.length === 0) continue;

                uploadedFiles[client.id] = [];

                for (const file of client.files) {
                    try {
                        // Check if file has base64 data
                        if (file.data && file.data.startsWith('data:')) {
                            // Convert base64 to blob
                            const blob = await this.base64ToBlob(file.data);

                            // Upload to Firebase Storage
                            const fileName = `${userId}/clients/${client.id}/${file.name}`;
                            const storageRef = this.storage.ref(fileName);
                            const uploadTask = await storageRef.put(blob);
                            const downloadURL = await uploadTask.ref.getDownloadURL();

                            uploadedFiles[client.id].push({
                                name: file.name,
                                type: file.type,
                                url: downloadURL,
                                uploadedAt: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.error('File upload error:', error);
                    }
                }
            }

            return uploadedFiles;
        },

        /**
         * Convert base64 to blob
         */
        base64ToBlob: function(base64) {
            return new Promise((resolve, reject) => {
                try {
                    const arr = base64.split(',');
                    const mime = arr[0].match(/:(.*?);/)[1];
                    const bstr = atob(arr[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);

                    while(n--) {
                        u8arr[n] = bstr.charCodeAt(n);
                    }

                    resolve(new Blob([u8arr], { type: mime }));
                } catch (error) {
                    reject(error);
                }
            });
        },

        /**
         * Restore data from Firestore and Storage
         */
        restoreBackup: async function() {
            if (!this.currentUser) {
                window.SmartAgenda.Toast.error('Please sign in to restore data');
                return { success: false, error: 'Not authenticated' };
            }

            try {
                const confirmed = await window.SmartAgenda.UIComponents.confirm({
                    title: 'Restore Backup',
                    message: 'This will replace all current data with your cloud backup. Continue?',
                    confirmText: 'Restore',
                    type: 'warning'
                });

                if (!confirmed) return { success: false, cancelled: true };

                window.SmartAgenda.Toast.info('Restoring backup...');

                const userId = this.currentUser.uid;
                const backupDoc = await this.db.collection('users').doc(userId).collection('backups').doc('latest').get();

                if (!backupDoc.exists) {
                    window.SmartAgenda.Toast.warning('No backup found');
                    return { success: false, error: 'No backup found' };
                }

                const backupData = backupDoc.data();

                // Download and restore files
                if (backupData.clients) {
                    for (const client of backupData.clients) {
                        if (client.cloudFiles && client.cloudFiles.length > 0) {
                            client.files = await this.downloadClientFiles(client.cloudFiles);
                            delete client.cloudFiles; // Remove cloud URLs after download
                        }
                    }
                }

                // Restore data to local storage
                window.SmartAgenda.DataManager.save('clients', backupData.clients || []);
                window.SmartAgenda.DataManager.save('appointments', backupData.appointments || []);
                window.SmartAgenda.DataManager.save('tasks', backupData.tasks || []);

                // Restore settings with proper application
                if (backupData.settings) {
                    if (backupData.settings.clientTypes) {
                        localStorage.setItem('clientTypes', backupData.settings.clientTypes);
                    }
                    if (backupData.settings.theme) {
                        localStorage.setItem('theme', backupData.settings.theme);
                        // Apply theme
                        if (window.SmartAgenda?.ThemeManager) {
                            window.SmartAgenda.ThemeManager.setTheme(backupData.settings.theme);
                        }
                    }
                    if (backupData.settings.fontSize) {
                        localStorage.setItem('fontSize', backupData.settings.fontSize);
                        // Apply font size
                        if (window.SmartAgenda?.FontSizeManager) {
                            window.SmartAgenda.FontSizeManager.setFontSize(backupData.settings.fontSize);
                        }
                    }
                    if (backupData.settings.language) {
                        localStorage.setItem('language', backupData.settings.language);
                        // Apply language
                        if (window.SmartAgenda?.I18n) {
                            window.SmartAgenda.I18n.setLanguage(backupData.settings.language);
                        }
                    }
                    if (backupData.settings.currency) {
                        localStorage.setItem('currency', backupData.settings.currency);
                    }

                    // Emit settings change event
                    if (window.SmartAgenda) {
                        window.SmartAgenda.EventBus.emit('settings:clientTypes:change');
                    }
                }

                window.SmartAgenda.Toast.success('Backup restored successfully!');

                // Reload to apply changes
                setTimeout(() => location.reload(), 1000);

                return { success: true };
            } catch (error) {
                console.error('Restore error:', error);
                window.SmartAgenda.Toast.error('Restore failed: ' + error.message);
                return { success: false, error: error.message };
            }
        },

        /**
         * Auto-restore backup on sign in (if local data is empty)
         */
        autoRestoreBackup: async function() {
            const clients = window.SmartAgenda.DataManager.getAll('clients') || [];

            // Only auto-restore if local data is empty
            if (clients.length === 0) {
                const userId = this.currentUser.uid;
                const backupDoc = await this.db.collection('users').doc(userId).collection('backups').doc('latest').get();

                if (backupDoc.exists) {
                    const result = await window.SmartAgenda.UIComponents.confirm({
                        title: 'Cloud Backup Found',
                        message: 'Would you like to restore your data from the cloud?',
                        confirmText: 'Restore',
                        type: 'info'
                    });

                    if (result) {
                        await this.restoreBackup();
                    }
                }
            }
        },

        /**
         * Download client files from Firebase Storage
         */
        downloadClientFiles: async function(cloudFiles) {
            const downloadedFiles = [];

            for (const cloudFile of cloudFiles) {
                try {
                    const response = await fetch(cloudFile.url);
                    const blob = await response.blob();
                    const base64 = await this.blobToBase64(blob);

                    downloadedFiles.push({
                        name: cloudFile.name,
                        type: cloudFile.type,
                        data: base64
                    });
                } catch (error) {
                    console.error('File download error:', error);
                }
            }

            return downloadedFiles;
        },

        /**
         * Convert blob to base64
         */
        blobToBase64: function(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
    };

    // Export to global namespace
    window.SmartAgenda = window.SmartAgenda || {};
    window.SmartAgenda.FirebaseService = FirebaseService;

    // Export individual functions globally for backwards compatibility
    window.auth = null;
    window.db = null;

    // Initialize Firebase when script loads (like old working version)
    if (typeof firebase !== 'undefined') {
        console.log('✅ Firebase SDK detected, initializing...');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('🔥 Initializing Firebase on DOMContentLoaded...');
                FirebaseService.init();
            });
        } else {
            console.log('🔥 Initializing Firebase immediately...');
            FirebaseService.init();
        }
    } else {
        console.error('❌ Firebase SDK not loaded! Make sure Firebase scripts are loaded before firebase-service.js');
    }

})();
