/**
 * Smart Agenda - Google Drive Service
 * Handles Google OAuth authentication and Drive API operations
 *
 * Features:
 * - Google Sign In with OAuth 2.0
 * - Upload/Download files to/from AppData folder
 * - List and delete backups
 * - Token management and refresh
 */
(function() {
    'use strict';

    // Google OAuth Configuration
    const GOOGLE_CONFIG = {
        clientId: '891625612896-2knlbbukgka82he5ldth3gln5h8oa7o0.apps.googleusercontent.com',
        scopes: [
            'https://www.googleapis.com/auth/drive.appdata',  // Access to AppData folder
            'https://www.googleapis.com/auth/drive.file'      // Access to files created by app
        ],
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    };

    const GoogleDriveService = {
        currentUser: null,
        accessToken: null,
        tokenClient: null,
        isInitialized: false,
        isMobile: false,

        /**
         * Initialize Google Sign In (Web or Mobile)
         */
        init: async function(clientId) {
            // Use provided client ID or default from config
            const actualClientId = clientId || GOOGLE_CONFIG.clientId;

            if (actualClientId === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
                console.warn('⚠️ Google Drive Service: Client ID not configured. Please update GOOGLE_CONFIG.clientId');
                return false;
            }

            // Detect if running on mobile (Capacitor)
            this.isMobile = window.Capacitor && window.Capacitor.isNativePlatform();

            if (this.isMobile) {
                // Mobile: Use Capacitor Google Auth plugin
                return this.initMobile(actualClientId);
            } else {
                // Web: Use Google Identity Services
                return this.initWeb(actualClientId);
            }
        },

        /**
         * Initialize for Web (Google Identity Services)
         */
        initWeb: function(clientId) {
            // Check if Google Identity Services is loaded
            if (!window.google || !window.google.accounts) {
                console.error('❌ Google Identity Services not loaded');
                if (window.SmartAgenda && window.SmartAgenda.Toast) {
                    window.SmartAgenda.Toast.error('Google Services not available');
                }
                return false;
            }

            try {
                // Initialize token client for OAuth
                this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: GOOGLE_CONFIG.scopes.join(' '),
                    callback: (response) => {
                        this.handleAuthCallback(response);
                    }
                });

                // Check for stored access token
                const storedToken = localStorage.getItem('google_drive_token');
                const storedExpiry = localStorage.getItem('google_drive_token_expiry');
                const storedUser = localStorage.getItem('google_drive_user');

                if (storedToken && storedExpiry && storedUser) {
                    const now = Date.now();
                    if (now < parseInt(storedExpiry)) {
                        // Token is still valid
                        this.accessToken = storedToken;
                        this.currentUser = JSON.parse(storedUser);
                        this.updateUIForAuthState(this.currentUser);
                        console.log('✅ Restored Google Drive session (Web)');
                    } else {
                        // Token expired, clear it
                        this.clearStoredToken();
                    }
                }

                this.isInitialized = true;
                console.log('✅ Google Drive Service initialized (Web)');
                return true;

            } catch (error) {
                console.error('❌ Google Drive initialization error:', error);
                return false;
            }
        },

        /**
         * Initialize for Mobile (Capacitor Plugin)
         */
        initMobile: async function(clientId) {
            try {
                // Import the Capacitor plugin
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

                // Initialize the plugin
                await GoogleAuth.initialize({
                    clientId: clientId,
                    scopes: GOOGLE_CONFIG.scopes,
                    grantOfflineAccess: true
                });

                // Check for stored session
                const storedUser = localStorage.getItem('google_drive_user');
                const storedToken = localStorage.getItem('google_drive_token');

                if (storedUser && storedToken) {
                    this.currentUser = JSON.parse(storedUser);
                    this.accessToken = storedToken;
                    this.updateUIForAuthState(this.currentUser);
                    console.log('✅ Restored Google Drive session (Mobile)');
                }

                this.isInitialized = true;
                console.log('✅ Google Drive Service initialized (Mobile)');
                return true;

            } catch (error) {
                console.error('❌ Google Drive Mobile initialization error:', error);
                return false;
            }
        },

        /**
         * Sign in to Google (Web or Mobile)
         */
        signIn: async function() {
            if (!this.isInitialized) {
                throw new Error('Google Drive Service not initialized');
            }

            if (this.isMobile) {
                return this.signInMobile();
            } else {
                return this.signInWeb();
            }
        },

        /**
         * Sign in to Google (Web)
         */
        signInWeb: function() {
            return new Promise((resolve, reject) => {
                try {
                    // Store resolve/reject for callback
                    this._signInResolve = resolve;
                    this._signInReject = reject;

                    // Request access token
                    this.tokenClient.requestAccessToken({
                        prompt: 'select_account'  // Always show account picker
                    });

                } catch (error) {
                    console.error('❌ Sign-in error:', error);
                    reject(error);
                }
            });
        },

        /**
         * Sign in to Google (Mobile)
         */
        signInMobile: async function() {
            try {
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

                // Sign in
                const user = await GoogleAuth.signIn();

                console.log('✅ Google Sign In success (Mobile):', user);

                // Store user info
                this.currentUser = {
                    id: user.id,
                    email: user.email,
                    name: user.name || user.givenName + ' ' + user.familyName,
                    picture: user.imageUrl
                };

                // Store access token
                this.accessToken = user.authentication.accessToken;

                // Save to localStorage
                localStorage.setItem('google_drive_user', JSON.stringify(this.currentUser));
                localStorage.setItem('google_drive_token', this.accessToken);

                // Set expiry (1 hour from now)
                const expiryTime = Date.now() + (3600 * 1000);
                localStorage.setItem('google_drive_token_expiry', expiryTime.toString());

                // Update UI
                this.updateUIForAuthState(this.currentUser);

                return this.currentUser;

            } catch (error) {
                console.error('❌ Mobile sign-in error:', error);
                throw error;
            }
        },

        /**
         * Handle OAuth callback
         */
        handleAuthCallback: async function(response) {
            if (response.error) {
                console.error('❌ Auth error:', response.error);
                if (this._signInReject) {
                    this._signInReject(new Error(response.error));
                }
                return;
            }

            // Store access token
            this.accessToken = response.access_token;

            // Calculate expiry time (default 3600 seconds = 1 hour)
            const expiresIn = response.expires_in || 3600;
            const expiryTime = Date.now() + (expiresIn * 1000);

            // Get user info
            try {
                const userInfo = await this.getUserInfo();
                this.currentUser = userInfo;

                // Store in localStorage
                localStorage.setItem('google_drive_token', this.accessToken);
                localStorage.setItem('google_drive_token_expiry', expiryTime.toString());
                localStorage.setItem('google_drive_user', JSON.stringify(userInfo));

                // Update UI
                this.updateUIForAuthState(userInfo);

                console.log('✅ Signed in as:', userInfo.email);

                if (this._signInResolve) {
                    this._signInResolve(userInfo);
                }

            } catch (error) {
                console.error('❌ Failed to get user info:', error);
                if (this._signInReject) {
                    this._signInReject(error);
                }
            }
        },

        /**
         * Get user info from Google
         */
        getUserInfo: async function() {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user info');
            }

            return await response.json();
        },

        /**
         * Sign out
         */
        signOut: function() {
            // Revoke token
            if (this.accessToken) {
                window.google.accounts.oauth2.revoke(this.accessToken, () => {
                    console.log('Token revoked');
                });
            }

            // Clear state
            this.currentUser = null;
            this.accessToken = null;
            this.clearStoredToken();

            // Update UI
            this.updateUIForAuthState(null);

            console.log('✅ Signed out');

            if (window.SmartAgenda && window.SmartAgenda.Toast) {
                window.SmartAgenda.Toast.success('Signed out successfully');
            }
        },

        /**
         * Clear stored token from localStorage
         */
        clearStoredToken: function() {
            localStorage.removeItem('google_drive_token');
            localStorage.removeItem('google_drive_token_expiry');
            localStorage.removeItem('google_drive_user');
        },

        /**
         * Update UI based on auth state
         */
        updateUIForAuthState: function(user) {
            // Call Settings.updateGoogleDriveUI if available
            if (window.SmartAgenda && window.SmartAgenda.Settings) {
                setTimeout(() => {
                    window.SmartAgenda.Settings.updateGoogleDriveUI();
                }, 100);
            }

            // Schedule auto-backup if user signed in
            if (user && window.SmartAgenda && window.SmartAgenda.BackupService) {
                setTimeout(() => {
                    window.SmartAgenda.BackupService.scheduleAutoBackup();
                }, 500);
            }
        },

        /**
         * Upload file to Google Drive AppData folder
         * @param {string} fileName - Name of file
         * @param {string} fileData - File data (encrypted backup as string)
         * @param {string} mimeType - MIME type (default: application/json)
         * @returns {Promise<Object>} File metadata from Drive
         */
        uploadFile: async function(fileName, fileData, mimeType = 'application/json') {
            if (!this.accessToken) {
                throw new Error('Not signed in');
            }

            try {
                // Create multipart request body
                const metadata = {
                    name: fileName,
                    parents: ['appDataFolder'],
                    mimeType: mimeType
                };

                const boundary = '-------314159265358979323846';
                const delimiter = "\r\n--" + boundary + "\r\n";
                const closeDelim = "\r\n--" + boundary + "--";

                const multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: ' + mimeType + '\r\n\r\n' +
                    fileData +
                    closeDelim;

                // Upload to Drive
                const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': `multipart/related; boundary=${boundary}`
                    },
                    body: multipartRequestBody
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Upload failed: ${error.error?.message || response.statusText}`);
                }

                const result = await response.json();
                console.log('✅ File uploaded to Google Drive:', result.id);

                return result;

            } catch (error) {
                console.error('❌ Upload error:', error);
                throw error;
            }
        },

        /**
         * List backup files from AppData folder
         * @returns {Promise<Array>} Array of file metadata
         */
        listBackups: async function() {
            if (!this.accessToken) {
                throw new Error('Not signed in');
            }

            try {
                // Query AppData folder for .enc files
                const query = "name contains '.enc' and 'appDataFolder' in parents and trashed=false";
                const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id,name,size,createdTime,modifiedTime)&orderBy=modifiedTime desc`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`List failed: ${response.statusText}`);
                }

                const result = await response.json();
                console.log(`✅ Found ${result.files?.length || 0} backup(s) in Google Drive`);

                return result.files || [];

            } catch (error) {
                console.error('❌ List backups error:', error);
                throw error;
            }
        },

        /**
         * Download file from Google Drive
         * @param {string} fileId - Drive file ID
         * @returns {Promise<string>} File content
         */
        downloadFile: async function(fileId) {
            if (!this.accessToken) {
                throw new Error('Not signed in');
            }

            try {
                const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`Download failed: ${response.statusText}`);
                }

                const content = await response.text();
                console.log('✅ File downloaded from Google Drive');

                return content;

            } catch (error) {
                console.error('❌ Download error:', error);
                throw error;
            }
        },

        /**
         * Delete file from Google Drive
         * @param {string} fileId - Drive file ID
         * @returns {Promise<boolean>} Success status
         */
        deleteFile: async function(fileId) {
            if (!this.accessToken) {
                throw new Error('Not signed in');
            }

            try {
                const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${fileId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    }
                );

                if (!response.ok && response.status !== 204) {
                    throw new Error(`Delete failed: ${response.statusText}`);
                }

                console.log('✅ File deleted from Google Drive');
                return true;

            } catch (error) {
                console.error('❌ Delete error:', error);
                throw error;
            }
        },

        /**
         * Get Drive storage quota info
         * @returns {Promise<Object>} Quota information
         */
        getQuotaInfo: async function() {
            if (!this.accessToken) {
                throw new Error('Not signed in');
            }

            try {
                const response = await fetch(
                    'https://www.googleapis.com/drive/v3/about?fields=storageQuota',
                    {
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`Get quota failed: ${response.statusText}`);
                }

                const result = await response.json();
                const quota = result.storageQuota;

                // Calculate values in MB
                const limit = parseInt(quota.limit) / (1024 * 1024);
                const usage = parseInt(quota.usage) / (1024 * 1024);
                const remaining = limit - usage;

                return {
                    limit: limit.toFixed(2),
                    usage: usage.toFixed(2),
                    remaining: remaining.toFixed(2),
                    percentUsed: ((usage / limit) * 100).toFixed(1)
                };

            } catch (error) {
                console.error('❌ Get quota error:', error);
                throw error;
            }
        },

        /**
         * Check if token is still valid
         * @returns {boolean} True if valid
         */
        isTokenValid: function() {
            const expiryTime = localStorage.getItem('google_drive_token_expiry');
            if (!expiryTime || !this.accessToken) {
                return false;
            }

            return Date.now() < parseInt(expiryTime);
        }
    };

    // Add to global API
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.GoogleDriveService = GoogleDriveService;

})();
