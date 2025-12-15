/**
 * Smart Agenda - Client Modal Phase 3 Functions
 * File Attachments functionality
 */

(function() {
    'use strict';

    const ClientModalNew = window.SmartAgenda?.ClientModalNew;
    if (!ClientModalNew) return;

    // Store files temporarily during modal session
    ClientModalNew.currentFiles = [];

    /**
     * Get client folder path
     */
    ClientModalNew.getClientFolderPath = function(clientName) {
        // Sanitize client name for filesystem
        const safeName = clientName.replace(/[^a-zA-Z0-9_\-\u0370-\u03FF\u1F00-\u1FFF]/g, '_').substring(0, 100);
        return `Smart Agenda/media/${safeName}`;
    };

    /**
     * Save file to Capacitor Filesystem (if available) or return base64
     */
    ClientModalNew.saveFileToStorage = async function(file, fileData, clientName = 'Unknown') {
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

        // Try to use Capacitor Filesystem on mobile
        if (isMobile && window.Capacitor?.Plugins?.Filesystem) {
            try {
                const Filesystem = window.Capacitor.Plugins.Filesystem;

                // Get client folder path
                const folderPath = this.getClientFolderPath(clientName);

                // Create unique filename with timestamp
                const timestamp = Date.now();
                const safeName = file.name.replace(/[^a-zA-Z0-9._\-\u0370-\u03FF\u1F00-\u1FFF]/g, '_');
                const fileName = `${timestamp}_${safeName}`;
                const fullPath = `${folderPath}/${fileName}`;

                // Extract base64 data (remove data URL prefix)
                const base64Data = fileData.split(',')[1] || fileData;

                // Write file to external storage (Documents directory)
                // Use 'DOCUMENTS' string instead of enum
                const result = await Filesystem.writeFile({
                    path: fullPath,
                    data: base64Data,
                    directory: 'DOCUMENTS',
                    recursive: true
                });

                console.log(`File saved to: Documents/${fullPath}`);

                // Return metadata only (no base64 data)
                return {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    path: fullPath,
                    storedInFilesystem: true,
                    uploadedAt: new Date().toISOString()
                };
            } catch (error) {
                console.error('Error saving to filesystem, using base64:', error);
            }
        }

        // Fallback: store as base64 (desktop or if filesystem fails)
        return {
            name: file.name,
            type: file.type,
            size: file.size,
            data: fileData,
            storedInFilesystem: false,
            uploadedAt: new Date().toISOString()
        };
    };

    /**
     * Initialize file upload functionality
     */
    ClientModalNew.initFileUpload = function(modal, client) {
        const addFileBtn = modal.querySelector('#add-file-btn');
        const fileInput = modal.querySelector('#file-input');
        const filesContainer = modal.querySelector('#files-container');

        // Initialize with existing files
        this.currentFiles = client?.files ? [...client.files] : [];

        // Bind remove and view buttons
        this.bindFileButtons(modal);

        // Click upload button to trigger file input
        addFileBtn?.addEventListener('click', () => {
            fileInput?.click();
        });

        // Handle file selection
        fileInput?.addEventListener('change', async (e) => {
            const selectedFiles = Array.from(e.target.files);

            if (selectedFiles.length === 0) return;

            // Get client name from modal
            const clientNameInput = modal.querySelector('[name="name"]');
            const clientName = clientNameInput?.value?.trim() || client?.name || 'Unknown';

            // Show loading
            window.SmartAgenda.Toast.info(`Uploading ${selectedFiles.length} file(s)...`);

            for (const file of selectedFiles) {
                try {
                    // Read file as base64
                    const fileData = await this.readFileAsBase64(file);

                    // Save to storage (filesystem or base64)
                    const fileMetadata = await this.saveFileToStorage(file, fileData, clientName);

                    // Add to current files array
                    this.currentFiles.push(fileMetadata);
                } catch (error) {
                    console.error('Error reading file:', error);
                    window.SmartAgenda.Toast.error(`Failed to upload ${file.name}`);
                }
            }

            // Update display
            this.refreshFileDisplay(modal);

            // Clear input
            fileInput.value = '';

            window.SmartAgenda.Toast.success(`${selectedFiles.length} file(s) uploaded`);
        });
    };

    /**
     * Read file as base64
     */
    ClientModalNew.readFileAsBase64 = function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    /**
     * Refresh file display
     */
    ClientModalNew.refreshFileDisplay = function(modal) {
        const filesContainer = modal.querySelector('#files-container');
        if (!filesContainer) return;

        // Rebuild HTML
        filesContainer.innerHTML = this.buildFileFields(this.currentFiles);

        // Update badge count
        const badge = modal.querySelector('[data-section="file-attachments"] .section-header span[style*="background: var(--primary-color)"]');
        const badgeParent = modal.querySelector('[data-section="file-attachments"] .section-header > div');

        if (this.currentFiles.length > 0) {
            if (!badge && badgeParent) {
                // Add badge
                const newBadge = document.createElement('span');
                newBadge.style.cssText = 'background: var(--primary-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;';
                newBadge.textContent = this.currentFiles.length;
                badgeParent.appendChild(newBadge);
            } else if (badge) {
                // Update badge
                badge.textContent = this.currentFiles.length;
            }
        } else if (badge) {
            // Remove badge if no files
            badge.remove();
        }

        // Re-bind buttons
        this.bindFileButtons(modal);
    };

    /**
     * Bind file button events
     */
    ClientModalNew.bindFileButtons = function(modal) {
        // View buttons
        modal.querySelectorAll('.view-file-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const index = parseInt(newBtn.dataset.index);
                const file = this.currentFiles[index];

                if (file) {
                    this.viewFile(file);
                }
            });
        });

        // Remove buttons
        modal.querySelectorAll('.remove-file-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', async () => {
                const index = parseInt(newBtn.dataset.index);
                const file = this.currentFiles[index];

                const confirmed = await window.SmartAgenda.UIComponents.confirm({
                    title: 'Delete File',
                    message: `Are you sure you want to delete "${file.name}"?`,
                    confirmText: 'Delete',
                    cancelText: 'Cancel',
                    type: 'danger'
                });

                if (confirmed) {
                    // Delete from filesystem if stored there
                    if (file.storedInFilesystem && file.path && window.Capacitor?.Plugins?.Filesystem) {
                        try {
                            const Filesystem = window.Capacitor.Plugins.Filesystem;
                            await Filesystem.deleteFile({
                                path: file.path,
                                directory: 'DOCUMENTS'
                            });
                            console.log(`File deleted from: Documents/${file.path}`);
                        } catch (error) {
                            console.error('Error deleting file from filesystem:', error);
                            // Continue anyway - remove from array
                        }
                    }

                    // Remove from array
                    this.currentFiles.splice(index, 1);

                    // Refresh display
                    this.refreshFileDisplay(modal);

                    window.SmartAgenda.Toast.success('File removed');
                }
            });
        });
    };

    /**
     * Load file data from storage
     */
    ClientModalNew.loadFileFromStorage = async function(file) {
        // If file is stored in filesystem, read it
        if (file.storedInFilesystem && file.path) {
            try {
                const Filesystem = window.Capacitor.Plugins.Filesystem;

                const result = await Filesystem.readFile({
                    path: file.path,
                    directory: 'DOCUMENTS'
                });

                // Return data URL format
                return `data:${file.type};base64,${result.data}`;
            } catch (error) {
                console.error('Error reading file from filesystem:', error);
                window.SmartAgenda.Toast.error('Unable to load file from storage');
                throw error;
            }
        }

        // If file has data property (old base64 format), return it
        if (file.data) {
            return file.data;
        }

        throw new Error('File data not found');
    };

    /**
     * View file
     */
    ClientModalNew.viewFile = async function(file) {
        if (!file) return;

        const isImage = file.type?.startsWith('image/');
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

        try {
            // Load file data from storage
            const fileData = await this.loadFileFromStorage(file);

            if (isImage) {
                // Show image in modal
                const content = `
                    <div style="text-align: center;">
                        <img src="${fileData}" style="max-width: 100%; max-height: 60vh; border-radius: 8px;">
                    </div>
                `;

                window.SmartAgenda.UIComponents.showModal({
                    title: file.name,
                    content: content,
                    buttons: [
                        {
                            label: 'Close',
                            type: 'secondary',
                            onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                        }
                    ],
                    size: 'large'
                });
            } else {
                // For PDFs and other documents on mobile, use Capacitor FileOpener if available
                if (isMobile && window.Capacitor) {
                    try {
                        const Filesystem = window.Capacitor.Plugins.Filesystem;

                        if (Filesystem) {
                            // Extract base64 data (remove data URL prefix)
                            const base64Data = fileData.split(',')[1] || fileData;

                            // Create unique filename
                            const fileName = `${Date.now()}_${file.name}`;

                            // Write file to cache directory
                            const writeResult = await Filesystem.writeFile({
                                path: fileName,
                                data: base64Data,
                                directory: 'CACHE'
                            });

                            // Get the file URI
                            const fileUri = writeResult.uri;

                            // Try to open with FileOpener if available
                            if (window.Capacitor.Plugins.FileOpener) {
                                await window.Capacitor.Plugins.FileOpener.open({
                                    filePath: fileUri,
                                    contentType: file.type
                                });
                            } else {
                                // Fallback: download
                                window.SmartAgenda.Toast.info('Opening file...');
                                this.downloadFileWithData(file, fileData);
                            }

                            return;
                        }
                    } catch (error) {
                        console.error('Error using Capacitor Filesystem:', error);
                        window.SmartAgenda.Toast.warning('Unable to open file. Downloading instead...');
                    }
                }

                // For desktop or if Capacitor is not available, try to open in new window/tab
                try {
                    const newWindow = window.open();
                    if (newWindow) {
                        newWindow.document.write(`
                            <html>
                                <head>
                                    <title>${file.name}</title>
                                    <style>
                                        body { margin: 0; padding: 20px; font-family: system-ui; }
                                        iframe { width: 100%; height: calc(100vh - 80px); border: 1px solid #ddd; }
                                        .header { margin-bottom: 20px; }
                                    </style>
                                </head>
                                <body>
                                    <div class="header">
                                        <h2>${file.name}</h2>
                                        <p>Size: ${this.formatFileSize(file.size)}</p>
                                    </div>
                                    <iframe src="${fileData}"></iframe>
                                </body>
                            </html>
                        `);
                    } else {
                        // Fallback: download
                        this.downloadFileWithData(file, fileData);
                    }
                } catch (error) {
                    console.error('Error opening file:', error);
                    window.SmartAgenda.Toast.error('Unable to open file. Downloading instead.');
                    this.downloadFileWithData(file, fileData);
                }
            }
        } catch (error) {
            console.error('Error loading file:', error);
            window.SmartAgenda.Toast.error('Unable to load file');
        }
    };

    /**
     * Download file with provided data
     */
    ClientModalNew.downloadFileWithData = function(file, fileData) {
        const link = document.createElement('a');
        link.href = fileData;
        link.download = file.name;
        link.click();
    };

    /**
     * Download file (loads from storage first)
     */
    ClientModalNew.downloadFile = async function(file) {
        try {
            const fileData = await this.loadFileFromStorage(file);
            this.downloadFileWithData(file, fileData);
        } catch (error) {
            console.error('Error downloading file:', error);
            window.SmartAgenda.Toast.error('Unable to download file');
        }
    };

})();
