/**
 * Smart Agenda - Google Drive Service (Simple Mobile-First Version)
 * Based on working AutoMotoLog implementation
 */
(function() {
    'use strict';

    // IMPORTANT: Use WEB Client ID here (not Android Client ID)
    // The Android Client ID is validated automatically by the plugin using SHA-1
    const CLIENT_ID = '891625612896-2knlbbukgka82he5ldth3gln5h8oa7o0.apps.googleusercontent.com';
    const SCOPES = [
        'profile',
        'email',
        'https://www.googleapis.com/auth/drive.file'
    ];

    const GoogleDriveService = {
        currentUser: null,
        accessToken: null,
        isInitialized: false,
        refreshInterval: null, // For periodic token refresh

        /**
         * Check if user is authenticated
         */
        isAuthenticated: function() {
            const token = localStorage.getItem('google_access_token');
            const expiry = localStorage.getItem('google_token_expiry');

            if (!token) return false;

            // Check if expired
            if (expiry && Date.now() > parseInt(expiry)) {
                console.log('⚠️ Token expired');
                return false;
            }

            return true;
        },

        /**
         * Check if token needs refresh (expired or will expire soon)
         * @returns {boolean} True if token needs refresh
         */
        needsTokenRefresh: function() {
            const expiry = localStorage.getItem('google_token_expiry');
            if (!expiry) return true;

            // Refresh if token expires in less than 5 minutes
            const fiveMinutes = 5 * 60 * 1000;
            return (parseInt(expiry) - Date.now()) < fiveMinutes;
        },

        /**
         * Clear stored tokens
         */
        clearTokens: function() {
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_refresh_token');
            localStorage.removeItem('google_token_expiry');
            localStorage.removeItem('google_drive_user');
            this.accessToken = null;
            this.currentUser = null;
        },

        /**
         * Save tokens to localStorage
         */
        saveTokens: function(accessToken, refreshToken = null, expiresIn = 3600) {
            localStorage.setItem('google_access_token', accessToken);

            if (refreshToken) {
                localStorage.setItem('google_refresh_token', refreshToken);
            }

            const expiry = Date.now() + (expiresIn * 1000);
            localStorage.setItem('google_token_expiry', expiry.toString());

            this.accessToken = accessToken;
        },

        /**
         * Refresh access token using refresh token
         */
        refreshAccessToken: async function() {
            try {
                const { GoogleAuth } = window.Capacitor.Plugins;

                if (!GoogleAuth) {
                    throw new Error('GoogleAuth plugin not available');
                }

                console.log('🔄 Attempting to refresh access token...');

                // Initialize GoogleAuth before attempting refresh
                try {
                    await GoogleAuth.initialize({
                        clientId: CLIENT_ID,
                        scopes: SCOPES,
                        grantOfflineAccess: true
                    });
                } catch (initError) {
                    console.warn('⚠️ GoogleAuth already initialized or init failed:', initError);
                    // Continue anyway - might already be initialized
                }

                // Try to use the refresh method if available
                if (typeof GoogleAuth.refresh === 'function') {
                    const result = await GoogleAuth.refresh();

                    if (result && result.accessToken) {
                        console.log('✅ Token refreshed successfully');

                        // Update tokens (keep existing refresh token)
                        this.saveTokens(
                            result.accessToken,
                            null, // Don't overwrite refresh token
                            3600
                        );

                        return result.accessToken;
                    }
                }

                // Fallback: Try to get current user (which might trigger auto-refresh)
                console.log('🔄 Fallback: checking current user for auto-refresh...');
                const currentUser = await GoogleAuth.signInSilently();

                if (currentUser && currentUser.authentication && currentUser.authentication.accessToken) {
                    console.log('✅ Token refreshed via silent sign-in');

                    this.saveTokens(
                        currentUser.authentication.accessToken,
                        currentUser.authentication.refreshToken,
                        3600
                    );

                    return currentUser.authentication.accessToken;
                }

                throw new Error('Failed to refresh token');

            } catch (error) {
                console.error('❌ Token refresh error:', error);
                throw error;
            }
        },

        /**
         * Start periodic token refresh to prevent expiration
         */
        startPeriodicRefresh: function() {
            // Clear any existing interval
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }

            // Refresh token every 30 minutes (well before the 1 hour expiry)
            this.refreshInterval = setInterval(async () => {
                if (this.isAuthenticated()) {
                    try {
                        console.log('🔄 Periodic token refresh triggered');
                        await this.refreshAccessToken();
                        console.log('✅ Periodic token refresh successful');
                    } catch (error) {
                        console.error('❌ Periodic token refresh failed:', error);
                        // Don't clear tokens on automatic refresh failure
                        // Wait for next cycle or manual API call to try again
                    }
                }
            }, 30 * 60 * 1000); // 30 minutes

            console.log('✅ Periodic token refresh started (every 30 minutes)');
        },

        /**
         * Stop periodic token refresh
         */
        stopPeriodicRefresh: function() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
                console.log('❌ Periodic token refresh stopped');
            }
        },

        /**
         * Ensure we have a valid access token before making API calls
         * Automatically refreshes if needed (on-demand refresh)
         * @returns {Promise<string>} Valid access token
         */
        ensureValidToken: async function() {
            // Check if we need to refresh
            if (!this.isAuthenticated() || this.needsTokenRefresh()) {
                console.log('🔄 Token needs refresh, refreshing now...');
                try {
                    await this.refreshAccessToken();
                } catch (error) {
                    console.error('Failed to refresh token:', error);
                    // Clear tokens if refresh fails
                    this.clearTokens();
                    throw new Error('Session expired. Please sign in again.');
                }
            }

            // Return current token
            this.accessToken = localStorage.getItem('google_access_token');
            return this.accessToken;
        },

        /**
         * Initialize the service
         */
        init: async function() {
            try {
                // Check if Google Auth plugin is available
                if (!window.Capacitor || !window.Capacitor.Plugins.GoogleAuth) {
                    console.log('Google Auth plugin not available');
                    return false;
                }

                // Check for stored session
                if (this.isAuthenticated()) {
                    const storedUser = localStorage.getItem('google_drive_user');
                    const storedToken = localStorage.getItem('google_access_token');

                    if (storedUser && storedToken) {
                        this.currentUser = JSON.parse(storedUser);
                        this.accessToken = storedToken;
                        this.updateUIForAuthState(this.currentUser);

                        // Start periodic token refresh for existing session
                        this.startPeriodicRefresh();

                        // Try to refresh token on app start to ensure it's valid
                        console.log('🔄 Refreshing token on app start...');
                        try {
                            await this.refreshAccessToken();
                            console.log('✅ Token refreshed on app start');
                        } catch (error) {
                            console.warn('⚠️ Failed to refresh token on startup:', error);
                            // Don't fail initialization - token might still be valid
                        }

                        console.log('✅ Restored Google Drive session');
                    }
                } else {
                    // Token expired or missing - try silent sign-in to restore session
                    const storedUser = localStorage.getItem('google_drive_user');
                    if (storedUser) {
                        console.log('🔄 Token expired, attempting silent sign-in...');
                        try {
                            const { GoogleAuth } = window.Capacitor.Plugins;
                            await GoogleAuth.initialize({
                                clientId: CLIENT_ID,
                                scopes: SCOPES,
                                grantOfflineAccess: true
                            });

                            const result = await GoogleAuth.signInSilently();

                            if (result && result.authentication && result.authentication.accessToken) {
                                console.log('✅ Silent sign-in successful, session restored');

                                this.currentUser = JSON.parse(storedUser);
                                this.saveTokens(
                                    result.authentication.accessToken,
                                    result.authentication.refreshToken,
                                    3600
                                );
                                this.updateUIForAuthState(this.currentUser);
                                this.startPeriodicRefresh();
                            }
                        } catch (error) {
                            console.warn('⚠️ Silent sign-in failed:', error);
                            // Clear invalid session
                            this.clearTokens();
                        }
                    }
                }

                this.isInitialized = true;
                console.log('✅ Google Drive Service initialized');
                return true;

            } catch (error) {
                console.error('❌ Google Drive Service init error:', error);
                return false;
            }
        },

        /**
         * Sign in with Google
         */
        signIn: async function() {
            try {
                // Import the plugin dynamically
                const { GoogleAuth } = window.Capacitor.Plugins;

                if (!GoogleAuth) {
                    throw new Error('GoogleAuth plugin not found');
                }

                // Initialize Google Auth
                await GoogleAuth.initialize({
                    clientId: CLIENT_ID,
                    scopes: SCOPES,
                    grantOfflineAccess: true
                });

                console.log('Google Auth initialized, signing in...');

                // Sign in
                const result = await GoogleAuth.signIn();

                console.log('✅ Google Sign In successful:', result);

                if (!result || !result.authentication) {
                    throw new Error('Failed to get authentication data');
                }

                // Store user info
                this.currentUser = {
                    id: result.id,
                    email: result.email,
                    name: result.name || result.givenName + ' ' + result.familyName,
                    picture: result.imageUrl
                };

                // Save tokens
                this.saveTokens(
                    result.authentication.accessToken,
                    result.authentication.refreshToken,
                    3600
                );

                // Save user to localStorage
                localStorage.setItem('google_drive_user', JSON.stringify(this.currentUser));

                // Update UI
                this.updateUIForAuthState(this.currentUser);

                // Start periodic token refresh to keep session alive
                this.startPeriodicRefresh();

                console.log('✅ User authenticated:', this.currentUser.email);

                return this.currentUser;

            } catch (error) {
                console.error('❌ Google Sign In error:', error);
                throw error;
            }
        },

        /**
         * Sign out
         */
        signOut: async function() {
            try {
                const { GoogleAuth } = window.Capacitor.Plugins;
                if (GoogleAuth) {
                    await GoogleAuth.signOut();
                }
            } catch (error) {
                console.error('Sign out error:', error);
            }

            // Stop periodic token refresh
            this.stopPeriodicRefresh();

            this.clearTokens();
            this.updateUIForAuthState(null);
            console.log('✅ Signed out');
        },

        /**
         * Get user info
         */
        getUserInfo: async function() {
            if (!this.accessToken) return null;

            try {
                const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${this.accessToken}` }
                });

                if (!response.ok) return null;

                return await response.json();
            } catch (error) {
                console.error('Get user info error:', error);
                return null;
            }
        },

        /**
         * Upload file to Google Drive
         */
        uploadFile: async function(fileName, content, mimeType = 'application/json') {
            // Ensure we have a valid token (auto-refresh if needed)
            await this.ensureValidToken();

            try {
                const metadata = {
                    name: fileName,
                    mimeType: mimeType
                };

                const boundary = 'foo_bar_baz';
                const delimiter = `\r\n--${boundary}\r\n`;
                const closeDelimiter = `\r\n--${boundary}--`;

                const multipartBody =
                    delimiter +
                    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    `Content-Type: ${mimeType}\r\n\r\n` +
                    content +
                    closeDelimiter;

                const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': `multipart/related; boundary=${boundary}`
                    },
                    body: multipartBody
                });

                if (!response.ok) {
                    throw new Error('Upload failed: ' + response.statusText);
                }

                return await response.json();

            } catch (error) {
                console.error('❌ Upload error:', error);
                throw error;
            }
        },

        /**
         * Download file from Google Drive
         */
        downloadFile: async function(fileId) {
            // Ensure we have a valid token (auto-refresh if needed)
            await this.ensureValidToken();

            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: { Authorization: `Bearer ${this.accessToken}` }
                });

                if (!response.ok) {
                    throw new Error('Download failed');
                }

                return await response.text();

            } catch (error) {
                console.error('❌ Download error:', error);
                throw error;
            }
        },

        /**
         * Update file in Google Drive
         */
        updateFile: async function(fileId, content, mimeType = 'application/json') {
            // Ensure we have a valid token (auto-refresh if needed)
            await this.ensureValidToken();

            try {
                const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': mimeType
                    },
                    body: content
                });

                if (!response.ok) {
                    throw new Error('Update failed: ' + response.statusText);
                }

                return await response.json();

            } catch (error) {
                console.error('❌ Update error:', error);
                throw error;
            }
        },

        /**
         * Delete file from Google Drive
         */
        deleteFile: async function(fileId) {
            // Ensure we have a valid token (auto-refresh if needed)
            await this.ensureValidToken();

            try {
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`
                    }
                });

                if (!response.ok && response.status !== 204) {
                    throw new Error('Delete failed: ' + response.statusText);
                }

                return true;

            } catch (error) {
                console.error('❌ Delete error:', error);
                throw error;
            }
        },

        /**
         * List files in Google Drive
         */
        listFiles: async function(query = "name contains 'smart-agenda-backup'") {
            // Ensure we have a valid token (auto-refresh if needed)
            await this.ensureValidToken();

            try {
                const url = new URL('https://www.googleapis.com/drive/v3/files');
                url.searchParams.append('q', query);
                url.searchParams.append('orderBy', 'modifiedTime desc');
                url.searchParams.append('fields', 'files(id, name, modifiedTime, size, createdTime)');

                const response = await fetch(url.toString(), {
                    headers: { Authorization: `Bearer ${this.accessToken}` }
                });

                if (!response.ok) {
                    throw new Error('Failed to list files');
                }

                const data = await response.json();
                return data.files || [];

            } catch (error) {
                console.error('❌ List files error:', error);
                throw error;
            }
        },

        /**
         * List backup files in Google Drive (alias for listFiles)
         */
        listBackups: async function() {
            console.log('📋 Listing backups from Google Drive...');
            try {
                const files = await this.listFiles("name contains 'smart-agenda-backup'");
                console.log('✅ Found backups:', files.length, files);
                return files;
            } catch (error) {
                console.error('❌ List backups error:', error);
                throw error;
            }
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
        }
    };

    // Add to global API
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.GoogleDriveService = GoogleDriveService;

    // Auto-initialize when app is ready
    if (window.SmartAgenda && window.SmartAgenda.EventBus) {
        window.SmartAgenda.EventBus.on('app:ready', () => GoogleDriveService.init());
    }

    // Handle app state changes (resume/pause)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        const App = window.Capacitor.Plugins.App;

        App.addListener('appStateChange', async (state) => {
            if (state.isActive && GoogleDriveService.isInitialized) {
                console.log('📱 App resumed - checking Google Drive session...');

                // Check if we have a stored session
                const storedUser = localStorage.getItem('google_drive_user');
                if (storedUser) {
                    // Try to refresh token when app comes to foreground
                    if (GoogleDriveService.isAuthenticated()) {
                        try {
                            console.log('🔄 Refreshing token on app resume...');
                            await GoogleDriveService.refreshAccessToken();
                            console.log('✅ Token refreshed on app resume');
                        } catch (error) {
                            console.warn('⚠️ Failed to refresh token on resume:', error);
                            // Try silent sign-in as fallback
                            try {
                                const { GoogleAuth } = window.Capacitor.Plugins;
                                await GoogleAuth.initialize({
                                    clientId: CLIENT_ID,
                                    scopes: SCOPES,
                                    grantOfflineAccess: true
                                });

                                const result = await GoogleAuth.signInSilently();
                                if (result && result.authentication && result.authentication.accessToken) {
                                    console.log('✅ Session restored via silent sign-in on resume');
                                    GoogleDriveService.currentUser = JSON.parse(storedUser);
                                    GoogleDriveService.saveTokens(
                                        result.authentication.accessToken,
                                        result.authentication.refreshToken,
                                        3600
                                    );
                                }
                            } catch (silentError) {
                                console.error('❌ Silent sign-in failed on resume:', silentError);
                                // Token might be completely invalid - user needs to sign in again
                            }
                        }
                    } else {
                        // Token expired - try silent sign-in
                        console.log('🔄 Token expired, attempting silent sign-in on resume...');
                        try {
                            const { GoogleAuth } = window.Capacitor.Plugins;
                            await GoogleAuth.initialize({
                                clientId: CLIENT_ID,
                                scopes: SCOPES,
                                grantOfflineAccess: true
                            });

                            const result = await GoogleAuth.signInSilently();
                            if (result && result.authentication && result.authentication.accessToken) {
                                console.log('✅ Session restored via silent sign-in on resume');
                                GoogleDriveService.currentUser = JSON.parse(storedUser);
                                GoogleDriveService.saveTokens(
                                    result.authentication.accessToken,
                                    result.authentication.refreshToken,
                                    3600
                                );
                                GoogleDriveService.updateUIForAuthState(GoogleDriveService.currentUser);
                            }
                        } catch (error) {
                            console.warn('⚠️ Silent sign-in failed on resume:', error);
                        }
                    }
                }
            }
        });

        console.log('✅ App state listener registered for Google Drive session');
    }

})();
