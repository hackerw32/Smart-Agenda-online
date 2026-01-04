/**
 * Smart Agenda - Encryption Service
 * Handles end-to-end encryption for cloud backups using Web Crypto API
 *
 * Features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - PBKDF2 key derivation from password
 * - Random salt and IV generation
 * - No external dependencies (uses native Web Crypto API)
 */
(function() {
    'use strict';

    const EncryptionService = {
        // Encryption configuration
        PBKDF2_ITERATIONS: 100000,  // 100k iterations for good security/performance balance
        SALT_LENGTH: 16,            // 16 bytes (128 bits)
        IV_LENGTH: 12,              // 12 bytes for GCM mode
        KEY_LENGTH: 256,            // AES-256

        /**
         * Initialize the service
         */
        init: function() {
            // Check if Web Crypto API is available
            if (!window.crypto || !window.crypto.subtle) {
                console.error('❌ Web Crypto API not available');
                if (window.SmartAgenda && window.SmartAgenda.Toast) {
                    window.SmartAgenda.Toast.error('Encryption not supported in this browser');
                }
                return false;
            }

            console.log('✅ Encryption Service initialized');
            return true;
        },

        /**
         * Generate cryptographically random salt
         * @returns {Uint8Array} Random salt (16 bytes)
         */
        generateSalt: function() {
            return window.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
        },

        /**
         * Generate cryptographically random IV (Initialization Vector)
         * @returns {Uint8Array} Random IV (12 bytes for GCM)
         */
        generateIV: function() {
            return window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
        },

        /**
         * Derive encryption key from password using PBKDF2
         * @param {string} password - User password
         * @param {Uint8Array} salt - Salt for key derivation
         * @param {number} iterations - Number of PBKDF2 iterations (default: 100000)
         * @returns {Promise<CryptoKey>} Derived encryption key
         */
        deriveKey: async function(password, salt, iterations = this.PBKDF2_ITERATIONS) {
            try {
                // Convert password string to ArrayBuffer
                const enc = new TextEncoder();
                const passwordBuffer = enc.encode(password);

                // Import password as base key
                const baseKey = await window.crypto.subtle.importKey(
                    'raw',
                    passwordBuffer,
                    { name: 'PBKDF2' },
                    false,
                    ['deriveKey']
                );

                // Derive AES key using PBKDF2
                const derivedKey = await window.crypto.subtle.deriveKey(
                    {
                        name: 'PBKDF2',
                        salt: salt,
                        iterations: iterations,
                        hash: 'SHA-256'
                    },
                    baseKey,
                    {
                        name: 'AES-GCM',
                        length: this.KEY_LENGTH
                    },
                    false,  // Not extractable (for security)
                    ['encrypt', 'decrypt']
                );

                return derivedKey;
            } catch (error) {
                console.error('❌ Key derivation error:', error);
                throw new Error('Failed to derive encryption key: ' + error.message);
            }
        },

        /**
         * Encrypt data with AES-256-GCM
         * @param {string} plaintext - Data to encrypt (as JSON string)
         * @param {string} password - User password
         * @returns {Promise<Object>} Object containing encrypted data, salt, and IV
         */
        encrypt: async function(plaintext, password) {
            try {
                // Generate random salt and IV
                const salt = this.generateSalt();
                const iv = this.generateIV();

                // Derive encryption key from password
                const key = await this.deriveKey(password, salt);

                // Convert plaintext to ArrayBuffer
                const enc = new TextEncoder();
                const plaintextBuffer = enc.encode(plaintext);

                // Encrypt with AES-256-GCM
                const encryptedBuffer = await window.crypto.subtle.encrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    key,
                    plaintextBuffer
                );

                // Convert to Base64 for storage
                const encryptedData = this.arrayBufferToBase64(encryptedBuffer);
                const saltBase64 = this.arrayBufferToBase64(salt);
                const ivBase64 = this.arrayBufferToBase64(iv);

                return {
                    encrypted: encryptedData,
                    salt: saltBase64,
                    iv: ivBase64,
                    algorithm: 'AES-256-GCM',
                    iterations: this.PBKDF2_ITERATIONS
                };

            } catch (error) {
                console.error('❌ Encryption error:', error);
                throw new Error('Encryption failed: ' + error.message);
            }
        },

        /**
         * Decrypt data with AES-256-GCM
         * @param {Object} encryptedData - Object containing encrypted, salt, and iv
         * @param {string} password - User password
         * @returns {Promise<string>} Decrypted plaintext
         */
        decrypt: async function(encryptedData, password) {
            try {
                // Convert Base64 back to ArrayBuffer
                const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.encrypted);
                const salt = this.base64ToArrayBuffer(encryptedData.salt);
                const iv = this.base64ToArrayBuffer(encryptedData.iv);

                // Get iterations (default to current if not specified)
                const iterations = encryptedData.iterations || this.PBKDF2_ITERATIONS;

                // Derive decryption key from password
                const key = await this.deriveKey(password, salt, iterations);

                // Decrypt with AES-256-GCM
                const decryptedBuffer = await window.crypto.subtle.decrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    key,
                    encryptedBuffer
                );

                // Convert ArrayBuffer back to string
                const dec = new TextDecoder();
                const plaintext = dec.decode(decryptedBuffer);

                return plaintext;

            } catch (error) {
                // Check if it's a wrong password error
                if (error.name === 'OperationError' || error.message.includes('decryption')) {
                    throw new Error('WRONG_PASSWORD');
                }

                console.error('❌ Decryption error:', error);
                throw new Error('Decryption failed: ' + error.message);
            }
        },

        /**
         * Encrypt file data (for large attachments)
         * @param {ArrayBuffer} fileData - File data as ArrayBuffer
         * @param {string} password - User password
         * @returns {Promise<Object>} Encrypted file data with metadata
         */
        encryptFile: async function(fileData, password) {
            try {
                const salt = this.generateSalt();
                const iv = this.generateIV();

                const key = await this.deriveKey(password, salt);

                const encryptedBuffer = await window.crypto.subtle.encrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    key,
                    fileData
                );

                return {
                    encrypted: encryptedBuffer,  // Keep as ArrayBuffer for efficiency
                    salt: this.arrayBufferToBase64(salt),
                    iv: this.arrayBufferToBase64(iv),
                    algorithm: 'AES-256-GCM',
                    iterations: this.PBKDF2_ITERATIONS
                };

            } catch (error) {
                console.error('❌ File encryption error:', error);
                throw new Error('File encryption failed: ' + error.message);
            }
        },

        /**
         * Decrypt file data
         * @param {Object} encryptedData - Encrypted file data with metadata
         * @param {string} password - User password
         * @returns {Promise<ArrayBuffer>} Decrypted file data
         */
        decryptFile: async function(encryptedData, password) {
            try {
                const salt = this.base64ToArrayBuffer(encryptedData.salt);
                const iv = this.base64ToArrayBuffer(encryptedData.iv);
                const iterations = encryptedData.iterations || this.PBKDF2_ITERATIONS;

                const key = await this.deriveKey(password, salt, iterations);

                const decryptedBuffer = await window.crypto.subtle.decrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    key,
                    encryptedData.encrypted  // Should be ArrayBuffer
                );

                return decryptedBuffer;

            } catch (error) {
                if (error.name === 'OperationError') {
                    throw new Error('WRONG_PASSWORD');
                }

                console.error('❌ File decryption error:', error);
                throw new Error('File decryption failed: ' + error.message);
            }
        },

        /**
         * Convert ArrayBuffer to Base64 string
         * @param {ArrayBuffer|Uint8Array} buffer - Buffer to convert
         * @returns {string} Base64 encoded string
         */
        arrayBufferToBase64: function(buffer) {
            const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        },

        /**
         * Convert Base64 string to ArrayBuffer
         * @param {string} base64 - Base64 encoded string
         * @returns {Uint8Array} Decoded buffer
         */
        base64ToArrayBuffer: function(base64) {
            const binary = window.atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        },

        /**
         * Hash password for verification (SHA-256)
         * @param {string} password - Password to hash
         * @returns {Promise<string>} Hex-encoded hash
         */
        hashPassword: async function(password) {
            try {
                const enc = new TextEncoder();
                const passwordBuffer = enc.encode(password);

                const hashBuffer = await window.crypto.subtle.digest(
                    'SHA-256',
                    passwordBuffer
                );

                // Convert to hex string
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                return hashHex;
            } catch (error) {
                console.error('❌ Password hashing error:', error);
                throw new Error('Password hashing failed');
            }
        },

        /**
         * Verify password strength
         * @param {string} password - Password to check
         * @returns {Object} Strength info {score: 0-4, feedback: string}
         */
        checkPasswordStrength: function(password) {
            if (!password) {
                return { score: 0, feedback: 'Password is required', level: 'weak' };
            }

            let score = 0;
            const feedback = [];

            // Length check
            if (password.length >= 8) score++;
            if (password.length >= 12) score++;
            if (password.length >= 16) score++;

            // Complexity checks
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;  // Mixed case
            if (/\d/.test(password)) score++;  // Contains numbers
            if (/[^a-zA-Z0-9]/.test(password)) score++;  // Special characters

            // Determine level
            let level = 'weak';
            let feedbackText = '';

            if (score <= 2) {
                level = 'weak';
                feedbackText = 'Password is too weak. Use at least 8 characters with mixed case, numbers, and symbols.';
            } else if (score <= 4) {
                level = 'medium';
                feedbackText = 'Password is acceptable. Consider adding more characters or complexity.';
            } else {
                level = 'strong';
                feedbackText = 'Password is strong!';
            }

            return {
                score: Math.min(score, 4),
                level: level,
                feedback: feedbackText
            };
        }
    };

    // Add to global API
    if (!window.SmartAgenda) {
        window.SmartAgenda = {};
    }
    window.SmartAgenda.EncryptionService = EncryptionService;

})();
