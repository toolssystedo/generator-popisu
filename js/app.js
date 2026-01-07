/**
 * App Module - Main application logic
 */

const App = {
    // Application state
    state: {
        file: null,
        fileName: '',
        data: null,
        columns: null,
        stats: null,
        isProcessing: false,
        isCancelled: false,
        processedData: null,
        results: {
            success: 0,
            skippedEmpty: 0,
            skippedShort: 0,
            errors: 0
        },
        previewItems: []
    },

    /**
     * Load and parse Excel file
     * @param {File} file - The file to load
     */
    async loadFile(file) {
        try {
            this.state.file = file;
            this.state.fileName = file.name;

            const result = await Excel.readFile(file);

            this.state.data = result.data;
            this.state.columns = result.columns;
            this.state.stats = result.stats;

            UI.showFileInfo(file.name, result.stats);

        } catch (error) {
            UI.showError(error.message);
        }
    },

    /**
     * Reset file selection
     */
    resetFile() {
        this.state.file = null;
        this.state.fileName = '';
        this.state.data = null;
        this.state.columns = null;
        this.state.stats = null;
        UI.reset();
    },

    /**
     * Start processing products
     */
    async startProcessing() {
        const apiKey = UI.elements.apiKeyInput.value.trim();

        // Validate API key
        if (!API.validateApiKey(apiKey)) {
            UI.showError('Zadejte prosím platný Anthropic API klíč.');
            return;
        }

        // Validate data
        if (!this.state.data || this.state.data.length === 0) {
            UI.showError('Nejsou načtena žádná data k zpracování.');
            return;
        }

        // Check if there are any processable products
        if (this.state.stats.processable === 0) {
            UI.showError('Žádné produkty nelze zpracovat. Všechny produkty mají prázdný nebo příliš krátký dlouhý popis.');
            return;
        }

        // Initialize processing state
        this.state.isProcessing = true;
        this.state.isCancelled = false;
        this.state.results = {
            success: 0,
            skippedEmpty: 0,
            skippedShort: 0,
            errors: 0
        };
        this.state.previewItems = [];

        // Clone data for processing
        this.state.processedData = JSON.parse(JSON.stringify(this.state.data));

        // Show processing UI
        UI.showProcessing();

        // Process products
        await this.processProducts(apiKey);
    },

    /**
     * Process all products
     * @param {string} apiKey - Anthropic API key
     */
    async processProducts(apiKey) {
        const products = this.state.processedData;
        const total = products.length;
        let processed = 0;
        const startTime = Date.now();

        // Get settings
        const justifyText = UI.getJustifyTextSetting();
        const addBulletPoints = UI.getAddBulletPointsSetting();
        const selectedTone = UI.getSelectedTone();
        const customToneExample = UI.getCustomToneExample();
        const useLinkPhrases = UI.getUseLinkPhrasesSetting();
        const linkPhrases = UI.getLinkPhrases();

        // Set up rate limit callback
        API.onRateLimitWait = (waitSeconds, attempt, maxAttempts) => {
            UI.addLogEntry(`Rate limit - čekám ${waitSeconds}s (pokus ${attempt}/${maxAttempts})...`, 'warning');
        };

        for (let i = 0; i < products.length; i++) {
            // Check if cancelled
            if (this.state.isCancelled) {
                UI.addLogEntry('Zpracování zrušeno uživatelem.', 'warning');
                break;
            }

            const product = products[i];
            const productName = product.name || `Produkt ${i + 1}`;
            const productCode = product.code || '';

            // Update progress
            UI.updateProgress(i + 1, total, productName);

            // Check if product can be processed
            const checkResult = Excel.canProcessProduct(product);

            if (!checkResult.canProcess) {
                if (checkResult.reason === 'empty') {
                    this.state.results.skippedEmpty++;
                    UI.addLogEntry(`Přeskočeno (prázdný popis): ${productCode} - ${productName}`, 'warning');
                } else if (checkResult.reason === 'short') {
                    this.state.results.skippedShort++;
                    UI.addLogEntry(`Přeskočeno (krátký popis <100 znaků): ${productCode} - ${productName}`, 'warning');
                }
                processed++;
                continue;
            }

            // Generate description via API (now includes existing shortDescription)
            const result = await API.generateDescription(
                productName,
                product.description,
                product.shortDescription || '',
                apiKey,
                addBulletPoints,
                selectedTone,
                customToneExample,
                useLinkPhrases,
                linkPhrases
            );

            if (result.success) {
                // Apply justify alignment if enabled
                let finalDescription = result.description;
                if (justifyText) {
                    finalDescription = API.applyJustifyAlignment(finalDescription);
                }

                // Clean the generated description before storing
                finalDescription = Excel.cleanText(finalDescription);

                // Update product with new short description
                product.shortDescription = finalDescription;
                this.state.results.success++;
                UI.addLogEntry(`Úspěšně zpracováno: ${productCode} - ${productName}`, 'success');

                // Add to preview (max 10 items)
                if (this.state.previewItems.length < 10) {
                    this.state.previewItems.push({
                        code: productCode,
                        name: productName,
                        longDescription: product.description,
                        shortDescription: finalDescription
                    });
                }
            } else {
                this.state.results.errors++;
                UI.addLogEntry(`Chyba: ${productCode} - ${productName}: ${result.error}`, 'error');

                // Check for authentication error - stop processing
                if (result.error.includes('Neplatný API klíč')) {
                    UI.showError(result.error);
                    this.state.isProcessing = false;
                    return;
                }
            }

            processed++;

            // Update estimated time
            const elapsed = Date.now() - startTime;
            const avgTime = elapsed / processed;
            const remaining = (total - processed) * avgTime / 1000;
            UI.updateEstimatedTime(remaining);

            // Add delay between requests
            if (i < products.length - 1 && !this.state.isCancelled) {
                await API.sleep(API.requestDelay);
            }
        }

        // Processing complete
        this.state.isProcessing = false;

        if (!this.state.isCancelled) {
            UI.showResults(this.state.results);
        } else {
            // Show partial results
            UI.showResults(this.state.results);
        }
    },

    /**
     * Cancel processing
     */
    cancelProcessing() {
        this.state.isCancelled = true;
        UI.addLogEntry('Rušení zpracování...', 'warning');
    },

    /**
     * Download processed file
     */
    downloadFile() {
        if (!this.state.processedData) {
            UI.showError('Žádná data k stažení.');
            return;
        }

        Excel.downloadFile(
            this.state.processedData,
            this.state.columns,
            this.state.fileName
        );
    },

    /**
     * Show preview of changes
     */
    showPreview() {
        if (this.state.previewItems.length === 0) {
            UI.showError('Žádné položky k zobrazení náhledu.');
            return;
        }

        UI.showPreviewModal(this.state.previewItems);
    },

    /**
     * Reset application to initial state
     */
    reset() {
        this.state = {
            file: null,
            fileName: '',
            data: null,
            columns: null,
            stats: null,
            isProcessing: false,
            isCancelled: false,
            processedData: null,
            results: {
                success: 0,
                skippedEmpty: 0,
                skippedShort: 0,
                errors: 0
            },
            previewItems: []
        };

        UI.reset();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // App is ready - UI module handles initialization
    console.log('Shoptet Description Generator initialized');
});
