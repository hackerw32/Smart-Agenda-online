/**
 * Smart Agenda - New Client Modal Functions (Phase 1)
 * Interactive functionality for the new modal
 */

(function() {
    'use strict';

    const ClientModalNew = window.SmartAgenda?.ClientModalNew;
    if (!ClientModalNew) return;

    /**
     * Initialize modal interactive elements
     */
    ClientModalNew.initializeModal = function(modal, client, availableTypes) {
        // Initialize collapsible sections
        this.initCollapsibleSections(modal, client);

        // Initialize photo upload
        this.initPhotoUpload(modal, client);

        // Initialize client types selector
        this.initClientTypesSelector(modal, availableTypes);

        // Initialize dynamic phone/email fields
        this.initDynamicPhoneFields(modal);
        this.initDynamicEmailFields(modal);

        // Initialize dynamic address fields
        this.initDynamicAddressFields(modal);

        // Initialize dynamic contact person fields
        this.initDynamicContactPersonFields(modal);

        // Initialize file upload
        this.initFileUpload(modal, client);

        // Initialize rich text editor for notes
        this.initNotesEditor(modal, client);
    };

    /**
     * Initialize collapsible sections
     */
    ClientModalNew.initCollapsibleSections = function(modal, client) {
        const sections = modal.querySelectorAll('.collapsible-section');
        const isEditMode = !!client; // If client exists, it's edit mode

        sections.forEach(section => {
            const header = section.querySelector('.section-header');
            const content = section.querySelector('.section-content');
            const toggle = section.querySelector('.section-toggle');

            if (!header || !content || !toggle) return;

            // Get section name
            const sectionName = section.getAttribute('data-section');

            // For new clients: start collapsed except for basic-info
            // For existing clients: start expanded
            if (isEditMode) {
                content.style.display = 'block';
                toggle.style.transform = 'rotate(0deg)';
            } else {
                // For new clients, only keep basic-info expanded
                if (sectionName === 'basic-info') {
                    content.style.display = 'block';
                    toggle.style.transform = 'rotate(0deg)';
                } else {
                    content.style.display = 'none';
                    toggle.style.transform = 'rotate(-90deg)';
                }
            }

            header.addEventListener('click', () => {
                const isExpanded = content.style.display !== 'none';

                if (isExpanded) {
                    content.style.display = 'none';
                    toggle.style.transform = 'rotate(-90deg)';
                } else {
                    content.style.display = 'block';
                    toggle.style.transform = 'rotate(0deg)';
                }
            });
        });
    };

    /**
     * Initialize photo upload functionality
     */
    ClientModalNew.initPhotoUpload = function(modal, client) {
        const uploadBtn = modal.querySelector('#upload-photo-btn');
        const photoInput = modal.querySelector('#client-photo-input');
        const preview = modal.querySelector('#client-photo-preview');
        const removeBtn = modal.querySelector('#remove-photo-btn');

        // Store initial photo
        this.photoData = client?.photo || null;

        uploadBtn?.addEventListener('click', () => {
            photoInput?.click();
        });

        photoInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                window.SmartAgenda.Toast.error('Η φωτογραφία πρέπει να είναι κάτω από 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                preview.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                this.photoData = event.target.result;

                // Add remove button if it doesn't exist
                if (!removeBtn) {
                    const photoSection = modal.querySelector('.photo-section');
                    const buttonsDiv = photoSection.querySelector('div:last-child');
                    buttonsDiv.innerHTML += `
                        <button type="button" class="btn-danger" id="remove-photo-btn"
                                style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;">
                            <span>🗑️</span>
                            <span>Remove</span>
                        </button>
                    `;
                    this.initPhotoUpload(modal, client); // Re-init to bind new button
                }
            };
            reader.readAsDataURL(file);
        });

        removeBtn?.addEventListener('click', () => {
            preview.innerHTML = '<span style="font-size: 50px;">👤</span>';
            this.photoData = null;
            photoInput.value = '';
            removeBtn.remove();
        });
    };

    /**
     * Initialize client types selector
     */
    ClientModalNew.initClientTypesSelector = function(modal, availableTypes) {
        const typeOptions = modal.querySelectorAll('.type-option');

        typeOptions.forEach(option => {
            const typeId = option.dataset.typeId;
            const type = availableTypes.find(t => t.id === typeId);

            // Click on type badge to toggle selection
            option.addEventListener('click', (e) => {
                if (e.target.classList.contains('type-star')) return; // Skip if clicking star

                const wasSelected = option.classList.contains('selected');
                option.classList.toggle('selected');

                if (option.classList.contains('selected')) {
                    option.style.borderColor = type.color;
                    option.style.background = type.color + '22';
                } else {
                    option.style.borderColor = 'var(--border)';
                    option.style.background = 'var(--surface)';

                    // If deselecting, clear the star
                    const star = option.querySelector('.type-star');
                    star.textContent = '☆';
                    star.style.opacity = '0.3';
                }
            });

            // Click on star to set as primary
            const star = option.querySelector('.type-star');
            star.addEventListener('click', (e) => {
                e.stopPropagation();

                // Can only set primary if selected
                if (!option.classList.contains('selected')) {
                    window.SmartAgenda.Toast.warning('Select the type first');
                    return;
                }

                // Clear all other stars
                modal.querySelectorAll('.type-star').forEach(s => {
                    s.textContent = '☆';
                    s.style.opacity = '0.3';
                });

                // Set this as primary
                star.textContent = '⭐';
                star.style.opacity = '1';
            });
        });
    };

    /**
     * Initialize dynamic phone fields
     */
    ClientModalNew.initDynamicPhoneFields = function(modal) {
        const addPhoneBtn = modal.querySelector('#add-phone-btn');
        const phonesContainer = modal.querySelector('#phones-container');

        // Bind remove buttons for existing phones
        this.bindRemovePhoneButtons(modal);

        addPhoneBtn?.addEventListener('click', () => {
            const currentCount = phonesContainer.querySelectorAll('.phone-field').length;

            if (currentCount >= 3) {
                window.SmartAgenda.Toast.warning('Maximum 3 phone numbers');
                return;
            }

            const newIndex = currentCount;
            const phoneFieldHTML = `
                <div class="phone-field" data-index="${newIndex}" style="display: flex; gap: 4px; margin-bottom: 6px;">
                    <select name="phone${newIndex}_type" style="flex: 0 0 65px; padding: 6px 4px; border: 1px solid var(--border);
                                                              border-radius: var(--border-radius-sm); background: var(--background);
                                                              color: var(--text-primary); font-size: 12px;">
                        <option value="work">Work</option>
                        <option value="home">Home</option>
                        <option value="mobile" selected>Mob</option>
                        <option value="other">Other</option>
                    </select>
                    <input type="tel" name="phone${newIndex}" placeholder="+30 123 456 7890"
                           style="flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--border);
                                  border-radius: var(--border-radius-sm); background: var(--background);
                                  color: var(--text-primary); font-size: 13px;">
                    <button type="button" class="remove-phone-btn" data-index="${newIndex}"
                            style="flex: 0 0 32px; padding: 6px; background: #ff4444; color: white;
                                   border: none; border-radius: var(--border-radius-sm); cursor: pointer;
                                   font-size: 16px; font-weight: bold; display: flex; align-items: center;
                                   justify-content: center;">
                        ✕
                    </button>
                </div>
            `;

            phonesContainer.insertAdjacentHTML('beforeend', phoneFieldHTML);
            this.bindRemovePhoneButtons(modal);

            // Hide add button if we reached 3
            if (currentCount + 1 >= 3) {
                addPhoneBtn.style.display = 'none';
            }
        });
    };

    /**
     * Bind remove phone button events
     */
    ClientModalNew.bindRemovePhoneButtons = function(modal) {
        const removeButtons = modal.querySelectorAll('.remove-phone-btn');

        removeButtons.forEach(btn => {
            // Remove old listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const phoneField = newBtn.closest('.phone-field');
                phoneField.remove();

                // Show add button again
                const addPhoneBtn = modal.querySelector('#add-phone-btn');
                const phonesContainer = modal.querySelector('#phones-container');
                const currentCount = phonesContainer.querySelectorAll('.phone-field').length;

                if (currentCount < 3 && addPhoneBtn) {
                    addPhoneBtn.style.display = 'flex';
                }
            });
        });
    };

    /**
     * Initialize dynamic email fields
     */
    ClientModalNew.initDynamicEmailFields = function(modal) {
        const addEmailBtn = modal.querySelector('#add-email-btn');
        const emailsContainer = modal.querySelector('#emails-container');

        // Bind remove buttons for existing emails
        this.bindRemoveEmailButtons(modal);

        addEmailBtn?.addEventListener('click', () => {
            const currentCount = emailsContainer.querySelectorAll('.email-field').length;

            if (currentCount >= 3) {
                window.SmartAgenda.Toast.warning('Maximum 3 email addresses');
                return;
            }

            const newIndex = currentCount;
            const emailFieldHTML = `
                <div class="email-field" data-index="${newIndex}" style="display: flex; gap: 4px; margin-bottom: 6px;">
                    <select name="email${newIndex}_type" style="flex: 0 0 65px; padding: 6px 4px; border: 1px solid var(--border);
                                                               border-radius: var(--border-radius-sm); background: var(--background);
                                                               color: var(--text-primary); font-size: 12px;">
                        <option value="work" selected>Work</option>
                        <option value="home">Home</option>
                        <option value="personal">Pers</option>
                        <option value="other">Other</option>
                    </select>
                    <input type="email" name="email${newIndex}" placeholder="email@example.com"
                           style="flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--border);
                                  border-radius: var(--border-radius-sm); background: var(--background);
                                  color: var(--text-primary); font-size: 13px;">
                    <button type="button" class="remove-email-btn" data-index="${newIndex}"
                            style="flex: 0 0 32px; padding: 6px; background: #ff4444; color: white;
                                   border: none; border-radius: var(--border-radius-sm); cursor: pointer;
                                   font-size: 16px; font-weight: bold; display: flex; align-items: center;
                                   justify-content: center;">
                        ✕
                    </button>
                </div>
            `;

            emailsContainer.insertAdjacentHTML('beforeend', emailFieldHTML);
            this.bindRemoveEmailButtons(modal);

            // Hide add button if we reached 3
            if (currentCount + 1 >= 3) {
                addEmailBtn.style.display = 'none';
            }
        });
    };

    /**
     * Bind remove email button events
     */
    ClientModalNew.bindRemoveEmailButtons = function(modal) {
        const removeButtons = modal.querySelectorAll('.remove-email-btn');

        removeButtons.forEach(btn => {
            // Remove old listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const emailField = newBtn.closest('.email-field');
                emailField.remove();

                // Show add button again
                const addEmailBtn = modal.querySelector('#add-email-btn');
                const emailsContainer = modal.querySelector('#emails-container');
                const currentCount = emailsContainer.querySelectorAll('.email-field').length;

                if (currentCount < 3 && addEmailBtn) {
                    addEmailBtn.style.display = 'flex';
                }
            });
        });
    };

    /**
     * Initialize rich text editor for notes
     */
    ClientModalNew.initNotesEditor = function(modal, client) {
        const descTextarea = modal.querySelector('[name="desc"]');
        if (!descTextarea) return;

        // Use Quill editor if available
        if (window.SmartAgenda?.UIComponents?.enhanceTextareaWithEditor) {
            this.currentDescEditor = window.SmartAgenda.UIComponents.enhanceTextareaWithEditor(
                descTextarea,
                client?.desc || ''
            );
        }
    };

    /**
     * Save client data
     */
    ClientModalNew.saveClient = function(modal, existingClient) {
        const formData = this.collectFormData(modal);

        // Validation
        if (!formData.name || formData.name.trim() === '') {
            window.SmartAgenda.Toast.error('Το όνομα πελάτη είναι υποχρεωτικό');
            return;
        }

        // Prepare client object
        const clientData = {
            name: formData.name.trim(),
            photo: this.photoData,
            clientTypes: formData.clientTypes,
            primaryType: formData.primaryType,

            // Phones
            phone: formData.phones[0]?.value || '',
            phoneType: formData.phones[0]?.type || 'work',
            phone2: formData.phones[1]?.value || '',
            phone2Type: formData.phones[1]?.type || 'work',
            phone3: formData.phones[2]?.value || '',
            phone3Type: formData.phones[2]?.type || 'work',

            // Emails
            email: formData.emails[0]?.value || '',
            emailType: formData.emails[0]?.type || 'work',
            email2: formData.emails[1]?.value || '',
            email2Type: formData.emails[1]?.type || 'work',
            email3: formData.emails[2]?.value || '',
            email3Type: formData.emails[2]?.type || 'work',

            // Addresses and Contact Persons
            addresses: formData.addresses,
            contactPersons: formData.contactPersons,

            // Files
            files: this.currentFiles || [],

            // Other
            desc: formData.desc,
            website: formData.website,
            facebook: formData.facebook,
            instagram: formData.instagram,
            linkedin: formData.linkedin
        };

        // Save or update
        if (existingClient) {
            // Update existing client
            clientData.id = existingClient.id;
            clientData.createdAt = existingClient.createdAt;
            clientData.updatedAt = new Date().toISOString();

            window.SmartAgenda.DataManager.update('clients', existingClient.id, clientData);
            window.SmartAgenda.Toast.success('Ο πελάτης ενημερώθηκε επιτυχώς');
        } else {
            // Create new client
            clientData.id = Date.now().toString();
            clientData.createdAt = new Date().toISOString();
            clientData.updatedAt = new Date().toISOString();

            window.SmartAgenda.DataManager.add('clients', clientData);
            window.SmartAgenda.Toast.success('Ο πελάτης προστέθηκε επιτυχώς');
        }

        // Close modal and refresh
        window.SmartAgenda.UIComponents.closeModal(modal);

        if (window.SmartAgenda.Clients?.render) {
            window.SmartAgenda.Clients.render();
        }
    };

    /**
     * Collect all form data
     */
    ClientModalNew.collectFormData = function(modal) {
        const formData = {
            name: '',
            clientTypes: [],
            primaryType: null,
            phones: [],
            emails: [],
            addresses: [],
            contactPersons: [],
            desc: '',
            website: '',
            facebook: '',
            instagram: '',
            linkedin: ''
        };

        // Name
        const nameInput = modal.querySelector('[name="name"]');
        formData.name = nameInput?.value || '';

        // Client types
        const selectedTypes = modal.querySelectorAll('.type-option.selected');
        formData.clientTypes = Array.from(selectedTypes).map(opt => opt.dataset.typeId);

        // Primary type (the one with ⭐) - using textContent check
        modal.querySelectorAll('.type-star').forEach(star => {
            if (star.textContent === '⭐') {
                formData.primaryType = star.closest('.type-option')?.dataset.typeId;
            }
        });

        // Fallback to first type if no primary set
        if (!formData.primaryType && formData.clientTypes.length > 0) {
            formData.primaryType = formData.clientTypes[0];
        }

        // Phones
        modal.querySelectorAll('.phone-field').forEach((field, index) => {
            const value = field.querySelector(`[name="phone${index}"]`)?.value || '';
            const type = field.querySelector(`[name="phone${index}_type"]`)?.value || 'work';

            if (value.trim()) {
                formData.phones.push({ value: value.trim(), type });
            }
        });

        // Emails
        modal.querySelectorAll('.email-field').forEach((field, index) => {
            const value = field.querySelector(`[name="email${index}"]`)?.value || '';
            const type = field.querySelector(`[name="email${index}_type"]`)?.value || 'work';

            if (value.trim()) {
                formData.emails.push({ value: value.trim(), type });
            }
        });

        // Addresses
        modal.querySelectorAll('.address-field').forEach((field, index) => {
            const label = field.querySelector(`[name="address${index}_label"]`)?.value || '';
            const value = field.querySelector(`[name="address${index}_value"]`)?.value || '';
            const type = field.querySelector(`[name="address${index}_type"]`)?.value || 'text';
            const lat = field.querySelector(`[name="address${index}_lat"]`)?.value || '';
            const lng = field.querySelector(`[name="address${index}_lng"]`)?.value || '';

            if (value.trim()) {
                const addressData = {
                    label: label.trim(),
                    value: value.trim(),
                    type: type
                };

                // Add coordinates if it's a map address
                if (type === 'map' && lat && lng) {
                    addressData.lat = parseFloat(lat);
                    addressData.lng = parseFloat(lng);
                }

                formData.addresses.push(addressData);
            }
        });

        // Contact Persons
        modal.querySelectorAll('.contact-person-field').forEach((field, index) => {
            const name = field.querySelector(`[name="contact${index}_name"]`)?.value || '';
            const position = field.querySelector(`[name="contact${index}_position"]`)?.value || '';
            const phone = field.querySelector(`[name="contact${index}_phone"]`)?.value || '';
            const email = field.querySelector(`[name="contact${index}_email"]`)?.value || '';

            if (name.trim()) {
                formData.contactPersons.push({
                    name: name.trim(),
                    position: position.trim(),
                    phone: phone.trim(),
                    email: email.trim()
                });
            }
        });

        // Notes
        if (this.currentDescEditor && this.currentDescEditor.getValue) {
            formData.desc = this.currentDescEditor.getValue();
        } else {
            formData.desc = modal.querySelector('[name="desc"]')?.value || '';
        }

        // Social media
        formData.website = modal.querySelector('[name="website"]')?.value || '';
        formData.facebook = modal.querySelector('[name="facebook"]')?.value || '';
        formData.instagram = modal.querySelector('[name="instagram"]')?.value || '';
        formData.linkedin = modal.querySelector('[name="linkedin"]')?.value || '';

        return formData;
    };

    /**
     * Delete client
     */
    ClientModalNew.deleteClient = async function(modal, clientId) {
        const confirmed = await window.SmartAgenda.UIComponents.confirm({
            title: 'Delete Client',
            message: 'Are you sure you want to delete this client? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (!confirmed) return;

        window.SmartAgenda.DataManager.delete('clients', clientId);
        window.SmartAgenda.Toast.success('Client deleted successfully');
        window.SmartAgenda.UIComponents.closeModal(modal);

        if (window.SmartAgenda.Clients?.render) {
            window.SmartAgenda.Clients.render();
        }
    };

})();
