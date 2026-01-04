/**
 * Smart Agenda - AdMob Service
 * Handles AdMob banner advertisements
 */
(function() {
    'use strict';

    const AdMobService = {
        isInitialized: false,
        isBannerShowing: false,
        bannerHeight: 0,

        /**
         * Initialize AdMob
         */
        init: async function() {
            // Check if ads are enabled (default to true if not set)
            const adsEnabled = localStorage.getItem('ads-enabled') !== 'false';
            if (!adsEnabled) {
                console.log('AdMob: Ads disabled by user in Advanced settings');
                return;
            }

            // Only run on native platforms
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                console.log('AdMob: Not running on native platform, skipping');
                return;
            }

            try {
                const AdMob = window.Capacitor.Plugins.AdMob;

                if (!AdMob) {
                    console.error('AdMob plugin not available');
                    return;
                }

                // Initialize AdMob
                await AdMob.initialize({
                    initializeForTesting: false,  // PRODUCTION MODE
                    testingDevices: []
                });

                this.isInitialized = true;
                console.log('AdMob initialized successfully in PRODUCTION mode');

                // Load banner directly (padding will be applied after banner loads)
                // Note: Initial padding is already applied by applyInitialNavigationPadding()
                await this.loadBannerAd();

            } catch (error) {
                console.error('AdMob initialization error:', error);
            }
        },

        /**
         * Load Banner Ad
         */
        loadBannerAd: async function() {
            if (this.isBannerShowing) {
                console.log('Banner already loaded');
                return;
            }

            try {
                const AdMob = window.Capacitor.Plugins.AdMob;

                // Wait for navigation bar height to be available (max 3 seconds)
                let navBarHeight = window.navigationBarHeight || 0;
                let attempts = 0;
                while (!navBarHeight && attempts < 15) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    navBarHeight = window.navigationBarHeight || 0;
                    attempts++;
                    if (navBarHeight) {
                        console.log('[AdMob] Navigation bar height found after', attempts * 200, 'ms');
                        break;
                    }
                }

                if (!navBarHeight) {
                    console.warn('[AdMob] Navigation bar height not available, using default');
                    navBarHeight = 0;
                }

                // Convert from px to dp for AdMob margin
                const density = window.devicePixelRatio || 1;
                const navBarHeightDp = Math.round(navBarHeight / density);

                const options = {
                    adId: 'ca-app-pub-6867669623484521/2332572375',  // YOUR REAL BANNER ID
                    adSize: 'BANNER',
                    position: 'BOTTOM_CENTER',
                    margin: navBarHeightDp,  // Position ABOVE navigation bar
                    isTesting: false  // PRODUCTION MODE
                };

                console.log('[AdMob Banner] Nav bar:', navBarHeight, 'px physical →', navBarHeightDp, 'dp (density:', density + ')');
                console.log('[AdMob Banner] Loading with margin:', navBarHeightDp, 'dp above navigation bar');

                // Show banner directly (like old working version)
                await AdMob.showBanner(options);

                this.isBannerShowing = true;
                console.log('[AdMob] ✅ Banner ad loaded successfully with margin above navigation bar');

                // Get banner height and add padding to app container
                this.updateAppPaddingForBanner();

                // Double-check padding after a delay (for slow devices)
                setTimeout(() => {
                    this.updateAppPaddingForBanner();
                    console.log('[AdMob] Padding reapplied after banner load');
                }, 1000);

            } catch (error) {
                console.error('[AdMob] Failed to load banner ad:', error);
                console.error('[AdMob] Error details:', JSON.stringify(error));
            }
        },

        /**
         * Show banner ad at bottom (kept for backwards compatibility)
         */
        showBanner: async function() {
            if (!this.isInitialized) {
                console.log('AdMob not initialized');
                return;
            }
            await this.loadBannerAd();
        },

        /**
         * Hide banner ad
         */
        hideBanner: async function() {
            if (!this.isInitialized || !this.isBannerShowing) {
                return;
            }

            try {
                const AdMob = window.Capacitor.Plugins.AdMob;
                await AdMob.hideBanner();
                this.isBannerShowing = false;
                console.log('AdMob banner hidden');

                // Remove padding from app container
                this.removeAppPaddingForBanner();

            } catch (error) {
                console.error('Error hiding AdMob banner:', error);
            }
        },

        /**
         * Resume banner (after app comes to foreground)
         */
        resumeBanner: async function() {
            if (!this.isInitialized) {
                return;
            }

            try {
                const AdMob = window.Capacitor.Plugins.AdMob;
                await AdMob.resumeBanner();
                console.log('AdMob banner resumed');
            } catch (error) {
                console.error('Error resuming AdMob banner:', error);
            }
        },

        /**
         * Update app padding to accommodate banner
         */
        updateAppPaddingForBanner: function() {
            // Standard banner height - use fixed value as Android already handles density
            this.bannerHeight = 50; // Fixed 50px for banner ad

            // Get navigation bar height and status bar height set by MainActivity
            // NOTE: These are in PHYSICAL pixels, need to convert to CSS pixels
            const navBarHeightPhysical = window.navigationBarHeight || 0;
            const statusBarHeightPhysical = window.androidInsets?.top || 0;

            // Convert physical pixels to CSS pixels for proper CSS rendering
            const density = window.devicePixelRatio || 1;
            const navBarHeight = Math.round(navBarHeightPhysical / density);
            const statusBarHeight = Math.round(statusBarHeightPhysical / density);

            // Inject CSS style for banner padding
            const styleId = 'admob-banner-padding-style';
            let styleElement = document.getElementById(styleId);

            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }

            // Total bottom padding = banner height + navigation bar height
            const totalBottomPadding = this.bannerHeight + navBarHeight;

            // Toast needs extra spacing (24px) above the banner
            const toastBottom = totalBottomPadding + 24;

            styleElement.innerHTML = `
                .main-content {
                    padding-bottom: ${this.bannerHeight}px !important;
                }
                #map-tab {
                    padding-bottom: 0px !important;
                }
                .toast-container {
                    bottom: ${toastBottom}px !important;
                }
                /* Position modal overlay - centered */
                .modal-overlay {
                    align-items: center !important;
                    justify-content: center !important;
                }
                /* Modal dialog spacing - leave space for status bar at top, ad + nav bar at bottom */
                .modal-dialog {
                    max-height: calc(100vh - ${statusBarHeight}px - ${totalBottomPadding}px) !important;
                    margin: ${statusBarHeight}px 20px ${totalBottomPadding}px 20px !important;
                }
            `;

            console.log(`[AdMob CSS] Banner: ${this.bannerHeight}px`);
            console.log(`[AdMob CSS] Status bar: ${statusBarHeightPhysical}px physical → ${statusBarHeight}px CSS (density: ${density})`);
            console.log(`[AdMob CSS] Nav bar: ${navBarHeightPhysical}px physical → ${navBarHeight}px CSS (density: ${density})`);
            console.log(`[AdMob CSS] Total bottom: ${totalBottomPadding}px CSS`);
            console.log(`[AdMob CSS] Modal margin-top: ${statusBarHeight}px, margin-bottom: ${totalBottomPadding}px`);
            console.log(`[AdMob CSS] Modal max-height: calc(100vh - ${statusBarHeight + totalBottomPadding}px)`);
        },

        /**
         * Remove app padding when banner is hidden
         */
        removeAppPaddingForBanner: function() {
            // Remove the injected style
            const styleElement = document.getElementById('admob-banner-padding-style');
            if (styleElement) {
                styleElement.remove();
            }

            this.bannerHeight = 0;
            console.log('AdMob banner padding removed');
        }
    };

    // Helper function to apply initial navigation padding
    function applyInitialNavigationPadding() {
        // Apply banner height immediately (before banner loads)
        const bannerHeight = 50;

        // Get physical pixels from Android
        const navBarHeightPhysical = window.navigationBarHeight || 0;
        const statusBarHeightPhysical = window.androidInsets?.top || 0;

        // Convert physical pixels to CSS pixels
        const density = window.devicePixelRatio || 1;
        const navBarHeight = Math.round(navBarHeightPhysical / density);
        const statusBarHeight = Math.round(statusBarHeightPhysical / density);
        const totalPadding = bannerHeight + navBarHeight;

        // Use DIFFERENT style element to avoid conflicts with updateAppPaddingForBanner
        const styleId = 'initial-admob-padding-style';
        let styleElement = document.getElementById(styleId);

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        // Apply ONLY main-content and toast padding
        // Modal CSS will be set by updateAppPaddingForBanner() after banner loads with correct values
        // NOTE: main-content only needs banner height, NOT banner+nav
        const mainContentPadding = bannerHeight; // Only banner, nav bar is below content

        styleElement.innerHTML = `
            .main-content {
                padding-bottom: ${mainContentPadding}px !important;
            }
            #map-tab {
                padding-bottom: 0px !important;
            }
            .toast {
                bottom: ${totalPadding + 24}px !important;
            }
        `;

        console.log(`[AdMob Initial] Padding applied:`);
        console.log(`  - Banner: ${bannerHeight}px CSS`);
        console.log(`  - Nav bar: ${navBarHeightPhysical}px physical → ${navBarHeight}px CSS (density: ${density})`);
        console.log(`  - Status bar: ${statusBarHeightPhysical}px physical → ${statusBarHeight}px CSS (density: ${density})`);
        console.log(`  - Total padding: ${totalPadding}px CSS`);
    }

    // Apply initial padding immediately on script load (before DOMContentLoaded)
    if (window.Capacitor?.isNativePlatform()) {
        // Check if ads are enabled before applying padding
        const adsEnabled = localStorage.getItem('ads-enabled') !== 'false';

        if (adsEnabled) {
            // Apply immediately
            applyInitialNavigationPadding();

            // Reapply after DOM loaded to ensure it sticks
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    applyInitialNavigationPadding();
                    console.log('[AdMob] Padding reapplied after DOM loaded');
                });
            }
        } else {
            console.log('[AdMob] Ads disabled - skipping initial padding');
        }
    }

    // Export to global namespace
    window.SmartAgenda = window.SmartAgenda || {};
    window.SmartAgenda.AdMobService = AdMobService;

    // Export individual functions globally (for backwards compatibility)
    window.initializeAdMob = AdMobService.init.bind(AdMobService);
    window.loadBannerAd = AdMobService.loadBannerAd.bind(AdMobService);
    window.hideBannerAd = AdMobService.hideBanner.bind(AdMobService);
    window.showBannerAdAgain = AdMobService.resumeBanner.bind(AdMobService);
    window.removeBannerAd = AdMobService.hideBanner.bind(AdMobService);

    // Initialize when app is ready (with delay like old working version)
    if (window.SmartAgenda && window.SmartAgenda.EventBus) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            // Check if welcome screen or tutorial will show
            const willShowWelcome = window.SmartAgenda?.WelcomeScreen?.shouldShow();

            if (willShowWelcome) {
                console.log('[AdMob] Welcome screen will show - delaying ad initialization');
                // Wait for welcome screen to close before loading ads
                window.SmartAgenda.EventBus.on('welcome:closed', () => {
                    setTimeout(() => {
                        if (window.Capacitor?.isNativePlatform()) {
                            console.log('[AdMob] Welcome closed - initializing ads now');
                            AdMobService.init();
                        }
                    }, 1000);
                });
            } else {
                // Normal startup - load ads with delay
                setTimeout(() => {
                    if (window.Capacitor?.isNativePlatform()) {
                        AdMobService.init();
                    }
                }, 2000);
            }
        });
    }

    // Handle app state changes (resume/pause)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        const App = window.Capacitor.Plugins.App;

        App.addListener('appStateChange', (state) => {
            if (state.isActive && AdMobService.isBannerShowing) {
                AdMobService.resumeBanner();
            }
        });
    }

})();
