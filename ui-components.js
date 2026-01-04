/**
 * Smart Agenda - UI Components Module
 * 
 * Reusable UI components:
 * - Modal dialogs
 * - Forms
 * - Confirmation dialogs
 * - Empty states
 */

(function() {
    'use strict';

    const UIComponents = {
        modalContainer: null,

        init: function() {
            this.modalContainer = document.getElementById('modal-container');
            this.initGreekTextInputFix();
            this.initBackButtonHandler();
        },

        /**
         * Initialize hardware back button handler (Android)
         */
        initBackButtonHandler: function() {
            // Check if Capacitor App plugin is available
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
                const { App } = window.Capacitor.Plugins;

                App.addListener('backButton', (event) => {
                    // Check if there are any open modals
                    const openModals = this.modalContainer.querySelectorAll('.modal-overlay.active');

                    if (openModals.length > 0) {
                        // Close the topmost modal
                        const lastModal = openModals[openModals.length - 1];
                        this.closeModal(lastModal);
                        return; // Prevent default back behavior
                    }

                    // Check if hamburger menu is open
                    const navMenu = document.getElementById('nav-menu');
                    if (navMenu && navMenu.classList.contains('open')) {
                        // Close the menu
                        if (window.SmartAgenda && window.SmartAgenda.Navigation) {
                            window.SmartAgenda.Navigation.closeMenu();
                        }
                        return; // Prevent default back behavior
                    }

                    // Check if we're in a settings category view (not main settings menu)
                    if (window.SmartAgenda && window.SmartAgenda.Settings && window.SmartAgenda.Settings.currentCategory) {
                        // Go back to main settings menu
                        window.SmartAgenda.Settings.goBackToMainMenu();
                        return; // Prevent default back behavior
                    }

                    // No modals or menus open, allow default back behavior
                    // (navigate back or exit app)
                    if (event.canGoBack) {
                        window.history.back();
                    } else {
                        App.exitApp();
                    }
                });

                console.log('✅ Back button handler initialized');
            }
        },

        /**
         * Initialize text input handling
         * Note: Greek text input should work naturally without intervention
         */
        initGreekTextInputFix: function() {
            // Removed custom text input handling as it was causing cursor issues
            // Greek/CJK text input should work naturally in modern browsers
            console.log('✅ Text input initialized (natural behavior)');
        },

        // ============================================
        // Modal System
        // ============================================

        /**
         * Show a modal dialog
         * @param {Object} options - Modal options
         * @returns {HTMLElement} Modal element
         */
        showModal: function(options) {
            const {
                title,
                content,
                buttons = [],
                size = 'medium', // small, medium, large
                closeOnOverlay = true,
                hideCloseButton = false,
                hideHeader = false
            } = options;

            // Create modal structure
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-dialog modal-${size}">
                    ${hideHeader ? '' : `
                        <div class="modal-header">
                            <h3 class="modal-title">${title}</h3>
                            ${hideCloseButton ? '' : '<button class="modal-close" aria-label="Close">×</button>'}
                        </div>
                    `}
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${buttons.length > 0 ? `
                        <div class="modal-footer">
                            ${buttons.map(btn => `
                                <button class="btn-${btn.type || 'secondary'}" data-action="${btn.action}" ${btn.icon ? 'style="min-width: auto; padding: 8px 12px;"' : ''}>
                                    ${btn.icon || btn.label}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;

            // Add to container
            this.modalContainer.appendChild(modal);

            // Prevent background scrolling
            document.body.style.overflow = 'hidden';

            // Bind events
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(modal));
            }

            if (closeOnOverlay) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modal);
                    }
                });
            }

            // Bind button actions
            buttons.forEach(btn => {
                const btnElement = modal.querySelector(`[data-action="${btn.action}"]`);
                if (btnElement && btn.onClick) {
                    btnElement.addEventListener('click', () => {
                        btn.onClick(modal);
                    });
                }
            });

            // Show modal with animation
            setTimeout(() => modal.classList.add('active'), 10);

            return modal;
        },

        /**
         * Show progress modal
         * @param {string} title - Modal title
         * @returns {Object} Modal controller with update and close methods
         */
        showProgressModal: function(title = 'Processing...') {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-dialog modal-small">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                    </div>
                    <div class="modal-body" style="padding: 24px;">
                        <div class="progress-message" style="text-align: center; margin-bottom: 16px; font-size: 14px; color: var(--text-secondary); min-height: 20px;">
                            Ξεκινάει...
                        </div>
                        <div class="progress-bar-container" style="width: 100%; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                            <div class="progress-bar-fill" style="width: 0%; height: 100%; background: var(--primary-color); transition: width 0.3s ease; position: relative; overflow: hidden;"></div>
                        </div>
                        <style>
                        @keyframes progress-pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.7; }
                        }
                        .progress-pulsing {
                            animation: progress-pulse 2s ease-in-out infinite;
                        }
                        .progress-pulsing::after {
                            content: '';
                            position: absolute;
                            top: 0;
                            right: 0;
                            bottom: 0;
                            left: 0;
                            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                            animation: progress-shimmer 2s linear infinite;
                        }
                        @keyframes progress-shimmer {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                        </style>
                        <div class="progress-percent" style="text-align: center; font-size: 13px; font-weight: 600; color: var(--primary-color);">
                            0%
                        </div>
                    </div>
                </div>
            `;

            // Add to container
            this.modalContainer.appendChild(modal);

            // Prevent background scrolling
            document.body.style.overflow = 'hidden';

            // Show modal with animation
            setTimeout(() => modal.classList.add('active'), 10);

            // Return controller
            return {
                element: modal,
                update: function(percent, message, options = {}) {
                    const progressFill = modal.querySelector('.progress-bar-fill');
                    const progressPercent = modal.querySelector('.progress-percent');
                    const progressMessage = modal.querySelector('.progress-message');

                    if (progressFill) {
                        progressFill.style.width = percent + '%';

                        // Add pulsing animation for simulated progress
                        if (options.pulsing) {
                            progressFill.classList.add('progress-pulsing');
                        } else {
                            progressFill.classList.remove('progress-pulsing');
                        }
                    }
                    if (progressPercent) {
                        progressPercent.textContent = percent + '%';
                    }
                    if (progressMessage && message) {
                        progressMessage.textContent = message;
                    }
                },
                close: function() {
                    modal.classList.remove('active');
                    setTimeout(() => {
                        modal.remove();
                        // Re-enable background scrolling only if no other modals are open
                        if (window.SmartAgenda.UIComponents.modalContainer.querySelectorAll('.modal-overlay').length === 0) {
                            document.body.style.overflow = '';
                        }
                    }, 300);
                }
            };
        },

        /**
         * Close a modal
         * @param {HTMLElement} modal - Modal element to close
         */
        closeModal: function(modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                // Re-enable background scrolling only if no other modals are open
                if (this.modalContainer.querySelectorAll('.modal-overlay').length === 0) {
                    document.body.style.overflow = '';
                }
            }, 200);
        },

        /**
         * Show confirmation dialog
         * @param {Object} options - Dialog options
         * @returns {Promise<boolean>} User's choice
         */
        confirm: function(options) {
            const {
                title = 'Confirm',
                message,
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'warning' // warning, danger, info
            } = options;

            return new Promise((resolve) => {
                const modal = this.showModal({
                    title,
                    content: `
                        <div class="confirm-dialog confirm-${type}">
                            <p>${message}</p>
                        </div>
                    `,
                    buttons: [
                        {
                            label: cancelText,
                            type: 'secondary',
                            action: 'cancel',
                            onClick: (modal) => {
                                this.closeModal(modal);
                                resolve(false);
                            }
                        },
                        {
                            label: confirmText,
                            type: type === 'danger' ? 'danger' : 'primary',
                            action: 'confirm',
                            onClick: (modal) => {
                                this.closeModal(modal);
                                resolve(true);
                            }
                        }
                    ],
                    size: 'small',
                    closeOnOverlay: false
                });
            });
        },

        // ============================================
        // Form Builder
        // ============================================

        /**
         * Create a form with fields
         * @param {Array} fields - Array of field definitions
         * @param {Object} initialValues - Initial field values
         * @returns {Object} Form element and getValue function
         */
        createForm: function(fields, initialValues = {}) {
            const form = document.createElement('form');
            form.className = 'modal-form';

            // Track if we need to create a row for inline fields
            let currentRow = null;

            fields.forEach((field, index) => {
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';

                // Support for inline fields (width property)
                if (field.width) {
                    formGroup.style.width = field.width;
                    formGroup.style.flex = '0 0 auto';
                    formGroup.style.minWidth = '0';

                    // Create a row container if:
                    // 1. This is the first inline field or previous wasn't inline
                    // 2. OR this field explicitly requests a new row
                    const prevField = fields[index - 1];
                    if (!currentRow || !prevField || !prevField.width || field.newRow) {
                        currentRow = document.createElement('div');
                        currentRow.className = 'form-row';
                        currentRow.style.display = 'flex';
                        currentRow.style.gap = '12px';
                        currentRow.style.marginBottom = '16px';
                        currentRow.style.flexWrap = 'nowrap';
                        form.appendChild(currentRow);
                    }
                } else {
                    // Not an inline field, reset current row
                    currentRow = null;
                }

                // Label
                if (field.label) {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    label.setAttribute('for', field.name);
                    if (field.required) {
                        label.innerHTML += ' <span class="text-danger">*</span>';
                    }
                    formGroup.appendChild(label);
                }

                // Input
                let input;
                switch (field.type) {
                    case 'note':
                        // For note type, just add the text without input field
                        const note = document.createElement('div');
                        note.className = 'form-note';
                        note.style.fontSize = '12px';
                        note.style.color = 'var(--text-secondary)';
                        note.style.marginTop = '8px';
                        note.style.fontStyle = 'italic';
                        note.textContent = field.text || '';
                        formGroup.innerHTML = '';
                        formGroup.appendChild(note);
                        formGroup.style.marginBottom = '8px';

                        // Append and continue to next field
                        if (currentRow && field.width) {
                            currentRow.appendChild(formGroup);
                        } else {
                            form.appendChild(formGroup);
                        }
                        input = null; // Set to null so we skip further processing
                        break;
                    case 'textarea':
                        input = document.createElement('textarea');
                        input.rows = field.rows || 4;
                        // Set initial value for textarea
                        if (initialValues[field.name] !== undefined) {
                            input.textContent = initialValues[field.name];
                        }
                        break;
                    case 'select':
                        input = document.createElement('select');
                        const selectValue = initialValues[field.name];
                        field.options?.forEach(opt => {
                            const option = document.createElement('option');
                            option.value = opt.value;
                            option.textContent = opt.label;
                            // Set selected attribute for initial value
                            if (selectValue !== undefined && opt.value == selectValue) {
                                option.selected = true;
                                option.setAttribute('selected', 'selected');
                            }
                            input.appendChild(option);
                        });
                        break;
                    case 'checkbox':
                        const wrapper = document.createElement('div');
                        wrapper.className = 'checkbox-wrapper';
                        input = document.createElement('input');
                        input.type = 'checkbox';
                        const checkLabel = document.createElement('label');
                        checkLabel.textContent = field.label;
                        wrapper.appendChild(input);
                        wrapper.appendChild(checkLabel);
                        formGroup.innerHTML = '';
                        formGroup.appendChild(wrapper);
                        break;
                    default:
                        input = document.createElement('input');
                        input.type = field.type || 'text';
                }

                // Skip further processing if input is null (e.g., for 'note' type)
                if (!input) {
                    return;
                }

                input.name = field.name;
                input.id = field.name;
                input.className = 'form-control';

                if (field.placeholder) {
                    input.placeholder = field.placeholder;
                }

                if (field.required) {
                    input.required = true;
                }

                if (field.step) {
                    input.step = field.step;
                }

                if (field.min !== undefined) {
                    input.min = field.min;
                }

                if (field.max !== undefined) {
                    input.max = field.max;
                }

                // Set initial value - MUST set as attribute to persist in outerHTML
                // Note: textarea and select already handled in switch case above
                if (initialValues[field.name] !== undefined && field.type !== 'textarea' && field.type !== 'select') {
                    if (field.type === 'checkbox') {
                        input.checked = initialValues[field.name];
                        if (initialValues[field.name]) {
                            input.setAttribute('checked', 'checked');
                        }
                    } else {
                        const value = initialValues[field.name];
                        // Only set value if it's not empty/null
                        if (value !== null && value !== '') {
                            input.value = value;
                            input.setAttribute('value', value);
                        }
                    }
                }

                if (field.type !== 'checkbox') {
                    formGroup.appendChild(input);
                }

                // Append formGroup to either current row or form
                if (currentRow && field.width) {
                    currentRow.appendChild(formGroup);
                } else {
                    form.appendChild(formGroup);
                }
            });

            // Return form and helper function
            const formObject = {
                element: form,
                getValues: function() {
                    const values = {};
                    fields.forEach(field => {
                        // Use this.element to always reference the current element
                        const input = this.element.querySelector(`[name="${field.name}"]`);
                        if (input) {
                            if (field.type === 'checkbox') {
                                values[field.name] = input.checked;
                            } else {
                                values[field.name] = input.value;
                            }
                        }
                    });
                    return values;
                },
                validate: function() {
                    return this.element.checkValidity();
                }
            };
            return formObject;
        },

        // ============================================
        // Empty State
        // ============================================

        /**
         * Create empty state element
         * @param {Object} options - Empty state options
         * @returns {HTMLElement} Empty state element
         */
        createEmptyState: function(options) {
            const {
                icon = '📭',
                title,
                message,
                actionText,
                onAction
            } = options;

            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <div class="empty-icon">${icon}</div>
                <h3 class="empty-title">${title}</h3>
                <p class="empty-message">${message}</p>
                ${actionText ? `<button class="btn-primary empty-action">${actionText}</button>` : ''}
            `;

            if (actionText && onAction) {
                const actionBtn = emptyState.querySelector('.empty-action');
                actionBtn.addEventListener('click', onAction);
            }

            return emptyState;
        },

        // ============================================
        // Loading Spinner
        // ============================================

        /**
         * Create loading spinner
         * @returns {HTMLElement} Spinner element
         */
        createSpinner: function() {
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner-inline';
            spinner.innerHTML = '<div class="spinner"></div>';
            return spinner;
        },

        // ============================================
        // Rich Text Editor (Quill)
        // ============================================

        /**
         * Initialize Quill editor on an element
         * @param {HTMLElement} element - Container element
         * @param {string} initialContent - Initial HTML content
         * @returns {Object} Quill instance
         */
        createRichTextEditor: function(element, initialContent = '') {
            // Use simple contenteditable editor for full Greek support
            // Quill has composition event issues on Android WebView

            // Create toolbar
            const toolbar = document.createElement('div');
            toolbar.className = 'simple-editor-toolbar';
            toolbar.innerHTML = `
                <button type="button" class="editor-btn" data-command="bold" title="Bold">
                    <strong>B</strong>
                </button>
                <button type="button" class="editor-btn" data-command="italic" title="Italic">
                    <em>I</em>
                </button>
                <button type="button" class="editor-btn" data-command="underline" title="Underline">
                    <u>U</u>
                </button>
                <span class="editor-separator"></span>
                <input type="color" class="editor-color-picker" data-command="foreColor" title="Text Color" value="#000000">
                <input type="color" class="editor-color-picker" data-command="backColor" title="Background Color" value="#ffff00">
                <span class="editor-separator"></span>
                <button type="button" class="editor-btn" data-command="insertUnorderedList" title="Bullet List">
                    ☰
                </button>
                <button type="button" class="editor-btn" data-command="insertOrderedList" title="Numbered List">
                    ≡
                </button>
                <span class="editor-separator"></span>
                <button type="button" class="editor-btn" data-command="removeFormat" title="Clear Formatting">
                    ✕
                </button>
            `;

            // Create editor area
            const editorDiv = document.createElement('div');
            editorDiv.className = 'simple-editor-content';
            editorDiv.contentEditable = 'true';
            editorDiv.setAttribute('placeholder', 'Enter description...');
            editorDiv.innerHTML = initialContent || '<p><br></p>';

            // Add styles (only once)
            if (!document.getElementById('simple-editor-styles')) {
                const style = document.createElement('style');
                style.id = 'simple-editor-styles';
                style.textContent = `
                    .simple-editor-toolbar {
                        display: flex;
                        gap: 4px;
                        padding: 8px;
                        background: var(--background);
                        border: 1px solid var(--border);
                        border-bottom: none;
                        border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
                        flex-wrap: wrap;
                    }
                    .editor-btn {
                        padding: 6px 10px;
                        border: 1px solid var(--border);
                        border-radius: 4px;
                        background: var(--surface);
                        color: var(--text-primary);
                        cursor: pointer;
                        font-size: 14px;
                        min-width: 32px;
                        transition: all 0.2s;
                    }
                    .editor-btn:hover {
                        background: var(--primary-color);
                        color: white;
                        border-color: var(--primary-color);
                    }
                    .editor-btn:active {
                        transform: scale(0.95);
                    }
                    .editor-color-picker {
                        width: 32px;
                        height: 32px;
                        border: 1px solid var(--border);
                        border-radius: 4px;
                        cursor: pointer;
                        padding: 2px;
                    }
                    .editor-separator {
                        width: 1px;
                        background: var(--border);
                        margin: 0 4px;
                    }
                    .simple-editor-content {
                        min-height: 150px;
                        max-height: 400px;
                        overflow-y: auto;
                        padding: 12px;
                        border: 1px solid var(--border);
                        border-radius: 0 0 var(--border-radius-sm) var(--border-radius-sm);
                        background: var(--surface);
                        color: var(--text-primary);
                        font-size: 14px;
                        line-height: 1.6;
                        outline: none;
                    }
                    .simple-editor-content:focus {
                        border-color: var(--primary-color);
                    }
                    .simple-editor-content[placeholder]:empty:before {
                        content: attr(placeholder);
                        color: var(--text-secondary);
                        opacity: 0.6;
                    }
                    .simple-editor-content p {
                        margin: 0 0 8px 0;
                    }
                    .simple-editor-content ul, .simple-editor-content ol {
                        margin: 0 0 8px 0;
                        padding-left: 24px;
                    }
                `;
                document.head.appendChild(style);
            }

            // Assemble editor
            element.appendChild(toolbar);
            element.appendChild(editorDiv);

            // Bind toolbar events
            toolbar.querySelectorAll('.editor-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const command = btn.dataset.command;
                    document.execCommand(command, false, null);
                    editorDiv.focus();
                });
            });

            // Bind color pickers
            toolbar.querySelectorAll('.editor-color-picker').forEach(picker => {
                picker.addEventListener('change', (e) => {
                    const command = picker.dataset.command;
                    document.execCommand(command, false, e.target.value);
                    editorDiv.focus();
                });
            });

            // Return Quill-compatible interface
            return {
                root: editorDiv,
                container: element,
                getContents: () => editorDiv.innerHTML,
                setContents: (html) => { editorDiv.innerHTML = html || '<p><br></p>'; },
                getText: () => editorDiv.textContent,
                getLength: () => editorDiv.textContent.length,
                focus: () => editorDiv.focus()
            };
        },

        /**
         * Add rich text editor to form field
         * @param {HTMLElement} textarea - Textarea to replace
         * @param {string} initialContent - Initial content
         * @returns {Object} Editor instance with getValue method
         */
        enhanceTextareaWithEditor: function(textarea, initialContent = '') {
            // DISABLED: No rich text editor - use plain textarea for full Greek support
            // Just show the textarea and strip any HTML from initial content

            textarea.style.display = 'block';

            // Strip HTML tags from initial content if it exists
            if (initialContent) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = initialContent;
                textarea.value = tempDiv.textContent || tempDiv.innerText || '';
            }

            return {
                getValue: () => textarea.value,
                setValue: (val) => {
                    if (val) {
                        // Strip HTML tags
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = val;
                        textarea.value = tempDiv.textContent || tempDiv.innerText || '';
                    } else {
                        textarea.value = '';
                    }
                }
            };
        }
    };

    // Add modal styles
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 200ms ease;
        }

        .modal-overlay.active {
            opacity: 1;
        }

        .modal-dialog {
            background: var(--surface);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transform: scale(0.9);
            transition: transform 200ms ease;
        }

        .modal-overlay.active .modal-dialog {
            transform: scale(1);
        }

        .modal-small { width: 90%; max-width: 400px; }
        .modal-medium { width: 90%; max-width: 600px; }
        .modal-large { width: 90%; max-width: 900px; }

        .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
        }

        .modal-close {
            width: 32px;
            height: 32px;
            border: none;
            background: transparent;
            border-radius: 50%;
            cursor: pointer;
            font-size: 28px;
            line-height: 1;
            color: var(--text-secondary);
            transition: all var(--transition-fast);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-close:hover {
            background: var(--surface-hover);
            color: var(--text-primary);
        }

        .modal-body {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
        }

        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid var(--border);
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        .modal-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .form-group label {
            font-weight: 500;
            font-size: 14px;
            color: var(--text-primary);
        }

        .form-control {
            padding: 10px 12px;
            border: 1px solid var(--border);
            border-radius: var(--border-radius-sm);
            background: var(--surface);
            color: var(--text-primary);
            font-size: 14px;
            font-family: inherit;
            transition: border-color var(--transition-fast);
        }

        .form-control:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        textarea.form-control {
            resize: vertical;
            min-height: 80px;
        }

        .checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .checkbox-wrapper input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .confirm-dialog {
            padding: 12px 0;
        }

        .confirm-dialog p {
            font-size: 15px;
            line-height: 1.6;
            color: var(--text-primary);
            margin: 0;
        }

        .confirm-warning {
            border-left: 4px solid var(--warning);
            padding-left: 16px;
        }

        .confirm-danger {
            border-left: 4px solid var(--danger);
            padding-left: 16px;
        }

        .loading-spinner-inline {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border);
            border-top-color: var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .rich-text-wrapper {
            border: 1px solid var(--border);
            border-radius: var(--border-radius-sm);
            background: var(--surface);
            transition: border-color var(--transition-fast);
        }

        .rich-text-wrapper:focus-within {
            border-color: var(--primary-color);
        }

        .quill-editor-container {
            min-height: 150px;
        }

        .ql-toolbar {
            border: none !important;
            border-bottom: 1px solid var(--border) !important;
            background: var(--background) !important;
        }

        .ql-container {
            border: none !important;
            font-family: inherit !important;
            font-size: 14px !important;
        }

        .ql-editor {
            min-height: 120px;
            color: var(--text-primary) !important;
        }

        .ql-editor.ql-blank::before {
            color: var(--text-tertiary) !important;
            font-style: normal !important;
        }

        .ql-snow .ql-stroke {
            stroke: var(--text-primary) !important;
        }

        .ql-snow .ql-fill {
            fill: var(--text-primary) !important;
        }

        .ql-snow .ql-picker-label {
            color: var(--text-primary) !important;
        }

        .ql-toolbar button:hover,
        .ql-toolbar button.ql-active {
            background: var(--surface-hover) !important;
        }
    `;
    document.head.appendChild(modalStyles);

    // Initialize and add to global API
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            UIComponents.init();
        });
        window.SmartAgenda.UIComponents = UIComponents;
    }

})();
