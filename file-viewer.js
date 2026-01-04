/**
 * Smart Agenda - File Viewer
 * Advanced file viewing with image zoom, rename, delete, and share
 */

(function() {
    'use strict';

    const FileViewer = {
        currentClient: null,
        currentFileIndex: null,
        touchStartDistance: 0,
        currentZoom: 1,
        MIN_ZOOM: 1,
        MAX_ZOOM: 4,
        // Pagination
        currentImagePage: 0,
        currentDocPage: 0,
        IMAGES_PER_PAGE: 12,
        DOCS_PER_PAGE: 10,

        /**
         * Show files modal with list of all files
         */
        showFilesModal: function(imagePageOffset = 0, docPageOffset = 0) {
            if (!this.currentClient || !this.currentClient.files || this.currentClient.files.length === 0) {
                window.SmartAgenda.Toast.warning('No files to display');
                return;
            }

            // Update current pages
            this.currentImagePage = Math.max(0, imagePageOffset);
            this.currentDocPage = Math.max(0, docPageOffset);

            const files = this.currentClient.files;
            const images = files.filter(f => f.type?.startsWith('image/'));
            const documents = files.filter(f => !f.type?.startsWith('image/'));

            let content = '<div style="padding: 8px;">';

            // Images grid
            if (images.length > 0) {
                const totalImagePages = Math.ceil(images.length / this.IMAGES_PER_PAGE);
                const startImageIdx = this.currentImagePage * this.IMAGES_PER_PAGE;
                const endImageIdx = Math.min(startImageIdx + this.IMAGES_PER_PAGE, images.length);
                const paginatedImages = images.slice(startImageIdx, endImageIdx);

                content += `
                    <div style="margin-bottom: 24px;">
                        <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span>🖼️ Images</span>
                                <span style="background: var(--primary-color)22; color: var(--primary-color); padding: 2px 8px; border-radius: 12px; font-size: 11px;">${images.length}</span>
                            </div>
                            ${totalImagePages > 1 ? `
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-secondary);">
                                    <button onclick="window.SmartAgenda.FileViewer.showFilesModal(${this.currentImagePage - 1}, ${this.currentDocPage})"
                                            ${this.currentImagePage === 0 ? 'disabled' : ''}
                                            style="padding: 4px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; ${this.currentImagePage === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                        ◀
                                    </button>
                                    <span>Page ${this.currentImagePage + 1} of ${totalImagePages}</span>
                                    <button onclick="window.SmartAgenda.FileViewer.showFilesModal(${this.currentImagePage + 1}, ${this.currentDocPage})"
                                            ${this.currentImagePage >= totalImagePages - 1 ? 'disabled' : ''}
                                            style="padding: 4px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; ${this.currentImagePage >= totalImagePages - 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                        ▶
                                    </button>
                                </div>
                            ` : ''}
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;">
                `;

                // Find original indices for paginated images
                paginatedImages.forEach((image) => {
                    const originalIndex = files.indexOf(image);

                    // Check if file has data or is stored in filesystem
                    const hasImageData = image.data && !image.storedInFilesystem;
                    const imagePreview = hasImageData ? image.data : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';

                    content += `
                        <div onclick="window.SmartAgenda.FileViewer.openImage(${originalIndex})"
                             style="cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid var(--border);
                                    transition: all 0.2s; aspect-ratio: 1; background: var(--surface); position: relative;"
                             onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
                             onmouseout="this.style.borderColor='var(--border)'; this.style.transform=''; this.style.boxShadow=''">
                            ${hasImageData ? `
                                <img src="${imagePreview}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                            ` : `
                                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                                    🖼️
                                </div>
                            `}
                            <div style="position: absolute; bottom: 4px; left: 4px; right: 4px; background: rgba(0,0,0,0.7); color: white; padding: 4px 6px; border-radius: 4px; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${this.escapeHtml(image.name)}
                            </div>
                        </div>
                    `;
                });

                content += '</div></div>';
            }

            // Documents list
            if (documents.length > 0) {
                const totalDocPages = Math.ceil(documents.length / this.DOCS_PER_PAGE);
                const startDocIdx = this.currentDocPage * this.DOCS_PER_PAGE;
                const endDocIdx = Math.min(startDocIdx + this.DOCS_PER_PAGE, documents.length);
                const paginatedDocs = documents.slice(startDocIdx, endDocIdx);

                content += `
                    <div>
                        <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span>📄 Documents</span>
                                <span style="background: var(--primary-color)22; color: var(--primary-color); padding: 2px 8px; border-radius: 12px; font-size: 11px;">${documents.length}</span>
                            </div>
                            ${totalDocPages > 1 ? `
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-secondary);">
                                    <button onclick="window.SmartAgenda.FileViewer.showFilesModal(${this.currentImagePage}, ${this.currentDocPage - 1})"
                                            ${this.currentDocPage === 0 ? 'disabled' : ''}
                                            style="padding: 4px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; ${this.currentDocPage === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                        ◀
                                    </button>
                                    <span>Page ${this.currentDocPage + 1} of ${totalDocPages}</span>
                                    <button onclick="window.SmartAgenda.FileViewer.showFilesModal(${this.currentImagePage}, ${this.currentDocPage + 1})"
                                            ${this.currentDocPage >= totalDocPages - 1 ? 'disabled' : ''}
                                            style="padding: 4px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; ${this.currentDocPage >= totalDocPages - 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                        ▶
                                    </button>
                                </div>
                            ` : ''}
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                `;

                paginatedDocs.forEach((doc) => {
                    const originalIndex = files.indexOf(doc);
                    const icon = this.getFileIcon(doc.type);

                    content += `
                        <div onclick="window.SmartAgenda.FileViewer.openDocument(${originalIndex})"
                             style="padding: 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);
                                    cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.2s;"
                             onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateX(4px)'"
                             onmouseout="this.style.borderColor='var(--border)'; this.style.transform=''">
                            <div style="font-size: 32px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
                                        background: var(--primary-color)22; border-radius: 8px; flex-shrink: 0;">
                                ${icon}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-size: 14px; font-weight: 600; color: var(--text-primary);
                                            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${this.escapeHtml(doc.name)}
                                </div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                                    ${this.formatFileSize(doc.size)}
                                </div>
                            </div>
                            <div style="flex-shrink: 0;">
                                <button onclick="event.stopPropagation(); window.SmartAgenda.FileViewer.showFileActions(${originalIndex})"
                                        style="padding: 8px 12px; background: var(--primary-color); color: white; border: none;
                                               border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
                                    •••
                                </button>
                            </div>
                        </div>
                    `;
                });

                content += '</div></div>';
            }

            content += '</div>';

            window.SmartAgenda.UIComponents.showModal({
                title: `Files - ${this.currentClient.name}`,
                content: content,
                buttons: [
                    {
                        label: 'Close',
                        type: 'primary',
                        action: 'close-files',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'large'
            });
        },

        /**
         * Open image with viewer
         */
        openImage: async function(fileIndex) {
            this.currentFileIndex = fileIndex;
            const file = this.currentClient.files[fileIndex];

            if (!file || !file.type?.startsWith('image/')) {
                return;
            }

            try {
                // Load image data
                let imageData;
                if (file.storedInFilesystem && window.SmartAgenda?.ClientModalNew?.loadFileFromStorage) {
                    imageData = await window.SmartAgenda.ClientModalNew.loadFileFromStorage(file);
                } else if (file.data) {
                    imageData = file.data;
                } else {
                    throw new Error('No image data available');
                }

                const content = `
                    <div id="image-viewer-container" style="position: relative; width: 100%; max-height: 60vh; overflow: hidden;
                                                           background: #000; border-radius: 8px; touch-action: none;">
                        <img id="image-viewer-img" src="${imageData}"
                             style="width: 100%; height: auto; display: block; transform-origin: center center;
                                    transition: transform 0.1s ease-out; cursor: grab;">
                    </div>
                    <div style="margin-top: 16px; text-align: center; color: var(--text-secondary); font-size: 13px;">
                        ${this.escapeHtml(file.name)} • ${this.formatFileSize(file.size)}
                    </div>
                `;

                const modal = window.SmartAgenda.UIComponents.showModal({
                    title: 'Image Viewer',
                    content: content,
                    buttons: [
                        {
                            label: 'Rename',
                            type: 'secondary',
                            action: 'rename-file',
                            onClick: (m) => {
                                // Close this modal first, then show rename dialog
                                this.renameFile(fileIndex, m);
                            }
                        },
                        {
                            label: 'Share',
                            type: 'secondary',
                            action: 'share-file',
                            onClick: (m) => {
                                this.shareFile(fileIndex);
                            }
                        },
                        {
                            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>`,
                            type: 'danger',
                            action: 'delete-file',
                            onClick: (m) => {
                                this.deleteFile(fileIndex, m);
                            }
                        },
                        {
                            label: 'Close',
                            type: 'primary',
                            action: 'close-viewer',
                            onClick: (m) => {
                                window.SmartAgenda.UIComponents.closeModal(m);
                            }
                        }
                    ],
                    size: 'large'
                });

                // Setup pinch to zoom after modal is loaded
                setTimeout(() => this.setupImageZoom(modal), 100);

            } catch (error) {
                console.error('Error opening image:', error);
                window.SmartAgenda.Toast.error('Unable to load image');
            }
        },

        /**
         * Setup pinch to zoom for image viewer
         */
        setupImageZoom: function(modal) {
            const container = modal.querySelector('#image-viewer-container');
            const img = modal.querySelector('#image-viewer-img');

            if (!container || !img) return;

            this.currentZoom = 1;
            let isPanning = false;
            let startX = 0;
            let startY = 0;
            let translateX = 0;
            let translateY = 0;

            // Touch events for pinch zoom
            container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    // Pinch zoom
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    this.touchStartDistance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                    );
                } else if (e.touches.length === 1 && this.currentZoom > 1) {
                    // Pan
                    isPanning = true;
                    startX = e.touches[0].clientX - translateX;
                    startY = e.touches[0].clientY - translateY;
                    img.style.cursor = 'grabbing';
                }
            });

            container.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const currentDistance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                    );

                    if (this.touchStartDistance > 0) {
                        const scale = currentDistance / this.touchStartDistance;
                        this.currentZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.currentZoom * scale));
                        this.updateImageTransform(img, translateX, translateY);
                        this.touchStartDistance = currentDistance;
                    }
                } else if (isPanning && e.touches.length === 1) {
                    e.preventDefault();
                    translateX = e.touches[0].clientX - startX;
                    translateY = e.touches[0].clientY - startY;
                    this.updateImageTransform(img, translateX, translateY);
                }
            });

            container.addEventListener('touchend', (e) => {
                if (e.touches.length < 2) {
                    this.touchStartDistance = 0;
                }
                if (e.touches.length === 0) {
                    isPanning = false;
                    img.style.cursor = 'grab';
                }
            });

            // Mouse wheel for zoom (desktop)
            container.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.currentZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.currentZoom * delta));
                this.updateImageTransform(img, translateX, translateY);
            }, { passive: false });

            // Double tap to reset zoom
            let lastTap = 0;
            container.addEventListener('touchend', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0) {
                    this.currentZoom = 1;
                    translateX = 0;
                    translateY = 0;
                    this.updateImageTransform(img, 0, 0);
                }
                lastTap = currentTime;
            });
        },

        /**
         * Update image transform
         */
        updateImageTransform: function(img, translateX, translateY) {
            img.style.transform = `scale(${this.currentZoom}) translate(${translateX / this.currentZoom}px, ${translateY / this.currentZoom}px)`;
        },

        /**
         * Open document with native app
         */
        openDocument: async function(fileIndex) {
            const file = this.currentClient.files[fileIndex];

            if (!file) return;

            try {
                // Load file data
                let fileData;
                if (file.storedInFilesystem && window.SmartAgenda?.ClientModalNew?.loadFileFromStorage) {
                    fileData = await window.SmartAgenda.ClientModalNew.loadFileFromStorage(file);
                } else if (file.data) {
                    fileData = file.data;
                } else {
                    throw new Error('No file data available');
                }

                // Check if we're on Capacitor mobile app
                const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

                if (isCapacitor) {
                    // MOBILE: Use Capacitor to open with native app
                    const { Filesystem } = window.Capacitor.Plugins;
                    const base64Data = fileData.split(',')[1] || fileData;
                    const timestamp = Date.now();
                    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const fileName = `${timestamp}_${safeName}`;

                    try {
                        // Write to cache directory
                        const writeResult = await Filesystem.writeFile({
                            path: fileName,
                            data: base64Data,
                            directory: 'CACHE'
                        });

                        console.log('[FileViewer] File written to:', writeResult.uri);

                        // Try to use FileOpener plugin if available
                        if (window.FileOpener2) {
                            // Cordova FileOpener2 plugin
                            window.FileOpener2.open(
                                writeResult.uri,
                                file.type,
                                {
                                    error: (e) => {
                                        console.error('[FileViewer] FileOpener2 error:', e);
                                        // Fallback: try system handler
                                        window.Capacitor.Plugins.Browser?.open({ url: writeResult.uri });
                                    },
                                    success: () => {
                                        console.log('[FileViewer] FileOpener2 opened successfully');
                                    }
                                }
                            );
                        } else if (window.Capacitor.Plugins.Browser) {
                            // Use Browser plugin to open file
                            await window.Capacitor.Plugins.Browser.open({
                                url: writeResult.uri,
                                presentationStyle: 'fullscreen'
                            });
                        } else {
                            // Last resort: download link
                            const link = document.createElement('a');
                            link.href = fileData;
                            link.download = file.name;
                            link.click();
                            window.SmartAgenda.Toast.info('File downloaded - check your downloads folder');
                        }
                    } catch (fsError) {
                        console.error('[FileViewer] Filesystem error:', fsError);
                        // Fallback to download
                        const link = document.createElement('a');
                        link.href = fileData;
                        link.download = file.name;
                        link.click();
                        window.SmartAgenda.Toast.info('File downloaded');
                    }
                } else {
                    // DESKTOP/WEB: Open in new tab
                    const link = document.createElement('a');
                    link.href = fileData;
                    link.download = file.name;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';

                    // For PDFs, try to open in new window instead of downloading
                    if (file.type === 'application/pdf') {
                        const newWindow = window.open();
                        if (newWindow) {
                            newWindow.document.write(`
                                <html>
                                    <head><title>${this.escapeHtml(file.name)}</title></head>
                                    <body style="margin:0; overflow:hidden;">
                                        <iframe src="${fileData}" style="width:100%; height:100vh; border:none;"></iframe>
                                    </body>
                                </html>
                            `);
                            newWindow.document.close();
                        } else {
                            // Popup blocked, fallback to download
                            link.click();
                        }
                    } else {
                        // For other documents, download them
                        link.click();
                    }
                }
            } catch (error) {
                console.error('[FileViewer] Error opening document:', error);
                window.SmartAgenda.Toast.error(`Unable to open document: ${error.message}`);
            }
        },

        /**
         * Show file actions menu
         */
        showFileActions: async function(fileIndex) {
            const file = this.currentClient.files[fileIndex];

            const content = `
                <div style="display: flex; flex-direction: column; gap: 8px; padding: 8px;">
                    <button onclick="window.SmartAgenda.FileViewer.renameFileFromMenu(${fileIndex})"
                            style="padding: 16px; background: var(--surface); border: 1px solid var(--border);
                                   border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
                                   display: flex; align-items: center; gap: 12px; color: var(--text-primary);
                                   transition: all 0.2s;">
                        <span style="font-size: 20px;">✏️</span>
                        <span>Rename</span>
                    </button>
                    <button onclick="window.SmartAgenda.FileViewer.shareFileFromMenu(${fileIndex})"
                            style="padding: 16px; background: var(--surface); border: 1px solid var(--border);
                                   border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
                                   display: flex; align-items: center; gap: 12px; color: var(--text-primary);
                                   transition: all 0.2s;">
                        <span style="font-size: 20px;">📤</span>
                        <span>Share</span>
                    </button>
                    <button onclick="window.SmartAgenda.FileViewer.deleteFileFromMenu(${fileIndex})"
                            style="padding: 16px; background: var(--danger)22; border: 1px solid var(--danger);
                                   border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
                                   display: flex; align-items: center; gap: 12px; color: var(--danger);
                                   transition: all 0.2s;">
                        <span style="font-size: 20px;">🗑️</span>
                        <span>Delete</span>
                    </button>
                </div>
            `;

            window.SmartAgenda.UIComponents.showModal({
                title: file.name,
                content: content,
                buttons: [
                    {
                        label: 'Close',
                        type: 'secondary',
                        action: 'close-actions',
                        onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                    }
                ],
                size: 'small'
            });
        },

        /**
         * Rename file
         */
        renameFile: async function(fileIndex, parentModal = null) {
            const file = this.currentClient.files[fileIndex];
            const currentName = file.name;
            const extension = currentName.substring(currentName.lastIndexOf('.'));
            const nameWithoutExt = currentName.substring(0, currentName.lastIndexOf('.'));

            const content = `
                <div style="padding: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">New filename:</label>
                    <input type="text" id="new-filename" value="${this.escapeHtml(nameWithoutExt)}"
                           style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 6px;
                                  font-size: 14px; background: var(--background); color: var(--text-primary);">
                    <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                        Extension: <strong>${extension}</strong>
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: 'Rename File',
                content: content,
                buttons: [
                    {
                        label: 'Cancel',
                        type: 'secondary',
                        action: 'cancel-rename',
                        onClick: (m) => window.SmartAgenda.UIComponents.closeModal(m)
                    },
                    {
                        label: 'Rename',
                        type: 'primary',
                        action: 'confirm-rename',
                        onClick: async (m) => {
                            const newNameInput = document.getElementById('new-filename');
                            const newName = newNameInput.value.trim() + extension;

                            if (!newName || newName === extension) {
                                window.SmartAgenda.Toast.error('Please enter a valid filename');
                                return;
                            }

                            try {
                                // Rename actual file if stored in filesystem
                                if (file.storedInFilesystem && file.path) {
                                    const Filesystem = window.Capacitor.Plugins.Filesystem;

                                    // Get old path and create new path
                                    const oldPath = file.path;
                                    const folderPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
                                    const timestamp = Date.now();
                                    const safeName = newName.replace(/[^a-zA-Z0-9._\-\u0370-\u03FF\u1F00-\u1FFF]/g, '_');
                                    const newPath = `${folderPath}/${timestamp}_${safeName}`;

                                    // Read old file
                                    const fileContent = await Filesystem.readFile({
                                        path: oldPath,
                                        directory: 'DOCUMENTS'
                                    });

                                    // Write to new path
                                    await Filesystem.writeFile({
                                        path: newPath,
                                        data: fileContent.data,
                                        directory: 'DOCUMENTS'
                                    });

                                    // Delete old file
                                    await Filesystem.deleteFile({
                                        path: oldPath,
                                        directory: 'DOCUMENTS'
                                    });

                                    // Update file metadata
                                    file.path = newPath;
                                }

                                // Update filename in metadata
                                file.name = newName;

                                // Save to client
                                await window.SmartAgenda.DataManager.update('clients', this.currentClient.id, {
                                    files: this.currentClient.files
                                });

                                window.SmartAgenda.Toast.success('File renamed successfully');
                                window.SmartAgenda.UIComponents.closeModal(m);

                                if (parentModal) {
                                    window.SmartAgenda.UIComponents.closeModal(parentModal);
                                }

                                // Refresh client view
                                const updatedClient = window.SmartAgenda.DataManager.getById('clients', this.currentClient.id);
                                if (updatedClient && window.SmartAgenda.ClientDetailView) {
                                    window.SmartAgenda.ClientDetailView.currentClient = updatedClient;
                                    this.currentClient = updatedClient;
                                }
                            } catch (error) {
                                console.error('Error renaming file:', error);
                                window.SmartAgenda.Toast.error('Failed to rename file');
                            }
                        }
                    }
                ],
                size: 'small'
            });
        },

        renameFileFromMenu: function(fileIndex) {
            this.renameFile(fileIndex);
        },

        /**
         * Delete file
         */
        deleteFile: async function(fileIndex, parentModal = null) {
            const file = this.currentClient.files[fileIndex];

            const confirmed = await window.SmartAgenda.UIComponents.confirm({
                title: 'Delete File',
                message: `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'danger'
            });

            if (!confirmed) return;

            try {
                // Delete from filesystem if stored there
                if (file.storedInFilesystem && file.path && window.Capacitor?.Plugins?.Filesystem) {
                    const Filesystem = window.Capacitor.Plugins.Filesystem;
                    await Filesystem.deleteFile({
                        path: file.path,
                        directory: 'DOCUMENTS'
                    });
                }

                // Remove from client files array
                this.currentClient.files.splice(fileIndex, 1);

                // Save to database
                await window.SmartAgenda.DataManager.update('clients', this.currentClient.id, {
                    files: this.currentClient.files
                });

                window.SmartAgenda.Toast.success('File deleted');

                if (parentModal) {
                    window.SmartAgenda.UIComponents.closeModal(parentModal);
                }

                // Refresh files modal if needed (maintain current pagination)
                if (this.currentClient.files.length > 0) {
                    this.showFilesModal(this.currentImagePage, this.currentDocPage);
                }

                // Update client detail view
                const updatedClient = window.SmartAgenda.DataManager.getById('clients', this.currentClient.id);
                if (updatedClient && window.SmartAgenda.ClientDetailView) {
                    window.SmartAgenda.ClientDetailView.currentClient = updatedClient;
                    this.currentClient = updatedClient;
                }
            } catch (error) {
                console.error('Error deleting file:', error);
                window.SmartAgenda.Toast.error('Failed to delete file');
            }
        },

        deleteFileFromMenu: function(fileIndex) {
            this.deleteFile(fileIndex);
        },

        /**
         * Share file using Capacitor Share API
         */
        shareFile: async function(fileIndex) {
            const file = this.currentClient.files[fileIndex];

            try {
                const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

                if (!isMobile || !window.Capacitor?.Plugins?.Share) {
                    window.SmartAgenda.Toast.warning('Share is only available on mobile devices');
                    return;
                }

                // Load file data
                let fileData;
                if (file.storedInFilesystem && window.SmartAgenda?.ClientModalNew?.loadFileFromStorage) {
                    fileData = await window.SmartAgenda.ClientModalNew.loadFileFromStorage(file);
                } else if (file.data) {
                    fileData = file.data;
                } else {
                    throw new Error('No file data available');
                }

                const Filesystem = window.Capacitor.Plugins.Filesystem;
                const Share = window.Capacitor.Plugins.Share;

                // Write to cache
                const base64Data = fileData.split(',')[1] || fileData;
                const fileName = file.name;

                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: 'CACHE'
                });

                // Share the file
                await Share.share({
                    title: file.name,
                    text: `Sharing file: ${file.name}`,
                    url: result.uri,
                    dialogTitle: 'Share file'
                });

            } catch (error) {
                console.error('Error sharing file:', error);
                window.SmartAgenda.Toast.error('Failed to share file');
            }
        },

        shareFileFromMenu: function(fileIndex) {
            this.shareFile(fileIndex);
        },

        // Helper functions
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

        formatFileSize: function(bytes) {
            if (!bytes || bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
        },

        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Add to global API
    if (window.SmartAgenda) {
        window.SmartAgenda.FileViewer = FileViewer;
    }

})();
