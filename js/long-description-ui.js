/**
 * Long Description UI Module
 * Handles UI for long description generation mode
 */

const LongDescriptionUI = {
    elements: {},

    /**
     * Initialize the module
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
    },

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Upload
            uploadZone: document.getElementById('longUploadZone'),
            fileInput: document.getElementById('longFileInput'),

            // File info
            fileInfo: document.getElementById('longFileInfo'),
            fileName: document.getElementById('longFileName'),
            fileStats: document.getElementById('longFileStats'),
            totalProducts: document.getElementById('longTotalProducts'),
            withShortDesc: document.getElementById('longWithShortDesc'),
            withImage: document.getElementById('longWithImage'),
            processable: document.getElementById('longProcessable'),
            removeFile: document.getElementById('longRemoveFile'),

            // API Key
            apiKeySection: document.getElementById('longApiKeySection'),
            apiKeyInput: document.getElementById('longApiKeyInput'),
            toggleApiKey: document.getElementById('longToggleApiKey'),
            saveApiKey: document.getElementById('longSaveApiKey'),

            // Settings
            settingsSection: document.getElementById('longSettingsSection'),
            justifyText: document.getElementById('longJustifyText'),
            addImages: document.getElementById('longAddImages'),
            useLinkPhrases: document.getElementById('longUseLinkPhrases'),
            linkPhrasesSection: document.getElementById('longLinkPhrasesSection'),
            linkPhrasesInput: document.getElementById('longLinkPhrasesInput'),
            toneRadios: document.querySelectorAll('input[name="longToneSelection"]'),
            customToneSection: document.getElementById('longCustomToneSection'),
            customToneExample: document.getElementById('longCustomToneExample'),

            // Process
            processBtn: document.getElementById('longProcessBtn'),

            // Processing
            processingSection: document.getElementById('longProcessingSection'),
            progressPercent: document.getElementById('longProgressPercent'),
            progressFill: document.getElementById('longProgressFill'),
            progressCurrent: document.getElementById('longProgressCurrent'),
            progressTotal: document.getElementById('longProgressTotal'),
            progressTime: document.getElementById('longProgressTime'),
            progressLog: document.getElementById('longProgressLog'),
            cancelBtn: document.getElementById('longCancelBtn'),

            // Results
            resultsSection: document.getElementById('longResultsSection'),
            resultSuccess: document.getElementById('longResultSuccess'),
            resultSkipped: document.getElementById('longResultSkipped'),
            resultErrors: document.getElementById('longResultErrors'),
            resultAvgLength: document.getElementById('longResultAvgLength'),
            resultWithImages: document.getElementById('longResultWithImages'),
            downloadBtn: document.getElementById('longDownloadBtn'),
            previewBtn: document.getElementById('longPreviewBtn'),
            resetBtn: document.getElementById('longResetBtn'),

            // Preview Modal
            previewModal: document.getElementById('longPreviewModal'),
            previewContent: document.getElementById('longPreviewContent'),
            closePreview: document.getElementById('longClosePreview'),

            // Error
            errorSection: document.getElementById('longErrorSection'),
            errorMessage: document.getElementById('longErrorMessage'),
            errorResetBtn: document.getElementById('longErrorResetBtn')
        };
    },

    /**
     * Bind UI events
     */
    bindEvents() {
        if (!this.elements.uploadZone) return;

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
            if (typeof LongDescriptionApp !== 'undefined' && LongDescriptionApp.resetFile) {
                LongDescriptionApp.resetFile();
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

        // Settings checkboxes
        if (this.elements.justifyText) {
            this.elements.justifyText.addEventListener('change', (e) => {
                localStorage.setItem('long_justify_text', e.target.checked);
            });
        }

        if (this.elements.addImages) {
            this.elements.addImages.addEventListener('change', (e) => {
                localStorage.setItem('long_add_images', e.target.checked);
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
                localStorage.setItem('long_use_link_phrases', e.target.checked);
            });
        }

        // Save link phrases on change
        if (this.elements.linkPhrasesInput) {
            this.elements.linkPhrasesInput.addEventListener('input', (e) => {
                localStorage.setItem('long_link_phrases', e.target.value);
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
                localStorage.setItem('long_tone_selection', e.target.value);
            });
        });

        // Save custom tone example on change
        if (this.elements.customToneExample) {
            this.elements.customToneExample.addEventListener('input', (e) => {
                localStorage.setItem('long_custom_tone_example', e.target.value);
            });
        }

        // Process button
        this.elements.processBtn.addEventListener('click', () => {
            if (typeof LongDescriptionApp !== 'undefined' && LongDescriptionApp.startProcessing) {
                LongDescriptionApp.startProcessing();
            }
        });

        // Cancel button
        this.elements.cancelBtn.addEventListener('click', () => {
            if (typeof LongDescriptionApp !== 'undefined' && LongDescriptionApp.cancelProcessing) {
                LongDescriptionApp.cancelProcessing();
            }
        });

        // Download button
        this.elements.downloadBtn.addEventListener('click', () => {
            if (typeof LongDescriptionApp !== 'undefined' && LongDescriptionApp.downloadFile) {
                LongDescriptionApp.downloadFile();
            }
        });

        // Preview button
        this.elements.previewBtn.addEventListener('click', () => {
            if (typeof LongDescriptionApp !== 'undefined' && LongDescriptionApp.showPreview) {
                LongDescriptionApp.showPreview();
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
            if (typeof LongDescriptionApp !== 'undefined' && LongDescriptionApp.reset) {
                LongDescriptionApp.reset();
            }
        });

        this.elements.errorResetBtn.addEventListener('click', () => {
            if (typeof LongDescriptionApp !== 'undefined' && LongDescriptionApp.reset) {
                LongDescriptionApp.reset();
            }
        });
    },

    /**
     * Load saved settings from localStorage
     */
    loadSettings() {
        // Load saved API key
        const savedKey = localStorage.getItem('anthropic_api_key');
        if (savedKey && this.elements.apiKeyInput) {
            this.elements.apiKeyInput.value = savedKey;
        }

        // Load saved justify text setting
        const savedJustify = localStorage.getItem('long_justify_text') === 'true';
        if (this.elements.justifyText) {
            this.elements.justifyText.checked = savedJustify;
        }

        // Load saved add images setting
        const savedAddImages = localStorage.getItem('long_add_images') === 'true';
        if (this.elements.addImages) {
            this.elements.addImages.checked = savedAddImages;
        }

        // Load saved link phrases setting
        const savedUseLinkPhrases = localStorage.getItem('long_use_link_phrases') === 'true';
        if (this.elements.useLinkPhrases) {
            this.elements.useLinkPhrases.checked = savedUseLinkPhrases;
            if (savedUseLinkPhrases && this.elements.linkPhrasesSection) {
                this.elements.linkPhrasesSection.classList.remove('hidden');
            }
        }

        // Load saved link phrases
        const savedLinkPhrases = localStorage.getItem('long_link_phrases');
        if (savedLinkPhrases && this.elements.linkPhrasesInput) {
            this.elements.linkPhrasesInput.value = savedLinkPhrases;
        }

        // Load saved tone selection
        const savedTone = localStorage.getItem('long_tone_selection') || 'neutral';
        this.elements.toneRadios.forEach(radio => {
            if (radio.value === savedTone) {
                radio.checked = true;
                if (savedTone === 'custom' && this.elements.customToneSection) {
                    this.elements.customToneSection.classList.remove('hidden');
                }
            }
        });

        // Load saved custom tone example
        const savedCustomTone = localStorage.getItem('long_custom_tone_example');
        if (savedCustomTone && this.elements.customToneExample) {
            this.elements.customToneExample.value = savedCustomTone;
        }
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

        if (typeof LongDescriptionApp !== 'undefined' && LongDescriptionApp.loadFile) {
            LongDescriptionApp.loadFile(file);
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
        this.elements.withShortDesc.textContent = stats.withShortDesc || 0;
        this.elements.withImage.textContent = stats.withImage || 0;
        this.elements.processable.textContent = stats.processable || 0;
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
        this.elements.resultSkipped.textContent = results.skipped;
        this.elements.resultErrors.textContent = results.errors;
        this.elements.resultAvgLength.textContent = results.avgLength || 0;
        this.elements.resultWithImages.textContent = results.withImages || 0;
    },

    /**
     * Show preview modal
     */
    showPreviewModal(previewData) {
        this.elements.previewContent.innerHTML = '';

        previewData.forEach(item => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item preview-item-long';
            previewItem.innerHTML = `
                <div class="preview-item-header">
                    <span class="preview-item-code">${this.escapeHtml(item.code)}</span>
                    <span class="preview-item-name">${this.escapeHtml(item.name)}</span>
                </div>
                <div class="preview-columns preview-columns-stacked">
                    <div class="preview-column">
                        <h4>Původní popis</h4>
                        <div class="preview-html-content">${item.originalDescription || '<em>Prázdný</em>'}</div>
                    </div>
                    <div class="preview-column">
                        <h4>Nový vylepšený popis</h4>
                        <div class="preview-html-content">${item.newDescription || '<em>Nezpracováno</em>'}</div>
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
     * Get settings
     */
    getSettings() {
        return {
            justifyText: this.elements.justifyText ? this.elements.justifyText.checked : false,
            addImages: this.elements.addImages ? this.elements.addImages.checked : false,
            useLinkPhrases: this.elements.useLinkPhrases ? this.elements.useLinkPhrases.checked : false,
            linkPhrases: this.elements.linkPhrasesInput ? this.elements.linkPhrasesInput.value.trim() : '',
            tone: this.getSelectedTone(),
            customToneExample: this.elements.customToneExample ? this.elements.customToneExample.value.trim() : ''
        };
    },

    /**
     * Get selected tone
     */
    getSelectedTone() {
        const selectedRadio = document.querySelector('input[name="longToneSelection"]:checked');
        return selectedRadio ? selectedRadio.value : 'neutral';
    },

    /**
     * Get API key
     */
    getApiKey() {
        return this.elements.apiKeyInput ? this.elements.apiKeyInput.value.trim() : '';
    },

    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all elements are loaded
    setTimeout(() => LongDescriptionUI.init(), 100);
});
