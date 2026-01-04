/**
 * Smart Agenda - Interactive Tutorial System
 *
 * Full interactive walkthrough with:
 * - Step-by-step guided tour
 * - Spotlight effect on UI elements
 * - Next/Previous navigation
 * - Mock data for demonstration
 */

(function() {
    'use strict';

    const Tutorial = {
        isActive: false,
        currentStep: 0,
        steps: [],
        overlay: null,
        spotlight: null,
        tooltip: null,
        mockDataCreated: false,

        /**
         * Define tutorial steps
         */
        defineSteps: function() {
            this.steps = [
                // Step 1: Welcome
                {
                    title: 'Καλώς ήρθατε στο Smart Agenda!',
                    description: 'Ας σας δείξουμε τα βασικά χαρακτηριστικά της εφαρμογής. Μπορείτε να παραλείψετε αυτό το tutorial ανά πάσα στιγμή.',
                    target: null,
                    position: 'center',
                    action: () => {
                        // Create mock data for demo
                        this.createMockData();
                    }
                },
                // Step 2: Menu button (don't click yet)
                {
                    title: 'Μενού Πλοήγησης',
                    description: 'Πατήστε το εικονίδιο μενού για να δείτε όλες τις διαθέσιμες λειτουργίες.',
                    target: '#menu-button',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 3: Open menu and show Home
                {
                    title: 'Αρχική',
                    description: 'Η αρχική σελίδα όπου βλέπετε μια γρήγορη επισκόπηση των δεδομένων σας.',
                    target: '[data-tab="home"]',
                    position: 'bottom',
                    beforeAction: true,
                    action: () => {
                        if (window.SmartAgenda?.Navigation) {
                            window.SmartAgenda.Navigation.openMenu();
                        }
                    }
                },
                // Step 4: Clients
                {
                    title: 'Πελάτες',
                    description: 'Διαχειριστείτε όλους τους πελάτες σας. Μπορείτε να προσθέσετε νέους πελάτες, να επεξεργαστείτε τα στοιχεία τους, και να δείτε το ιστορικό τους.',
                    target: '[data-tab="clients"]',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 5: Appointments
                {
                    title: 'Ραντεβού',
                    description: 'Διαχειριστείτε τα ραντεβού σας. Μπορείτε να δείτε το status, την πληρωμή, και την προτεραιότητα.',
                    target: '[data-tab="appointments"]',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 6: Interactions
                {
                    title: 'Αλληλεπιδράσεις',
                    description: 'Καταγράψτε όλες τις επικοινωνίες και αλληλεπιδράσεις με τους πελάτες σας.',
                    target: '[data-tab="interactions"]',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 7: Tasks
                {
                    title: 'Εργασίες',
                    description: 'Διαχειριστείτε τις εργασίες σας. Μπορείτε να ορίσετε προθεσμίες και προτεραιότητες.',
                    target: '[data-tab="tasks"]',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 8: Map
                {
                    title: 'Χάρτης',
                    description: 'Δείτε όλους τους πελάτες σας στον χάρτη με βάση την τοποθεσία τους.',
                    target: '[data-tab="map"]',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 9: Financials
                {
                    title: 'Οικονομικά',
                    description: 'Παρακολουθήστε τα οικονομικά σας: τζίρος, κέρδη, έξοδα.',
                    target: '[data-tab="finance"]',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 10: Calendar
                {
                    title: 'Ημερολόγιο',
                    description: 'Δείτε όλα τα ραντεβού σας σε μορφή ημερολογίου. Πατήστε σε μια ημέρα για να δείτε λεπτομέρειες.',
                    target: '[data-tab="calendar"]',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 11: Advanced
                {
                    title: 'Προχωρημένα',
                    description: 'Προηγμένες λειτουργίες και εργαλεία για την εφαρμογή σας.',
                    target: '[data-tab="advanced"]',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 12: Settings
                {
                    title: 'Ρυθμίσεις',
                    description: 'Προσαρμόστε την εφαρμογή στις ανάγκες σας. Αλλάξτε θέμα, γλώσσα, νόμισμα και συνδεθείτε με Google Drive για backup.',
                    target: '[data-tab="settings"]',
                    position: 'bottom',
                    beforeAction: false,
                    action: null
                },
                // Step 13: Close menu, go to Clients, show + button
                {
                    title: 'Προσθήκη Νέου Πελάτη',
                    description: 'Χρησιμοποιήστε το κουμπί + για να προσθέσετε νέους πελάτες.',
                    target: '#header-add-button',
                    position: 'bottom-left',
                    beforeAction: true,
                    action: () => {
                        if (window.SmartAgenda?.Navigation) {
                            window.SmartAgenda.Navigation.closeMenu();
                            setTimeout(() => {
                                window.SmartAgenda.Navigation.switchTab('clients');
                            }, 100);
                        }
                    }
                },
                // Step 14: Quick actions on client card (wait for data to load)
                {
                    title: 'Γρήγορες Ενέργειες',
                    description: 'Σε κάθε πελάτη έχετε γρήγορες ενέργειες: χάρτης, κλήση, SMS, email, νέο ραντεβού, νέα εργασία.',
                    target: '.client-card .quick-actions',
                    position: 'top',
                    beforeAction: false,
                    action: null,
                    waitForElement: true // Flag to wait for element to appear
                },
                // Step 15: Completion
                {
                    title: 'Είστε Έτοιμοι!',
                    description: 'Αυτό ήταν! Τώρα μπορείτε να αρχίσετε να χρησιμοποιείτε το Smart Agenda. Μπορείτε πάντα να επανεκκινήσετε το tutorial από τις Ρυθμίσεις.',
                    target: null,
                    position: 'center',
                    action: () => {
                        // Clean up mock data
                        this.cleanupMockData();
                    }
                }
            ];
        },

        /**
         * Start the tutorial
         */
        start: function() {
            if (this.isActive) return;

            console.log('🎓 Starting tutorial...');
            this.isActive = true;
            this.currentStep = 0;
            this.defineSteps();

            // Create overlay and UI elements
            this.createOverlay();
            this.showStep(0);

            // Don't prevent scrolling - we want the app to be interactive
        },

        /**
         * Create overlay, spotlight, and tooltip
         */
        createOverlay: function() {
            // No dark overlay - we'll just use the spotlight border

            // Spotlight (highlighted area with border only)
            this.spotlight = document.createElement('div');
            this.spotlight.id = 'tutorial-spotlight';
            this.spotlight.style.cssText = `
                position: fixed;
                border: 3px solid var(--primary-color);
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(74, 144, 226, 0.8), 0 0 40px rgba(74, 144, 226, 0.4);
                z-index: 9999;
                pointer-events: none;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(this.spotlight);

            // Tooltip (instructions box)
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'tutorial-tooltip';
            this.tooltip.style.cssText = `
                position: fixed;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                padding: 24px;
                max-width: 400px;
                z-index: 10000;
                transition: all 0.3s ease;
            `;
            this.tooltip.innerHTML = `
                <div class="tutorial-header" style="margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary);"></h3>
                    <div style="margin-top: 4px; font-size: 12px; color: var(--text-secondary);">
                        <span id="tutorial-step-counter"></span>
                    </div>
                </div>
                <div class="tutorial-body" style="margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-primary);"></p>
                </div>
                <div class="tutorial-footer" style="display: flex; gap: 8px; justify-content: space-between;">
                    <button id="tutorial-skip" style="padding: 8px 16px; background: transparent; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px; color: var(--text-secondary);">
                        Παράλειψη
                    </button>
                    <div style="display: flex; gap: 8px;">
                        <button id="tutorial-prev" style="padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px; color: var(--text-primary);">
                            Πίσω
                        </button>
                        <button id="tutorial-next" style="padding: 8px 20px; background: var(--primary-color); border: none; border-radius: 6px; cursor: pointer; font-size: 14px; color: white; font-weight: 500;">
                            Επόμενο
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(this.tooltip);

            // Bind events
            document.getElementById('tutorial-skip').addEventListener('click', () => this.end());
            document.getElementById('tutorial-prev').addEventListener('click', () => this.previousStep());
            document.getElementById('tutorial-next').addEventListener('click', () => this.nextStep());
        },

        /**
         * Show a specific step
         */
        showStep: function(stepIndex) {
            if (stepIndex < 0 || stepIndex >= this.steps.length) return;

            this.currentStep = stepIndex;
            const step = this.steps[stepIndex];

            console.log(`📍 Tutorial step ${stepIndex + 1}/${this.steps.length}: ${step.title}`);

            // Update tooltip content
            this.tooltip.querySelector('h3').textContent = step.title;
            this.tooltip.querySelector('p').textContent = step.description;
            document.getElementById('tutorial-step-counter').textContent = `Βήμα ${stepIndex + 1} από ${this.steps.length}`;

            // Update button states
            const prevBtn = document.getElementById('tutorial-prev');
            const nextBtn = document.getElementById('tutorial-next');

            prevBtn.disabled = stepIndex === 0;
            prevBtn.style.opacity = stepIndex === 0 ? '0.5' : '1';
            prevBtn.style.cursor = stepIndex === 0 ? 'not-allowed' : 'pointer';

            if (stepIndex === this.steps.length - 1) {
                nextBtn.textContent = 'Τέλος';
            } else {
                nextBtn.textContent = 'Επόμενο';
            }

            // Execute action BEFORE showing spotlight if beforeAction is true
            if (step.action && step.beforeAction) {
                step.action();
                // Wait for action to complete, then position
                setTimeout(() => {
                    this.positionElements(step);
                }, 500);
            } else {
                // Position spotlight and tooltip first
                setTimeout(() => {
                    this.positionElements(step);

                    // Then execute action if it should run AFTER showing spotlight
                    if (step.action && !step.beforeAction) {
                        setTimeout(() => step.action(), 300);
                    }
                }, 300);
            }
        },

        /**
         * Position spotlight and tooltip based on target element
         */
        positionElements: function(step) {
            if (!step.target) {
                // Center mode (no spotlight)
                this.spotlight.style.display = 'none';

                // Center tooltip
                this.tooltip.style.top = '50%';
                this.tooltip.style.left = '50%';
                this.tooltip.style.transform = 'translate(-50%, -50%)';
                this.tooltip.style.right = 'auto';
                this.tooltip.style.bottom = 'auto';
            } else {
                const target = document.querySelector(step.target);
                if (!target) {
                    // If waitForElement flag is set, keep trying
                    if (step.waitForElement) {
                        console.log(`Waiting for element: ${step.target}`);
                        let attempts = 0;
                        const maxAttempts = 20; // Try for 2 seconds

                        const waitInterval = setInterval(() => {
                            attempts++;
                            const el = document.querySelector(step.target);

                            if (el) {
                                clearInterval(waitInterval);
                                console.log(`Element found after ${attempts} attempts`);
                                this.positionElements(step); // Retry with element found
                            } else if (attempts >= maxAttempts) {
                                clearInterval(waitInterval);
                                console.warn(`Tutorial target not found after waiting: ${step.target}`);
                                // Skip to next step
                                setTimeout(() => this.nextStep(), 500);
                            }
                        }, 100);
                        return;
                    }

                    console.warn(`Tutorial target not found: ${step.target}`);
                    // Skip to next step
                    setTimeout(() => this.nextStep(), 1000);
                    return;
                }

                // Show and position spotlight
                this.spotlight.style.display = 'block';
                const rect = target.getBoundingClientRect();

                // Add padding around element
                const padding = 8;
                this.spotlight.style.top = (rect.top - padding) + 'px';
                this.spotlight.style.left = (rect.left - padding) + 'px';
                this.spotlight.style.width = (rect.width + padding * 2) + 'px';
                this.spotlight.style.height = (rect.height + padding * 2) + 'px';

                // Scroll element into view
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Position tooltip based on position preference
                this.positionTooltip(rect, step.position);
            }
        },

        /**
         * Position tooltip relative to spotlight
         */
        positionTooltip: function(targetRect, position) {
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const gap = 20;

            let top, left;

            switch (position) {
                case 'top':
                    top = targetRect.top - tooltipRect.height - gap;
                    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'bottom':
                    // Always below the target
                    top = targetRect.bottom + gap;
                    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                    left = targetRect.left - tooltipRect.width - gap;
                    break;
                case 'right':
                    top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                    left = targetRect.right + gap;
                    break;
                case 'bottom-right':
                    top = targetRect.bottom + gap;
                    left = targetRect.right - tooltipRect.width;
                    break;
                case 'bottom-left':
                    top = targetRect.bottom + gap;
                    left = targetRect.left;
                    break;
                default:
                    // Default: below and centered
                    top = targetRect.bottom + gap;
                    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
            }

            // Ensure tooltip stays within viewport horizontally
            const maxLeft = window.innerWidth - tooltipRect.width - 20;
            left = Math.max(20, Math.min(left, maxLeft));

            // For bottom position, allow tooltip to go below viewport if needed (scrollable)
            // For top position, ensure it doesn't go above viewport
            if (position === 'top') {
                top = Math.max(20, top);
            }

            this.tooltip.style.top = top + 'px';
            this.tooltip.style.left = left + 'px';
            this.tooltip.style.transform = 'none';
        },

        /**
         * Go to next step
         */
        nextStep: function() {
            if (this.currentStep < this.steps.length - 1) {
                this.showStep(this.currentStep + 1);
            } else {
                this.end();
            }
        },

        /**
         * Go to previous step
         */
        previousStep: function() {
            if (this.currentStep > 0) {
                this.showStep(this.currentStep - 1);
            }
        },

        /**
         * End tutorial
         */
        end: function() {
            console.log('🎓 Tutorial ended');
            this.isActive = false;

            // Remove UI elements
            if (this.spotlight) this.spotlight.remove();
            if (this.tooltip) this.tooltip.remove();

            // Close menu if open
            if (window.SmartAgenda?.Navigation) {
                window.SmartAgenda.Navigation.closeMenu();
            }

            // Clean up mock data
            this.cleanupMockData();

            // Mark tutorial as completed
            localStorage.setItem('tutorial_completed', 'true');

            // Show completion message
            if (window.SmartAgenda?.Toast) {
                window.SmartAgenda.Toast.success('Tutorial ολοκληρώθηκε!');
            }
        },

        /**
         * Create mock data for demonstration
         */
        createMockData: function() {
            if (this.mockDataCreated) return;

            console.log('📦 Creating mock data for tutorial...');

            const mockClients = [
                {
                    id: 'tutorial-client-1',
                    name: 'Γιάννης Παπαδόπουλος',
                    phone: '6912345678',
                    email: 'giannis@example.com',
                    address: 'Λεωφόρος Αθηνών 123, Αθήνα',
                    lat: 37.9838,
                    lng: 23.7275,
                    type: 'existing',
                    notes: 'Demo πελάτης για tutorial',
                    createdAt: new Date().toISOString(),
                    isTutorialData: true
                },
                {
                    id: 'tutorial-client-2',
                    name: 'Μαρία Γεωργίου',
                    phone: '6923456789',
                    email: 'maria@example.com',
                    address: 'Πατησίων 45, Αθήνα',
                    lat: 38.0000,
                    lng: 23.7300,
                    type: 'potential',
                    notes: 'Demo πελάτης για tutorial',
                    createdAt: new Date().toISOString(),
                    isTutorialData: true
                }
            ];

            const mockAppointments = [
                {
                    id: 'tutorial-appt-1',
                    client: 'tutorial-client-1',
                    clientName: 'Γιάννης Παπαδόπουλος',
                    title: 'Demo Ραντεβού',
                    date: new Date().toISOString(),
                    endDate: new Date(Date.now() + 3600000).toISOString(),
                    priority: 'high',
                    status: 'pending',
                    amount: 100,
                    paid: 'unpaid',
                    notes: 'Demo ραντεβού για tutorial',
                    createdAt: new Date().toISOString(),
                    isTutorialData: true
                }
            ];

            // Store mock data
            if (window.SmartAgenda?.DataManager) {
                mockClients.forEach(client => {
                    window.SmartAgenda.DataManager.save('clients', client);
                });
                mockAppointments.forEach(appt => {
                    window.SmartAgenda.DataManager.save('appointments', appt);
                });

                // Trigger refresh
                window.SmartAgenda.EventBus.emit('data:change');
            }

            this.mockDataCreated = true;
        },

        /**
         * Clean up mock data after tutorial
         */
        cleanupMockData: function() {
            if (!this.mockDataCreated) return;

            console.log('🧹 Cleaning up tutorial mock data...');

            if (window.SmartAgenda?.DataManager) {
                // Remove all items marked as tutorial data
                const clients = window.SmartAgenda.DataManager.getAll('clients');
                const appointments = window.SmartAgenda.DataManager.getAll('appointments');
                const tasks = window.SmartAgenda.DataManager.getAll('tasks');

                clients.filter(c => c.isTutorialData).forEach(c => {
                    window.SmartAgenda.DataManager.delete('clients', c.id);
                });

                appointments.filter(a => a.isTutorialData).forEach(a => {
                    window.SmartAgenda.DataManager.delete('appointments', a.id);
                });

                tasks.filter(t => t.isTutorialData).forEach(t => {
                    window.SmartAgenda.DataManager.delete('tasks', t.id);
                });

                // Trigger refresh
                window.SmartAgenda.EventBus.emit('data:change');
            }

            this.mockDataCreated = false;
        }
    };

    // Add to global API
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.Tutorial = Tutorial;

    console.log('✅ Tutorial module loaded');

})();
