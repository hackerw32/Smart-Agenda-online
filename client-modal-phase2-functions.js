/**
 * Smart Agenda - Client Modal Phase 2 Functions
 * Addresses and Contact Persons functionality
 */

(function() {
    'use strict';

    const ClientModalNew = window.SmartAgenda?.ClientModalNew;
    if (!ClientModalNew) return;

    /**
     * Initialize dynamic address fields
     */
    ClientModalNew.initDynamicAddressFields = function(modal) {
        const addAddressBtn = modal.querySelector('#add-address-btn');
        const addressesContainer = modal.querySelector('#addresses-container');

        // Bind existing buttons
        this.bindAddressButtons(modal);

        addAddressBtn?.addEventListener('click', () => {
            const currentCount = addressesContainer.querySelectorAll('.address-field').length;

            if (currentCount >= 3) {
                window.SmartAgenda.Toast.warning('Maximum 3 addresses');
                return;
            }

            // Show choice modal: Map or Text
            this.showAddressTypeChoice(modal, currentCount);
        });
    };

    /**
     * Show address type choice dialog
     */
    ClientModalNew.showAddressTypeChoice = async function(modal, index) {
        const choice = await window.SmartAgenda.UIComponents.confirm({
            title: 'Add Address',
            message: 'How would you like to add the address?',
            confirmText: '📍 Pick from Map',
            cancelText: '📝 Enter Text',
            type: 'info'
        });

        const addressesContainer = modal.querySelector('#addresses-container');
        const type = choice ? 'map' : 'text';

        // Build new address HTML
        const newAddressHTML = `
            <div class="address-field" data-index="${index}"
                 style="margin-bottom: 8px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px;">

                <div style="display: flex; gap: 4px; margin-bottom: 6px; align-items: center;">
                    <input type="text" name="address${index}_label" value=""
                           placeholder="Label (e.g., Main Office)"
                           style="flex: 1; min-width: 0; padding: 4px 6px; border: 1px solid var(--border);
                                  border-radius: var(--border-radius-sm); background: var(--background);
                                  color: var(--text-primary); font-size: 12px; font-weight: 500;">

                    <button type="button" class="remove-address-btn" data-index="${index}"
                            style="flex: 0 0 auto; padding: 6px 8px; background: #ff4444; color: white;
                                   border: none; border-radius: var(--border-radius-sm); cursor: pointer;
                                   display: flex; align-items: center; justify-content: center;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                        </svg>
                    </button>
                </div>

                <div class="address-content" data-index="${index}">
                    ${type === 'map' ? this.buildMapAddressHTML(index) : this.buildTextAddressHTML(index)}
                </div>
            </div>
        `;

        // Remove "no addresses" message if exists
        const emptyMessage = addressesContainer.querySelector('div[style*="dashed"]');
        if (emptyMessage) emptyMessage.remove();

        addressesContainer.insertAdjacentHTML('beforeend', newAddressHTML);
        this.bindAddressButtons(modal);

        // Hide add button if we reached 3
        const addAddressBtn = modal.querySelector('#add-address-btn');
        const currentCount = addressesContainer.querySelectorAll('.address-field').length;
        if (currentCount >= 3 && addAddressBtn) {
            addAddressBtn.style.display = 'none';
        }

        // If map type, auto-open map picker
        if (type === 'map') {
            setTimeout(() => {
                const pickBtn = addressesContainer.querySelector(`[data-index="${index}"].pick-from-map-btn`);
                if (pickBtn) pickBtn.click();
            }, 100);
        }
    };

    /**
     * Build map address HTML
     */
    ClientModalNew.buildMapAddressHTML = function(index) {
        return `
            <div style="display: flex; gap: 4px;">
                <input type="text" name="address${index}_value" value=""
                       placeholder="Address from map" readonly
                       style="flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--border);
                              border-radius: var(--border-radius-sm); background: var(--surface);
                              color: var(--text-primary); font-size: 12px;">
                <button type="button" class="pick-from-map-btn" data-index="${index}"
                        style="flex: 0 0 auto; padding: 6px 10px; background: var(--primary-color); color: white;
                               border: none; border-radius: var(--border-radius-sm); cursor: pointer; font-size: 12px;">
                    📍 Pick
                </button>
            </div>
            <input type="hidden" name="address${index}_type" value="map">
            <input type="hidden" name="address${index}_lat" value="">
            <input type="hidden" name="address${index}_lng" value="">
        `;
    };

    /**
     * Build text address HTML
     */
    ClientModalNew.buildTextAddressHTML = function(index) {
        return `
            <input type="text" name="address${index}_value" value=""
                   placeholder="Enter full address"
                   style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                          border-radius: var(--border-radius-sm); background: var(--background);
                          color: var(--text-primary); font-size: 13px;">
            <input type="hidden" name="address${index}_type" value="text">
        `;
    };

    /**
     * Bind address button events
     */
    ClientModalNew.bindAddressButtons = function(modal) {
        // Remove address buttons
        modal.querySelectorAll('.remove-address-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const addressField = newBtn.closest('.address-field');
                const addressesContainer = modal.querySelector('#addresses-container');
                addressField.remove();

                // Check if container is empty
                const remainingAddresses = addressesContainer.querySelectorAll('.address-field').length;
                if (remainingAddresses === 0) {
                    addressesContainer.innerHTML = `
                        <div style="padding: 12px; text-align: center; color: var(--text-secondary); font-size: 13px; border: 1px dashed var(--border); border-radius: 6px;">
                            No addresses yet. Click "Add Address" to add one.
                        </div>
                    `;
                }

                // Show add button again
                const addAddressBtn = modal.querySelector('#add-address-btn');
                if (remainingAddresses < 3 && addAddressBtn) {
                    addAddressBtn.style.display = 'flex';
                }
            });
        });

        // Pick from map buttons
        modal.querySelectorAll('.pick-from-map-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const index = newBtn.dataset.index;
                this.openMapPicker(modal, index);
            });
        });
    };

    /**
     * Open map picker
     */
    ClientModalNew.openMapPicker = function(parentModal, addressIndex) {
        // Get current location if exists
        const latInput = parentModal.querySelector(`[name="address${addressIndex}_lat"]`);
        const lngInput = parentModal.querySelector(`[name="address${addressIndex}_lng"]`);
        const currentLat = latInput?.value ? parseFloat(latInput.value) : null;
        const currentLng = lngInput?.value ? parseFloat(lngInput.value) : null;

        // Use the existing map picker from old clients.js
        if (window.SmartAgenda?.Clients?.openLocationPicker) {
            const addressInput = parentModal.querySelector(`[name="address${addressIndex}_value"]`);
            const locationDisplay = null; // Not needed for new modal

            window.SmartAgenda.Clients.openLocationPicker(
                parentModal,
                addressInput,
                locationDisplay,
                latInput,
                lngInput
            );
        } else {
            window.SmartAgenda.Toast.error('Map picker not available');
        }
    };

    /**
     * Initialize dynamic contact person fields
     */
    ClientModalNew.initDynamicContactPersonFields = function(modal) {
        const addContactBtn = modal.querySelector('#add-contact-btn');
        const contactsContainer = modal.querySelector('#contacts-container');

        // Bind existing remove buttons
        this.bindContactButtons(modal);

        addContactBtn?.addEventListener('click', () => {
            const currentCount = contactsContainer.querySelectorAll('.contact-person-field').length;

            if (currentCount >= 3) {
                window.SmartAgenda.Toast.warning('Maximum 3 contact persons');
                return;
            }

            const newIndex = currentCount;
            const contactHTML = `
                <div class="contact-person-field" data-index="${newIndex}"
                     style="margin-bottom: 8px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px;">

                    <div style="display: flex; gap: 4px; margin-bottom: 6px;">
                        <input type="text" name="contact${newIndex}_name" value=""
                               placeholder="Name *" required
                               style="flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--border);
                                      border-radius: var(--border-radius-sm); background: var(--background);
                                      color: var(--text-primary); font-size: 13px; font-weight: 500;">

                        <button type="button" class="remove-contact-btn" data-index="${newIndex}"
                                style="flex: 0 0 28px; padding: 4px; background: #ff4444; color: white;
                                       border: none; border-radius: var(--border-radius-sm); cursor: pointer;
                                       font-size: 14px; font-weight: bold;">
                            ✕
                        </button>
                    </div>

                    <div style="margin-bottom: 6px;">
                        <input type="text" name="contact${newIndex}_position" value=""
                               placeholder="Position (e.g., Manager, Secretary)"
                               style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                      border-radius: var(--border-radius-sm); background: var(--background);
                                      color: var(--text-primary); font-size: 12px;">
                    </div>

                    <div style="margin-bottom: 6px;">
                        <input type="tel" name="contact${newIndex}_phone" value=""
                               placeholder="Phone"
                               style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                      border-radius: var(--border-radius-sm); background: var(--background);
                                      color: var(--text-primary); font-size: 12px;">
                    </div>

                    <div>
                        <input type="email" name="contact${newIndex}_email" value=""
                               placeholder="Email"
                               style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                      border-radius: var(--border-radius-sm); background: var(--background);
                                      color: var(--text-primary); font-size: 12px;">
                    </div>
                </div>
            `;

            // Remove "no contacts" message if exists
            const emptyMessage = contactsContainer.querySelector('div[style*="dashed"]');
            if (emptyMessage) emptyMessage.remove();

            contactsContainer.insertAdjacentHTML('beforeend', contactHTML);
            this.bindContactButtons(modal);

            // Hide add button if we reached 3
            if (currentCount + 1 >= 3) {
                addContactBtn.style.display = 'none';
            }
        });
    };

    /**
     * Bind contact button events
     */
    ClientModalNew.bindContactButtons = function(modal) {
        modal.querySelectorAll('.remove-contact-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const contactField = newBtn.closest('.contact-person-field');
                const contactsContainer = modal.querySelector('#contacts-container');
                contactField.remove();

                // Check if container is empty
                const remainingContacts = contactsContainer.querySelectorAll('.contact-person-field').length;
                if (remainingContacts === 0) {
                    contactsContainer.innerHTML = `
                        <div style="padding: 12px; text-align: center; color: var(--text-secondary); font-size: 13px; border: 1px dashed var(--border); border-radius: 6px;">
                            No contact persons yet. Click "Add Contact Person" to add one.
                        </div>
                    `;
                }

                // Show add button again
                const addContactBtn = modal.querySelector('#add-contact-btn');
                if (remainingContacts < 3 && addContactBtn) {
                    addContactBtn.style.display = 'flex';
                }
            });
        });
    };

})();
