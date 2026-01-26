import * as XLSX from 'xlsx';
import type { Product, ShortDescriptionStats, LongDescriptionStats } from '@/types';

// Required columns for processing (lowercase for comparison)
const REQUIRED_COLUMNS = ['code', 'name', 'description', 'shortdescription'];

// Text columns that need cleaning
const TEXT_COLUMNS = ['description', 'shortDescription', 'name'];

/**
 * Clean header name - remove BOM, invisible characters, and normalize
 */
function cleanHeaderName(header: unknown): string {
  if (header === null || header === undefined) return '';
  let str = String(header);
  // Remove BOM (Byte Order Mark)
  str = str.replace(/^\uFEFF/, '');
  // Remove zero-width characters and other invisible Unicode
  str = str.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
  // Trim whitespace
  str = str.trim();
  return str;
}

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
 * Clean cell value for XLSX export - removes \r characters to prevent _x000d_ in output
 */
function cleanCellValue(value: unknown): string | number {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return value
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '')
      .replace(/_x000d_/gi, '');
  }
  return String(value);
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

        // Convert to array format to preserve original rows
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          reject(new Error('Soubor neobsahuje žádná data'));
          return;
        }

        // Get column names from first row - clean and normalize
        const rawHeaders = jsonData[0];
        const columns = rawHeaders.map(h => cleanHeaderName(h));
        const headers = columns.map(h => h.toLowerCase());

        // Debug: log actual column names
        console.log('[SHORT DESC] Načtené sloupce ze souboru:', columns);
        console.log('[SHORT DESC] Sloupce (lowercase):', headers);
        console.log('[SHORT DESC] Požadované sloupce:', REQUIRED_COLUMNS);

        // Validate required columns (case-insensitive)
        const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col.toLowerCase()));
        if (missingColumns.length > 0) {
          console.error('[SHORT DESC] Chybějící sloupce:', missingColumns);
          reject(new Error(`Chybějící sloupce: ${missingColumns.join(', ')}. Nalezené sloupce: ${columns.join(', ')}`));
          return;
        }

        // Find column indices (case-insensitive)
        const codeIdx = headers.indexOf('code');
        const nameIdx = headers.indexOf('name');
        const descIdx = headers.indexOf('description');
        const shortDescIdx = headers.indexOf('shortdescription');
        const imageIdx = headers.indexOf('image');
        const manufacturerIdx = headers.indexOf('manufacturer');
        const categoryTextIdx = headers.indexOf('categorytext');

        console.log('[SHORT DESC] Index sloupců - code:', codeIdx, 'name:', nameIdx, 'description:', descIdx, 'shortDescription:', shortDescIdx, 'manufacturer:', manufacturerIdx, 'categoryText:', categoryTextIdx);

        // Transform to Product array with original row preserved
        const products: Product[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const product = cleanRow({
            code: row[codeIdx] ? String(row[codeIdx]).trim() : '',
            name: row[nameIdx] ? String(row[nameIdx]).trim() : '',
            description: row[descIdx] ? String(row[descIdx]).trim() : '',
            shortDescription: row[shortDescIdx] ? String(row[shortDescIdx]).trim() : '',
            image: imageIdx >= 0 && row[imageIdx] ? String(row[imageIdx]).trim() : '',
            manufacturer: manufacturerIdx >= 0 && row[manufacturerIdx] ? String(row[manufacturerIdx]).trim() : '',
            categoryText: categoryTextIdx >= 0 && row[categoryTextIdx] ? String(row[categoryTextIdx]).trim() : '',
            _originalRow: row
          });
          products.push(product);
        }

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

        // Get column names - clean and normalize
        const rawHeaders = jsonData[0];
        const columns = rawHeaders.map(h => cleanHeaderName(h));
        const headers = columns.map(h => h.toLowerCase());

        // Debug: log actual column names
        console.log('[LONG DESC] Načtené sloupce ze souboru:', columns);
        console.log('[LONG DESC] Sloupce (lowercase):', headers);

        // Check required columns (case-insensitive)
        const requiredColumns = ['code', 'name', 'description', 'shortdescription'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col.toLowerCase()));

        if (missingColumns.length > 0) {
          console.error('[LONG DESC] Chybějící sloupce:', missingColumns);
          throw new Error(`Chybějící povinné sloupce: ${missingColumns.join(', ')}. Nalezené sloupce: ${columns.join(', ')}`);
        }

        // Find column indices (case-insensitive)
        const codeIdx = headers.indexOf('code');
        const nameIdx = headers.indexOf('name');
        const descIdx = headers.indexOf('description');
        const shortDescIdx = headers.indexOf('shortdescription');
        const imageIdx = headers.indexOf('image');
        const manufacturerIdx = headers.indexOf('manufacturer');
        const categoryTextIdx = headers.indexOf('categorytext');

        console.log('[LONG DESC] Index sloupců - code:', codeIdx, 'name:', nameIdx, 'description:', descIdx, 'shortDescription:', shortDescIdx, 'manufacturer:', manufacturerIdx, 'categoryText:', categoryTextIdx);

        // Find all image columns (image, image2, image3, ...) but NOT defaultImage
        const imageColumnIndices: number[] = [];
        headers.forEach((header, idx) => {
          // Match 'image' or 'image2', 'image3', etc. but NOT 'defaultimage'
          if (header === 'image' || /^image\d+$/.test(header)) {
            imageColumnIndices.push(idx);
          }
        });

        // Process data rows
        const products: Product[] = [];
        let withShortDesc = 0;
        let withImage = 0;
        let processable = 0;

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          // Collect all images from image columns (skip defaultImage) for processing
          const imageUrls: string[] = [];
          for (const imgIdx of imageColumnIndices) {
            if (row[imgIdx]) {
              const url = String(row[imgIdx]).trim();
              if (url.length > 0) {
                imageUrls.push(url);
              }
            }
          }

          // Get original image value (just the 'image' column)
          const originalImage = imageIdx >= 0 && row[imageIdx] ? String(row[imageIdx]).trim() : '';

          const product: Product = {
            code: row[codeIdx] ? String(row[codeIdx]).trim() : '',
            name: row[nameIdx] ? String(row[nameIdx]).trim() : '',
            description: row[descIdx] ? String(row[descIdx]).trim() : '',
            shortDescription: row[shortDescIdx] ? String(row[shortDescIdx]).trim() : '',
            image: originalImage,
            manufacturer: manufacturerIdx >= 0 && row[manufacturerIdx] ? String(row[manufacturerIdx]).trim() : '',
            categoryText: categoryTextIdx >= 0 && row[categoryTextIdx] ? String(row[categoryTextIdx]).trim() : '',
            _allImages: imageUrls.join(', '),
            _originalRow: row
          };

          // Count stats
          if (product.shortDescription && product.shortDescription.length > 0) {
            withShortDesc++;
          }
          // Count products with any images (using _allImages which contains all image columns)
          if (product._allImages && product._allImages.length > 0) {
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
 * ONLY the 'shortDescription' column is modified, all other columns remain unchanged
 */
export function downloadShortDescFile(data: Product[], columns: string[], fileName: string): void {
  // Build data array with original headers
  const headers = [...columns];
  const rows: (string | number)[][] = [headers];
  const lowerHeaders = headers.map(h => h.toLowerCase());
  const shortDescIdx = lowerHeaders.indexOf('shortdescription');

  for (const product of data) {
    const row: (string | number)[] = [];
    for (let i = 0; i < headers.length; i++) {
      if (i === shortDescIdx) {
        // ONLY shortDescription column is modified - clean \r characters
        row.push(cleanCellValue(product.shortDescription || ''));
      } else {
        // ALL other columns use original values from _originalRow - clean \r characters
        row.push(cleanCellValue(product._originalRow ? (product._originalRow[i] ?? '') : ''));
      }
    }
    rows.push(row);
  }

  // Create workbook
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  // Generate filename
  const outputName = fileName.replace(/\.xlsx?$/i, '_processed.xlsx');

  // Download file
  XLSX.writeFile(workbook, outputName);
}

/**
 * Download processed file for long descriptions
 * ONLY the 'description' column is modified, all other columns remain unchanged
 */
export function downloadLongDescFile(data: Product[], columns: string[], fileName: string): void {
  // Build data array with original headers
  const headers = [...columns];
  const rows: (string | number)[][] = [headers];
  const lowerHeaders = headers.map(h => h.toLowerCase());
  const descIdx = lowerHeaders.indexOf('description');

  for (const product of data) {
    const row: (string | number)[] = [];
    for (let i = 0; i < headers.length; i++) {
      if (i === descIdx) {
        // ONLY description column is modified - clean \r characters
        row.push(cleanCellValue(product.description || ''));
      } else {
        // ALL other columns use original values from _originalRow - clean \r characters
        row.push(cleanCellValue(product._originalRow ? (product._originalRow[i] ?? '') : ''));
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
