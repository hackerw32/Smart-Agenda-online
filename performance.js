/**
 * Smart Agenda - Performance & Graphics Settings
 * Simple toggle for fancy graphics (blur, animations)
 * Default: OFF (performance mode for all devices)
 */
(function() {
    'use strict';

    const Performance = {
        /**
         * Check if fancy graphics are enabled
         * @returns {boolean}
         */
        isFancyGraphicsEnabled: function() {
            const setting = localStorage.getItem('fancy_graphics');
            // Default is OFF (false) for performance
            return setting === 'true';
        },

        /**
         * Apply graphics settings
         */
        applyGraphicsSettings: function() {
            const fancyGraphics = this.isFancyGraphicsEnabled();

            console.log(`✨ Fancy Graphics: ${fancyGraphics ? 'ON (blur + animations)' : 'OFF (performance mode)'}`);

            // Add class to body for CSS targeting
            if (fancyGraphics) {
                document.body.classList.add('fancy-graphics');
                document.body.classList.remove('performance-mode');
            } else {
                document.body.classList.add('performance-mode');
                document.body.classList.remove('fancy-graphics');
            }

            // Store in global for runtime checks
            window.FANCY_GRAPHICS = fancyGraphics;

            // Emit event for other modules
            if (window.SmartAgenda && window.SmartAgenda.EventBus) {
                window.SmartAgenda.EventBus.emit('graphics:changed', {
                    fancy: fancyGraphics
                });
            }

            return fancyGraphics;
        },

        /**
         * Toggle fancy graphics
         * @param {boolean} enabled - Enable or disable fancy graphics
         */
        setFancyGraphics: function(enabled) {
            localStorage.setItem('fancy_graphics', enabled ? 'true' : 'false');
            console.log(`✅ Fancy Graphics set to: ${enabled ? 'ON' : 'OFF'}`);

            // Re-apply settings
            this.applyGraphicsSettings();

            // Reload page to apply changes
            if (window.SmartAgenda && window.SmartAgenda.Toast) {
                window.SmartAgenda.Toast.success('Η αλλαγή θα εφαρμοστεί μετά την επαναφόρτωση');
                setTimeout(() => window.location.reload(), 1500);
            }
        },

        /**
         * Initialize graphics settings
         */
        init: function() {
            console.log('🚀 Initializing graphics settings...');

            // Apply graphics settings immediately
            this.applyGraphicsSettings();

            console.log('📱 Graphics mode:', this.isFancyGraphicsEnabled() ? 'Fancy (ON)' : 'Performance (OFF - default)');
        }
    };

    // Add to global API
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.Performance = Performance;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Performance.init());
    } else {
        Performance.init();
    }

})();
