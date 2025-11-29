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
            // TEMPORARILY DISABLED - Ads are turned off
            console.log('AdMob: Temporarily disabled');
            return;

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

                // Show banner after delay to ensure app is ready
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

                // Get navigation bar height from MainActivity
                const navBarHeight = window.navigationBarHeight || 0;

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

                console.log('Navigation bar height (px):', navBarHeight);
                console.log('Navigation bar height (dp):', navBarHeightDp);
                console.log('Loading banner ad with margin:', navBarHeightDp, 'dp');

                // Show banner directly (like old working version)
                await AdMob.showBanner(options);

                this.isBannerShowing = true;
                console.log('✅ Banner ad loaded successfully with margin above navigation bar');

                // Get banner height and add padding to app container
                this.updateAppPaddingForBanner();

            } catch (error) {
                console.error('Failed to load banner ad:', error);
                console.error('Error details:', JSON.stringify(error));
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
            // Standard banner height is 50dp
            // Use density from device or default to 1
            const density = window.devicePixelRatio || 1;
            const bannerHeightDp = 50;
            this.bannerHeight = Math.round(bannerHeightDp * density);

            // Get navigation bar height set by MainActivity (if exists)
            const navBarHeight = window.navigationBarHeight || 0;

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
                    padding-bottom: ${totalBottomPadding}px !important;
                }
                #map-tab {
                    padding-bottom: 0px !important;
                }
                .toast-container {
                    bottom: ${toastBottom}px !important;
                }
            `;

            console.log(`AdMob banner height: ${this.bannerHeight}px`);
            console.log(`Navigation bar height: ${navBarHeight}px`);
            console.log(`Total bottom padding: ${totalBottomPadding}px`);
            console.log(`Toast positioned at: ${toastBottom}px above bottom`);
            console.log(`Nav spacer height set to: ${totalBottomPadding}px`);
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
        // Wait a bit for MainActivity to set navigationBarHeight
        setTimeout(() => {
            const navBarHeight = window.navigationBarHeight || 0;
            if (navBarHeight > 0) {
                const styleId = 'admob-banner-padding-style';
                let styleElement = document.getElementById(styleId);

                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.id = styleId;
                    document.head.appendChild(styleElement);
                }

                // Apply just navigation padding initially
                styleElement.innerHTML = `
                    .main-content {
                        padding-bottom: ${navBarHeight}px !important;
                    }
                    #map-tab {
                        padding-bottom: 0px !important;
                    }
                `;

                console.log(`Initial navigation padding applied: ${navBarHeight}px`);
                console.log(`Initial nav spacer height set to: ${navBarHeight}px`);
            }
        }, 100); // Small delay to ensure navigationBarHeight is set
    }

    // Apply initial padding immediately
    // TEMPORARILY DISABLED - Since ads are off, no padding needed
    /*
    if (window.Capacitor?.isNativePlatform()) {
        applyInitialNavigationPadding();
    }
    */

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
            // Add 2-second delay to ensure app is fully ready (like old working version)
            setTimeout(() => {
                if (window.Capacitor?.isNativePlatform()) {
                    AdMobService.init();
                }
            }, 2000);
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
