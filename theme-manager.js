/**
 * Smart Agenda - Advanced Theme Manager
 * Handles colorful themes with preset gradients and custom colors
 */
(function() {
    'use strict';

    // Preset solid color themes (8 colors with proper contrast)
    const PRESET_SOLID_COLORS = [
        {
            id: 'red',
            name: 'Κόκκινο',
            color: '#DC2626',
            textColor: 'light',
            bgColor: '#FEF2F2',
            iconColor: '#991B1B' // Πιο σκούρο για contrast
        },
        {
            id: 'pink',
            name: 'Ροζ',
            color: '#EC4899',
            textColor: 'light',
            bgColor: '#FDF2F8',
            iconColor: '#BE185D' // Πιο σκούρο για contrast
        },
        {
            id: 'purple',
            name: 'Μωβ',
            color: '#9333EA',
            textColor: 'light',
            bgColor: '#FAF5FF',
            iconColor: '#6B21A8' // Πιο σκούρο για contrast
        },
        {
            id: 'blue',
            name: 'Μπλε',
            color: '#2563EB',
            textColor: 'light',
            bgColor: '#EFF6FF',
            iconColor: '#1E40AF' // Πιο σκούρο για contrast
        },
        {
            id: 'green',
            name: 'Πράσινο',
            color: '#059669',
            textColor: 'light',
            bgColor: '#F0FDF4',
            iconColor: '#047857' // Πιο σκούρο για contrast
        },
        {
            id: 'orange',
            name: 'Πορτοκαλί',
            color: '#EA580C',
            textColor: 'light',
            bgColor: '#FFF7ED',
            iconColor: '#C2410C' // Πιο σκούρο για contrast
        },
        {
            id: 'cyan',
            name: 'Γαλάζιο',
            color: '#06B6D4',
            textColor: 'dark',
            bgColor: '#ECFEFF',
            iconColor: '#0E7490' // Πιο σκούρο για contrast
        },
        {
            id: 'amber',
            name: 'Χρυσό',
            color: '#D97706',
            textColor: 'dark',
            bgColor: '#FFFBEB',
            iconColor: '#B45309' // Πιο σκούρο για contrast
        }
    ];

    // Preset gradient themes (from template)
    const PRESET_GRADIENTS = [
        {
            id: 'blue-purple',
            name: 'Μπλε - Μωβ',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            colors: ['#667eea', '#764ba2'],
            textColor: 'light',
            bgColor: '#F5F3FF'
        },
        {
            id: 'pink-orange',
            name: 'Ροζ - Πορτοκαλί',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            colors: ['#f093fb', '#f5576c'],
            textColor: 'light',
            bgColor: '#FFF5F7'
        },
        {
            id: 'green-teal',
            name: 'Πράσινο - Γαλάζιο',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            colors: ['#4facfe', '#00f2fe'],
            textColor: 'dark',
            bgColor: '#F0F9FF'
        },
        {
            id: 'red-pink',
            name: 'Κόκκινο - Ροζ',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            colors: ['#fa709a', '#fee140'],
            textColor: 'dark',
            bgColor: '#FFFBEB'
        },
        {
            id: 'indigo-purple',
            name: 'Indigo - Μωβ',
            gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
            colors: ['#6a11cb', '#2575fc'],
            textColor: 'light',
            bgColor: '#EEF2FF'
        },
        {
            id: 'yellow-red',
            name: 'Κίτρινο - Κόκκινο',
            gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
            colors: ['#ffd89b', '#19547b'],
            textColor: 'dark',
            bgColor: '#FFFBEB'
        },
        {
            id: 'cyan-blue',
            name: 'Κυανό - Μπλε',
            gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
            colors: ['#a1c4fd', '#c2e9fb'],
            textColor: 'dark',
            bgColor: '#F0F9FF'
        },
        {
            id: 'emerald-lime',
            name: 'Σμαραγδί - Lime',
            gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
            colors: ['#d299c2', '#fef9d7'],
            textColor: 'dark',
            bgColor: '#FEFCE8'
        }
    ];

    const ThemeManager = {
        currentColorType: 'solid', // 'solid' or 'gradient'
        currentTextColor: 'light', // 'light' or 'dark'
        customColors: {
            solid: '#2563eb',
            gradient: ['#2563eb', '#9333ea']
        },

        init: function() {
            console.log('Advanced Theme Manager initialized');
            this.bindThemeSelectEvent();
            this.bindColorfulThemeButton();
            this.renderPresetSolidColors();
            this.renderPresetGradients();
            this.bindColorTypeToggle();
            this.bindCustomColorEvents();
            this.loadSavedCustomTheme();
        },

        /**
         * Listen to theme select changes
         */
        bindThemeSelectEvent: function() {
            const themeSelect = document.getElementById('theme-select');
            const paletteBtn = document.getElementById('colorful-theme-config-btn');
            if (!themeSelect) return;

            themeSelect.addEventListener('change', (e) => {
                const selectedTheme = e.target.value;

                if (selectedTheme === 'colorful') {
                    // Show palette button
                    if (paletteBtn) paletteBtn.style.display = 'block';
                } else {
                    // Hide palette button
                    if (paletteBtn) paletteBtn.style.display = 'none';
                    // Apply regular theme
                    window.SmartAgenda.ThemeManager.setTheme(selectedTheme);
                }
            });
        },

        /**
         * Bind click event to colorful theme config button
         */
        bindColorfulThemeButton: function() {
            const paletteBtn = document.getElementById('colorful-theme-config-btn');
            if (!paletteBtn) return;

            paletteBtn.addEventListener('click', () => {
                this.showColorfulThemesPage();
            });
        },

        /**
         * Show the colorful themes settings page
         */
        showColorfulThemesPage: function() {
            // Hide main settings menu
            const settingsMainMenu = document.getElementById('settings-main-menu');
            if (settingsMainMenu) settingsMainMenu.style.display = 'none';

            // Hide appearance settings content
            const appearanceContent = document.getElementById('appearance-settings-content');
            if (appearanceContent) appearanceContent.style.display = 'none';

            // Show settings header with back button
            const settingsHeader = document.getElementById('settings-header');
            if (settingsHeader) {
                settingsHeader.style.display = 'flex';

                // Update header
                const headerIcon = document.getElementById('settings-header-icon');
                const headerTitle = document.getElementById('settings-header-title');
                const headerSubtitle = document.getElementById('settings-header-subtitle');

                if (headerIcon) {
                    headerIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>`;
                }
                if (headerTitle) headerTitle.textContent = 'Χρωματιστά Θέματα';
                if (headerSubtitle) headerSubtitle.textContent = 'Επιλέξτε ή δημιουργήστε το δικό σας θέμα';
            }

            // Setup back button to return to appearance settings
            const backBtn = document.getElementById('settings-back-btn');
            if (backBtn) {
                // Remove existing listeners by cloning the button
                const newBackBtn = backBtn.cloneNode(true);
                backBtn.parentNode.replaceChild(newBackBtn, backBtn);

                // Add new listener to go back to appearance settings
                newBackBtn.addEventListener('click', () => {
                    this.goBackToAppearanceSettings();
                });
            }

            // Show colorful themes content
            const colorfulContent = document.getElementById('colorful-themes-content');
            if (colorfulContent) colorfulContent.style.display = 'block';

            // Re-render presets to ensure they're visible
            this.renderPresetSolidColors();
            this.renderPresetGradients();
        },

        /**
         * Go back to appearance settings from colorful themes page
         */
        goBackToAppearanceSettings: function() {
            // Hide colorful themes content
            const colorfulContent = document.getElementById('colorful-themes-content');
            if (colorfulContent) colorfulContent.style.display = 'none';

            // Show appearance settings content
            const appearanceContent = document.getElementById('appearance-settings-content');
            if (appearanceContent) appearanceContent.style.display = 'block';

            // Update header to appearance settings
            const headerIcon = document.getElementById('settings-header-icon');
            const headerTitle = document.getElementById('settings-header-title');
            const headerSubtitle = document.getElementById('settings-header-subtitle');

            if (headerIcon) {
                headerIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                </svg>`;
            }
            if (headerTitle) headerTitle.textContent = 'Εμφάνιση';
            if (headerSubtitle) headerSubtitle.textContent = 'Προσαρμόστε τη εμφάνιση της εφαρμογής';

            // Restore back button to go to main settings menu
            const backBtn = document.getElementById('settings-back-btn');
            if (backBtn && window.SmartAgenda && window.SmartAgenda.SettingsManager) {
                // Remove existing listeners by cloning the button
                const newBackBtn = backBtn.cloneNode(true);
                backBtn.parentNode.replaceChild(newBackBtn, backBtn);

                // Add listener to go back to main menu
                newBackBtn.addEventListener('click', () => {
                    window.SmartAgenda.SettingsManager.goBackToMainMenu();
                });
            }
        },

        /**
         * Render preset solid color options
         */
        renderPresetSolidColors: function() {
            const grid = document.getElementById('preset-solid-colors-grid');
            if (!grid) return;

            grid.innerHTML = PRESET_SOLID_COLORS.map(preset => `
                <div class="preset-solid-card" data-preset-id="${preset.id}"
                     style="height: 100px; border-radius: 12px; background: ${preset.color};
                            cursor: pointer; display: flex; align-items: center; justify-content: center;
                            font-weight: 600; font-size: 14px; color: ${preset.textColor === 'light' ? 'white' : '#1a1a1a'};
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s ease;
                            border: 3px solid transparent;"
                     onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 12px rgba(0,0,0,0.2)';"
                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';">
                    ${preset.name}
                </div>
            `).join('');

            // Bind click events to preset cards
            grid.querySelectorAll('.preset-solid-card').forEach(card => {
                card.addEventListener('click', () => {
                    const presetId = card.dataset.presetId;
                    this.applySolidColor(presetId);
                });
            });
        },

        /**
         * Render preset gradient options
         */
        renderPresetGradients: function() {
            const grid = document.getElementById('preset-gradients-grid');
            if (!grid) return;

            grid.innerHTML = PRESET_GRADIENTS.map(preset => `
                <div class="preset-gradient-card" data-preset-id="${preset.id}"
                     style="height: 100px; border-radius: 12px; background: ${preset.gradient};
                            cursor: pointer; display: flex; align-items: center; justify-content: center;
                            font-weight: 600; font-size: 14px; color: ${preset.textColor === 'light' ? 'white' : '#1a1a1a'};
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s ease;
                            border: 3px solid transparent;"
                     onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 12px rgba(0,0,0,0.2)';"
                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';">
                    ${preset.name}
                </div>
            `).join('');

            // Bind click events to preset cards
            grid.querySelectorAll('.preset-gradient-card').forEach(card => {
                card.addEventListener('click', () => {
                    const presetId = card.dataset.presetId;
                    this.applyPresetGradient(presetId);
                });
            });
        },

        /**
         * Apply a solid color theme
         */
        applySolidColor: function(presetId) {
            const preset = PRESET_SOLID_COLORS.find(p => p.id === presetId);
            if (!preset) return;

            // Create CSS variables for the solid color
            const root = document.documentElement;

            // Set primary color
            root.style.setProperty('--primary-color', preset.color);
            root.style.setProperty('--primary-hover', this.darkenColor(preset.color, 10));
            root.style.setProperty('--primary-light', this.lightenColor(preset.color, 10));

            // Set background color for pages
            root.style.setProperty('--page-bg-color', preset.bgColor);

            // Set icon color for SVG icons in page background (darker for light backgrounds)
            root.style.setProperty('--icon-color-in-bg', preset.iconColor);

            // Set text colors based on preset
            if (preset.textColor === 'light') {
                root.style.setProperty('--text-on-primary', '#ffffff');
                root.style.setProperty('--icon-on-primary', '#ffffff');
            } else {
                root.style.setProperty('--text-on-primary', '#1a1a1a');
                root.style.setProperty('--icon-on-primary', '#1a1a1a');
            }

            // Apply solid color to header and primary elements
            this.applySolidColorToElements(preset.color, preset.textColor, preset.bgColor);

            // Save theme
            localStorage.setItem('colorful-theme', JSON.stringify({
                type: 'solid',
                presetId: presetId,
                color: preset.color,
                textColor: preset.textColor,
                bgColor: preset.bgColor,
                iconColor: preset.iconColor
            }));

            // Update theme select
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect) themeSelect.value = 'colorful';

            window.SmartAgenda.Toast.success(`Εφαρμόστηκε το θέμα: ${preset.name}`);
        },

        /**
         * Apply a preset gradient theme
         */
        applyPresetGradient: function(presetId) {
            const preset = PRESET_GRADIENTS.find(p => p.id === presetId);
            if (!preset) return;

            // Create CSS variables for the gradient
            const root = document.documentElement;

            // Set primary color to first gradient color
            root.style.setProperty('--primary-color', preset.colors[0]);
            root.style.setProperty('--primary-hover', this.darkenColor(preset.colors[0], 10));
            root.style.setProperty('--primary-light', this.lightenColor(preset.colors[0], 10));

            // Set gradient for special elements
            root.style.setProperty('--gradient-primary', preset.gradient);

            // Set text colors based on preset
            if (preset.textColor === 'light') {
                root.style.setProperty('--text-on-primary', '#ffffff');
                root.style.setProperty('--icon-on-primary', '#ffffff');
            } else {
                root.style.setProperty('--text-on-primary', '#1a1a1a');
                root.style.setProperty('--icon-on-primary', '#1a1a1a');
            }

            // Set background color for pages
            if (preset.bgColor) {
                root.style.setProperty('--page-bg-color', preset.bgColor);
            }

            // Apply gradient to header and primary elements
            this.applyGradientToElements(preset.gradient, preset.textColor, preset.bgColor);

            // Save theme
            localStorage.setItem('colorful-theme', JSON.stringify({
                type: 'gradient',
                presetId: presetId,
                gradient: preset.gradient,
                textColor: preset.textColor,
                bgColor: preset.bgColor
            }));

            // Update theme select
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect) themeSelect.value = 'colorful';

            window.SmartAgenda.Toast.success(`Εφαρμόστηκε το θέμα: ${preset.name}`);
        },

        /**
         * Bind color type toggle (Solid vs Gradient)
         */
        bindColorTypeToggle: function() {
            const solidBtn = document.getElementById('color-type-solid');
            const gradientBtn = document.getElementById('color-type-gradient');
            const solidSection = document.getElementById('solid-colors-section');
            const gradientSection = document.getElementById('gradient-colors-section');

            if (solidBtn && gradientBtn) {
                solidBtn.addEventListener('click', () => {
                    solidBtn.classList.add('active');
                    gradientBtn.classList.remove('active');
                    if (solidSection) solidSection.style.display = 'block';
                    if (gradientSection) gradientSection.style.display = 'none';
                });

                gradientBtn.addEventListener('click', () => {
                    gradientBtn.classList.add('active');
                    solidBtn.classList.remove('active');
                    if (solidSection) solidSection.style.display = 'none';
                    if (gradientSection) gradientSection.style.display = 'block';
                });
            }
        },

        /**
         * Bind events for custom color pickers
         */
        bindCustomColorEvents: function() {
            // Color type toggle (solid vs gradient)
            const solidBtn = document.getElementById('color-type-solid');
            const gradientBtn = document.getElementById('color-type-gradient');
            const solidSection = document.getElementById('solid-color-section');
            const gradientSection = document.getElementById('gradient-color-section');

            if (solidBtn && gradientBtn) {
                solidBtn.addEventListener('click', () => {
                    this.currentColorType = 'solid';
                    solidBtn.classList.add('active');
                    gradientBtn.classList.remove('active');
                    solidBtn.style.borderColor = 'var(--primary-color)';
                    gradientBtn.style.borderColor = 'var(--border)';
                    if (solidSection) solidSection.style.display = 'block';
                    if (gradientSection) gradientSection.style.display = 'none';
                    this.updateCustomPreview();
                });

                gradientBtn.addEventListener('click', () => {
                    this.currentColorType = 'gradient';
                    gradientBtn.classList.add('active');
                    solidBtn.classList.remove('active');
                    gradientBtn.style.borderColor = 'var(--primary-color)';
                    solidBtn.style.borderColor = 'var(--border)';
                    if (solidSection) solidSection.style.display = 'none';
                    if (gradientSection) gradientSection.style.display = 'block';
                    this.updateCustomPreview();
                });
            }

            // Solid color picker
            const solidColorPicker = document.getElementById('custom-solid-color');
            const solidHexInput = document.getElementById('custom-solid-hex');

            if (solidColorPicker && solidHexInput) {
                solidColorPicker.addEventListener('input', (e) => {
                    this.customColors.solid = e.target.value;
                    solidHexInput.value = e.target.value;
                    this.updateCustomPreview();
                });

                solidHexInput.addEventListener('input', (e) => {
                    const hex = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        this.customColors.solid = hex;
                        solidColorPicker.value = hex;
                        this.updateCustomPreview();
                    }
                });
            }

            // Gradient color pickers
            const gradColor1 = document.getElementById('custom-gradient-color1');
            const gradHex1 = document.getElementById('custom-gradient-hex1');
            const gradColor2 = document.getElementById('custom-gradient-color2');
            const gradHex2 = document.getElementById('custom-gradient-hex2');

            if (gradColor1 && gradHex1) {
                gradColor1.addEventListener('input', (e) => {
                    this.customColors.gradient[0] = e.target.value;
                    gradHex1.value = e.target.value;
                    this.updateCustomPreview();
                });

                gradHex1.addEventListener('input', (e) => {
                    const hex = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        this.customColors.gradient[0] = hex;
                        gradColor1.value = hex;
                        this.updateCustomPreview();
                    }
                });
            }

            if (gradColor2 && gradHex2) {
                gradColor2.addEventListener('input', (e) => {
                    this.customColors.gradient[1] = e.target.value;
                    gradHex2.value = e.target.value;
                    this.updateCustomPreview();
                });

                gradHex2.addEventListener('input', (e) => {
                    const hex = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                        this.customColors.gradient[1] = hex;
                        gradColor2.value = hex;
                        this.updateCustomPreview();
                    }
                });
            }

            // Text color toggle
            const lightBtn = document.getElementById('text-color-light');
            const darkBtn = document.getElementById('text-color-dark');

            if (lightBtn && darkBtn) {
                lightBtn.addEventListener('click', () => {
                    this.currentTextColor = 'light';
                    lightBtn.classList.add('active');
                    darkBtn.classList.remove('active');
                    lightBtn.style.borderColor = 'var(--primary-color)';
                    darkBtn.style.borderColor = 'var(--border)';
                    this.updateCustomPreview();
                });

                darkBtn.addEventListener('click', () => {
                    this.currentTextColor = 'dark';
                    darkBtn.classList.add('active');
                    lightBtn.classList.remove('active');
                    darkBtn.style.borderColor = 'var(--primary-color)';
                    lightBtn.style.borderColor = 'var(--border)';
                    this.updateCustomPreview();
                });
            }

            // Apply button
            const applyBtn = document.getElementById('apply-custom-colors');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    this.applyCustomColors();
                });
            }
        },

        /**
         * Update the custom color preview
         */
        updateCustomPreview: function() {
            const preview = document.getElementById('custom-color-preview');
            if (!preview) return;

            if (this.currentColorType === 'solid') {
                preview.style.background = this.customColors.solid;
            } else {
                const gradient = `linear-gradient(135deg, ${this.customColors.gradient[0]}, ${this.customColors.gradient[1]})`;
                preview.style.background = gradient;
            }

            preview.style.color = this.currentTextColor === 'light' ? 'white' : '#1a1a1a';
        },

        /**
         * Apply custom colors to the app
         */
        applyCustomColors: function() {
            const root = document.documentElement;

            if (this.currentColorType === 'solid') {
                // Apply solid color
                root.style.setProperty('--primary-color', this.customColors.solid);
                root.style.setProperty('--primary-hover', this.darkenColor(this.customColors.solid, 10));
                root.style.setProperty('--primary-light', this.lightenColor(this.customColors.solid, 10));
                root.style.setProperty('--gradient-primary', this.customColors.solid);

                // Apply solid color to header
                const header = document.querySelector('.app-header');
                if (header) {
                    header.style.background = this.customColors.solid;
                }
            } else {
                // Apply gradient
                const gradient = `linear-gradient(135deg, ${this.customColors.gradient[0]}, ${this.customColors.gradient[1]})`;
                root.style.setProperty('--primary-color', this.customColors.gradient[0]);
                root.style.setProperty('--primary-hover', this.darkenColor(this.customColors.gradient[0], 10));
                root.style.setProperty('--primary-light', this.lightenColor(this.customColors.gradient[0], 10));
                root.style.setProperty('--gradient-primary', gradient);

                // Apply gradient to elements
                this.applyGradientToElements(gradient, this.currentTextColor);
            }

            // Set text colors
            if (this.currentTextColor === 'light') {
                root.style.setProperty('--text-on-primary', '#ffffff');
                root.style.setProperty('--icon-on-primary', '#ffffff');
            } else {
                root.style.setProperty('--text-on-primary', '#1a1a1a');
                root.style.setProperty('--icon-on-primary', '#1a1a1a');
            }

            // Save custom theme
            localStorage.setItem('colorful-theme', JSON.stringify({
                type: 'custom',
                colorType: this.currentColorType,
                colors: this.customColors,
                textColor: this.currentTextColor
            }));

            // Update theme select
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect) themeSelect.value = 'colorful';

            window.SmartAgenda.Toast.success('Τα προσαρμοσμένα χρώματα εφαρμόστηκαν!');
        },

        /**
         * Apply solid color to header and primary elements
         */
        applySolidColorToElements: function(color, textColor, bgColor) {
            const header = document.querySelector('.app-header');
            if (header) {
                header.style.background = color;
                header.style.color = textColor === 'light' ? 'white' : '#1a1a1a';
            }

            // Update all SVG icons in header
            const headerIcons = header?.querySelectorAll('svg');
            headerIcons?.forEach(icon => {
                icon.style.color = textColor === 'light' ? 'white' : '#1a1a1a';
                icon.style.stroke = textColor === 'light' ? 'white' : '#1a1a1a';
            });

            // Update nav menu
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                navMenu.style.background = color;
            }

            // Update active nav item
            const activeNavItem = document.querySelector('.nav-item.active');
            if (activeNavItem) {
                activeNavItem.style.background = 'rgba(255, 255, 255, 0.2)';
            }

            // Update buttons
            document.querySelectorAll('.btn-primary').forEach(btn => {
                btn.style.background = color;
                btn.style.color = textColor === 'light' ? 'white' : '#1a1a1a';
            });

            // Apply background color to content areas
            this.applyBackgroundColorToPages(bgColor);
        },

        /**
         * Apply gradient to header and primary elements
         */
        applyGradientToElements: function(gradient, textColor, bgColor) {
            const header = document.querySelector('.app-header');
            if (header) {
                header.style.background = gradient;
                header.style.color = textColor === 'light' ? 'white' : '#1a1a1a';
            }

            // Update all SVG icons in header
            const headerIcons = header?.querySelectorAll('svg');
            headerIcons?.forEach(icon => {
                icon.style.color = textColor === 'light' ? 'white' : '#1a1a1a';
                icon.style.stroke = textColor === 'light' ? 'white' : '#1a1a1a';
            });

            // Update nav menu gradient
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                navMenu.style.background = gradient;
            }

            // Update active nav item
            const activeNavItem = document.querySelector('.nav-item.active');
            if (activeNavItem) {
                activeNavItem.style.background = 'rgba(255, 255, 255, 0.2)';
            }

            // Update buttons
            document.querySelectorAll('.btn-primary').forEach(btn => {
                btn.style.background = gradient;
                btn.style.color = textColor === 'light' ? 'white' : '#1a1a1a';
            });

            // Apply background color to content areas if available
            if (bgColor) {
                this.applyBackgroundColorToPages(bgColor);
            }
        },

        /**
         * Apply background color to all pages
         */
        applyBackgroundColorToPages: function(bgColor) {
            // Apply to main content areas
            const contentAreas = document.querySelectorAll('.content, .page-content, #home-content, #clients-content, #appointments-content, #tasks-content, #interactions-content, #finance-content, #calendar-content, #advanced-content');
            contentAreas.forEach(area => {
                if (area) {
                    area.style.backgroundColor = bgColor;
                }
            });

            // Apply to body if no specific content area
            const body = document.body;
            if (body && bgColor) {
                body.style.backgroundColor = bgColor;
            }
        },

        /**
         * Load saved custom theme on app start
         */
        loadSavedCustomTheme: function() {
            const savedTheme = localStorage.getItem('colorful-theme');
            if (!savedTheme) return;

            try {
                const theme = JSON.parse(savedTheme);

                if (theme.type === 'solid') {
                    // Apply solid color theme
                    setTimeout(() => {
                        this.applySolidColor(theme.presetId);
                    }, 100);
                } else if (theme.type === 'gradient') {
                    // Apply gradient theme
                    setTimeout(() => {
                        this.applyPresetGradient(theme.presetId);
                    }, 100);
                } else if (theme.type === 'custom') {
                    // Apply custom theme
                    this.currentColorType = theme.colorType;
                    this.customColors = theme.colors;
                    this.currentTextColor = theme.textColor;

                    setTimeout(() => {
                        this.applyCustomColors();
                    }, 100);
                }
            } catch (error) {
                console.error('Error loading saved colorful theme:', error);
            }
        },

        /**
         * Clear colorful theme styles when switching to other themes
         */
        clearColorfulThemeStyles: function() {
            console.log('Clearing colorful theme styles');

            // Hide palette button
            const paletteBtn = document.getElementById('colorful-theme-config-btn');
            if (paletteBtn) paletteBtn.style.display = 'none';

            // Remove inline styles from header
            const header = document.querySelector('.app-header');
            if (header) {
                header.style.background = '';
                header.style.color = '';
            }

            // Remove inline styles from header icons
            const headerIcons = header?.querySelectorAll('svg');
            headerIcons?.forEach(icon => {
                icon.style.color = '';
                icon.style.stroke = '';
            });

            // Remove inline styles from nav menu
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) {
                navMenu.style.background = '';
            }

            // Remove inline styles from active nav item
            const activeNavItem = document.querySelector('.nav-item.active');
            if (activeNavItem) {
                activeNavItem.style.background = '';
            }

            // Remove inline styles from all primary buttons
            document.querySelectorAll('.btn-primary').forEach(btn => {
                btn.style.background = '';
                btn.style.color = '';
            });

            // Clear CSS variables
            const root = document.documentElement;
            root.style.removeProperty('--page-bg-color');
            root.style.removeProperty('--icon-color-in-bg');
            root.style.removeProperty('--gradient-primary');

            // Accent color will be automatically set by the theme when setTheme is called

            // Reset background colors of content areas
            const contentAreas = document.querySelectorAll('.content, .page-content, #home-content, #clients-content, #appointments-content, #tasks-content, #interactions-content, #finance-content, #calendar-content, #advanced-content');
            contentAreas.forEach(area => {
                if (area) {
                    area.style.backgroundColor = '';
                }
            });

            // Reset body background
            const body = document.body;
            if (body) {
                body.style.backgroundColor = '';
            }

            // Clear saved colorful theme from localStorage
            localStorage.removeItem('colorful-theme');
        },

        /**
         * Darken a color by a percentage
         */
        darkenColor: function(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max((num >> 16) - amt, 0);
            const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
            const B = Math.max((num & 0x0000FF) - amt, 0);
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        },

        /**
         * Lighten a color by a percentage
         */
        lightenColor: function(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min((num >> 16) + amt, 255);
            const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
            const B = Math.min((num & 0x0000FF) + amt, 255);
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }
    };

    // ============================================
    // Accent Color Manager (Windows-style)
    // ============================================
    const AccentColorManager = {
        accentColors: [
            { id: 'blue', name: 'Μπλε', color: '#2563EB', light: '#EFF6FF', dark: '#1E40AF' },
            { id: 'red', name: 'Κόκκινο', color: '#DC2626', light: '#FEF2F2', dark: '#991B1B' },
            { id: 'pink', name: 'Ροζ', color: '#EC4899', light: '#FDF2F8', dark: '#BE185D' },
            { id: 'purple', name: 'Μωβ', color: '#9333EA', light: '#FAF5FF', dark: '#6B21A8' },
            { id: 'green', name: 'Πράσινο', color: '#059669', light: '#F0FDF4', dark: '#047857' },
            { id: 'orange', name: 'Πορτοκαλί', color: '#EA580C', light: '#FFF7ED', dark: '#C2410C' },
            { id: 'cyan', name: 'Γαλάζιο', color: '#06B6D4', light: '#ECFEFF', dark: '#0E7490' },
            { id: 'amber', name: 'Χρυσό', color: '#D97706', light: '#FFFBEB', dark: '#B45309' }
        ],

        init: function() {
            this.renderAccentColors();
            this.bindThemeModeCards();
            this.loadSavedThemeMode();  // Load theme first
            this.loadSavedAccentColor(); // Then load accent (respecting theme defaults)
        },

        renderAccentColors: function() {
            const grid = document.getElementById('accent-colors-grid');
            if (!grid) return;

            grid.innerHTML = this.accentColors.map(color => `
                <div class="accent-color-card" data-accent="${color.id}"
                     style="aspect-ratio: 1; background: ${color.color}; border-radius: 12px; cursor: pointer;
                            border: 3px solid transparent; transition: all 0.2s ease; position: relative;
                            display: flex; align-items: center; justify-content: center; opacity: 0.6;">
                    <svg class="accent-check" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" style="display: none;">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            `).join('');

            // Bind click events
            grid.querySelectorAll('.accent-color-card').forEach(card => {
                card.addEventListener('click', () => {
                    const accentId = card.dataset.accent;
                    this.applyAccentColor(accentId, true, true); // showToast=true, saveManual=true
                });
            });
        },

        applyAccentColor: function(accentId, showToast = false, saveManual = false) {
            const accent = this.accentColors.find(a => a.id === accentId);
            if (!accent) return;

            const root = document.documentElement;
            root.style.setProperty('--primary-color', accent.color);
            root.style.setProperty('--primary-hover', accent.dark);
            root.style.setProperty('--primary-light', accent.light);

            // Save manually chosen accent color
            if (saveManual) {
                localStorage.setItem('manualAccentColor', accentId);
            }

            // Update visual selection
            this.updateAccentSelection(accentId);

            if (showToast) {
                window.SmartAgenda.Toast.success(`Χρώμα έμφασης: ${accent.name}`);
            }
        },

        updateAccentSelection: function(accentId) {
            document.querySelectorAll('.accent-color-card').forEach(card => {
                const check = card.querySelector('.accent-check');
                if (card.dataset.accent === accentId) {
                    card.style.borderColor = 'var(--text-primary)';
                    card.style.opacity = '1';
                    if (check) check.style.display = 'block';
                } else {
                    card.style.borderColor = 'transparent';
                    card.style.opacity = '0.6';
                    if (check) check.style.display = 'none';
                }
            });
        },

        bindThemeModeCards: function() {
            document.querySelectorAll('.theme-mode-card').forEach(card => {
                card.addEventListener('click', () => {
                    const theme = card.dataset.theme;
                    this.applyThemeMode(theme);
                });
            });
        },

        applyThemeMode: function(theme) {
            // Use the existing ThemeManager
            if (window.SmartAgenda && window.SmartAgenda.ThemeManager) {
                window.SmartAgenda.ThemeManager.setTheme(theme);
            }

            // Clear manual accent color when changing theme
            localStorage.removeItem('manualAccentColor');

            // Auto-apply accent color based on theme
            if (theme === 'kouzmidis') {
                // Modern theme → Amber/Gold accent
                this.applyAccentColor('amber');
            } else {
                // Light & Dark theme → Blue accent
                this.applyAccentColor('blue');
            }

            // Update visual selection
            this.updateThemeModeSelection(theme);
        },

        updateThemeModeSelection: function(theme) {
            document.querySelectorAll('.theme-mode-card').forEach(card => {
                if (card.dataset.theme === theme) {
                    card.style.borderColor = 'var(--primary-color)';
                    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                } else {
                    card.style.borderColor = 'var(--border)';
                    card.style.boxShadow = 'none';
                }
            });
        },

        loadSavedAccentColor: function() {
            // Check if user has manually chosen an accent color
            const manualAccent = localStorage.getItem('manualAccentColor');
            if (manualAccent) {
                this.applyAccentColor(manualAccent);
            }
            // Otherwise, the default accent is already applied by loadSavedThemeMode
        },

        loadSavedThemeMode: function() {
            const savedTheme = localStorage.getItem('theme') || 'light';

            // Auto-set accent color based on theme
            if (savedTheme === 'kouzmidis') {
                this.applyAccentColor('amber');
            } else {
                this.applyAccentColor('blue');
            }

            this.updateThemeModeSelection(savedTheme);
        }
    };

    // Attach to SmartAgenda global
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            ThemeManager.init();
            AccentColorManager.init();
        });
        window.SmartAgenda.ColorfulThemeManager = ThemeManager;
        window.SmartAgenda.AccentColorManager = AccentColorManager;
    }
})();
