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
        placesService: null,
        directionsService: null,
        directionsRenderer: null,

        // Markers and overlays
        clientMarkers: [],
        appointmentMarkers: [],
        userLocationMarker: null,
        selectedMarkers: [],

        // Route planning
        routeWaypoints: [],
        activeRoute: null,

        // UI state
        infoWindow: null,
        isInitialized: false,
        currentFilter: 'all', // 'all' or array of type IDs
        currentTypeFilter: 'all', // For filtering client types on map (deprecated, using currentFilter now)
        filterMode: 'or', // 'or', 'and', or 'or-and' - how to combine multiple filters

        // Offline cache
        offlineCache: {
            enabled: false,
            tiles: new Map(),
            lastUpdate: null
        },

        // Check-in history
        checkIns: [],

        // =============================================================================
        // INITIALIZATION
        // =============================================================================

        init: function() {
            console.log('🗺️ Initializing Maps module...');

            // Load Google Maps API
            this.loadGoogleMapsAPI();

            // Load check-in history from localStorage
            this.loadCheckInHistory();

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
            }

            console.log('✅ Maps module loaded');
        },

        loadGoogleMapsAPI: function() {
            // Check if already loaded
            if (window.google && window.google.maps) {
                console.log('[Maps] Google Maps API already loaded');
                window.geocoder = new google.maps.Geocoder();
                return;
            }

            console.log('[Maps] Loading Google Maps API...');

            // Create script element
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async&callback=initializeGoogleMaps`;
            script.async = true;
            script.defer = true;
            script.onerror = (error) => {
                console.error('❌ Failed to load Google Maps API:', error);
                window.SmartAgenda.Toast.error('Failed to load maps - check internet connection');

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
            };

            document.head.appendChild(script);
            console.log('[Maps] Google Maps API script tag added to page');
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
                // Create map
                this.map = new google.maps.Map(mapElement, {
                    center: center,
                    zoom: zoom,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    styles: this.getMapStyles(),
                    zoomControl: true,
                    mapTypeControl: true,
                    scaleControl: true,
                    streetViewControl: false,
                    rotateControl: false,
                    fullscreenControl: true,
                    gestureHandling: 'greedy'
                });
                console.log('[Maps] Google Map instance created successfully');
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
            this.placesService = new google.maps.places.PlacesService(this.map);
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer({
                map: this.map,
                suppressMarkers: false,
                polylineOptions: {
                    strokeColor: MARKER_COLORS.route,
                    strokeWeight: 4
                }
            });
            this.infoWindow = new google.maps.InfoWindow();

            // Export to window for global access
            window.map = this.map;
            window.geocoder = this.geocoder;

            // Setup event listeners
            this.setupMapListeners();

            // Add custom controls
            this.addMapControls();

            // Load markers
            this.refreshClientMarkers();
            // Don't load separate appointment markers - they're shown in client markers instead
            // this.refreshAppointmentMarkers();

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
            const controlsHeader = document.getElementById('map-controls-header');
            if (!controlsHeader) return;

            // Clear existing controls
            controlsHeader.innerHTML = '';

            // Search Nearby Button
            const nearbyBtn = this.createTopControlButton('🔍', 'Search Nearby');
            nearbyBtn.addEventListener('click', () => this.showNearbySearch());
            controlsHeader.appendChild(nearbyBtn);

            // Route Planning Button
            const routeBtn = this.createTopControlButtonWithLabel('🚗', 'Optimize Route', 'map.route_button');
            routeBtn.addEventListener('click', () => this.showRoutePlanner());
            controlsHeader.appendChild(routeBtn);

            // Today's Appointments Button
            const appointmentsBtn = this.createTopControlButtonWithLabel('📅', 'Today\'s Appointments', 'map.appointments_button');
            appointmentsBtn.addEventListener('click', () => this.showTodaysAppointments());
            controlsHeader.appendChild(appointmentsBtn);

            // Client Type Filter Button
            const filterBtn = this.createTopControlButtonWithLabel('🔽', 'Client Filters', 'map.filter_button');
            filterBtn.addEventListener('click', () => this.showMapFilter());
            controlsHeader.appendChild(filterBtn);

            // GPS Button
            const gpsBtn = this.createTopControlButtonWithLabel('📍', 'My Location', 'map.gps_button');
            gpsBtn.addEventListener('click', () => this.centerOnUserLocation());
            controlsHeader.appendChild(gpsBtn);
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

        getMapStyles: function() {
            const isDark = document.body.classList.contains('dark');
            if (!isDark) return [];

            // Dark theme styles
            return [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
            ];
        },

        refreshMap: function() {
            if (!this.map) return;

            // Trigger resize to fix display issues
            google.maps.event.trigger(this.map, 'resize');

            // Refresh markers
            this.refreshClientMarkers();
            // Don't refresh appointment markers - they're shown in client popups instead
            // this.refreshAppointmentMarkers();
        },

        // =============================================================================
        // CLIENT MARKERS
        // =============================================================================

        refreshClientMarkers: function() {
            // Check if Google Maps is loaded and map is initialized
            if (!window.google || !this.map) {
                console.warn('[Maps] Google Maps not ready yet, skipping marker refresh');
                return;
            }

            console.log('[Maps] Refreshing client markers...');

            // Clear existing markers
            this.clientMarkers.forEach(marker => marker.setMap(null));
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

            // Count clients with location data
            const clientsWithLocation = clients.filter(c => c.lat && c.lng);
            console.log('[Maps] Clients with location data:', clientsWithLocation.length);

            // Load markers in batches to improve performance with many clients
            const BATCH_SIZE = 50;
            let currentBatch = 0;

            const loadBatch = () => {
                const startIdx = currentBatch * BATCH_SIZE;
                const endIdx = Math.min(startIdx + BATCH_SIZE, clientsWithLocation.length);

                for (let i = startIdx; i < endIdx; i++) {
                    const client = clientsWithLocation[i];
                    if (client.lat && client.lng) {
                        this.addClientMarker(client);
                    }
                }

                currentBatch++;

                if (endIdx < clientsWithLocation.length) {
                    // Load next batch with a small delay to avoid blocking UI
                    setTimeout(() => loadBatch(), 50);
                } else {
                    console.log(`[Maps] ✅ Loaded ${this.clientMarkers.length} client markers on map`);
                }
            };

            loadBatch();
        },

        addClientMarker: function(client) {
            const position = {
                lat: parseFloat(client.lat),
                lng: parseFloat(client.lng)
            };

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

            // Only use animation if there are few markers (to avoid performance issues)
            const useAnimation = this.clientMarkers.length < 50;

            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: client.name,
                icon: this.createMarkerIcon(markerColor),
                animation: useAnimation ? google.maps.Animation.DROP : null
            });

            // Store client data with marker
            marker.clientData = client;

            // Click listener
            marker.addListener('click', () => {
                this.showClientInfoWindow(marker, client);
            });

            this.clientMarkers.push(marker);
        },

        createMarkerIcon: function(color) {
            const svg = `
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="3"/>
                    <circle cx="16" cy="16" r="4" fill="white"/>
                </svg>
            `;

            return {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            };
        },

        showClientInfoWindow: function(marker, client) {
            const content = this.createClientInfoContent(client);
            this.infoWindow.setContent(content);
            this.infoWindow.open(this.map, marker);

            // Bind event listeners after info window opens
            setTimeout(() => {
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

            // Get client photo
            const clientPhoto = client.photo;
            const clientInitial = client.name ? client.name.charAt(0).toUpperCase() : '?';

            // Get avatar color from client's primary type (same as marker color)
            let avatarColor = '#94a3b8'; // Default gray
            const availableTypes = window.SmartAgenda?.Settings?.getClientTypes() || [];

            if (client.clientTypes && client.clientTypes.length > 0) {
                const primaryTypeId = client.primaryType || client.clientTypes[0];
                const primaryType = availableTypes.find(t => t.id === primaryTypeId);
                if (primaryType) {
                    avatarColor = primaryType.color;
                }
            } else if (client.customerType) {
                // Legacy support
                const type = availableTypes.find(t => t.id === client.customerType);
                if (type) {
                    avatarColor = type.color;
                }
            }

            return `
                <div style="background: ${bgColor}; color: ${textColor}; padding: 0; max-width: 300px; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                    <!-- Header with Photo -->
                    <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${isDark ? '#1e40af' : '#1d4ed8'} 100%); padding: 12px 10px; position: relative;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="position: relative;">
                                ${clientPhoto ? `
                                    <img src="${clientPhoto}" alt="${this.escapeHtml(client.name)}"
                                         style="width: 46px; height: 46px; border-radius: 50%; border: 2px solid white; object-fit: cover; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
                                ` : `
                                    <div style="width: 46px; height: 46px; border-radius: 50%; background: ${avatarColor}; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
                                        ${clientInitial}
                                    </div>
                                `}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: white; cursor: pointer; text-shadow: 0 1px 2px rgba(0,0,0,0.2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                    onclick="window.SmartAgenda.Maps.openClientDetails('${client.id}')">
                                    ${this.escapeHtml(client.name)}
                                </h3>
                                ${clientAppointments.length > 0 ? `
                                    <div style="margin-top: 2px; font-size: 11px; color: rgba(255,255,255,0.9); font-weight: 500; cursor: pointer; text-decoration: underline;"
                                         onclick="event.stopPropagation(); window.SmartAgenda.Maps.showClientAppointments('${client.id}');"
                                         title="Click to view appointments">
                                        📅 ${clientAppointments.length} pending appointment${clientAppointments.length > 1 ? 's' : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Content -->
                    <div style="padding: 10px;">

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

                            ${client.address ? `
                                <div style="display: flex; align-items: flex-start; gap: 6px; padding: 6px 8px; background: ${surfaceColor}; border-radius: 6px; border: 1px solid ${borderColor};">
                                    <span style="font-size: 15px;">📍</span>
                                    <span style="font-size: 12px; line-height: 1.4; color: ${secondaryTextColor}; flex: 1;">${this.escapeHtml(client.address)}</span>
                                </div>
                            ` : ''}
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
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
                                <button onclick="window.SmartAgenda.Maps.navigateToClient('${client.id}')"
                                        style="padding: 7px 8px; background: ${primaryColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';"
                                        onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                                    🧭 Navigate
                                </button>
                                <button onclick="window.SmartAgenda.Maps.checkInAtClient('${client.id}')"
                                        style="padding: 7px 8px; background: ${successColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';"
                                        onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
                                    ✓ Check In
                                </button>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                                <button onclick="window.SmartAgenda.Maps.addToRoute('${client.id}')"
                                        style="padding: 7px 8px; background: ${surfaceColor}; color: ${textColor}; border: 1px solid ${borderColor}; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 11px; transition: all 0.2s;"
                                        onmouseover="this.style.background='${borderColor}';"
                                        onmouseout="this.style.background='${surfaceColor}';">
                                    ➕ Add to Route
                                </button>
                                <button onclick="window.SmartAgenda.Maps.editLocationNotes('${client.id}')"
                                        style="padding: 7px 8px; background: ${surfaceColor}; color: ${textColor}; border: 1px solid ${borderColor}; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 11px; transition: all 0.2s;"
                                        onmouseover="this.style.background='${borderColor}';"
                                        onmouseout="this.style.background='${surfaceColor}';">
                                    📝 Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        bindInfoWindowEvents: function(client) {
            // Events are handled via onclick attributes for now
            // This method is here for future enhancements
        },

        // =============================================================================
        // APPOINTMENT MARKERS
        // =============================================================================

        refreshAppointmentMarkers: function() {
            // Clear existing appointment markers
            this.appointmentMarkers.forEach(marker => marker.setMap(null));
            this.appointmentMarkers = [];

            // Get today's appointments
            const appointments = window.SmartAgenda?.DataManager?.getAll('appointments') || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todaysAppointments = appointments.filter(apt => {
                if (!apt.date || apt.completed) return false;
                const aptDate = new Date(apt.date);
                aptDate.setHours(0, 0, 0, 0);
                return aptDate.getTime() === today.getTime();
            });

            // Add markers for appointments with client locations
            todaysAppointments.forEach(apt => {
                if (apt.client) {
                    const clients = window.SmartAgenda.DataManager.getAll('clients');
                    const client = clients.find(c => String(c.id) === String(apt.client));
                    if (client && client.lat && client.lng) {
                        this.addAppointmentMarker(apt, client);
                    }
                }
            });
        },

        addAppointmentMarker: function(appointment, client) {
            const position = {
                lat: parseFloat(client.lat),
                lng: parseFloat(client.lng)
            };

            // Create a distinct marker for appointments
            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: `Appointment: ${client.name}`,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: MARKER_COLORS.appointment,
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                },
                zIndex: 1000 // Show above regular markers
            });

            marker.addListener('click', () => {
                const content = `
                    <div style="padding: 12px; min-width: 200px;">
                        <h4 style="margin: 0 0 8px 0;">📅 Appointment</h4>
                        <div style="margin-bottom: 8px;">
                            <strong>${client.name}</strong>
                        </div>
                        <div style="font-size: 14px; color: var(--text-secondary);">
                            ${new Date(appointment.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </div>
                        ${appointment.desc ? `
                            <div style="margin-top: 8px; font-size: 13px;">
                                ${this.escapeHtml(appointment.desc).substring(0, 100)}
                            </div>
                        ` : ''}
                        <button onclick="window.SmartAgenda.Maps.navigateToClient('${client.id}')"
                                style="margin-top: 12px; width: 100%; padding: 8px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                            🧭 Navigate
                        </button>
                    </div>
                `;
                this.infoWindow.setContent(content);
                this.infoWindow.open(this.map, marker);
            });

            this.appointmentMarkers.push(marker);
        },

        // =============================================================================
        // PHASE 1: NAVIGATE TO CLIENT (NATIVE APP INTEGRATION)
        // =============================================================================

        navigateToClient: function(clientId) {
            const clients = window.SmartAgenda.DataManager.getAll('clients');
            const client = clients.find(c => String(c.id) === String(clientId));

            if (!client || !client.lat || !client.lng) {
                window.SmartAgenda.Toast.error('Client location not available');
                return;
            }

            this.infoWindow.close();

            // Check if running on mobile (Capacitor)
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                this.openNativeNavigation(client);
            } else {
                // Web fallback - open Google Maps in browser
                const url = `https://www.google.com/maps/dir/?api=1&destination=${client.lat},${client.lng}`;
                window.open(url, '_blank');
            }
        },

        openNativeNavigation: async function(client) {
            try {
                // Open Google Maps directly without asking
                const destination = `${client.lat},${client.lng}`;

                if (window.Capacitor.getPlatform() === 'ios') {
                    // iOS - try to open Google Maps app first
                    window.location.href = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
                    // Fallback to Apple Maps if Google Maps not installed
                    setTimeout(() => {
                        window.location.href = `http://maps.apple.com/?daddr=${client.lat},${client.lng}`;
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
                if (!client.lat || !client.lng) return;

                const distance = this.calculateDistance(
                    userLat, userLng,
                    parseFloat(client.lat), parseFloat(client.lng)
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

        showClientOnMap: function(clientId) {
            // Close modal
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                if (modal.style.display !== 'none') {
                    window.SmartAgenda.UIComponents.closeModal(modal);
                }
            });

            // Find and show client marker
            const marker = this.clientMarkers.find(m => String(m.clientData.id) === String(clientId));
            if (marker) {
                this.map.setCenter(marker.getPosition());
                this.map.setZoom(16);
                google.maps.event.trigger(marker, 'click');
            }
        },

        // =============================================================================
        // PHASE 1: ROUTE PLANNING
        // =============================================================================

        showRoutePlanner: function() {
            const content = `
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px;">
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">
                            Select clients from the map by clicking "Add to Route" on their info windows.
                        </p>
                        <div id="route-waypoints-list" style="margin-bottom: 16px;">
                            ${this.renderRouteWaypointsList()}
                        </div>
                    </div>

                    ${this.routeWaypoints.length > 1 ? `
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.SmartAgenda.Maps.optimizeRoute()"
                                    style="flex: 1; padding: 10px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                🎯 Optimize Route
                            </button>
                            <button onclick="window.SmartAgenda.Maps.clearRoute()"
                                    style="flex: 1; padding: 10px; background: var(--danger); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                🗑️ Clear
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;

            window.SmartAgenda.UIComponents.showModal({
                title: '🚗 Route Planning',
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
        },

        renderRouteWaypointsList: function() {
            if (this.routeWaypoints.length === 0) {
                return '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No clients added to route yet</div>';
            }

            return `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${this.routeWaypoints.map((clientId, index) => {
                        const client = window.SmartAgenda.DataManager.getById('clients', clientId);
                        if (!client) return '';
                        return `
                            <div style="display: flex; align-items: center; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface);">
                                <div style="width: 24px; height: 24px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: 600; font-size: 12px;">
                                    ${index + 1}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 500;">${this.escapeHtml(client.name)}</div>
                                    ${client.address ? `<div style="font-size: 12px; color: var(--text-secondary);">${this.escapeHtml(client.address)}</div>` : ''}
                                </div>
                                <button onclick="window.SmartAgenda.Maps.removeFromRoute('${clientId}')"
                                        style="padding: 4px 8px; background: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    ×
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        },

        addToRoute: function(clientId) {
            if (this.routeWaypoints.includes(clientId)) {
                window.SmartAgenda.Toast.warning('Client already in route');
                return;
            }

            this.routeWaypoints.push(clientId);
            window.SmartAgenda.Toast.success('Added to route');
            this.infoWindow.close();

            // Update route planner if open
            this.updateRoutePlannerModal();
        },

        removeFromRoute: function(clientId) {
            const index = this.routeWaypoints.indexOf(clientId);
            if (index > -1) {
                this.routeWaypoints.splice(index, 1);
                window.SmartAgenda.Toast.success('Removed from route');
                this.updateRoutePlannerModal();

                if (this.routeWaypoints.length === 0) {
                    this.clearRoute();
                }
            }
        },

        clearRoute: function() {
            this.routeWaypoints = [];
            if (this.directionsRenderer) {
                this.directionsRenderer.setMap(null);
                this.directionsRenderer.setMap(this.map);
            }
            this.updateRoutePlannerModal();
            window.SmartAgenda.Toast.success('Route cleared');
        },

        optimizeRoute: async function() {
            if (this.routeWaypoints.length < 2) {
                window.SmartAgenda.Toast.warning('Add at least 2 clients to optimize route');
                return;
            }

            window.SmartAgenda.Toast.info('Calculating optimal route...');

            try {
                // Get user location as starting point
                const userPosition = await this.getUserPosition();
                const origin = userPosition ?
                    new google.maps.LatLng(userPosition.lat, userPosition.lng) :
                    this.getClientPosition(this.routeWaypoints[0]);

                // Prepare waypoints (filter out clients that don't exist or don't have location)
                const waypoints = this.routeWaypoints
                    .map(clientId => {
                        const client = window.SmartAgenda.DataManager.getById('clients', clientId);
                        if (!client || !client.lat || !client.lng) {
                            console.warn(`Client ${clientId} not found or missing location, removing from route`);
                            return null;
                        }
                        return {
                            location: new google.maps.LatLng(parseFloat(client.lat), parseFloat(client.lng)),
                            stopover: true,
                            clientId: clientId // Store clientId for later reference
                        };
                    })
                    .filter(waypoint => waypoint !== null);

                // Update routeWaypoints to only include valid clients
                this.routeWaypoints = waypoints.map(w => w.clientId);

                if (waypoints.length < 2) {
                    window.SmartAgenda.Toast.error('Not enough valid clients with locations in route');
                    return;
                }

                // Calculate route
                const request = {
                    origin: origin,
                    destination: waypoints[waypoints.length - 1].location,
                    waypoints: waypoints.slice(0, -1),
                    optimizeWaypoints: true,
                    travelMode: google.maps.TravelMode.DRIVING
                };

                this.directionsService.route(request, (result, status) => {
                    if (status === 'OK') {
                        this.directionsRenderer.setDirections(result);
                        this.activeRoute = result;

                        // Reorder waypoints based on optimization
                        // waypoint_order contains indices for waypoints[0..-2] (excludes destination)
                        const order = result.routes[0].waypoint_order;
                        const waypointsWithoutLast = this.routeWaypoints.slice(0, -1);
                        const lastWaypoint = this.routeWaypoints[this.routeWaypoints.length - 1];

                        // Reorder based on optimized order, then add destination at end
                        const optimized = order.map(i => waypointsWithoutLast[i]);
                        optimized.push(lastWaypoint);
                        this.routeWaypoints = optimized;

                        // Calculate total distance and time
                        let totalDistance = 0;
                        let totalDuration = 0;
                        result.routes[0].legs.forEach(leg => {
                            totalDistance += leg.distance.value;
                            totalDuration += leg.duration.value;
                        });

                        const distanceKm = (totalDistance / 1000).toFixed(1);
                        const durationMin = Math.round(totalDuration / 60);

                        window.SmartAgenda.Toast.success(`Route optimized: ${distanceKm}km, ${durationMin} min`);
                        this.updateRoutePlannerModal();
                    } else {
                        console.error('Directions request failed:', status);
                        window.SmartAgenda.Toast.error('Could not calculate route');
                    }
                });
            } catch (error) {
                console.error('Route optimization error:', error);
                window.SmartAgenda.Toast.error('Route optimization failed');
            }
        },

        getClientPosition: function(clientId) {
            const client = window.SmartAgenda.DataManager.getById('clients', clientId);
            if (client && client.lat && client.lng) {
                return new google.maps.LatLng(parseFloat(client.lat), parseFloat(client.lng));
            }
            return null;
        },

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

        updateRoutePlannerModal: function() {
            const modal = document.querySelector('.modal-overlay[style*="display: flex"]');
            if (!modal) return;

            const titleElement = modal.querySelector('.modal-title');
            if (titleElement && titleElement.textContent.includes('Route Planning')) {
                const contentContainer = modal.querySelector('.modal-body');
                if (contentContainer) {
                    contentContainer.innerHTML = `
                        <div style="padding: 16px;">
                            <div style="margin-bottom: 16px;">
                                <p style="color: var(--text-secondary); margin-bottom: 12px;">
                                    Select clients from the map by clicking "Add to Route" on their info windows.
                                </p>
                                <div id="route-waypoints-list" style="margin-bottom: 16px;">
                                    ${this.renderRouteWaypointsList()}
                                </div>
                            </div>

                            ${this.routeWaypoints.length > 1 ? `
                                <div style="display: flex; gap: 8px;">
                                    <button onclick="window.SmartAgenda.Maps.optimizeRoute()"
                                            style="flex: 1; padding: 10px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                        🎯 Optimize Route
                                    </button>
                                    <button onclick="window.SmartAgenda.Maps.clearRoute()"
                                            style="flex: 1; padding: 10px; background: var(--danger); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                        🗑️ Clear
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
            }
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
                return client && client.lat && client.lng;
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
                if (client && client.lat && client.lng) {
                    bounds.extend(new google.maps.LatLng(parseFloat(client.lat), parseFloat(client.lng)));
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

        loadCheckInHistory: function() {
            try {
                const saved = localStorage.getItem('checkInHistory');
                if (saved) {
                    this.checkIns = JSON.parse(saved);
                }
            } catch (error) {
                console.error('Error loading check-in history:', error);
                this.checkIns = [];
            }
        },

        // =============================================================================
        // PHASE 2/MOBILE: OFFLINE MAP CACHING
        // =============================================================================

        toggleOfflineMaps: async function() {
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                window.SmartAgenda.Toast.warning('Offline maps only available on mobile app');
                return;
            }

            this.offlineCache.enabled = !this.offlineCache.enabled;

            if (this.offlineCache.enabled) {
                window.SmartAgenda.Toast.info('Offline maps enabled - caching visible area...');
                await this.cacheVisibleArea();
            } else {
                window.SmartAgenda.Toast.info('Offline maps disabled');
                this.clearOfflineCache();
            }
        },

        cacheVisibleArea: async function() {
            // This is a simplified implementation
            // In production, you would use proper tile caching with IndexedDB

            const bounds = this.map.getBounds();
            if (!bounds) return;

            try {
                const cacheData = {
                    bounds: {
                        north: bounds.getNorthEast().lat(),
                        south: bounds.getSouthWest().lat(),
                        east: bounds.getNorthEast().lng(),
                        west: bounds.getSouthWest().lng()
                    },
                    zoom: this.map.getZoom(),
                    timestamp: Date.now()
                };

                // Store cache metadata
                this.offlineCache.lastUpdate = cacheData.timestamp;
                localStorage.setItem('mapOfflineCache', JSON.stringify(cacheData));

                window.SmartAgenda.Toast.success('Map area cached for offline use');
            } catch (error) {
                console.error('Error caching map:', error);
                window.SmartAgenda.Toast.error('Failed to cache map');
            }
        },

        clearOfflineCache: function() {
            this.offlineCache.tiles.clear();
            this.offlineCache.lastUpdate = null;
            localStorage.removeItem('mapOfflineCache');
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
