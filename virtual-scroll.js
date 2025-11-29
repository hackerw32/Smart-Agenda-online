/**
 * Smart Agenda - Virtual Scrolling Utility
 *
 * Efficiently renders large lists by only rendering visible items
 * Improves performance for datasets with 1000+ items
 */

(function() {
    'use strict';

    class VirtualScroll {
        /**
         * @param {Object} options - Configuration options
         * @param {HTMLElement} options.container - The scrollable container element
         * @param {Array} options.items - Array of items to render
         * @param {Function} options.renderItem - Function that renders a single item
         * @param {Number} options.itemHeight - Height of each item in pixels (default: 80)
         * @param {Number} options.buffer - Number of extra items to render above/below viewport (default: 5)
         */
        constructor(options) {
            this.container = options.container;
            this.items = options.items || [];
            this.renderItem = options.renderItem;
            this.itemHeight = options.itemHeight || 80;
            this.buffer = options.buffer || 5;

            this.scrollTop = 0;
            this.containerHeight = 0;
            this.visibleStart = 0;
            this.visibleEnd = 0;

            // Create wrapper elements
            this.scrollWrapper = null;
            this.contentWrapper = null;
            this.spacerTop = null;
            this.spacerBottom = null;

            this.init();
        }

        init() {
            // Clear container
            this.container.innerHTML = '';

            // Create scroll wrapper (enables scrolling)
            this.scrollWrapper = document.createElement('div');
            this.scrollWrapper.className = 'virtual-scroll-wrapper';
            this.scrollWrapper.style.cssText = `
                overflow-y: auto;
                overflow-x: hidden;
                height: 100%;
                position: relative;
            `;

            // Create content wrapper (holds visible items)
            this.contentWrapper = document.createElement('div');
            this.contentWrapper.className = 'virtual-scroll-content';
            this.contentWrapper.style.cssText = `
                position: relative;
            `;

            // Create spacers to maintain scroll height
            this.spacerTop = document.createElement('div');
            this.spacerTop.className = 'virtual-scroll-spacer-top';

            this.spacerBottom = document.createElement('div');
            this.spacerBottom.className = 'virtual-scroll-spacer-bottom';

            // Build structure
            this.contentWrapper.appendChild(this.spacerTop);
            this.contentWrapper.appendChild(this.spacerBottom);
            this.scrollWrapper.appendChild(this.contentWrapper);
            this.container.appendChild(this.scrollWrapper);

            // Bind scroll event
            this.scrollWrapper.addEventListener('scroll', this.onScroll.bind(this));

            // Initial render
            this.updateView();
        }

        onScroll() {
            this.scrollTop = this.scrollWrapper.scrollTop;
            this.updateView();
        }

        updateView() {
            if (!this.items || this.items.length === 0) {
                this.contentWrapper.innerHTML = '';
                return;
            }

            const totalHeight = this.items.length * this.itemHeight;
            this.containerHeight = this.scrollWrapper.clientHeight;

            // Calculate visible range
            const startIndex = Math.floor(this.scrollTop / this.itemHeight);
            const endIndex = Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight);

            // Add buffer
            this.visibleStart = Math.max(0, startIndex - this.buffer);
            this.visibleEnd = Math.min(this.items.length, endIndex + this.buffer);

            // Calculate spacer heights
            const topHeight = this.visibleStart * this.itemHeight;
            const bottomHeight = (this.items.length - this.visibleEnd) * this.itemHeight;

            // Update spacers
            this.spacerTop.style.height = `${topHeight}px`;
            this.spacerBottom.style.height = `${bottomHeight}px`;

            // Render visible items
            this.renderVisibleItems();
        }

        renderVisibleItems() {
            // Remove old items (except spacers)
            const existingItems = this.contentWrapper.querySelectorAll('.virtual-scroll-item');
            existingItems.forEach(item => item.remove());

            // Render new visible items
            const fragment = document.createDocumentFragment();

            for (let i = this.visibleStart; i < this.visibleEnd; i++) {
                const item = this.items[i];
                if (!item) continue;

                const itemElement = this.renderItem(item, i);
                itemElement.classList.add('virtual-scroll-item');
                itemElement.style.minHeight = `${this.itemHeight}px`;
                fragment.appendChild(itemElement);
            }

            // Insert after top spacer
            this.spacerTop.after(fragment);
        }

        /**
         * Update items and re-render
         * @param {Array} newItems - New array of items
         */
        setItems(newItems) {
            this.items = newItems;
            this.scrollWrapper.scrollTop = 0; // Reset scroll to top
            this.scrollTop = 0;
            this.updateView();
        }

        /**
         * Scroll to a specific item index
         * @param {Number} index - Item index to scroll to
         */
        scrollToIndex(index) {
            const scrollTop = index * this.itemHeight;
            this.scrollWrapper.scrollTop = scrollTop;
        }

        /**
         * Destroy virtual scroll instance
         */
        destroy() {
            this.scrollWrapper.removeEventListener('scroll', this.onScroll.bind(this));
            this.container.innerHTML = '';
        }

        /**
         * Force update (useful when container size changes)
         */
        refresh() {
            this.containerHeight = this.scrollWrapper.clientHeight;
            this.updateView();
        }
    }

    // Export to window
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.VirtualScroll = VirtualScroll;

    console.log('Virtual Scroll utility loaded');

})();
