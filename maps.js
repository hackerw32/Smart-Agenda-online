/**
 * Smart Agenda - Complete Maps Module
 *
 * Features:
 * - Google Maps integration
 * - Client markers with info windows
 * - Route planning and optimization
 * - Navigate to client (native app integration)
 * - Location notes and check-ins
 * - Search nearby clients
 * - Appointment mapping
 * - Offline map caching
 * - Multiple addresses per client
 */

(function() {
    'use strict';

    // =============================================================================
    // CONFIGURATION & CONSTANTS
    // =============================================================================

    const GOOGLE_MAPS_API_KEY = "AIzaSyCy8sgS8Hdy_gmtSlTGIy87_3g2JWHyR4o";
    const DEFAULT_CENTER = { lat: 37.9838, lng: 23.7275 }; // Athens, Greece
    const DEFAULT_ZOOM = 11;
    const NEARBY_RADIUS_KM = 5; // Default radius for nearby search

    // Map ID for Google Maps
    const MAP_ID = 'de8670acc4bd10699eb9ccb1';  // Light theme map

    // Marker colors for different client types
    const MARKER_COLORS = {
        existing: '#4CAF50',
        potential: '#FF9800',
        appointment: '#2196F3',
        selected: '#FF5722',
        route: '#9C27B0'
    };

    // =============================================================================
    // MAIN MAPS MODULE
    // =============================================================================

    const Maps = {
        // Core Google Maps objects
        map: null,
        geocoder: null,

        // Markers and overlays
        clientMarkers: [],
        userLocationMarker: null,
        selectedMarkers: [],

        // UI state
        infoWindow: null,
        isInitialized: false,
        isLoadingMarkers: false, // Flag to prevent concurrent marker refreshes
        currentFilter: 'all', // 'all' or array of type IDs
        currentTypeFilter: 'all', // For filtering client types on map (deprecated, using currentFilter now)
        filterMode: 'or', // 'or', 'and', or 'or-and' - how to combine multiple filters


        // =============================================================================
        // INITIALIZATION
        // =============================================================================

        init: function() {
            console.log('🗺️ Initializing Maps module...');

            // Load Google Maps API
            this.loadGoogleMapsAPI();

            // Listen for tab changes
            if (window.SmartAgenda) {
                window.SmartAgenda.EventBus.on('tab:change', (tabName) => {
                    if (tabName === 'map' && !this.isInitialized) {
                        setTimeout(() => this.initializeMap(), 100);
                    } else if (tabName === 'map' && this.isInitialized) {
                        this.refreshMap();
                    }
                });

                // Listen for client data changes
                window.SmartAgenda.EventBus.on('data:clients:change', () => {
                    if (this.isInitialized) {
                        this.refreshClientMarkers();
                    }
                });

                // Listen for appointment changes - refresh client markers to update appointment counts
                window.SmartAgenda.EventBus.on('data:appointments:change', () => {
                    if (this.isInitialized) {
                        this.refreshClientMarkers(); // Refresh client markers to update appointment counts
                    }
                });

                // Listen for language changes - reload map with new language
                window.SmartAgenda.EventBus.on('language:change', (newLanguage) => {
                    console.log(`🌍 Language changed to: ${newLanguage}, reloading map...`);
                    this.reloadMapWithLanguage(newLanguage);
                });
            }

            console.log('✅ Maps module loaded');
        },

        loadGoogleMapsAPI: async function() {
            // Check if already loaded
            if (window.google && window.google.maps) {
                console.log('[Maps] Google Maps API already loaded');
                window.geocoder = new google.maps.Geocoder();
                return Promise.resolve();
            }

            console.log('[Maps] Loading Google Maps API (Modern Async)...');

            try {
                // Get current language from localStorage
                const appLanguage = localStorage.getItem('language') || 'en';
                // Map app language codes to Google Maps language codes
                const languageMap = {
                    'en': 'en',
                    'el': 'el',  // Greek
                    'ru': 'ru'   // Russian
                };
                const mapsLanguage = languageMap[appLanguage] || 'en';

                // Modern promise-based loading
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker,geometry&loading=async&v=weekly&language=${mapsLanguage}`;
                script.async = true;
                script.defer = true;

                const loadPromise = new Promise((resolve, reject) => {
                    script.onload = () => {
                        console.log('✅ Google Maps API loaded successfully');
                        window.geocoder = new google.maps.Geocoder();
                        resolve();
                    };
                    script.onerror = (error) => {
                        console.error('❌ Failed to load Google Maps API:', error);
                        reject(error);
                    };
                });

                document.head.appendChild(script);
                await loadPromise;
            } catch (error) {
                console.error('❌ Google Maps loading error:', error);
                window.SmartAgenda?.Toast?.error('Failed to load maps - check internet connection');

                // Update loading indicator
                const mapLoading = document.getElementById('map-loading');
                if (mapLoading) {
                    mapLoading.innerHTML = `
                        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                        <div style="color: var(--text-error); font-size: 14px;">Failed to load Google Maps</div>
                        <div style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">
                            Check your internet connection
                        </div>
                    `;
                }
                throw error;
            }
        },

        initializeMap: function() {
            console.log('[Maps] initializeMap called, isInitialized:', this.isInitialized);

            if (this.isInitialized) {
                console.log('[Maps] Map already initialized, skipping');
                return;
            }

            const mapElement = document.getElementById('map');
            const mapLoading = document.getElementById('map-loading');

            console.log('[Maps] Map element:', mapElement ? 'found' : 'NOT FOUND');
            console.log('[Maps] Google Maps API:', window.google ? 'loaded' : 'NOT LOADED');

            if (!mapElement || !window.google) {
                console.error('❌ Map element or Google Maps not available');
                if (mapLoading) {
                    mapLoading.innerHTML = `
                        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                        <div style="color: var(--text-error); font-size: 14px;">Failed to load map</div>
                        <div style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">
                            ${!mapElement ? 'Map element not found' : 'Google Maps API not loaded'}
                        </div>
                    `;
                }
                return;
            }

            console.log('Creating Google Map instance...');

            // Get saved position or use default
            const savedPosition = this.loadMapPosition();
            const center = savedPosition?.center || DEFAULT_CENTER;
            const zoom = savedPosition?.zoom || DEFAULT_ZOOM;

            console.log('[Maps] Creating map with center:', center, 'zoom:', zoom);

            try {
                // Create map with Map ID (enables Advanced Markers and Vector maps)
                this.map = new google.maps.Map(mapElement, {
                    mapId: MAP_ID,
                    center: center,
                    zoom: zoom,
                    zoomControl: false,        // Removed zoom +/- buttons
                    mapTypeControl: false,     // Removed Map/Satellite buttons
                    scaleControl: true,
                    streetViewControl: false,
                    rotateControl: false,      // Disable rotate control
                    fullscreenControl: false,  // Removed fullscreen button
                    gestureHandling: 'greedy',
                    tilt: 0,                   // Disable tilt/skew (force flat map)
                    heading: 0,                // Disable rotation (force north-up)
                    disableDefaultUI: false
                });
                console.log('[Maps] Google Map instance created successfully with Map ID');
            } catch (error) {
                console.error('❌ Failed to create map instance:', error);
                if (mapLoading) {
                    mapLoading.innerHTML = `
                        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                        <div style="color: var(--text-error); font-size: 14px;">Failed to create map</div>
                        <div style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">${error.message}</div>
                    `;
                }
                return;
            }

            // Initialize services
            this.geocoder = new google.maps.Geocoder();
            this.infoWindow = new google.maps.InfoWindow();

            // Hide native InfoWindow header and X button with CSS
            this.addInfoWindowStyles();

            // Export to window for global access
            window.map = this.map;
            window.geocoder = this.geocoder;

            // Setup event listeners
            this.setupMapListeners();

            // Add custom controls
            this.addMapControls();

            // Load markers
            this.refreshClientMarkers();

            // Try to show user location
            this.showUserLocation();

            this.isInitialized = true;

            // Hide loading indicator
            if (mapLoading) {
                mapLoading.style.display = 'none';
                console.log('[Maps] Loading indicator hidden');
            }

            // Force map to resize (fixes some rendering issues)
            setTimeout(() => {
                if (this.map) {
                    google.maps.event.trigger(this.map, 'resize');
                    console.log('[Maps] Map resized');
                }
            }, 100);

            console.log('✅ Map initialized successfully');
        },

        addInfoWindowStyles: function() {
            // Add CSS to hide native InfoWindow header and close button
            if (!document.getElementById('custom-infowindow-styles')) {
                const style = document.createElement('style');
                style.id = 'custom-infowindow-styles';
                style.textContent = `
                    /* Hide native InfoWindow close button */
                    .gm-style-iw-chr {
                        display: none !important;
                    }

                    /* Remove padding from InfoWindow container */
                    .gm-style .gm-style-iw-c {
                        padding: 0 !important;
                        border-radius: 10px !important;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                    }

                    /* Remove default scrolling container constraints */
                    .gm-style .gm-style-iw-d {
                        overflow: auto !important;
                        max-height: none !important;
                    }

                    /* Hide native close button (backup selector) */
                    .gm-style-iw button[aria-label="Close"] {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);
            }
        },

        setupMapListeners: function() {
            // Save map position on move
            let saveTimeout;
            this.map.addListener('center_changed', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => this.saveMapPosition(), 1000);
            });

            this.map.addListener('zoom_changed', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => this.saveMapPosition(), 1000);
            });
        },


        addMapControls: function() {
            // Create dropdown menu
            this.createMapDropdown();

            // Setup map menu button
            const mapMenuButton = document.getElementById('map-menu-button');
            if (mapMenuButton) {
                mapMenuButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleMapDropdown();
                });
            }

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                const dropdown = document.getElementById('map-dropdown-menu');
                if (dropdown && !dropdown.contains(e.target)) {
                    this.hideMapDropdown();
                }
            });
        },

        createMapDropdown: function() {
            // Remove existing dropdown if any
            const existingDropdown = document.getElementById('map-dropdown-menu');
            if (existingDropdown) {
                existingDropdown.remove();
            }

            // Create dropdown menu
            const dropdown = document.createElement('div');
            dropdown.id = 'map-dropdown-menu';
            dropdown.className = 'map-dropdown-menu';
            dropdown.style.display = 'none';

            dropdown.innerHTML = `
                <div class="map-dropdown-item" data-action="search">
                    <span class="map-dropdown-icon">🔍</span>
                    <span class="map-dropdown-label">Αναζήτηση</span>
                </div>
                <div class="map-dropdown-item" data-action="appointments">
                    <span class="map-dropdown-icon">📅</span>
                    <span class="map-dropdown-label">Ραντεβού</span>
                </div>
                <div class="map-dropdown-item" data-action="filters">
                    <span class="map-dropdown-icon">🔽</span>
                    <span class="map-dropdown-label">Φίλτρα</span>
                </div>
                <div class="map-dropdown-item" data-action="location">
                    <span class="map-dropdown-icon">📍</span>
                    <span class="map-dropdown-label">Η τοποθεσία μου</span>
                </div>
                <div class="map-dropdown-item" data-action="reset-view">
                    <span class="map-dropdown-icon">🧭</span>
                    <span class="map-dropdown-label">Επαναφορά Προβολής</span>
                </div>
            `;

            // Add event listeners
            dropdown.querySelectorAll('.map-dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const action = item.getAttribute('data-action');
                    this.handleDropdownAction(action);
                    this.hideMapDropdown();
                });
            });

            document.body.appendChild(dropdown);
        },

        toggleMapDropdown: function() {
            const dropdown = document.getElementById('map-dropdown-menu');
            const button = document.getElementById('map-menu-button');

            if (!dropdown || !button) return;

            if (dropdown.style.display === 'none') {
                // Position dropdown below button
                const buttonRect = button.getBoundingClientRect();
                dropdown.style.top = (buttonRect.bottom + 5) + 'px';
                dropdown.style.right = '10px';
                dropdown.style.display = 'block';

                // Animate in
                setTimeout(() => {
                    dropdown.style.opacity = '1';
                    dropdown.style.transform = 'translateY(0)';
                }, 10);
            } else {
                this.hideMapDropdown();
            }
        },

        hideMapDropdown: function() {
            const dropdown = document.getElementById('map-dropdown-menu');
            if (!dropdown) return;

            dropdown.style.opacity = '0';
            dropdown.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                dropdown.style.display = 'none';
            }, 200);
        },

        handleDropdownAction: function(action) {
            switch(action) {
                case 'search':
                    this.showNearbySearch();
                    break;
                case 'appointments':
                    this.showTodaysAppointments();
                    break;
                case 'filters':
                    this.showMapFilter();
                    break;
                case 'location':
                    this.centerOnUserLocation();
                    break;
                case 'reset-view':
                    this.resetMapView();
                    break;
            }
        },

        resetMapView: function() {
            if (!this.map) return;

            // Reset tilt (make map flat)
            this.map.setTilt(0);

            // Reset heading (north-up)
            this.map.setHeading(0);

            console.log('🧭 Map view reset - tilt and rotation restored to default');

            // Show toast notification
            if (window.SmartAgenda && window.SmartAgenda.Toast) {
                window.SmartAgenda.Toast.success('Η προβολή επαναφέρθηκε');
            }
        },

        createTopControlButton: function(icon, label) {
            const button = document.createElement('button');
            button.textContent = icon;
            button.title = label;
            button.style.cssText = `
                width: 36px;
                height: 36px;
                padding: 0;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 6px;
                cursor: pointer;
                font-size: 18px;
                color: var(--text-primary);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            button.addEventListener('mouseenter', () => {
                button.style.background = 'var(--primary-color)';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'var(--surface)';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });
            return button;
        },

        createTopControlButtonWithLabel: function(icon, label, i18nKey) {
            const container = document.createElement('div');
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            `;

            const button = document.createElement('button');
            button.textContent = icon;
            button.title = label;
            button.style.cssText = `
                width: 36px;
                height: 36px;
                padding: 0;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 6px;
                cursor: pointer;
                font-size: 18px;
                color: var(--text-primary);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            if (i18nKey) {
                labelEl.setAttribute('data-i18n', i18nKey);
                const i18n = window.SmartAgenda?.I18n;
                if (i18n) {
                    labelEl.textContent = i18n.translate(i18nKey);
                }
            }
            labelEl.style.cssText = `
                font-size: 10px;
                color: var(--text-secondary);
                text-align: center;
                white-space: nowrap;
            `;

            button.addEventListener('mouseenter', () => {
                button.style.background = 'var(--primary-color)';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'var(--surface)';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });

            container.appendChild(button);
            container.appendChild(labelEl);

            // Add the click event to the container for easier clicking
            container.addEventListener('click', (e) => {
                if (e.target !== button) {
                    button.click();
                }
            });

            return container;
        },

        createControlButton: function(icon, title) {
            const button = document.createElement('button');
            button.textContent = icon;
            button.title = title;
            button.style.cssText = `
                width: 40px;
                height: 40px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 8px;
                cursor: pointer;
                font-size: 20px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                transition: all 0.2s ease;
            `;
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.1)';
                button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
                button.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            });
            return button;
        },

        refreshMap: function() {
            if (!this.map) return;

            // Trigger resize to fix display issues
            google.maps.event.trigger(this.map, 'resize');

            // Refresh markers
            this.refreshClientMarkers();
        },

        reloadMapWithLanguage: async function(newLanguage) {
            console.log(`🌍 Reloading map with language: ${newLanguage}`);

            // Save current map position and zoom
            const currentPosition = this.map ? {
                center: {
                    lat: this.map.getCenter().lat(),
                    lng: this.map.getCenter().lng()
                },
                zoom: this.map.getZoom()
            } : null;

            // Show loading indicator
            const mapElement = document.getElementById('map');
            const mapContainer = document.getElementById('map-container');
            if (mapContainer) {
                const existingLoading = document.getElementById('map-loading');
                if (existingLoading) existingLoading.remove();

                const loadingDiv = document.createElement('div');
                loadingDiv.id = 'map-loading';
                loadingDiv.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                    <div style="color: var(--text-primary); font-size: 14px;">Reloading map...</div>
                `;
                loadingDiv.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: var(--background);
                    z-index: 1000;
                `;
                mapContainer.appendChild(loadingDiv);
            }

            // Remove old Google Maps API script
            const oldScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (oldScript) {
                oldScript.remove();
            }

            // Clear Google Maps objects
            if (window.google) {
                delete window.google;
            }

            // Reset initialization flag
            this.isInitialized = false;
            this.map = null;
            this.clientMarkers = [];

            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 300));

            // Reload Google Maps API with new language
            try {
                await this.loadGoogleMapsAPI();

                // Reinitialize map
                await this.initializeMap();

                // Restore position if we had one
                if (currentPosition && this.map) {
                    this.map.setCenter(currentPosition.center);
                    this.map.setZoom(currentPosition.zoom);
                }

                console.log(`✅ Map reloaded successfully with language: ${newLanguage}`);
            } catch (error) {
                console.error('❌ Error reloading map:', error);
            }
        },

        // =============================================================================
        // CLIENT MARKERS
        // =============================================================================

        /**
         * Get client coordinates supporting both old and new data structures
         * @param {Object} client - The client object
         * @returns {Object|null} Object with lat and lng properties, or null if not found
         */
        getClientCoordinates: function(client) {
            if (!client) return null;

            // Check old format (direct lat/lng properties)
            if (client.lat && client.lng) {
                return {
                    lat: parseFloat(client.lat),
                    lng: parseFloat(client.lng)
                };
            }

            // Check new format (addresses array with map type)
            if (client.addresses && Array.isArray(client.addresses)) {
                const mapAddress = client.addresses.find(addr => addr.type === 'map' && addr.lat && addr.lng);
                if (mapAddress) {
                    return {
                        lat: parseFloat(mapAddress.lat),
                        lng: parseFloat(mapAddress.lng)
                    };
                }
            }

            return null;
        },

        /**
         * Check if client has valid location coordinates
         * @param {Object} client - The client object
         * @returns {boolean} True if client has valid coordinates
         */
        hasClientLocation: function(client) {
            return this.getClientCoordinates(client) !== null;
        },

        refreshClientMarkers: function() {
            // Check if Google Maps is loaded and map is initialized
            if (!window.google || !this.map) {
                console.warn('[Maps] Google Maps not ready yet, skipping marker refresh');
                return;
            }

            // Prevent concurrent refreshes
            if (this.isLoadingMarkers) {
                console.warn('[Maps] Markers already loading, skipping refresh');
                return;
            }

            this.isLoadingMarkers = true;
            console.log('[Maps] Refreshing client markers...');

            // Clear existing markers (works with both old and new Markers API)
            this.clientMarkers.forEach(marker => {
                if (marker.map) {
                    marker.map = null; // Advanced Markers
                } else if (marker.setMap) {
                    marker.setMap(null); // Old Markers (fallback)
                }
            });
            this.clientMarkers = [];

            // Get clients from data manager
            let clients = window.SmartAgenda?.DataManager?.getAll('clients') || [];
            console.log('[Maps] Total clients in database:', clients.length);

            // Apply type filter if not 'all'
            if (this.currentFilter !== 'all' && Array.isArray(this.currentFilter) && this.currentFilter.length > 0) {
                const selectedTypes = this.currentFilter;
                clients = clients.filter(client => {
                    let clientTypesList = [];

                    // Support new clientTypes array
                    if (client.clientTypes && Array.isArray(client.clientTypes)) {
                        clientTypesList = client.clientTypes;
                    } else if (client.customerType) {
                        clientTypesList = [client.customerType];
                    }

                    if (clientTypesList.length === 0) return false;

                    // Apply filter logic based on mode
                    if (this.filterMode === 'and') {
                        // AND: client must have ALL selected types
                        return selectedTypes.every(typeId => clientTypesList.includes(typeId));
                    } else if (this.filterMode === 'or-and') {
                        // OR+AND: First 2 types use OR, rest use AND
                        const firstTwo = selectedTypes.slice(0, 2);
                        const rest = selectedTypes.slice(2);

                        // Client must have at least one of the first two
                        const hasFirstTwo = firstTwo.length === 0 || firstTwo.some(typeId => clientTypesList.includes(typeId));

                        // Client must have all of the rest
                        const hasRest = rest.every(typeId => clientTypesList.includes(typeId));

                        return hasFirstTwo && hasRest;
                    } else {
                        // OR: client must have AT LEAST ONE of the selected types
                        return selectedTypes.some(typeId => clientTypesList.includes(typeId));
                    }
                });
            } else if (this.currentTypeFilter !== 'all') {
                // Legacy support for single currentTypeFilter
                clients = clients.filter(client => {
                    if (client.clientTypes && Array.isArray(client.clientTypes)) {
                        return client.clientTypes.includes(this.currentTypeFilter);
                    }
                    return client.customerType === this.currentTypeFilter;
                });
            }

            // Count clients with location data (supports both old and new formats)
            const clientsWithLocation = clients.filter(c => this.hasClientLocation(c));
            console.log('[Maps] Clients with location data:', clientsWithLocation.length);

            // Load markers in batches to improve performance with many clients
            const BATCH_SIZE = 50;
            let currentBatch = 0;

            const loadBatch = () => {
                const startIdx = currentBatch * BATCH_SIZE;
                const endIdx = Math.min(startIdx + BATCH_SIZE, clientsWithLocation.length);

                for (let i = startIdx; i < endIdx; i++) {
                    const client = clientsWithLocation[i];
                    if (this.hasClientLocation(client)) {
                        this.addClientMarker(client);
                    }
                }

                currentBatch++;

                if (endIdx < clientsWithLocation.length) {
                    // Load next batch with a small delay to avoid blocking UI
                    setTimeout(() => loadBatch(), 50);
                } else {
                    console.log(`[Maps] ✅ Loaded ${this.clientMarkers.length} client markers on map`);
                    this.isLoadingMarkers = false; // Done loading
                }
            };

            loadBatch();
        },

        addClientMarker: async function(client) {
            const coords = this.getClientCoordinates(client);
            if (!coords) return; // Skip if no valid coordinates

            const position = coords;

            // Get marker color from client's primary type
            let markerColor = '#94a3b8'; // Default gray

            if (window.SmartAgenda?.Settings) {
                const availableTypes = window.SmartAgenda.Settings.getClientTypes();

                // Support both new and old client type formats
                if (client.clientTypes && client.clientTypes.length > 0) {
                    const primaryTypeId = client.primaryType || client.clientTypes[0];
                    const primaryType = availableTypes.find(t => t.id === primaryTypeId);
                    if (primaryType) {
                        markerColor = primaryType.color;
                    }
                } else if (client.customerType) {
                    // Legacy support
                    const type = availableTypes.find(t => t.id === client.customerType);
                    if (type) {
                        markerColor = type.color;
                    }
                }
            }

            try {
                // Create native pin with custom color using Advanced Markers API
                const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

                // Create a native pin element with custom color
                const pinElement = new PinElement({
                    background: markerColor,
                    borderColor: '#ffffff',
                    glyphColor: '#ffffff',
                    scale: 1.2
                });

                // Create Advanced Marker (much better performance than old Markers)
                const marker = new AdvancedMarkerElement({
                    map: this.map,
                    position: position,
                    title: client.name,
                    content: pinElement.element
                });

                // Store client data with marker
                marker.clientData = client;

                // Click listener
                marker.addListener('click', () => {
                    this.showClientInfoWindow(marker, client);
                });

                this.clientMarkers.push(marker);
            } catch (error) {
                console.error('Error creating Advanced Marker:', error);
                // Fallback to old marker if Advanced Markers fail
                this.addClientMarkerFallback(client, position, markerColor);
            }
        },

        // Fallback to old markers if Advanced Markers API fails
        addClientMarkerFallback: function(client, position, markerColor) {
            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: client.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: markerColor,
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                }
            });

            marker.clientData = client;
            marker.addListener('click', () => {
                this.showClientInfoWindow(marker, client);
            });

            this.clientMarkers.push(marker);
        },

        showClientInfoWindow: function(marker, client) {
            const content = this.createClientInfoContent(client);
            this.infoWindow.setContent(content);
            this.infoWindow.open(this.map, marker);

            // Pan map to ensure info window is fully visible (including X button)
            setTimeout(() => {
                // Get marker position
                const markerPosition = marker.position || marker.getPosition();
                if (markerPosition) {
                    // Pan with offset to ensure X button is visible
                    // Offset moves the center down so the info window fits above
                    const projection = this.map.getProjection();
                    if (projection) {
                        const scale = Math.pow(2, this.map.getZoom());
                        const pixelOffset = new google.maps.Point(0, -120 / scale); // Offset upwards

                        const worldPoint = projection.fromLatLngToPoint(markerPosition);
                        const newWorldPoint = new google.maps.Point(
                            worldPoint.x,
                            worldPoint.y + pixelOffset.y
                        );
                        const newCenter = projection.fromPointToLatLng(newWorldPoint);

                        this.map.panTo(newCenter);
                    } else {
                        // Fallback: simple pan to marker
                        this.map.panTo(markerPosition);
                    }
                }

                this.bindInfoWindowEvents(client);
            }, 100);
        },


        createClientInfoContent: function(client) {
            const isDark = document.body.classList.contains('dark') || document.body.getAttribute('data-theme') === 'dark';
            const bgColor = isDark ? '#1e293b' : '#ffffff';
            const textColor = isDark ? '#f1f5f9' : '#333333';
            const secondaryTextColor = isDark ? '#cbd5e1' : '#64748b';
            const borderColor = isDark ? '#334155' : '#e2e8f0';
            const surfaceColor = isDark ? '#0f172a' : '#f8fafc';
            const primaryColor = isDark ? '#3b82f6' : '#2563eb';
            const successColor = isDark ? '#22c55e' : '#10b981';
            const warningColor = isDark ? '#fbbf24' : '#f59e0b';
            const infoColor = isDark ? '#60a5fa' : '#3b82f6';

            // Get appointment count
            const appointments = window.SmartAgenda?.DataManager?.getAll('appointments') || [];
            const clientAppointments = appointments.filter(apt =>
                String(apt.client) === String(client.id) && !apt.completed
            );

            // Get location notes
            const locationNotes = client.locationNotes || '';

            // Get available client types for badges
            const availableTypes = window.SmartAgenda?.Settings?.getClientTypes() || [];

            return `
                <div style="background: ${bgColor}; color: ${textColor}; padding: 14px; max-width: 340px; position: relative;">
                    <!-- Custom Close Button -->
                    <button onclick="window.SmartAgenda.Maps.closeInfoWindow()"
                            style="position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border: none; background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; color: ${textColor}; border-radius: 50%; cursor: pointer; font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 10;"
                            onmouseover="this.style.background='${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}';"
                            onmouseout="this.style.background='${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}';"
                            title="Close">
                        ✕
                    </button>

                    <!-- Client Name -->
                    <h3 style="margin: 0 35px 10px 0; font-size: 17px; font-weight: 700; color: ${textColor}; cursor: pointer; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
                        onclick="window.SmartAgenda.Maps.openClientDetails('${client.id}')">
                        ${this.escapeHtml(client.name)}
                    </h3>

                    ${clientAppointments.length > 0 ? `
                        <div style="margin-bottom: 10px; padding: 8px; background: ${isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff'}; border-left: 3px solid ${primaryColor}; border-radius: 6px; cursor: pointer;"
                             onclick="event.stopPropagation(); window.SmartAgenda.Maps.showClientAppointments('${client.id}');"
                             title="Click to view appointments">
                            <div style="font-size: 12px; font-weight: 600; color: ${primaryColor};">
                                📅 ${clientAppointments.length} pending appointment${clientAppointments.length > 1 ? 's' : ''}
                            </div>
                        </div>
                    ` : ''}

                        <!-- Contact Info -->
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            ${client.phone ? `
                                <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: ${surfaceColor}; border-radius: 6px; border: 1px solid ${borderColor};">
                                    <span style="font-size: 15px;">📞</span>
                                    <a href="tel:${client.phone}" style="color: ${successColor}; text-decoration: none; font-weight: 600; font-size: 13px; flex: 1;">
                                        ${client.phone}
                                    </a>
                                </div>
                            ` : ''}

                            ${client.email ? `
                                <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: ${surfaceColor}; border-radius: 6px; border: 1px solid ${borderColor};">
                                    <span style="font-size: 15px;">📧</span>
                                    <a href="mailto:${client.email}" style="color: ${primaryColor}; text-decoration: none; font-weight: 600; font-size: 12px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        ${client.email}
                                    </a>
                                </div>
                            ` : ''}

                            ${(() => {
                                // Get address from new or old format
                                let displayAddress = client.address; // Old format

                                // Check new format (addresses array)
                                if (!displayAddress && client.addresses && Array.isArray(client.addresses)) {
                                    // Try to find address with type 'map' first (has coordinates)
                                    const mapAddress = client.addresses.find(addr => addr.type === 'map' && addr.value);
                                    if (mapAddress) {
                                        displayAddress = mapAddress.value;
                                    } else {
                                        // Fall back to any address
                                        const anyAddress = client.addresses.find(addr => addr.value);
                                        if (anyAddress) {
                                            displayAddress = anyAddress.value;
                                        }
                                    }
                                }

                                return displayAddress ? `
                                    <div style="display: flex; align-items: flex-start; gap: 6px; padding: 6px 8px; background: ${surfaceColor}; border-radius: 6px; border: 1px solid ${borderColor};">
                                        <span style="font-size: 15px;">📍</span>
                                        <span style="font-size: 12px; line-height: 1.4; color: ${secondaryTextColor}; flex: 1;">${this.escapeHtml(displayAddress)}</span>
                                    </div>
                                ` : '';
                            })()}
                        </div>

                        <!-- Client Types -->
                        ${(() => {
                            // Get client's types
                            let clientTypesList = [];
                            if (client.clientTypes && Array.isArray(client.clientTypes)) {
                                clientTypesList = client.clientTypes;
                            } else if (client.customerType) {
                                clientTypesList = [client.customerType];
                            }

                            if (clientTypesList.length > 0 && availableTypes.length > 0) {
                                const primaryTypeId = client.primaryType || clientTypesList[0];
                                const typesBadges = clientTypesList.map(typeId => {
                                    const type = availableTypes.find(t => t.id === typeId);
                                    if (!type) return '';
                                    const isPrimary = typeId === primaryTypeId;
                                    return `
                                        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: ${type.color}22; border: 1px solid ${type.color}; border-radius: 12px; font-size: 11px; font-weight: 600; color: ${type.color};">
                                            ${isPrimary ? '⭐' : ''}<span style="width: 8px; height: 8px; border-radius: 50%; background: ${type.color};"></span>${this.escapeHtml(type.name)}
                                        </span>
                                    `;
                                }).join('');

                                return `
                                    <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                                        ${typesBadges}
                                    </div>
                                `;
                            }
                            return '';
                        })()}

                        <!-- Location Notes -->
                        ${locationNotes ? `
                            <div style="margin-top: 8px; padding: 8px; background: ${isDark ? 'rgba(251, 191, 36, 0.15)' : '#fffbeb'}; border-left: 3px solid ${warningColor}; border-radius: 6px;">
                                <div style="font-weight: 700; font-size: 10px; margin-bottom: 4px; color: ${warningColor}; text-transform: uppercase; letter-spacing: 0.5px;">📝 Location Notes</div>
                                <div style="font-size: 12px; line-height: 1.4; color: ${textColor};">${this.escapeHtml(locationNotes)}</div>
                            </div>
                        ` : ''}

                        <!-- Action Buttons -->
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid ${borderColor};">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                                <button onclick="window.SmartAgenda.Maps.navigateToClient('${client.id}')"
                                        style="padding: 8px 10px; background: ${primaryColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';"
                                        onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                                    🧭 Navigate
                                </button>
                                <button onclick="window.SmartAgenda.Maps.editLocationNotes('${client.id}')"
                                        style="padding: 8px 10px; background: ${surfaceColor}; color: ${textColor}; border: 1px solid ${borderColor}; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.2s;"
                                        onmouseover="this.style.background='${borderColor}';"
                                        onmouseout="this.style.background='${surfaceColor}';">
                                    📝 Notes
                                </button>
                            </div>
                        </div>
                </div>
            `;
        },

        bindInfoWindowEvents: function(client) {
            // Events are handled via onclick attributes for now
            // This method is here for future enhancements
        },

        closeInfoWindow: function() {
            if (this.infoWindow) {
                this.infoWindow.close();
            }
        },

        // =============================================================================
        // NAVIGATE TO CLIENT (NATIVE APP INTEGRATION)
        // =============================================================================

        navigateToClient: function(clientId) {
            const clients = window.SmartAgenda.DataManager.getAll('clients');
            const client = clients.find(c => String(c.id) === String(clientId));

            const coords = this.getClientCoordinates(client);
            if (!client || !coords) {
                window.SmartAgenda.Toast.error('Client location not available');
                return;
            }

            this.infoWindow.close();

            // Check if running on mobile (Capacitor)
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                this.openNativeNavigation(client);
            } else {
                // Web fallback - open Google Maps in browser
                const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
                window.open(url, '_blank');
            }
        },

        openNativeNavigation: async function(client) {
            try {
                // Open Google Maps directly without asking
                const coords = this.getClientCoordinates(client);
                if (!coords) return;

                const destination = `${coords.lat},${coords.lng}`;

                if (window.Capacitor.getPlatform() === 'ios') {
                    // iOS - try to open Google Maps app first
                    window.location.href = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
                    // Fallback to Apple Maps if Google Maps not installed
                    setTimeout(() => {
                        window.location.href = `http://maps.apple.com/?daddr=${coords.lat},${coords.lng}`;
                    }, 500);
                } else {
                    // Android - use geo URI which typically opens Google Maps
                    window.location.href = `geo:0,0?q=${destination}(${encodeURIComponent(client.name)})`;
                }

                window.SmartAgenda.Toast.success('Opening Google Maps...');
            } catch (error) {
                console.error('Navigation error:', error);
                window.SmartAgenda.Toast.error('Could not open navigation');
            }
        },

        // =============================================================================
        // PHASE 1: LOCATION NOTES
        // =============================================================================

        editLocationNotes: async function(clientId) {
            const clients = window.SmartAgenda.DataManager.getAll('clients');
            const client = clients.find(c => String(c.id) === String(clientId));

            if (!client) return;

            this.infoWindow.close();

            const currentNotes = client.locationNotes || '';

            const content = `
                <div style="padding: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Location Notes for ${this.escapeHtml(client.name)}</label>
                    <textarea id="location-notes-input"
                              style="width: 100%; min-height: 100px; padding: 8px; border: 1px solid var(--border); border-radius: 6px; resize: vertical; font-family: inherit; background: var(--background); color: var(--text-primary);"
                              placeholder="e.g., Gate code: 1234, Park on the left, Ring twice..."></textarea>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                        Add parking instructions, gate codes, or access notes
                    </div>
                </div>
            `;

            // Set textarea value after modal is created to avoid escaping issues
            setTimeout(() => {
                const textarea = document.getElementById('location-notes-input');
                if (textarea) {
                    textarea.value = currentNotes;
                }
            }, 50);

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: '📝 Location Notes',
                content: content,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        action: 'cancel',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    },
                    {
                        label: 'Save',
                        type: 'primary',
                        action: 'save',
                        onClick: (modal) => {
                            const notes = document.getElementById('location-notes-input')?.value || '';
                            window.SmartAgenda.DataManager.update('clients', clientId, {
                                locationNotes: notes
                            });
                            window.SmartAgenda.Toast.success('Location notes saved');
                            window.SmartAgenda.UIComponents.closeModal(modal);

                            // Refresh the marker info window to show the updated notes
                            const updatedClient = window.SmartAgenda.DataManager.getById('clients', clientId);
                            if (updatedClient) {
                                const marker = this.clientMarkers.find(m => m.clientId === clientId);
                                if (marker && this.infoWindow) {
                                    const content = this.createClientInfoContent(updatedClient);
                                    this.infoWindow.setContent(content);
                                }
                            }
                        }
                    }
                ],
                size: 'small'
            });
        },

        // =============================================================================
        // PHASE 1: SEARCH NEARBY CLIENTS
        // =============================================================================

        showNearbySearch: async function() {
            if (!navigator.geolocation) {
                window.SmartAgenda.Toast.error('Geolocation not supported');
                return;
            }

            window.SmartAgenda.Toast.info('Getting your location...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    this.searchNearbyClients(userLat, userLng);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    window.SmartAgenda.Toast.error('Could not get your location');
                }
            );
        },

        searchNearbyClients: function(userLat, userLng) {
            const clients = window.SmartAgenda.DataManager.getAll('clients');
            const nearbyClients = [];

            clients.forEach(client => {
                const coords = this.getClientCoordinates(client);
                if (!coords) return;

                const distance = this.calculateDistance(
                    userLat, userLng,
                    coords.lat, coords.lng
                );

                if (distance <= NEARBY_RADIUS_KM) {
                    nearbyClients.push({
                        client: client,
                        distance: distance
                    });
                }
            });

            // Sort by distance
            nearbyClients.sort((a, b) => a.distance - b.distance);

            this.showNearbyClientsModal(nearbyClients, userLat, userLng);
        },

        showNearbyClientsModal: function(nearbyClients, userLat, userLng) {
            if (nearbyClients.length === 0) {
                window.SmartAgenda.Toast.info(`No clients within ${NEARBY_RADIUS_KM}km`);
                return;
            }

            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px; color: var(--text-secondary);">
                        Found ${nearbyClients.length} client${nearbyClients.length > 1 ? 's' : ''} within ${NEARBY_RADIUS_KM}km
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
                        ${nearbyClients.map(item => `
                            <div style="padding: 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s ease;"
                                 onmouseover="this.style.background='var(--surface)'"
                                 onmouseout="this.style.background='transparent'"
                                 onclick="window.SmartAgenda.Maps.showClientOnMap('${item.client.id}')">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">
                                            ${this.escapeHtml(item.client.name)}
                                        </div>
                                        ${item.client.address ? `
                                            <div style="font-size: 13px; color: var(--text-secondary);">
                                                📍 ${this.escapeHtml(item.client.address)}
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div style="font-weight: 600; color: var(--primary-color); font-size: 14px; margin-left: 12px;">
                                        ${item.distance.toFixed(1)} km
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            window.SmartAgenda.UIComponents.showModal({
                title: '🔍 Nearby Clients',
                content: content,
                buttons: [
                    {
                        label: 'Close',
                        type: 'secondary',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'medium'
            });

            // Show user location on map
            if (!this.userLocationMarker) {
                this.userLocationMarker = new google.maps.Marker({
                    position: { lat: userLat, lng: userLng },
                    map: this.map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3
                    },
                    title: 'Your Location',
                    zIndex: 2000
                });
            } else {
                this.userLocationMarker.setPosition({ lat: userLat, lng: userLng });
            }

            this.map.setCenter({ lat: userLat, lng: userLng });
            this.map.setZoom(13);
        },

        showClientOnMap: function(clientId, retries = 0) {
            // Close modal
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                if (modal.style.display !== 'none') {
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            });

            // If markers are still loading, wait and retry
            if (this.isLoadingMarkers && retries < 20) {
                console.log(`[Maps] Markers still loading, waiting... (retry ${retries + 1}/20)`);
                setTimeout(() => this.showClientOnMap(clientId, retries + 1), 200);
                return;
            }

            // Find and show client marker
            const marker = this.clientMarkers.find(m => String(m.clientData?.id) === String(clientId));
            if (marker) {
                // Get position from Advanced Marker (uses .position property, not .getPosition())
                const markerPosition = marker.position || (marker.getPosition ? marker.getPosition() : null);
                if (markerPosition) {
                    this.map.setCenter(markerPosition);
                    this.map.setZoom(16);

                    // Trigger click event to open info window
                    google.maps.event.trigger(marker, 'click');
                } else {
                    console.error('[Maps] Could not get marker position for client:', clientId);
                    window.SmartAgenda.Toast.error('Could not locate client on map');
                }
            } else {
                if (retries >= 20) {
                    console.error('[Maps] Client marker not found after waiting:', clientId);
                    window.SmartAgenda.Toast.warning('Client not found on map - ensure location is set');
                } else {
                    // Wait a bit longer and retry
                    console.log(`[Maps] Marker not found yet for client ${clientId}, waiting... (retry ${retries + 1}/20)`);
                    setTimeout(() => this.showClientOnMap(clientId, retries + 1), 200);
                }
            }
        },

        // =============================================================================
        // HELPER FUNCTIONS
        // =============================================================================

        getUserPosition: function() {
            return new Promise((resolve) => {
                if (!navigator.geolocation) {
                    resolve(null);
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    () => resolve(null),
                    { timeout: 5000 }
                );
            });
        },

        // =============================================================================
        // PHASE 2: TODAY'S APPOINTMENTS MAPPING
        // =============================================================================

        showTodaysAppointments: function() {
            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todaysAppointments = appointments.filter(apt => {
                if (!apt.date) return false;
                const aptDate = new Date(apt.date);
                aptDate.setHours(0, 0, 0, 0);
                return aptDate.getTime() === today.getTime();
            });

            if (todaysAppointments.length === 0) {
                window.SmartAgenda.Toast.info('No appointments for today');
                return;
            }

            // Filter appointments with client locations
            const appointmentsWithLocations = todaysAppointments.filter(apt => {
                if (!apt.client) return false;
                const client = window.SmartAgenda.DataManager.getById('clients', apt.client);
                return client && this.hasClientLocation(client);
            });

            if (appointmentsWithLocations.length === 0) {
                window.SmartAgenda.Toast.warning('No appointments have client locations');
                return;
            }

            // Focus on appointments
            this.focusOnAppointments(appointmentsWithLocations);

            window.SmartAgenda.Toast.success(`Showing ${appointmentsWithLocations.length} appointment${appointmentsWithLocations.length > 1 ? 's' : ''}`);
        },

        focusOnAppointments: function(appointments) {
            if (appointments.length === 0) return;

            const bounds = new google.maps.LatLngBounds();

            appointments.forEach(apt => {
                const client = window.SmartAgenda.DataManager.getById('clients', apt.client);
                const coords = this.getClientCoordinates(client);
                if (coords) {
                    bounds.extend(new google.maps.LatLng(coords.lat, coords.lng));
                }
            });

            this.map.fitBounds(bounds);

            // Add some padding
            if (appointments.length === 1) {
                this.map.setZoom(15);
            }
        },

        // =============================================================================
        // MAP TYPE FILTER
        // =============================================================================

        showMapFilter: function() {
            const availableTypes = window.SmartAgenda.Settings?.getClientTypes() || [];

            // Get all clients and count by type
            const allClients = window.SmartAgenda.DataManager.getAll('clients');
            const totalCount = allClients.length;

            // Count clients per type
            const typeCounts = {};
            typeCounts['all'] = totalCount;
            availableTypes.forEach(type => {
                typeCounts[type.id] = allClients.filter(client => {
                    if (client.clientTypes && Array.isArray(client.clientTypes)) {
                        return client.clientTypes.includes(type.id);
                    }
                    return client.customerType === type.id;
                }).length;
            });

            // Determine selected types
            const selectedTypes = this.currentFilter === 'all' ? [] : (Array.isArray(this.currentFilter) ? this.currentFilter : []);

            const content = `
                <div class="filter-menu" style="padding: 16px;">
                    <!-- Explanation -->
                    <div style="margin-bottom: 16px; padding: 12px; background: var(--surface); border-radius: 6px; font-size: 12px; color: var(--text-secondary);">
                        <div style="margin-bottom: 8px;"><strong>Filter Modes:</strong></div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div>
                                <div style="margin-bottom: 2px;"><span style="font-size: 16px;">⭕</span> <strong>OR</strong></div>
                                <div style="font-size: 11px;">Show clients with ANY of the selected types</div>
                            </div>
                            <div>
                                <div style="margin-bottom: 2px;"><span style="font-size: 16px;">⬜</span> <strong>AND</strong></div>
                                <div style="font-size: 11px;">Show clients with ALL selected types</div>
                            </div>
                            <div>
                                <div style="margin-bottom: 2px;"><span style="font-size: 16px;">🔀</span> <strong>OR+AND</strong></div>
                                <div style="font-size: 11px;">First 2 types use OR, rest use AND</div>
                            </div>
                        </div>
                    </div>

                    <!-- Filter Mode Buttons -->
                    <div style="display: flex; gap: 6px; margin-bottom: 16px;">
                        <button id="filter-mode-or" class="btn-${this.filterMode === 'or' ? 'primary' : 'secondary'}" style="flex: 1; padding: 6px; font-size: 12px;">
                            <span style="font-size: 14px; margin-right: 2px;">⭕</span>
                            <span>OR</span>
                        </button>
                        <button id="filter-mode-and" class="btn-${this.filterMode === 'and' ? 'primary' : 'secondary'}" style="flex: 1; padding: 6px; font-size: 12px;">
                            <span style="font-size: 14px; margin-right: 2px;">⬜</span>
                            <span>AND</span>
                        </button>
                        <button id="filter-mode-or-and" class="btn-${this.filterMode === 'or-and' ? 'primary' : 'secondary'}" style="flex: 1; padding: 6px; font-size: 12px;">
                            <span style="font-size: 14px; margin-right: 2px;">🔀</span>
                            <span>OR+AND</span>
                        </button>
                    </div>

                    <!-- All Clients Option -->
                    <div class="filter-option" data-filter="all" style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; cursor: pointer; border-radius: 6px; background: ${this.currentFilter === 'all' ? 'var(--primary-color)22' : 'var(--surface)'}; border: 1px solid ${this.currentFilter === 'all' ? 'var(--primary-color)' : 'var(--border)'};">
                        <input type="radio" name="filter-all" ${this.currentFilter === 'all' ? 'checked' : ''} style="margin-right: 12px; cursor: pointer;">
                        <span style="flex: 1; font-weight: 500;">All Clients</span>
                        <span style="color: var(--text-secondary); font-size: 13px;">${typeCounts['all']}</span>
                    </div>

                    <!-- Client Types -->
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${availableTypes.map(type => `
                            <div class="filter-type-option" data-type-id="${type.id}" style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; cursor: pointer; border-radius: 6px; background: ${selectedTypes.includes(type.id) ? 'var(--primary-color)22' : 'var(--surface)'}; border: 1px solid ${selectedTypes.includes(type.id) ? 'var(--primary-color)' : 'var(--border)'};">
                                <input type="checkbox" ${selectedTypes.includes(type.id) ? 'checked' : ''} style="margin-right: 12px; cursor: pointer;">
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: ${type.color}; margin-right: 12px;"></div>
                                <span style="flex: 1;">${this.escapeHtml(type.name)}</span>
                                <span style="color: var(--text-secondary); font-size: 13px;">${typeCounts[type.id] || 0}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Filter by Client Type',
                content: content,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        action: 'cancel',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    },
                    {
                        label: 'Apply Filter',
                        type: 'primary',
                        action: 'apply',
                        onClick: (modal) => {
                            this.refreshClientMarkers();
                            window.SmartAgenda.UIComponents.closeModal(modal);

                            const count = this.currentFilter === 'all' ? totalCount : selectedTypes.length;
                            window.SmartAgenda.Toast.success(`Filter applied (${this.filterMode.toUpperCase()} mode)`);
                        }
                    }
                ],
                size: 'medium'
            });

            // Bind filter mode buttons
            const orButton = modal.querySelector('#filter-mode-or');
            const andButton = modal.querySelector('#filter-mode-and');
            const orAndButton = modal.querySelector('#filter-mode-or-and');

            orButton?.addEventListener('click', () => {
                this.filterMode = 'or';
                orButton.className = 'btn-primary';
                andButton.className = 'btn-secondary';
                orAndButton.className = 'btn-secondary';
            });

            andButton?.addEventListener('click', () => {
                this.filterMode = 'and';
                andButton.className = 'btn-primary';
                orButton.className = 'btn-secondary';
                orAndButton.className = 'btn-secondary';
            });

            orAndButton?.addEventListener('click', () => {
                this.filterMode = 'or-and';
                orAndButton.className = 'btn-primary';
                orButton.className = 'btn-secondary';
                andButton.className = 'btn-secondary';
            });

            // Bind "All Clients" option
            const allOption = modal.querySelector('[data-filter="all"]');
            allOption?.addEventListener('click', () => {
                this.currentFilter = 'all';
                this.currentTypeFilter = 'all';
                modal.querySelector('[name="filter-all"]').checked = true;

                // Uncheck all type checkboxes
                modal.querySelectorAll('.filter-type-option input[type="checkbox"]').forEach(cb => cb.checked = false);

                // Update styling
                allOption.style.background = 'var(--primary-color)22';
                allOption.style.borderColor = 'var(--primary-color)';
                modal.querySelectorAll('.filter-type-option').forEach(opt => {
                    opt.style.background = 'var(--surface)';
                    opt.style.borderColor = 'var(--border)';
                });
            });

            // Bind type filter options (checkboxes for multiple selection)
            modal.querySelectorAll('.filter-type-option').forEach(option => {
                const updateFilterState = () => {
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    const typeId = option.dataset.typeId;
                    // FIX: Use current filter state instead of initial snapshot
                    let newSelectedTypes = Array.isArray(this.currentFilter) && this.currentFilter !== 'all' ? [...this.currentFilter] : [];

                    if (checkbox.checked) {
                        if (!newSelectedTypes.includes(typeId)) {
                            newSelectedTypes.push(typeId);
                        }
                    } else {
                        newSelectedTypes = newSelectedTypes.filter(id => id !== typeId);
                    }

                    // Update current filter
                    if (newSelectedTypes.length === 0) {
                        this.currentFilter = 'all';
                        this.currentTypeFilter = 'all';
                        modal.querySelector('[name="filter-all"]').checked = true;
                    } else {
                        this.currentFilter = newSelectedTypes;
                        this.currentTypeFilter = newSelectedTypes[0]; // Set first one for legacy
                        modal.querySelector('[name="filter-all"]').checked = false;
                    }

                    // Update styling
                    if (checkbox.checked) {
                        option.style.background = 'var(--primary-color)22';
                        option.style.borderColor = 'var(--primary-color)';
                    } else {
                        option.style.background = 'var(--surface)';
                        option.style.borderColor = 'var(--border)';
                    }

                    // Update "All" option styling
                    if (this.currentFilter === 'all') {
                        allOption.style.background = 'var(--primary-color)22';
                        allOption.style.borderColor = 'var(--primary-color)';
                    } else {
                        allOption.style.background = 'var(--surface)';
                        allOption.style.borderColor = 'var(--border)';
                    }
                };

                // Handle click on the option div
                option.addEventListener('click', (e) => {
                    if (e.target.type === 'checkbox') return; // Let checkbox handle itself
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                    updateFilterState();
                });

                // Handle direct click on checkbox
                const checkbox = option.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.addEventListener('change', () => {
                        updateFilterState();
                    });
                }
            });
        },

        // =============================================================================
        // PHASE 2: CHECK-IN SYSTEM
        // =============================================================================

        checkInAtClient: async function(clientId) {
            const client = window.SmartAgenda.DataManager.getById('clients', clientId);
            if (!client) return;

            this.infoWindow.close();

            // Get user location for check-in verification
            try {
                const position = await this.getUserPosition();

                // Ask for notes
                const content = `
                    <div style="padding: 16px;">
                        <div style="margin-bottom: 16px;">
                            <strong>Check-in at: ${this.escapeHtml(client.name)}</strong>
                        </div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Visit Notes</label>
                        <textarea id="checkin-notes"
                                  style="width: 100%; min-height: 100px; padding: 8px; border: 1px solid var(--border); border-radius: 6px; resize: vertical; font-family: inherit; background: var(--background); color: var(--text-primary);"
                                  placeholder="What did you do during this visit?"></textarea>
                    </div>
                `;

                const modal = window.SmartAgenda.UIComponents.showModal({
                    title: '✓ Check In',
                    content: content,
                    buttons: [
                        {
                            label: 'Cancel',
                            type: 'secondary',
                            action: 'cancel',
                            onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                        },
                        {
                            label: 'Check In',
                            type: 'primary',
                            action: 'checkin',
                            onClick: (modal) => {
                                const notes = document.getElementById('checkin-notes')?.value || '';

                                // Create interaction instead of old check-in
                                const interaction = {
                                    id: Date.now().toString(),
                                    clientId: clientId,
                                    type: 'checkin',
                                    date: new Date().toISOString(),
                                    notes: notes,
                                    userLat: position?.lat || null,
                                    userLng: position?.lng || null,
                                    createdAt: new Date().toISOString()
                                };

                                window.SmartAgenda.DataManager.add('interactions', interaction);

                                // Update client's lastContact
                                window.SmartAgenda.DataManager.update('clients', clientId, {
                                    lastContact: interaction.date,
                                    lastVisit: interaction.date
                                });

                                window.SmartAgenda.UIComponents.closeModal(modal);
                                window.SmartAgenda.Toast.success('Checked in successfully!');
                            }
                        }
                    ],
                    size: 'small'
                });

            } catch (error) {
                console.error('Check-in error:', error);
                window.SmartAgenda.Toast.error('Check-in failed');
            }
        },

        // =============================================================================
        // USER LOCATION
        // =============================================================================

        showUserLocation: function() {
            if (!navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    if (!this.userLocationMarker) {
                        this.userLocationMarker = new google.maps.Marker({
                            position: pos,
                            map: this.map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 12,
                                fillColor: '#4285F4',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 3
                            },
                            title: 'Your Location',
                            zIndex: 2000
                        });
                    } else {
                        this.userLocationMarker.setPosition(pos);
                    }
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
            );
        },

        centerOnUserLocation: function() {
            if (!navigator.geolocation) {
                window.SmartAgenda.Toast.error('Geolocation not supported');
                return;
            }

            window.SmartAgenda.Toast.info('Getting your location...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    this.map.setCenter(pos);
                    this.map.setZoom(15);

                    if (!this.userLocationMarker) {
                        this.userLocationMarker = new google.maps.Marker({
                            position: pos,
                            map: this.map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 12,
                                fillColor: '#4285F4',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 3
                            },
                            title: 'Your Location',
                            zIndex: 2000
                        });
                    } else {
                        this.userLocationMarker.setPosition(pos);
                    }

                    window.SmartAgenda.Toast.success('Location found');
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    window.SmartAgenda.Toast.error('Could not get your location');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        },

        // =============================================================================
        // UTILITY FUNCTIONS
        // =============================================================================

        calculateDistance: function(lat1, lon1, lat2, lon2) {
            // Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = this.toRad(lat2 - lat1);
            const dLon = this.toRad(lon2 - lon1);

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        },

        toRad: function(degrees) {
            return degrees * (Math.PI / 180);
        },

        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        openClientDetails: function(clientId) {
            this.infoWindow.close();

            // Open client detail view (not edit modal)
            const client = window.SmartAgenda.DataManager.getById('clients', clientId);
            if (client && window.SmartAgenda.ClientDetailView) {
                window.SmartAgenda.ClientDetailView.show(client);
            }
        },

        showClientAppointments: function(clientId) {
            this.infoWindow.close();

            // Get client and their appointments
            const client = window.SmartAgenda.DataManager.getById('clients', clientId);
            if (!client) return;

            const appointments = window.SmartAgenda.DataManager.getAll('appointments');
            const clientAppointments = appointments.filter(apt =>
                String(apt.client) === String(clientId) && !apt.completed
            ).sort((a, b) => new Date(a.date) - new Date(b.date));

            if (clientAppointments.length === 0) {
                window.SmartAgenda.Toast.info('No pending appointments for this client');
                return;
            }

            // Build modal content
            const content = `
                <div style="max-height: 400px; overflow-y: auto;">
                    ${clientAppointments.map(apt => {
                        const date = new Date(apt.date);
                        const dateStr = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                        const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                        const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
                        const priorityColor = priorityColors[apt.priority] || '#94a3b8';
                        const currency = window.SmartAgenda.State.get('currentCurrency') || '€';

                        return `
                            <div style="padding: 16px; margin-bottom: 12px; background: var(--surface); border-radius: 8px; border-left: 4px solid ${priorityColor}; cursor: pointer; transition: all 0.2s;"
                                 onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';"
                                 onmouseout="this.style.transform=''; this.style.boxShadow='';"
                                 onclick="window.SmartAgenda.Maps.viewAppointment('${apt.id}')">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <div>
                                        <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); margin-bottom: 4px;">${dateStr}</div>
                                        <div style="font-size: 13px; color: var(--text-secondary);">${timeStr}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <span style="display: inline-block; padding: 4px 10px; background: ${priorityColor}; color: white; border-radius: 12px; font-size: 11px; font-weight: 600; margin-bottom: 4px;">
                                            ${(apt.priority || 'medium').toUpperCase()}
                                        </span>
                                        ${apt.amount ? `<div style="font-weight: 600; font-size: 14px; color: var(--success);">${currency}${parseFloat(apt.amount).toFixed(2)}</div>` : ''}
                                    </div>
                                </div>
                                ${apt.desc ? `
                                    <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border);">
                                        ${this.escapeHtml(this.stripHtml(apt.desc).substring(0, 100))}${this.stripHtml(apt.desc).length > 100 ? '...' : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            // Show modal
            window.SmartAgenda.UIComponents.showModal({
                title: `Appointments for ${client.name}`,
                content: content,
                buttons: [
                    {
                        label: 'Close',
                        type: 'secondary',
                        action: 'close',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'medium'
            });
        },

        viewAppointment: function(appointmentId) {
            // Close any open modals
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => window.SmartAgenda.UIComponents.closeModal(modal));

            // Switch to appointments tab
            if (window.SmartAgenda?.Navigation) {
                window.SmartAgenda.Navigation.switchTab('appointments');
            }

            // Open appointment modal after a short delay
            setTimeout(() => {
                const appointment = window.SmartAgenda.DataManager.getById('appointments', appointmentId);
                if (appointment && window.SmartAgenda.Appointments) {
                    window.SmartAgenda.Appointments.showAppointmentModal(appointment);
                }
            }, 200);
        },

        stripHtml: function(html) {
            if (!html) return '';
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent || div.innerText || '';
        },

        saveMapPosition: function() {
            if (!this.map) return;

            const center = this.map.getCenter();
            const zoom = this.map.getZoom();

            try {
                localStorage.setItem('mapPosition', JSON.stringify({
                    center: {
                        lat: center.lat(),
                        lng: center.lng()
                    },
                    zoom: zoom
                }));
            } catch (error) {
                console.warn('Could not save map position:', error);
            }
        },

        loadMapPosition: function() {
            try {
                const saved = localStorage.getItem('mapPosition');
                return saved ? JSON.parse(saved) : null;
            } catch (error) {
                console.warn('Could not load map position:', error);
                return null;
            }
        }
    };

    // =============================================================================
    // GLOBAL CALLBACK FOR GOOGLE MAPS API
    // =============================================================================

    window.initializeGoogleMaps = function() {
        console.log('Google Maps API loaded');
        window.geocoder = new google.maps.Geocoder();

        // Initialize map if we're on the map tab
        const mapTab = document.getElementById('map-tab');
        if (mapTab && mapTab.classList.contains('active')) {
            setTimeout(() => Maps.initializeMap(), 100);
        }
    };

    // =============================================================================
    // EXPORTS
    // =============================================================================

    // Register with SmartAgenda
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => Maps.init());
        window.SmartAgenda.Maps = Maps;
    }

    // Export functions for global access
    window.loadCustomerMarkers = () => Maps.refreshClientMarkers();
    window.initMapSystem = () => Maps.initializeMap();
    window.initializeGoogleMap = () => Maps.initializeMap();

    console.log('Maps module loaded');

})();
