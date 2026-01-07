/**
 * Excel Module - Handles XLSX file reading and writing
 */

const Excel = {
    // Required columns for processing
    requiredColumns: ['code', 'name', 'description', 'shortDescription'],

    // Optional columns
    optionalColumns: ['pairCode', 'guid'],

    // Text columns that need cleaning
    textColumns: ['description', 'shortDescription', 'name'],

    /**
     * Clean text from carriage returns and SheetJS escape sequences
     * MUST be called before any text is passed to SheetJS
     * @param {string} text - Text to clean
     * @returns {string} Cleaned text
     */
    cleanText(text) {
        if (!text || typeof text !== 'string') return text;
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '')
            .replace(/_x000d_/gi, '');
    },

    /**
     * Clean all text columns in a single row
     * @param {Object} row - Data row
     * @returns {Object} Cleaned row
     */
    cleanRow(row) {
        const cleanedRow = { ...row };
        this.textColumns.forEach(col => {
            if (cleanedRow[col]) {
                cleanedRow[col] = this.cleanText(cleanedRow[col]);
            }
        });
        return cleanedRow;
    },

    /**
     * Clean all rows in data array
     * @param {Array} data - Array of data rows
     * @returns {Array} Cleaned data
     */
    cleanAllData(data) {
        return data.map(row => this.cleanRow(row));
    },

    /**
     * Read XLSX file and return data
     * @param {File} file - The file to read
     * @returns {Promise<{data: Array, columns: Array, stats: Object}>}
     */
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Convert to JSON with header row
                    let jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    if (jsonData.length === 0) {
                        reject(new Error('Soubor neobsahuje žádná data'));
                        return;
                    }

                    // Clean all text data immediately after reading
                    jsonData = this.cleanAllData(jsonData);

                    // Get column names from first row
                    const columns = Object.keys(jsonData[0]);

                    // Validate required columns
                    const missingColumns = this.requiredColumns.filter(col => !columns.includes(col));
                    if (missingColumns.length > 0) {
                        reject(new Error(`Chybějící sloupce: ${missingColumns.join(', ')}`));
                        return;
                    }

                    // Calculate statistics
                    const stats = this.calculateStats(jsonData);

                    resolve({
                        data: jsonData,
                        columns: columns,
                        stats: stats
                    });
                } catch (error) {
                    reject(new Error(`Chyba při čtení souboru: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Chyba při načítání souboru'));
            };

            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Calculate statistics from data
     * @param {Array} data - The product data
     * @returns {Object} Statistics
     */
    calculateStats(data) {
        const stats = {
            total: data.length,
            withDescription: 0,
            processable: 0,
            emptyDescription: 0,
            shortDescription: 0
        };

        data.forEach(row => {
            const description = row.description || '';
            const plainText = this.stripHtml(description);

            if (plainText.trim().length > 0) {
                stats.withDescription++;

                if (plainText.length >= 100) {
                    stats.processable++;
                } else {
                    stats.shortDescription++;
                }
            } else {
                stats.emptyDescription++;
            }
        });

        return stats;
    },

    /**
     * Strip HTML tags from text
     * @param {string} html - HTML string
     * @returns {string} Plain text
     */
    stripHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    /**
     * Get text length without HTML tags
     * @param {string} html - HTML string
     * @returns {number} Text length
     */
    getTextLength(html) {
        return this.stripHtml(html).trim().length;
    },

    /**
     * Check if product can be processed
     * @param {Object} product - Product data
     * @returns {{canProcess: boolean, reason: string|null}}
     */
    canProcessProduct(product) {
        const description = product.description || '';
        const plainText = this.stripHtml(description);

        if (plainText.trim().length === 0) {
            return {
                canProcess: false,
                reason: 'empty'
            };
        }

        if (plainText.length < 100) {
            return {
                canProcess: false,
                reason: 'short'
            };
        }

        return {
            canProcess: true,
            reason: null
        };
    },

    /**
     * Create XLSX file from data
     * @param {Array} data - The product data
     * @param {Array} columns - Column order
     * @param {string} fileName - Output file name
     */
    downloadFile(data, columns, fileName) {
        // Clean ALL text data before passing to SheetJS
        const cleanedData = this.cleanAllData(data);

        // Create worksheet from cleaned data
        const worksheet = XLSX.utils.json_to_sheet(cleanedData, { header: columns });

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

        // Generate filename
        const outputName = fileName.replace(/\.xlsx?$/i, '_processed.xlsx');

        // Download file
        XLSX.writeFile(workbook, outputName);
    }
};
