/**
 * UI Module - Handles all UI updates and interactions
 */

const UI = {
    // DOM Elements cache
    elements: {},

    /**
     * Initialize UI module
     */
    init() {
        this.cacheElements();
        this.initDarkMode();
        this.bindEvents();
    },

    /**
     * Cache DOM elements for better performance
     */
    cacheElements() {
        this.elements = {
            // Dark mode
            darkModeToggle: document.getElementById('darkModeToggle'),

            // Upload
            uploadZone: document.getElementById('uploadZone'),
            fileInput: document.getElementById('fileInput'),

            // File info
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            fileStats: document.getElementById('fileStats'),
            totalProducts: document.getElementById('totalProducts'),
            withDescription: document.getElementById('withDescription'),
            processable: document.getElementById('processable'),
            removeFile: document.getElementById('removeFile'),

            // API Key
            apiKeySection: document.getElementById('apiKeySection'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            toggleApiKey: document.getElementById('toggleApiKey'),
            saveApiKey: document.getElementById('saveApiKey'),

            // Settings
            settingsSection: document.getElementById('settingsSection'),
            justifyText: document.getElementById('justifyText'),
            addBulletPoints: document.getElementById('addBulletPoints'),
            useLinkPhrases: document.getElementById('useLinkPhrases'),
            linkPhrasesSection: document.getElementById('linkPhrasesSection'),
            linkPhrasesInput: document.getElementById('linkPhrasesInput'),
            toneRadios: document.querySelectorAll('input[name="toneSelection"]'),
            customToneSection: document.getElementById('customToneSection'),
            customToneExample: document.getElementById('customToneExample'),

            // Process
            processBtn: document.getElementById('processBtn'),

            // Processing
            processingSection: document.getElementById('processingSection'),
            progressPercent: document.getElementById('progressPercent'),
            progressFill: document.getElementById('progressFill'),
            progressCurrent: document.getElementById('progressCurrent'),
            progressTotal: document.getElementById('progressTotal'),
            progressTime: document.getElementById('progressTime'),
            progressLog: document.getElementById('progressLog'),
            cancelBtn: document.getElementById('cancelBtn'),

            // Results
            resultsSection: document.getElementById('resultsSection'),
            resultSuccess: document.getElementById('resultSuccess'),
            resultSkippedEmpty: document.getElementById('resultSkippedEmpty'),
            resultSkippedShort: document.getElementById('resultSkippedShort'),
            resultErrors: document.getElementById('resultErrors'),
            downloadBtn: document.getElementById('downloadBtn'),
            previewBtn: document.getElementById('previewBtn'),
            resetBtn: document.getElementById('resetBtn'),

            // Preview Modal
            previewModal: document.getElementById('previewModal'),
            previewContent: document.getElementById('previewContent'),
            closePreview: document.getElementById('closePreview'),

            // Error
            errorSection: document.getElementById('errorSection'),
            errorMessage: document.getElementById('errorMessage'),
            errorResetBtn: document.getElementById('errorResetBtn'),

            // Lightbox
            lightboxModal: document.getElementById('lightboxModal'),
            lightboxImage: document.getElementById('lightboxImage'),
            lightboxOverlay: document.querySelector('.lightbox-overlay'),
            lightboxClose: document.querySelector('.lightbox-close')
        };
    },

    /**
     * Initialize dark mode from localStorage
     */
    initDarkMode() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    },

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
    },

    /**
     * Bind UI events
     */
    bindEvents() {
        // Dark mode toggle
        this.elements.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Upload zone drag events
        this.elements.uploadZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadZone.classList.add('dragging');
        });

        this.elements.uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadZone.classList.remove('dragging');
        });

        this.elements.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        this.elements.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadZone.classList.remove('dragging');

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // Upload zone click
        this.elements.uploadZone.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        // File input change
        this.elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                this.handleFileSelect(file);
            }
        });

        // Remove file button
        this.elements.removeFile.addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.resetFile) {
                App.resetFile();
            }
        });

        // Toggle API key visibility
        this.elements.toggleApiKey.addEventListener('click', () => {
            const input = this.elements.apiKeyInput;
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        // Save API key checkbox
        this.elements.saveApiKey.addEventListener('change', (e) => {
            if (!e.target.checked) {
                localStorage.removeItem('anthropic_api_key');
            }
        });

        // API key input - save on change
        this.elements.apiKeyInput.addEventListener('input', () => {
            if (this.elements.saveApiKey.checked) {
                localStorage.setItem('anthropic_api_key', this.elements.apiKeyInput.value);
            }
        });

        // Load saved API key
        const savedKey = localStorage.getItem('anthropic_api_key');
        if (savedKey) {
            this.elements.apiKeyInput.value = savedKey;
        }

        // Load saved justify text setting
        const savedJustify = localStorage.getItem('justify_text') === 'true';
        if (this.elements.justifyText) {
            this.elements.justifyText.checked = savedJustify;
        }

        // Save justify text setting on change
        if (this.elements.justifyText) {
            this.elements.justifyText.addEventListener('change', (e) => {
                localStorage.setItem('justify_text', e.target.checked);
            });
        }

        // Load saved bullet points setting
        const savedBulletPoints = localStorage.getItem('add_bullet_points') === 'true';
        if (this.elements.addBulletPoints) {
            this.elements.addBulletPoints.checked = savedBulletPoints;
        }

        // Save bullet points setting on change
        if (this.elements.addBulletPoints) {
            this.elements.addBulletPoints.addEventListener('change', (e) => {
                localStorage.setItem('add_bullet_points', e.target.checked);
            });
        }

        // Link phrases checkbox - show/hide textarea
        if (this.elements.useLinkPhrases) {
            this.elements.useLinkPhrases.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.elements.linkPhrasesSection.classList.remove('hidden');
                } else {
                    this.elements.linkPhrasesSection.classList.add('hidden');
                }
                localStorage.setItem('use_link_phrases', e.target.checked);
            });
        }

        // Load saved link phrases setting
        const savedUseLinkPhrases = localStorage.getItem('use_link_phrases') === 'true';
        if (this.elements.useLinkPhrases) {
            this.elements.useLinkPhrases.checked = savedUseLinkPhrases;
            if (savedUseLinkPhrases) {
                this.elements.linkPhrasesSection.classList.remove('hidden');
            }
        }

        // Load saved link phrases
        const savedLinkPhrases = localStorage.getItem('link_phrases');
        if (savedLinkPhrases && this.elements.linkPhrasesInput) {
            this.elements.linkPhrasesInput.value = savedLinkPhrases;
        }

        // Save link phrases on change
        if (this.elements.linkPhrasesInput) {
            this.elements.linkPhrasesInput.addEventListener('input', (e) => {
                localStorage.setItem('link_phrases', e.target.value);
            });
        }

        // Tone selection - show/hide custom tone textarea
        this.elements.toneRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const isCustom = e.target.value === 'custom';
                if (isCustom) {
                    this.elements.customToneSection.classList.remove('hidden');
                } else {
                    this.elements.customToneSection.classList.add('hidden');
                }
                localStorage.setItem('tone_selection', e.target.value);
            });
        });

        // Load saved tone selection
        const savedTone = localStorage.getItem('tone_selection') || 'neutral';
        this.elements.toneRadios.forEach(radio => {
            if (radio.value === savedTone) {
                radio.checked = true;
                if (savedTone === 'custom') {
                    this.elements.customToneSection.classList.remove('hidden');
                }
            }
        });

        // Load saved custom tone example
        const savedCustomTone = localStorage.getItem('custom_tone_example');
        if (savedCustomTone && this.elements.customToneExample) {
            this.elements.customToneExample.value = savedCustomTone;
        }

        // Save custom tone example on change
        if (this.elements.customToneExample) {
            this.elements.customToneExample.addEventListener('input', (e) => {
                localStorage.setItem('custom_tone_example', e.target.value);
            });
        }

        // Process button
        this.elements.processBtn.addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.startProcessing) {
                App.startProcessing();
            }
        });

        // Cancel button
        this.elements.cancelBtn.addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.cancelProcessing) {
                App.cancelProcessing();
            }
        });

        // Download button
        this.elements.downloadBtn.addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.downloadFile) {
                App.downloadFile();
            }
        });

        // Preview button
        this.elements.previewBtn.addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.showPreview) {
                App.showPreview();
            }
        });

        // Close preview
        this.elements.closePreview.addEventListener('click', () => this.hidePreview());
        this.elements.previewModal.addEventListener('click', (e) => {
            if (e.target === this.elements.previewModal) {
                this.hidePreview();
            }
        });

        // Reset buttons
        this.elements.resetBtn.addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.reset) {
                App.reset();
            }
        });

        this.elements.errorResetBtn.addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.reset) {
                App.reset();
            }
        });

        // Lightbox - template link click
        document.querySelectorAll('.template-link[data-lightbox]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const imageSrc = link.getAttribute('data-lightbox');
                this.openLightbox(imageSrc);
            });
        });

        // Lightbox - close on button click
        if (this.elements.lightboxClose) {
            this.elements.lightboxClose.addEventListener('click', () => this.closeLightbox());
        }

        // Lightbox - close on overlay click
        if (this.elements.lightboxOverlay) {
            this.elements.lightboxOverlay.addEventListener('click', () => this.closeLightbox());
        }

        // Lightbox - close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.lightboxModal && !this.elements.lightboxModal.classList.contains('hidden')) {
                this.closeLightbox();
            }
        });
    },

    /**
     * Handle file selection
     */
    handleFileSelect(file) {
        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        if (!validExtensions.includes(fileExtension)) {
            this.showError('Neplatný formát souboru. Nahrajte prosím soubor ve formátu .xlsx nebo .xls');
            return;
        }

        if (typeof App !== 'undefined' && App.loadFile) {
            App.loadFile(file);
        }
    },

    /**
     * Show file info section
     */
    showFileInfo(fileName, stats) {
        this.elements.uploadZone.classList.add('hidden');
        this.elements.fileInfo.classList.remove('hidden');
        this.elements.apiKeySection.classList.remove('hidden');
        this.elements.settingsSection.classList.remove('hidden');
        this.elements.processBtn.classList.remove('hidden');

        this.elements.fileName.textContent = fileName;
        this.elements.fileStats.textContent = `${stats.total} produktů nalezeno`;
        this.elements.totalProducts.textContent = stats.total;
        this.elements.withDescription.textContent = stats.withDescription;
        this.elements.processable.textContent = stats.processable;
    },

    /**
     * Show processing section
     */
    showProcessing() {
        this.elements.fileInfo.classList.add('hidden');
        this.elements.apiKeySection.classList.add('hidden');
        this.elements.settingsSection.classList.add('hidden');
        this.elements.processBtn.classList.add('hidden');
        this.elements.processingSection.classList.remove('hidden');
        this.elements.progressLog.innerHTML = '<p class="log-entry">Připravuji zpracování...</p>';
    },

    /**
     * Update progress
     */
    updateProgress(current, total, productName = null) {
        const percent = Math.round((current / total) * 100);

        this.elements.progressPercent.textContent = `${percent}%`;
        this.elements.progressFill.style.width = `${percent}%`;
        this.elements.progressCurrent.textContent = current;
        this.elements.progressTotal.textContent = total;

        if (productName) {
            this.addLogEntry(`Zpracovávám: ${productName}`, 'info');
        }
    },

    /**
     * Update estimated time
     */
    updateEstimatedTime(remainingSeconds) {
        if (remainingSeconds < 60) {
            this.elements.progressTime.textContent = `(zbývá ~${Math.ceil(remainingSeconds)}s)`;
        } else {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = Math.ceil(remainingSeconds % 60);
            this.elements.progressTime.textContent = `(zbývá ~${minutes}m ${seconds}s)`;
        }
    },

    /**
     * Add log entry
     */
    addLogEntry(message, type = 'info') {
        const entry = document.createElement('p');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        this.elements.progressLog.appendChild(entry);
        this.elements.progressLog.scrollTop = this.elements.progressLog.scrollHeight;

        // Keep only last 50 entries
        const entries = this.elements.progressLog.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    },

    /**
     * Show results section
     */
    showResults(results) {
        this.elements.processingSection.classList.add('hidden');
        this.elements.resultsSection.classList.remove('hidden');

        this.elements.resultSuccess.textContent = results.success;
        this.elements.resultSkippedEmpty.textContent = results.skippedEmpty;
        this.elements.resultSkippedShort.textContent = results.skippedShort;
        this.elements.resultErrors.textContent = results.errors;
    },

    /**
     * Show preview modal
     */
    showPreviewModal(previewData) {
        this.elements.previewContent.innerHTML = '';

        previewData.forEach(item => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <div class="preview-item-header">
                    <span class="preview-item-code">${this.escapeHtml(item.code)}</span>
                    <span class="preview-item-name">${this.escapeHtml(item.name)}</span>
                </div>
                <div class="preview-columns">
                    <div class="preview-column">
                        <h4>Dlouhý popis (zkráceno)</h4>
                        <p>${this.escapeHtml(this.truncateText(this.stripHtml(item.longDescription), 300))}</p>
                    </div>
                    <div class="preview-column">
                        <h4>Vygenerovaný krátký popis</h4>
                        <p>${this.escapeHtml(item.shortDescription)}</p>
                    </div>
                </div>
            `;
            this.elements.previewContent.appendChild(previewItem);
        });

        this.elements.previewModal.classList.remove('hidden');
    },

    /**
     * Hide preview modal
     */
    hidePreview() {
        this.elements.previewModal.classList.add('hidden');
    },

    /**
     * Show error
     */
    showError(message) {
        this.elements.uploadZone.classList.add('hidden');
        this.elements.fileInfo.classList.add('hidden');
        this.elements.apiKeySection.classList.add('hidden');
        this.elements.settingsSection.classList.add('hidden');
        this.elements.processBtn.classList.add('hidden');
        this.elements.processingSection.classList.add('hidden');
        this.elements.resultsSection.classList.add('hidden');
        this.elements.errorSection.classList.remove('hidden');

        this.elements.errorMessage.textContent = message;
    },

    /**
     * Reset UI to initial state
     */
    reset() {
        this.elements.uploadZone.classList.remove('hidden');
        this.elements.fileInfo.classList.add('hidden');
        this.elements.apiKeySection.classList.add('hidden');
        this.elements.settingsSection.classList.add('hidden');
        this.elements.processBtn.classList.add('hidden');
        this.elements.processingSection.classList.add('hidden');
        this.elements.resultsSection.classList.add('hidden');
        this.elements.errorSection.classList.add('hidden');

        this.elements.fileInput.value = '';
        this.elements.progressFill.style.width = '0%';
        this.elements.progressLog.innerHTML = '';
    },

    /**
     * Get justify text setting
     */
    getJustifyTextSetting() {
        return this.elements.justifyText ? this.elements.justifyText.checked : false;
    },

    /**
     * Get add bullet points setting
     */
    getAddBulletPointsSetting() {
        return this.elements.addBulletPoints ? this.elements.addBulletPoints.checked : false;
    },

    /**
     * Get selected tone
     */
    getSelectedTone() {
        const selectedRadio = document.querySelector('input[name="toneSelection"]:checked');
        return selectedRadio ? selectedRadio.value : 'neutral';
    },

    /**
     * Get custom tone example text
     */
    getCustomToneExample() {
        return this.elements.customToneExample ? this.elements.customToneExample.value.trim() : '';
    },

    /**
     * Get use link phrases setting
     */
    getUseLinkPhrasesSetting() {
        return this.elements.useLinkPhrases ? this.elements.useLinkPhrases.checked : false;
    },

    /**
     * Get link phrases text
     */
    getLinkPhrases() {
        return this.elements.linkPhrasesInput ? this.elements.linkPhrasesInput.value.trim() : '';
    },

    /**
     * Open lightbox with image
     */
    openLightbox(imageSrc) {
        if (this.elements.lightboxModal && this.elements.lightboxImage) {
            this.elements.lightboxImage.src = imageSrc;
            this.elements.lightboxModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Close lightbox
     */
    closeLightbox() {
        if (this.elements.lightboxModal) {
            this.elements.lightboxModal.classList.add('hidden');
            this.elements.lightboxImage.src = '';
            document.body.style.overflow = '';
        }
    },

    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    },

    /**
     * Strip HTML tags from text
     */
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html || '';
        return div.textContent || div.innerText || '';
    },

    /**
     * Truncate text
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => UI.init());
