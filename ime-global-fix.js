/**
 * Global IME Fix for Greek Keyboard
 * Prevents cursor jumping to end when editing Greek text
 *
 * CRITICAL: This script MUST load before ANY other JavaScript
 */

(function() {
    'use strict';

    console.log('[IME Global Fix] Initializing...');

    // Track composing state more reliably
    let isComposing = false;
    let composingElement = null;

    // Use capture phase to catch events before any other handlers
    document.addEventListener('compositionstart', (e) => {
        isComposing = true;
        composingElement = e.target;
        console.log('[IME] Composition START on:', e.target.tagName, e.target.name || e.target.id || '(unnamed)');
    }, true);

    document.addEventListener('compositionend', (e) => {
        console.log('[IME] Composition END on:', e.target.tagName, e.target.name || e.target.id || '(unnamed)');
        // Delay clearing to ensure value is stable
        setTimeout(() => {
            isComposing = false;
            composingElement = null;
        }, 0);
    }, true);

    // CRITICAL FIX: Override input.value setter to block during composition
    const inputValueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    const originalInputSetter = inputValueDescriptor.set;
    const originalInputGetter = inputValueDescriptor.get;

    Object.defineProperty(HTMLInputElement.prototype, 'value', {
        get: function() {
            return originalInputGetter.call(this);
        },
        set: function(newValue) {
            // Block ANY value changes during composition
            if (isComposing && this === composingElement) {
                console.warn('[IME] BLOCKED value change during composition:', this.tagName, this.name || this.id || '(unnamed)');
                return;
            }
            return originalInputSetter.call(this, newValue);
        },
        configurable: true,
        enumerable: true
    });

    // Same for textarea
    const textareaValueDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    const originalTextareaSetter = textareaValueDescriptor.set;
    const originalTextareaGetter = textareaValueDescriptor.get;

    Object.defineProperty(HTMLTextAreaElement.prototype, 'value', {
        get: function() {
            return originalTextareaGetter.call(this);
        },
        set: function(newValue) {
            if (isComposing && this === composingElement) {
                console.warn('[IME] BLOCKED value change during composition:', this.tagName, this.name || this.id || '(unnamed)');
                return;
            }
            return originalTextareaSetter.call(this, newValue);
        },
        configurable: true,
        enumerable: true
    });

    // Also block setSelectionRange, setRangeText during composition
    const originalSetSelectionRange = HTMLInputElement.prototype.setSelectionRange;
    HTMLInputElement.prototype.setSelectionRange = function(...args) {
        if (isComposing && this === composingElement) {
            console.warn('[IME] BLOCKED setSelectionRange during composition');
            return;
        }
        return originalSetSelectionRange.apply(this, args);
    };

    const originalSetRangeText = HTMLInputElement.prototype.setRangeText;
    if (originalSetRangeText) {
        HTMLInputElement.prototype.setRangeText = function(...args) {
            if (isComposing && this === composingElement) {
                console.warn('[IME] BLOCKED setRangeText during composition');
                return;
            }
            return originalSetRangeText.apply(this, args);
        };
    }

    console.log('[IME Global Fix] Fully applied - Greek keyboard protection enabled');
})();
