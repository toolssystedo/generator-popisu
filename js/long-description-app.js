/**
 * Long Description App Module
 * Main application logic for long description generation
 */

const LongDescriptionApp = {
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
            skipped: 0,
            errors: 0,
            avgLength: 0,
            withImages: 0
        },
        previewItems: []
    },

    /**
     * Load and parse Excel file
     */
    async loadFile(file) {
        try {
            this.state.file = file;
            this.state.fileName = file.name;

            const result = await this.readExcelFile(file);

            this.state.data = result.data;
            this.state.columns = result.columns;
            this.state.stats = result.stats;

            LongDescriptionUI.showFileInfo(file.name, result.stats);

        } catch (error) {
            LongDescriptionUI.showError(error.message);
        }
    },

    /**
     * Read Excel file and extract data
     */
    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length < 2) {
                        throw new Error('Soubor neobsahuje žádná data.');
                    }

                    const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
                    const columns = jsonData[0].map(h => String(h).trim());

                    // Check required columns
                    const requiredColumns = ['code', 'name', 'description', 'shortdescription'];
                    const missingColumns = requiredColumns.filter(col =>
                        !headers.includes(col)
                    );

                    if (missingColumns.length > 0) {
                        throw new Error(`Chybějící povinné sloupce: ${missingColumns.join(', ')}`);
                    }

                    // Find column indices
                    const codeIdx = headers.indexOf('code');
                    const nameIdx = headers.indexOf('name');
                    const descIdx = headers.indexOf('description');
                    const shortDescIdx = headers.indexOf('shortdescription');
                    const imageIdx = headers.indexOf('image');

                    // Process data rows
                    const products = [];
                    let withShortDesc = 0;
                    let withImage = 0;
                    let processable = 0;

                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || row.length === 0) continue;

                        const product = {
                            code: row[codeIdx] ? String(row[codeIdx]).trim() : '',
                            name: row[nameIdx] ? String(row[nameIdx]).trim() : '',
                            description: row[descIdx] ? String(row[descIdx]).trim() : '',
                            shortDescription: row[shortDescIdx] ? String(row[shortDescIdx]).trim() : '',
                            image: imageIdx >= 0 && row[imageIdx] ? String(row[imageIdx]).trim() : '',
                            _originalRow: row
                        };

                        // Count stats
                        if (product.shortDescription && product.shortDescription.length > 0) {
                            withShortDesc++;
                        }
                        if (product.image && product.image.length > 0) {
                            withImage++;
                        }

                        // Can be processed if has name and short description
                        if (product.name && product.shortDescription && product.shortDescription.length >= 20) {
                            processable++;
                        }

                        products.push(product);
                    }

                    resolve({
                        data: products,
                        columns: columns,
                        stats: {
                            total: products.length,
                            withShortDesc: withShortDesc,
                            withImage: withImage,
                            processable: processable
                        }
                    });

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
            reader.readAsArrayBuffer(file);
        });
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
        LongDescriptionUI.reset();
    },

    /**
     * Start processing products
     */
    async startProcessing() {
        const apiKey = LongDescriptionUI.getApiKey();

        // Validate API key
        if (!apiKey || apiKey.length < 20) {
            LongDescriptionUI.showError('Zadejte prosím platný Anthropic API klíč.');
            return;
        }

        // Validate data
        if (!this.state.data || this.state.data.length === 0) {
            LongDescriptionUI.showError('Nejsou načtena žádná data k zpracování.');
            return;
        }

        // Check if there are any processable products
        if (this.state.stats.processable === 0) {
            LongDescriptionUI.showError('Žádné produkty nelze zpracovat. Produkty musí mít název a krátký popis (min. 20 znaků).');
            return;
        }

        // Initialize processing state
        this.state.isProcessing = true;
        this.state.isCancelled = false;
        this.state.results = {
            success: 0,
            skipped: 0,
            errors: 0,
            avgLength: 0,
            withImages: 0
        };
        this.state.previewItems = [];

        // Clone data for processing
        this.state.processedData = JSON.parse(JSON.stringify(this.state.data));

        // Show processing UI
        LongDescriptionUI.showProcessing();

        // Process products
        await this.processProducts(apiKey);
    },

    /**
     * Process all products
     */
    async processProducts(apiKey) {
        const products = this.state.processedData;
        const total = products.length;
        let processed = 0;
        const startTime = Date.now();
        let totalLength = 0;

        // Get settings
        const settings = LongDescriptionUI.getSettings();

        // Set up rate limit callback
        LongDescriptionAPI.onRateLimitWait = (waitSeconds, attempt, maxAttempts) => {
            LongDescriptionUI.addLogEntry(`Rate limit - čekám ${waitSeconds}s (pokus ${attempt}/${maxAttempts})...`, 'warning');
        };

        for (let i = 0; i < products.length; i++) {
            // Check if cancelled
            if (this.state.isCancelled) {
                LongDescriptionUI.addLogEntry('Zpracování zrušeno uživatelem.', 'warning');
                break;
            }

            const product = products[i];
            const productName = product.name || `Produkt ${i + 1}`;
            const productCode = product.code || '';

            // Update progress
            LongDescriptionUI.updateProgress(i + 1, total, productName);

            // Check if product can be processed
            if (!product.name || !product.shortDescription || product.shortDescription.length < 20) {
                this.state.results.skipped++;
                LongDescriptionUI.addLogEntry(`Přeskočeno (nedostatek dat): ${productCode} - ${productName}`, 'warning');
                processed++;
                continue;
            }

            // Generate description via API
            const result = await LongDescriptionAPI.generateDescription(product, settings, apiKey);

            if (result.success) {
                // Apply justify alignment if enabled
                let finalDescription = result.description;
                if (settings.justifyText) {
                    finalDescription = LongDescriptionAPI.applyJustifyAlignment(finalDescription);
                }

                // Update product with new description
                product.description = finalDescription;
                this.state.results.success++;

                // Track length
                const plainText = LongDescriptionAPI.stripHtml(finalDescription);
                totalLength += plainText.length;

                // Track images
                if (LongDescriptionAPI.hasImage(finalDescription)) {
                    this.state.results.withImages++;
                }

                LongDescriptionUI.addLogEntry(`Úspěšně zpracováno: ${productCode} - ${productName}`, 'success');

                // Add to preview (max 10 items)
                if (this.state.previewItems.length < 10) {
                    this.state.previewItems.push({
                        code: productCode,
                        name: productName,
                        originalDescription: product.originalDescription,
                        newDescription: finalDescription
                    });
                }
            } else {
                this.state.results.errors++;
                LongDescriptionUI.addLogEntry(`Chyba: ${productCode} - ${productName}: ${result.error}`, 'error');

                // Check for authentication error - stop processing
                if (result.error.includes('Neplatný API klíč')) {
                    LongDescriptionUI.showError(result.error);
                    this.state.isProcessing = false;
                    return;
                }
            }

            processed++;

            // Update estimated time
            const elapsed = Date.now() - startTime;
            const avgTime = elapsed / processed;
            const remaining = (total - processed) * avgTime / 1000;
            LongDescriptionUI.updateEstimatedTime(remaining);

            // Add delay between requests
            if (i < products.length - 1 && !this.state.isCancelled) {
                await LongDescriptionAPI.sleep(LongDescriptionAPI.requestDelay);
            }
        }

        // Calculate average length
        if (this.state.results.success > 0) {
            this.state.results.avgLength = Math.round(totalLength / this.state.results.success);
        }

        // Processing complete
        this.state.isProcessing = false;
        LongDescriptionUI.showResults(this.state.results);
    },

    /**
     * Cancel processing
     */
    cancelProcessing() {
        this.state.isCancelled = true;
        LongDescriptionUI.addLogEntry('Rušení zpracování...', 'warning');
    },

    /**
     * Download processed file
     */
    downloadFile() {
        if (!this.state.processedData) {
            LongDescriptionUI.showError('Žádná data k stažení.');
            return;
        }

        try {
            // Build data array with original headers (no changes)
            const headers = [...this.state.columns];

            // Build rows
            const rows = [headers];
            const lowerHeaders = headers.map(h => h.toLowerCase());

            for (const product of this.state.processedData) {
                const row = [];
                for (let i = 0; i < headers.length; i++) {
                    const header = lowerHeaders[i];
                    if (header === 'code') {
                        row.push(product.code || '');
                    } else if (header === 'name') {
                        row.push(product.name || '');
                    } else if (header === 'description') {
                        row.push(product.description || '');
                    } else if (header === 'shortdescription') {
                        row.push(product.shortDescription || '');
                    } else if (header === 'image') {
                        row.push(product.image || '');
                    } else {
                        // Get value from original row if available
                        const origHeader = this.state.columns.findIndex(h => h.toLowerCase() === header);
                        row.push(origHeader >= 0 && product._originalRow ? (product._originalRow[origHeader] || '') : '');
                    }
                }
                rows.push(row);
            }

            // Create workbook
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

            // Generate filename
            const baseName = this.state.fileName.replace(/\.[^/.]+$/, '');
            const newFileName = `${baseName}_long_descriptions.xlsx`;

            // Download
            XLSX.writeFile(workbook, newFileName);

        } catch (error) {
            LongDescriptionUI.showError(`Chyba při stahování: ${error.message}`);
        }
    },

    /**
     * Show preview of changes
     */
    showPreview() {
        if (this.state.previewItems.length === 0) {
            LongDescriptionUI.showError('Žádné položky k zobrazení náhledu.');
            return;
        }

        LongDescriptionUI.showPreviewModal(this.state.previewItems);
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
                skipped: 0,
                errors: 0,
                avgLength: 0,
                withImages: 0
            },
            previewItems: []
        };

        LongDescriptionUI.reset();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Long Description Generator initialized');
});
