/**
 * Smart Agenda - New Client Modal (Phase 1)
 * Collapsible sections with improved structure
 */

(function() {
    'use strict';

    const ClientModalNew = {
        currentDescEditor: null,
        photoData: null,

        /**
         * Show new client modal with improved structure
         */
        showClientModal: function(client = null) {
            const isEdit = !!client;
            const i18n = window.SmartAgenda.I18n;

            // Get client types from settings
            const availableTypes = window.SmartAgenda.Settings?.getClientTypes() || [];

            // Build modal content with collapsible sections
            const content = this.buildModalContent(client, availableTypes, isEdit);

            // Modal buttons (preserve context with arrow functions)
            const self = this;
            const buttons = [
                {
                    label: i18n.translate('actions.cancel'),
                    type: 'secondary',
                    action: 'cancel',
                    onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                },
                {
                    label: i18n.translate('actions.save'),
                    type: 'primary',
                    action: 'save',
                    onClick: (modal) => {
                        window.SmartAgenda.ClientModalNew.saveClient(modal, client);
                    }
                }
            ];

            // Add delete button for existing clients
            if (isEdit) {
                buttons.unshift({
                    label: i18n.translate('actions.delete'),
                    type: 'danger',
                    action: 'delete',
                    onClick: (modal) => {
                        window.SmartAgenda.ClientModalNew.deleteClient(modal, client.id);
                    }
                });
            }

            // Show modal
            const modal = window.SmartAgenda.UIComponents.showModal({
                title: isEdit ? `Αλλαγή ${client.name}` : i18n.translate('actions.add') + ' Πελάτης',
                content: content,
                buttons: buttons,
                size: 'medium',
                hideCloseButton: true
            });

            // Initialize interactive elements
            setTimeout(() => {
                this.initializeModal(modal, client, availableTypes);
            }, 100);
        },

        /**
         * Build modal HTML content
         */
        buildModalContent: function(client, availableTypes, isEdit) {
            return `
                <div class="client-modal-container" style="max-height: 70vh; overflow-y: auto; padding: 8px;">
                    ${this.buildPhotoSection(client)}
                    ${this.buildBasicInfoSection(client, availableTypes)}
                    ${this.buildContactDetailsSection(client)}
                    ${this.buildAddressesSection(client)}
                    ${this.buildContactPersonsSection(client)}
                    ${this.buildNotesSection(client)}
                    ${this.buildSocialMediaSection(client)}
                    ${this.buildFileAttachmentsSection(client)}
                </div>
            `;
        },

        /**
         * Photo Section - Large, centered, first
         */
        buildPhotoSection: function(client) {
            return `
                <div class="modal-section photo-section" style="margin-bottom: 24px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                        <div id="client-photo-preview"
                             style="width: 120px; height: 120px; border-radius: 50%;
                                    background: var(--border); display: flex; align-items: center;
                                    justify-content: center; overflow: hidden;
                                    border: 3px solid var(--primary-color); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            ${client?.photo ?
                                `<img src="${client.photo}" style="width: 100%; height: 100%; object-fit: cover;">` :
                                '<span style="font-size: 50px;">👤</span>'}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <input type="file" id="client-photo-input" accept="image/*" style="display: none;">
                            <button type="button" class="btn-primary" id="upload-photo-btn"
                                    style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;">
                                <span>📷</span>
                                <span>Choose Photo</span>
                            </button>
                            ${client?.photo ? `
                                <button type="button" class="btn-danger" id="remove-photo-btn"
                                        style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;">
                                    <span>🗑️</span>
                                    <span>Remove</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Basic Info Section (Name, Client Type) - Collapsible
         */
        buildBasicInfoSection: function(client, availableTypes) {
            return `
                <div class="modal-section collapsible-section" data-section="basic-info">
                    <div class="section-header" style="display: flex; align-items: center; justify-content: space-between;
                                                      padding: 12px 16px; background: var(--surface); border-radius: 8px;
                                                      cursor: pointer; border: 1px solid var(--border); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">📋</span>
                            <span style="font-weight: 600; font-size: 15px;">Βασικές Πληροφορίες</span>
                        </div>
                        <span class="section-toggle" style="font-size: 20px; transition: transform 0.3s;">▼</span>
                    </div>
                    <div class="section-content" style="padding: 0 4px 12px 4px;">
                        <!-- Name (Required) -->
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: var(--text-primary); font-size: 13px;">
                                Όνομα <span style="color: var(--danger-color);">*</span>
                            </label>
                            <input type="text" name="name" value="${client?.name || ''}" required
                                   placeholder="Όνομα πελάτη"
                                   style="width: 100%; padding: 8px; border: 1px solid var(--border);
                                          border-radius: var(--border-radius-sm); background: var(--background);
                                          color: var(--text-primary); font-size: 14px;">
                        </div>

                        <!-- Client Type (Optional) -->
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: var(--text-primary); font-size: 13px;">
                                Τύποι Πελάτη
                            </label>
                            <div id="client-types-selector" style="display: flex; flex-wrap: wrap; gap: 6px;">
                                ${this.buildClientTypesHTML(availableTypes, client)}
                            </div>
                            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">
                                Κλικ για επιλογή. Κλικ ⭐ για κύριο τύπο.
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Build client types selector HTML
         */
        buildClientTypesHTML: function(availableTypes, client) {
            let selectedTypes = [];
            let primaryTypeId = null;

            if (client) {
                if (client.clientTypes) {
                    selectedTypes = client.clientTypes;
                    primaryTypeId = client.primaryType || client.clientTypes[0];
                } else if (client.customerType) {
                    selectedTypes = [client.customerType];
                    primaryTypeId = client.customerType;
                }
            }

            return availableTypes.map(type => {
                const isSelected = selectedTypes.includes(type.id);
                const isPrimary = type.id === primaryTypeId;
                return `
                    <div class="type-option ${isSelected ? 'selected' : ''}" data-type-id="${type.id}"
                         style="display: flex; align-items: center; padding: 8px 12px;
                                border: 2px solid ${isSelected ? type.color : 'var(--border)'};
                                border-radius: 8px; cursor: pointer;
                                background: ${isSelected ? type.color + '22' : 'var(--surface)'};
                                transition: all 0.2s;">
                        <span class="type-star" style="font-size: 20px; margin-right: 6px; cursor: pointer;
                                                      opacity: ${isPrimary ? '1' : '0.3'};">
                            ${isPrimary ? '⭐' : '☆'}
                        </span>
                        <div style="width: 14px; height: 14px; border-radius: 50%; background: ${type.color}; margin-right: 8px;"></div>
                        <span style="font-weight: 500; color: var(--text-primary); font-size: 14px;">${this.escapeHtml(type.name)}</span>
                    </div>
                `;
            }).join('');
        },

        /**
         * Contact Details Section (Phones, Emails) - Collapsible with dynamic fields
         */
        buildContactDetailsSection: function(client) {
            // Parse existing phones and emails
            const phones = this.parsePhones(client);
            const emails = this.parseEmails(client);

            return `
                <div class="modal-section collapsible-section" data-section="contact-details">
                    <div class="section-header" style="display: flex; align-items: center; justify-content: space-between;
                                                      padding: 12px 16px; background: var(--surface); border-radius: 8px;
                                                      cursor: pointer; border: 1px solid var(--border); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">📞</span>
                            <span style="font-weight: 600; font-size: 15px;">Στοιχεία Επικοινωνίας</span>
                        </div>
                        <span class="section-toggle" style="font-size: 20px; transition: transform 0.3s;">▼</span>
                    </div>
                    <div class="section-content" style="padding: 0 4px 12px 4px;">
                        <!-- Phones -->
                        <div class="form-group" style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: var(--text-primary); font-size: 13px;">
                                Τηλέφωνα
                            </label>
                            <div id="phones-container">
                                ${this.buildPhoneFields(phones)}
                            </div>
                            ${phones.length < 3 ? `
                                <button type="button" id="add-phone-btn" class="btn-secondary"
                                        style="margin-top: 6px; width: 100%; padding: 6px; display: flex; align-items: center;
                                               justify-content: center; gap: 4px; font-size: 13px;">
                                    <span>➕</span>
                                    <span>Προσθήκη Τηλεφώνου</span>
                                </button>
                            ` : ''}
                        </div>

                        <!-- Emails -->
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: var(--text-primary); font-size: 13px;">
                                Email
                            </label>
                            <div id="emails-container">
                                ${this.buildEmailFields(emails)}
                            </div>
                            ${emails.length < 3 ? `
                                <button type="button" id="add-email-btn" class="btn-secondary"
                                        style="margin-top: 6px; width: 100%; padding: 6px; display: flex; align-items: center;
                                               justify-content: center; gap: 4px; font-size: 13px;">
                                    <span>➕</span>
                                    <span>Προσθήκη Email</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Parse phones from client data
         */
        parsePhones: function(client) {
            if (!client) return [{ value: '', type: 'work' }];

            const phones = [];
            if (client.phone) phones.push({ value: client.phone, type: client.phoneType || 'work' });
            if (client.phone2) phones.push({ value: client.phone2, type: client.phone2Type || 'work' });
            if (client.phone3) phones.push({ value: client.phone3, type: client.phone3Type || 'work' });

            return phones.length > 0 ? phones : [{ value: '', type: 'work' }];
        },

        /**
         * Parse emails from client data
         */
        parseEmails: function(client) {
            if (!client) return [{ value: '', type: 'work' }];

            const emails = [];
            if (client.email) emails.push({ value: client.email, type: client.emailType || 'work' });
            if (client.email2) emails.push({ value: client.email2, type: client.email2Type || 'work' });
            if (client.email3) emails.push({ value: client.email3, type: client.email3Type || 'work' });

            return emails.length > 0 ? emails : [{ value: '', type: 'work' }];
        },

        /**
         * Build phone input fields
         */
        buildPhoneFields: function(phones) {
            return phones.map((phone, index) => `
                <div class="phone-field" data-index="${index}" style="display: flex; gap: 4px; margin-bottom: 6px;">
                    <select name="phone${index}_type" style="flex: 0 0 65px; padding: 6px 4px; border: 1px solid var(--border);
                                                              border-radius: var(--border-radius-sm); background: var(--background);
                                                              color: var(--text-primary); font-size: 12px;">
                        <option value="work" ${phone.type === 'work' ? 'selected' : ''}>Εργασία</option>
                        <option value="home" ${phone.type === 'home' ? 'selected' : ''}>Οικία</option>
                        <option value="mobile" ${phone.type === 'mobile' ? 'selected' : ''}>Κινητό</option>
                        <option value="other" ${phone.type === 'other' ? 'selected' : ''}>Άλλο</option>
                    </select>
                    <input type="tel" name="phone${index}" value="${phone.value || ''}"
                           placeholder="+30 123 456 7890"
                           style="flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--border);
                                  border-radius: var(--border-radius-sm); background: var(--background);
                                  color: var(--text-primary); font-size: 13px;">
                    ${index > 0 ? `
                        <button type="button" class="remove-phone-btn" data-index="${index}"
                                style="flex: 0 0 32px; padding: 6px; background: #ff4444; color: white;
                                       border: none; border-radius: var(--border-radius-sm); cursor: pointer;
                                       font-size: 16px; font-weight: bold; display: flex; align-items: center;
                                       justify-content: center;">
                            ✕
                        </button>
                    ` : ''}
                </div>
            `).join('');
        },

        /**
         * Build email input fields
         */
        buildEmailFields: function(emails) {
            return emails.map((email, index) => `
                <div class="email-field" data-index="${index}" style="display: flex; gap: 4px; margin-bottom: 6px;">
                    <select name="email${index}_type" style="flex: 0 0 65px; padding: 6px 4px; border: 1px solid var(--border);
                                                               border-radius: var(--border-radius-sm); background: var(--background);
                                                               color: var(--text-primary); font-size: 12px;">
                        <option value="work" ${email.type === 'work' ? 'selected' : ''}>Εργασία</option>
                        <option value="home" ${email.type === 'home' ? 'selected' : ''}>Οικία</option>
                        <option value="personal" ${email.type === 'personal' ? 'selected' : ''}>Προσ.</option>
                        <option value="other" ${email.type === 'other' ? 'selected' : ''}>Άλλο</option>
                    </select>
                    <input type="email" name="email${index}" value="${email.value || ''}"
                           placeholder="email@example.com"
                           style="flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--border);
                                  border-radius: var(--border-radius-sm); background: var(--background);
                                  color: var(--text-primary); font-size: 13px;">
                    ${index > 0 ? `
                        <button type="button" class="remove-email-btn" data-index="${index}"
                                style="flex: 0 0 32px; padding: 6px; background: #ff4444; color: white;
                                       border: none; border-radius: var(--border-radius-sm); cursor: pointer;
                                       font-size: 16px; font-weight: bold; display: flex; align-items: center;
                                       justify-content: center;">
                            ✕
                        </button>
                    ` : ''}
                </div>
            `).join('');
        },

        /**
         * Notes Section - Collapsible
         */
        buildNotesSection: function(client) {
            return `
                <div class="modal-section collapsible-section" data-section="notes">
                    <div class="section-header" style="display: flex; align-items: center; justify-content: space-between;
                                                      padding: 12px 16px; background: var(--surface); border-radius: 8px;
                                                      cursor: pointer; border: 1px solid var(--border); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">📝</span>
                            <span style="font-weight: 600; font-size: 15px;">Σημειώσεις</span>
                        </div>
                        <span class="section-toggle" style="font-size: 20px; transition: transform 0.3s;">▼</span>
                    </div>
                    <div class="section-content" style="padding: 0 4px 12px 4px;">
                        <div class="form-group">
                            <textarea name="desc" rows="4" placeholder="Πρόσθετες σημειώσεις για τον πελάτη..."
                                      style="width: 100%; padding: 8px; border: 1px solid var(--border);
                                             border-radius: var(--border-radius-sm); background: var(--background);
                                             color: var(--text-primary); font-size: 13px; font-family: inherit; resize: vertical;">${client?.desc || ''}</textarea>
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Social Media Section - Collapsible
         */
        buildSocialMediaSection: function(client) {
            return `
                <div class="modal-section collapsible-section" data-section="social-media">
                    <div class="section-header" style="display: flex; align-items: center; justify-content: space-between;
                                                      padding: 12px 16px; background: var(--surface); border-radius: 8px;
                                                      cursor: pointer; border: 1px solid var(--border); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">🌐</span>
                            <span style="font-weight: 600; font-size: 15px;">Social Media & Ιστοσελίδα</span>
                        </div>
                        <span class="section-toggle" style="font-size: 20px; transition: transform 0.3s;">▼</span>
                    </div>
                    <div class="section-content" style="padding: 0 4px 12px 4px;">
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 500;">Ιστοσελίδα</label>
                            <input type="url" name="website" value="${client?.website || ''}"
                                   placeholder="https://example.com"
                                   style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                          border-radius: var(--border-radius-sm); background: var(--background);
                                          color: var(--text-primary); font-size: 13px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 500;">Facebook</label>
                            <input type="url" name="facebook" value="${client?.facebook || ''}"
                                   placeholder="https://facebook.com/username"
                                   style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                          border-radius: var(--border-radius-sm); background: var(--background);
                                          color: var(--text-primary); font-size: 13px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 500;">Instagram</label>
                            <input type="url" name="instagram" value="${client?.instagram || ''}"
                                   placeholder="https://instagram.com/username"
                                   style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                          border-radius: var(--border-radius-sm); background: var(--background);
                                          color: var(--text-primary); font-size: 13px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 500;">LinkedIn</label>
                            <input type="url" name="linkedin" value="${client?.linkedin || ''}"
                                   placeholder="https://linkedin.com/in/username"
                                   style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                          border-radius: var(--border-radius-sm); background: var(--background);
                                          color: var(--text-primary); font-size: 13px;">
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Addresses Section - Collapsible with dynamic fields (map or text)
         */
        buildAddressesSection: function(client) {
            const addresses = this.parseAddresses(client);

            return `
                <div class="modal-section collapsible-section" data-section="addresses">
                    <div class="section-header" style="display: flex; align-items: center; justify-content: space-between;
                                                      padding: 12px 16px; background: var(--surface); border-radius: 8px;
                                                      cursor: pointer; border: 1px solid var(--border); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">📍</span>
                            <span style="font-weight: 600; font-size: 15px;">Διευθύνσεις</span>
                        </div>
                        <span class="section-toggle" style="font-size: 20px; transition: transform 0.3s;">▼</span>
                    </div>
                    <div class="section-content" style="padding: 0 4px 12px 4px;">
                        <div id="addresses-container">
                            ${this.buildAddressFields(addresses)}
                        </div>
                        ${addresses.length < 3 ? `
                            <button type="button" id="add-address-btn" class="btn-secondary"
                                    style="margin-top: 6px; width: 100%; padding: 6px; display: flex; align-items: center;
                                           justify-content: center; gap: 4px; font-size: 13px;">
                                <span>➕</span>
                                <span>Προσθήκη Διεύθυνσης</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        },

        /**
         * Parse addresses from client data
         */
        parseAddresses: function(client) {
            if (!client) return [];

            const addresses = [];

            // Legacy single address field
            if (client.address && !client.addresses) {
                addresses.push({
                    type: 'text',
                    value: client.address,
                    label: 'Main',
                    lat: client.lat || null,
                    lng: client.lng || null
                });
            }

            // New addresses array
            if (client.addresses && Array.isArray(client.addresses)) {
                client.addresses.forEach(addr => {
                    addresses.push(addr);
                });
            }

            return addresses;
        },

        /**
         * Build address fields
         */
        buildAddressFields: function(addresses) {
            if (addresses.length === 0) {
                return `
                    <div style="padding: 12px; text-align: center; color: var(--text-secondary); font-size: 13px; border: 1px dashed var(--border); border-radius: 6px;">
                        Δεν υπάρχουν διευθύνσεις ακόμα. Κλικ "Προσθήκη Διεύθυνσης" για προσθήκη.
                    </div>
                `;
            }

            return addresses.map((address, index) => `
                <div class="address-field" data-index="${index}"
                     style="margin-bottom: 8px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px;">

                    <div style="display: flex; gap: 4px; margin-bottom: 6px; align-items: center;">
                        <!-- Address Label -->
                        <input type="text" name="address${index}_label" value="${address.label || ''}"
                               placeholder="Label (e.g., Main Office)"
                               style="flex: 1; min-width: 0; padding: 4px 6px; border: 1px solid var(--border);
                                      border-radius: var(--border-radius-sm); background: var(--background);
                                      color: var(--text-primary); font-size: 12px; font-weight: 500;">

                        <!-- Address Type Toggle -->
                        <button type="button" class="address-type-toggle" data-index="${index}" data-current-type="${address.type || 'text'}"
                                style="flex: 0 0 auto; padding: 4px 8px; background: var(--primary-color); color: white;
                                       border: none; border-radius: var(--border-radius-sm); cursor: pointer; font-size: 11px;">
                            ${address.type === 'map' ? '🗺️ Map' : '📝 Text'}
                        </button>

                        ${index > 0 || addresses.length > 1 ? `
                            <button type="button" class="remove-address-btn" data-index="${index}"
                                    style="flex: 0 0 28px; padding: 4px; background: #ff4444; color: white;
                                           border: none; border-radius: var(--border-radius-sm); cursor: pointer;
                                           font-size: 14px; font-weight: bold;">
                                ✕
                            </button>
                        ` : ''}
                    </div>

                    <!-- Address Content (Text or Map) -->
                    <div class="address-content" data-index="${index}">
                        ${address.type === 'map' ?
                            this.buildMapAddressContent(address, index) :
                            this.buildTextAddressContent(address, index)
                        }
                    </div>
                </div>
            `).join('');
        },

        /**
         * Build text address content
         */
        buildTextAddressContent: function(address, index) {
            return `
                <input type="text" name="address${index}_value" value="${address.value || ''}"
                       placeholder="Enter full address"
                       style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                              border-radius: var(--border-radius-sm); background: var(--background);
                              color: var(--text-primary); font-size: 13px;">
                <input type="hidden" name="address${index}_type" value="text">
            `;
        },

        /**
         * Build map address content
         */
        buildMapAddressContent: function(address, index) {
            const hasLocation = address.lat && address.lng;
            return `
                <div style="display: flex; gap: 4px;">
                    <input type="text" name="address${index}_value" value="${address.value || ''}"
                           placeholder="Address from map" readonly
                           style="flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--border);
                                  border-radius: var(--border-radius-sm); background: var(--surface);
                                  color: var(--text-primary); font-size: 12px;">
                    <button type="button" class="pick-from-map-btn" data-index="${index}"
                            style="flex: 0 0 auto; padding: 6px 10px; background: var(--primary-color); color: white;
                                   border: none; border-radius: var(--border-radius-sm); cursor: pointer; font-size: 12px;">
                        ${hasLocation ? '📍 Change' : '📍 Pick'}
                    </button>
                </div>
                <input type="hidden" name="address${index}_type" value="map">
                <input type="hidden" name="address${index}_lat" value="${address.lat || ''}">
                <input type="hidden" name="address${index}_lng" value="${address.lng || ''}">
            `;
        },

        /**
         * Contact Persons Section - Collapsible with dynamic fields
         */
        buildContactPersonsSection: function(client) {
            const contacts = this.parseContactPersons(client);

            return `
                <div class="modal-section collapsible-section" data-section="contact-persons">
                    <div class="section-header" style="display: flex; align-items: center; justify-content: space-between;
                                                      padding: 12px 16px; background: var(--surface); border-radius: 8px;
                                                      cursor: pointer; border: 1px solid var(--border); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">👥</span>
                            <span style="font-weight: 600; font-size: 15px;">Άτομα Επικοινωνίας</span>
                        </div>
                        <span class="section-toggle" style="font-size: 20px; transition: transform 0.3s;">▼</span>
                    </div>
                    <div class="section-content" style="padding: 0 4px 12px 4px;">
                        <div id="contacts-container">
                            ${this.buildContactPersonFields(contacts)}
                        </div>
                        ${contacts.length < 3 ? `
                            <button type="button" id="add-contact-btn" class="btn-secondary"
                                    style="margin-top: 6px; width: 100%; padding: 6px; display: flex; align-items: center;
                                           justify-content: center; gap: 4px; font-size: 13px;">
                                <span>➕</span>
                                <span>Προσθήκη Ατόμου Επικοινωνίας</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        },

        /**
         * Parse contact persons from client data
         */
        parseContactPersons: function(client) {
            if (!client) return [];

            const contacts = [];

            // Legacy contactName field
            if (client.contactName && !client.contactPersons) {
                contacts.push({
                    name: client.contactName,
                    phone: '',
                    email: '',
                    position: ''
                });
            }

            // New contactPersons array
            if (client.contactPersons && Array.isArray(client.contactPersons)) {
                client.contactPersons.forEach(contact => {
                    contacts.push(contact);
                });
            }

            return contacts;
        },

        /**
         * Build contact person fields
         */
        buildContactPersonFields: function(contacts) {
            if (contacts.length === 0) {
                return `
                    <div style="padding: 12px; text-align: center; color: var(--text-secondary); font-size: 13px; border: 1px dashed var(--border); border-radius: 6px;">
                        Δεν υπάρχουν άτομα επικοινωνίας ακόμα. Κλικ "Προσθήκη Ατόμου Επικοινωνίας" για προσθήκη.
                    </div>
                `;
            }

            return contacts.map((contact, index) => `
                <div class="contact-person-field" data-index="${index}"
                     style="margin-bottom: 8px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px;">

                    <!-- Name and Remove Button -->
                    <div style="display: flex; gap: 4px; margin-bottom: 6px;">
                        <input type="text" name="contact${index}_name" value="${contact.name || ''}"
                               placeholder="Name *" required
                               style="flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--border);
                                      border-radius: var(--border-radius-sm); background: var(--background);
                                      color: var(--text-primary); font-size: 13px; font-weight: 500;">

                        <button type="button" class="remove-contact-btn" data-index="${index}"
                                style="flex: 0 0 28px; padding: 4px; background: #ff4444; color: white;
                                       border: none; border-radius: var(--border-radius-sm); cursor: pointer;
                                       font-size: 14px; font-weight: bold;">
                            ✕
                        </button>
                    </div>

                    <!-- Position -->
                    <div style="margin-bottom: 6px;">
                        <input type="text" name="contact${index}_position" value="${contact.position || ''}"
                               placeholder="Position (e.g., Manager, Secretary)"
                               style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                      border-radius: var(--border-radius-sm); background: var(--background);
                                      color: var(--text-primary); font-size: 12px;">
                    </div>

                    <!-- Phone -->
                    <div style="margin-bottom: 6px;">
                        <input type="tel" name="contact${index}_phone" value="${contact.phone || ''}"
                               placeholder="Phone"
                               style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                      border-radius: var(--border-radius-sm); background: var(--background);
                                      color: var(--text-primary); font-size: 12px;">
                    </div>

                    <!-- Email -->
                    <div>
                        <input type="email" name="contact${index}_email" value="${contact.email || ''}"
                               placeholder="Email"
                               style="width: 100%; padding: 6px 8px; border: 1px solid var(--border);
                                      border-radius: var(--border-radius-sm); background: var(--background);
                                      color: var(--text-primary); font-size: 12px;">
                    </div>
                </div>
            `).join('');
        },

        /**
         * File Attachments Section - Collapsible with file upload
         */
        buildFileAttachmentsSection: function(client) {
            const files = this.parseFiles(client);

            return `
                <div class="modal-section collapsible-section" data-section="file-attachments">
                    <div class="section-header" style="display: flex; align-items: center; justify-content: space-between;
                                                      padding: 12px 16px; background: var(--surface); border-radius: 8px;
                                                      cursor: pointer; border: 1px solid var(--border); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 20px;">📎</span>
                            <span style="font-weight: 600; font-size: 15px;">Συνημμένα Αρχεία</span>
                            ${files.length > 0 ? `<span style="background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${files.length}</span>` : ''}
                        </div>
                        <span class="section-toggle" style="font-size: 20px; transition: transform 0.3s;">▼</span>
                    </div>
                    <div class="section-content" style="padding: 0 4px 12px 4px;">
                        <div id="files-container" style="margin-bottom: 8px;">
                            ${this.buildFileFields(files)}
                        </div>
                        <input type="file" id="file-input" multiple style="display: none;"
                               accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar">
                        <button type="button" id="add-file-btn" class="btn-secondary"
                                style="width: 100%; padding: 8px; display: flex; align-items: center;
                                       justify-content: center; gap: 6px; font-size: 13px;">
                            <span>📁</span>
                            <span>Upload Files</span>
                        </button>
                        <div style="margin-top: 6px; font-size: 11px; color: var(--text-secondary); text-align: center;">
                            Supported: Images, PDF, Word, Excel, PowerPoint, TXT, ZIP, RAR
                        </div>
                    </div>
                </div>
            `;
        },

        /**
         * Parse files from client data
         */
        parseFiles: function(client) {
            if (!client || !client.files || !Array.isArray(client.files)) {
                return [];
            }
            return client.files;
        },

        /**
         * Build file fields display
         */
        buildFileFields: function(files) {
            if (files.length === 0) {
                return `
                    <div style="padding: 12px; text-align: center; color: var(--text-secondary); font-size: 13px; border: 1px dashed var(--border); border-radius: 6px;">
                        No files attached. Click "Upload Files" to add files.
                    </div>
                `;
            }

            return files.map((file, index) => {
                const icon = this.getFileIcon(file.type);
                const isImage = file.type?.startsWith('image/');
                const hasImageData = isImage && file.data && !file.storedInFilesystem;

                return `
                    <div class="file-item" data-index="${index}"
                         style="display: flex; gap: 8px; align-items: center; padding: 8px;
                                background: var(--surface); border: 1px solid var(--border);
                                border-radius: 6px; margin-bottom: 6px;">

                        ${hasImageData ? `
                            <div style="flex: 0 0 48px; height: 48px; border-radius: 4px; overflow: hidden; background: var(--border);">
                                <img src="${file.data}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                        ` : `
                            <div style="flex: 0 0 48px; height: 48px; border-radius: 4px; background: var(--primary-color)22;
                                        display: flex; align-items: center; justify-content: center; font-size: 24px;">
                                ${icon}
                            </div>
                        `}

                        <div style="flex: 1; min-width: 0; overflow: hidden;">
                            <div style="font-size: 13px; font-weight: 500; color: var(--text-primary);
                                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${this.escapeHtml(file.name)}
                            </div>
                            <div style="font-size: 11px; color: var(--text-secondary);">
                                ${this.formatFileSize(file.size)}
                            </div>
                        </div>

                        <button type="button" class="view-file-btn" data-index="${index}"
                                style="flex: 0 0 auto; padding: 6px 10px; background: var(--primary-color); color: white;
                                       border: none; border-radius: var(--border-radius-sm); cursor: pointer; font-size: 11px;">
                            👁️ View
                        </button>

                        <button type="button" class="remove-file-btn" data-index="${index}"
                                style="flex: 0 0 28px; padding: 4px; background: #ff4444; color: white;
                                       border: none; border-radius: var(--border-radius-sm); cursor: pointer;
                                       font-size: 14px; font-weight: bold;">
                            ✕
                        </button>
                    </div>
                `;
            }).join('');
        },

        /**
         * Get file icon based on type
         */
        getFileIcon: function(type) {
            if (!type) return '📄';

            if (type.startsWith('image/')) return '🖼️';
            if (type === 'application/pdf') return '📕';
            if (type.includes('word') || type.includes('document')) return '📘';
            if (type.includes('sheet') || type.includes('excel')) return '📗';
            if (type.includes('presentation') || type.includes('powerpoint')) return '📙';
            if (type === 'text/plain') return '📃';
            if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return '📦';

            return '📄';
        },

        /**
         * Format file size
         */
        formatFileSize: function(bytes) {
            if (!bytes || bytes === 0) return '0 B';

            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
        },

        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Export to global scope
    if (window.SmartAgenda) {
        window.SmartAgenda.ClientModalNew = ClientModalNew;
    }

})();
