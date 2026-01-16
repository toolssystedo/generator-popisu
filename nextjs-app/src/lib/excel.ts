import * as XLSX from 'xlsx';
import type { Product, ShortDescriptionStats, LongDescriptionStats } from '@/types';

// Required columns for processing
const REQUIRED_COLUMNS = ['code', 'name', 'description', 'shortDescription'];

// Text columns that need cleaning
const TEXT_COLUMNS = ['description', 'shortDescription', 'name'];

/**
 * Clean text from carriage returns and SheetJS escape sequences
 */
export function cleanText(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '')
    .replace(/_x000d_/gi, '');
}

/**
 * Strip HTML tags from text
 */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return '';
  // Create a temporary div to parse HTML
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  // Fallback for SSR - simple regex
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Get text length without HTML tags
 */
export function getTextLength(html: string | undefined | null): number {
  return stripHtml(html).trim().length;
}

/**
 * Clean all text columns in a single row
 */
function cleanRow(row: Product): Product {
  const cleanedRow = { ...row };
  TEXT_COLUMNS.forEach(col => {
    if (col === 'description' && cleanedRow.description) {
      cleanedRow.description = cleanText(cleanedRow.description);
    } else if (col === 'shortDescription' && cleanedRow.shortDescription) {
      cleanedRow.shortDescription = cleanText(cleanedRow.shortDescription);
    } else if (col === 'name' && cleanedRow.name) {
      cleanedRow.name = cleanText(cleanedRow.name);
    }
  });
  return cleanedRow;
}

/**
 * Read XLSX file and return data for SHORT description mode
 */
export async function readFileForShortDescriptions(file: File): Promise<{
  data: Product[];
  columns: string[];
  stats: ShortDescriptionStats;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with header row
        let jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          reject(new Error('Soubor neobsahuje žádná data'));
          return;
        }

        // Get column names from first row
        const columns = Object.keys(jsonData[0]);

        // Validate required columns
        const missingColumns = REQUIRED_COLUMNS.filter(col => !columns.includes(col));
        if (missingColumns.length > 0) {
          reject(new Error(`Chybějící sloupce: ${missingColumns.join(', ')}`));
          return;
        }

        // Transform to Product array and clean
        const products: Product[] = jsonData.map(row => cleanRow({
          code: row.code || '',
          name: row.name || '',
          description: row.description || '',
          shortDescription: row.shortDescription || '',
          image: row.image || '',
        }));

        // Calculate statistics
        const stats = calculateShortDescStats(products);

        resolve({
          data: products,
          columns: columns,
          stats: stats
        });
      } catch (error) {
        reject(new Error(`Chyba při čtení souboru: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Chyba při načítání souboru'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read XLSX file and return data for LONG description mode
 */
export async function readFileForLongDescriptions(file: File): Promise<{
  data: Product[];
  columns: string[];
  stats: LongDescriptionStats;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          throw new Error('Soubor neobsahuje žádná data.');
        }

        const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
        const columns = jsonData[0].map(h => String(h).trim());

        // Check required columns
        const requiredColumns = ['code', 'name', 'description', 'shortdescription'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

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
        const products: Product[] = [];
        let withShortDesc = 0;
        let withImage = 0;
        let processable = 0;

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const product: Product = {
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
            withShortDesc,
            withImage,
            processable
          }
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Calculate statistics for short description mode
 */
function calculateShortDescStats(data: Product[]): ShortDescriptionStats {
  const stats: ShortDescriptionStats = {
    total: data.length,
    withDescription: 0,
    processable: 0,
    emptyDescription: 0,
    shortDescription: 0
  };

  data.forEach(row => {
    const description = row.description || '';
    const plainText = stripHtml(description);

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
}

/**
 * Check if product can be processed for short descriptions
 */
export function canProcessProductShort(product: Product): { canProcess: boolean; reason: 'empty' | 'short' | null } {
  const description = product.description || '';
  const plainText = stripHtml(description);

  if (plainText.trim().length === 0) {
    return { canProcess: false, reason: 'empty' };
  }

  if (plainText.length < 100) {
    return { canProcess: false, reason: 'short' };
  }

  return { canProcess: true, reason: null };
}

/**
 * Check if product can be processed for long descriptions
 */
export function canProcessProductLong(product: Product): boolean {
  return !!(product.name && product.shortDescription && product.shortDescription.length >= 20);
}

/**
 * Download processed file for short descriptions
 */
export function downloadShortDescFile(data: Product[], columns: string[], fileName: string): void {
  // Clean ALL text data before passing to SheetJS
  const cleanedData = data.map(row => cleanRow(row));

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

/**
 * Download processed file for long descriptions
 */
export function downloadLongDescFile(data: Product[], columns: string[], fileName: string): void {
  // Build data array with original headers
  const headers = [...columns];
  const rows: (string | number)[][] = [headers];
  const lowerHeaders = headers.map(h => h.toLowerCase());

  for (const product of data) {
    const row: (string | number)[] = [];
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
        const origHeader = columns.findIndex(h => h.toLowerCase() === header);
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
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const newFileName = `${baseName}_long_descriptions.xlsx`;

  // Download
  XLSX.writeFile(workbook, newFileName);
}
