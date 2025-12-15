/**
 * Smart Agenda - File Manager
 * Browse and search all client files
 */

(function() {
    'use strict';

    const FileManager = {
        /**
         * Show file manager
         */
        show: function() {
            // Get all clients with files
            const clients = window.SmartAgenda.DataManager.getAll('clients') || [];
            const clientsWithFiles = clients.filter(c => c.files && c.files.length > 0);

            // Build file list
            let allFiles = [];
            clientsWithFiles.forEach(client => {
                client.files.forEach((file, index) => {
                    allFiles.push({
                        ...file,
                        clientId: client.id,
                        clientName: client.name,
                        fileIndex: index
                    });
                });
            });

            // Sort by upload date (newest first)
            allFiles.sort((a, b) => {
                const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
                const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
                return dateB - dateA;
            });

            const content = `
                <div class="file-manager-container">
                    <!-- Search Bar -->
                    <div style="margin-bottom: 20px;">
                        <input type="text" id="file-search-input" placeholder="Search files by name or client..."
                               style="width: 100%; padding: 12px 16px; border: 1px solid var(--border);
                                      border-radius: 8px; background: var(--background); color: var(--text-primary);
                                      font-size: 14px;">
                    </div>

                    <!-- Stats -->
                    <div style="margin-bottom: 20px; padding: 16px; background: var(--surface); border-radius: 8px;
                                border: 1px solid var(--border); display: flex; gap: 20px; flex-wrap: wrap;">
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">${allFiles.length}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Total Files</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">${clientsWithFiles.length}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Clients with Files</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">${this.getTotalSize(allFiles)}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Total Size</div>
                        </div>
                    </div>

                    <!-- File Type Filter -->
                    <div style="margin-bottom: 20px; display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="file-type-filter active" data-type="all"
                                style="padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px;
                                       background: var(--primary-color); color: white; cursor: pointer; font-size: 12px;">
                            All Files
                        </button>
                        <button class="file-type-filter" data-type="image"
                                style="padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px;
                                       background: var(--surface); color: var(--text-primary); cursor: pointer; font-size: 12px;">
                            🖼️ Images
                        </button>
                        <button class="file-type-filter" data-type="pdf"
                                style="padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px;
                                       background: var(--surface); color: var(--text-primary); cursor: pointer; font-size: 12px;">
                            📕 PDFs
                        </button>
                        <button class="file-type-filter" data-type="document"
                                style="padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px;
                                       background: var(--surface); color: var(--text-primary); cursor: pointer; font-size: 12px;">
                            📘 Documents
                        </button>
                        <button class="file-type-filter" data-type="archive"
                                style="padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px;
                                       background: var(--surface); color: var(--text-primary); cursor: pointer; font-size: 12px;">
                            📦 Archives
                        </button>
                    </div>

                    <!-- Files Grid -->
                    <div id="files-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px;">
                        ${this.buildFilesGrid(allFiles)}
                    </div>
                </div>
            `;

            const modal = window.SmartAgenda.UIComponents.showModal({
                title: '📎 File Manager',
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

            // Store all files for filtering
            this.allFiles = allFiles;
            this.currentModal = modal;

            // Bind events
            this.bindEvents(modal);
        },

        /**
         * Build files grid HTML
         */
        buildFilesGrid: function(files) {
            if (files.length === 0) {
                return `
                    <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-secondary);">
                        No files found
                    </div>
                `;
            }

            return files.map(file => {
                const icon = this.getFileIcon(file.type);
                const isImage = file.type?.startsWith('image/');

                return `
                    <div class="file-card" data-client-id="${file.clientId}" data-file-index="${file.fileIndex}"
                         style="padding: 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);
                                cursor: pointer; transition: all 0.2s;">
                        ${isImage ? `
                            <div style="width: 100%; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: var(--border); margin-bottom: 8px;">
                                <img src="${file.data}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                        ` : `
                            <div style="width: 100%; aspect-ratio: 1; border-radius: 6px; background: var(--primary-color)22;
                                        display: flex; align-items: center; justify-content: center; font-size: 48px; margin-bottom: 8px;">
                                ${icon}
                            </div>
                        `}
                        <div style="font-size: 13px; font-weight: 500; color: var(--text-primary);
                                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;"
                             title="${this.escapeHtml(file.name)}">
                            ${this.escapeHtml(file.name)}
                        </div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">
                            ${this.formatFileSize(file.size)}
                        </div>
                        <div style="font-size: 11px; color: var(--primary-color); font-weight: 500;
                                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                             title="${this.escapeHtml(file.clientName)}">
                            📋 ${this.escapeHtml(file.clientName)}
                        </div>
                    </div>
                `;
            }).join('');
        },

        /**
         * Bind events
         */
        bindEvents: function(modal) {
            // Search
            const searchInput = modal.querySelector('#file-search-input');
            searchInput?.addEventListener('input', (e) => {
                this.filterFiles(e.target.value, this.currentFileType || 'all');
            });

            // File type filters
            modal.querySelectorAll('.file-type-filter').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active state
                    modal.querySelectorAll('.file-type-filter').forEach(b => {
                        b.classList.remove('active');
                        b.style.background = 'var(--surface)';
                        b.style.color = 'var(--text-primary)';
                    });
                    btn.classList.add('active');
                    btn.style.background = 'var(--primary-color)';
                    btn.style.color = 'white';

                    // Filter
                    const type = btn.dataset.type;
                    this.currentFileType = type;
                    this.filterFiles(searchInput?.value || '', type);
                });
            });

            // File clicks
            modal.querySelectorAll('.file-card').forEach(card => {
                card.addEventListener('click', () => {
                    const clientId = card.dataset.clientId;
                    const fileIndex = parseInt(card.dataset.fileIndex);

                    const client = window.SmartAgenda.DataManager.getById('clients', clientId);
                    if (client && client.files && client.files[fileIndex]) {
                        this.openFile(client.files[fileIndex], client);
                    }
                });

                // Hover effect
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-2px)';
                    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    card.style.borderColor = 'var(--primary-color)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = 'none';
                    card.style.borderColor = 'var(--border)';
                });
            });
        },

        /**
         * Filter files
         */
        filterFiles: function(searchTerm, fileType) {
            let filtered = this.allFiles;

            // Filter by search term
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(file =>
                    file.name.toLowerCase().includes(term) ||
                    file.clientName.toLowerCase().includes(term)
                );
            }

            // Filter by file type
            if (fileType !== 'all') {
                filtered = filtered.filter(file => {
                    if (fileType === 'image') return file.type?.startsWith('image/');
                    if (fileType === 'pdf') return file.type === 'application/pdf';
                    if (fileType === 'document') return file.type?.includes('word') || file.type?.includes('document') || file.type?.includes('sheet') || file.type?.includes('excel') || file.type?.includes('presentation');
                    if (fileType === 'archive') return file.type?.includes('zip') || file.type?.includes('rar') || file.type?.includes('compressed');
                    return true;
                });
            }

            // Update grid
            const grid = this.currentModal.querySelector('#files-grid');
            if (grid) {
                grid.innerHTML = this.buildFilesGrid(filtered);
                this.bindEvents(this.currentModal);
            }
        },

        /**
         * Open file
         */
        openFile: function(file, client) {
            const isImage = file.type?.startsWith('image/');

            if (isImage) {
                const content = `
                    <div style="text-align: center;">
                        <img src="${file.data}" style="max-width: 100%; max-height: 60vh; border-radius: 8px;">
                        <div style="margin-top: 16px; padding: 12px; background: var(--surface); border-radius: 8px;">
                            <div style="font-weight: 600; margin-bottom: 4px;">${this.escapeHtml(file.name)}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">
                                Client: ${this.escapeHtml(client.name)} • ${this.formatFileSize(file.size)}
                            </div>
                        </div>
                    </div>
                `;

                window.SmartAgenda.UIComponents.showModal({
                    title: file.name,
                    content: content,
                    buttons: [
                        {
                            label: 'View Client',
                            type: 'secondary',
                            onClick: (modal) => {
                                window.SmartAgenda.UIComponents.closeModal(modal);
                                window.SmartAgenda.UIComponents.closeModal(this.currentModal);
                                window.SmartAgenda.ClientDetailView.show(client);
                            }
                        },
                        {
                            label: 'Download',
                            type: 'primary',
                            onClick: () => {
                                const link = document.createElement('a');
                                link.href = file.data;
                                link.download = file.name;
                                link.click();
                            }
                        },
                        {
                            label: 'Close',
                            type: 'secondary',
                            onClick: (modal) => window.SmartAgenda.UIComponents.closeModal(modal)
                        }
                    ],
                    size: 'large'
                });
            } else {
                // Download
                const link = document.createElement('a');
                link.href = file.data;
                link.download = file.name;
                link.target = '_blank';
                link.click();
            }
        },

        /**
         * Get file icon
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
         * Get total size of all files
         */
        getTotalSize: function(files) {
            const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
            return this.formatFileSize(totalBytes);
        },

        /**
         * Escape HTML
         */
        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Add to global API
    if (window.SmartAgenda) {
        window.SmartAgenda.FileManager = FileManager;
    }

})();
