import type { BrandEntry, CategoryEntry, LinkToInsert, Product } from '@/types';

/**
 * Remove diacritics from text for matching
 */
function removeDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Parse CSV content and return rows
 */
function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Simple CSV parsing - handle quoted values
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ';' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Find column index by name (case-insensitive)
 */
function findColumnIndex(headers: string[], columnName: string): number {
  const normalizedName = columnName.toLowerCase().trim();
  return headers.findIndex(h => h.toLowerCase().trim() === normalizedName);
}

/**
 * Parse CSV file with brands (značky)
 * Expected columns: Name, indexName
 */
export function parseBrandsCsv(content: string): BrandEntry[] {
  const rows = parseCSV(content);
  if (rows.length < 2) return []; // Need at least header + 1 data row

  const headers = rows[0];
  const nameIndex = findColumnIndex(headers, 'Name');
  const indexNameIndex = findColumnIndex(headers, 'indexName');

  if (nameIndex === -1 || indexNameIndex === -1) {
    console.error('[CSV] Brands CSV missing required columns. Found:', headers);
    throw new Error('CSV se značkami musí obsahovat sloupce "Name" a "indexName"');
  }

  const entries: BrandEntry[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIndex]?.trim();
    const indexName = row[indexNameIndex]?.trim();

    if (name && indexName) {
      const normalized = removeDiacritics(name.toLowerCase());
      if (!seen.has(normalized)) {
        seen.add(normalized);
        entries.push({
          name,
          url: `/${indexName}/`,
          nameNormalized: normalized,
        });
      }
    }
  }

  console.log(`[CSV] Parsed ${entries.length} unique brands`);
  return entries;
}

/**
 * Parse CSV file with categories (kategorie)
 * Expected columns: Title, url
 */
export function parseCategoriesCsv(content: string): CategoryEntry[] {
  const rows = parseCSV(content);
  if (rows.length < 2) return []; // Need at least header + 1 data row

  const headers = rows[0];
  const titleIndex = findColumnIndex(headers, 'Title');
  const urlIndex = findColumnIndex(headers, 'url');

  if (titleIndex === -1 || urlIndex === -1) {
    console.error('[CSV] Categories CSV missing required columns. Found:', headers);
    throw new Error('CSV s kategoriemi musí obsahovat sloupce "Title" a "url"');
  }

  const entries: CategoryEntry[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const title = row[titleIndex]?.trim();
    const url = row[urlIndex]?.trim();

    if (title && url) {
      const normalized = removeDiacritics(title.toLowerCase());
      if (!seen.has(normalized)) {
        seen.add(normalized);
        entries.push({
          title,
          url: `/${url}/`,
          titleNormalized: normalized,
        });
      }
    }
  }

  console.log(`[CSV] Parsed ${entries.length} unique categories`);
  // Show first 5 categories for debugging
  console.log('[CSV] Sample categories:', entries.slice(0, 5).map(e => ({ title: e.title, url: e.url, normalized: e.titleNormalized })));
  return entries;
}

/**
 * Read CSV file content
 */
export function readCsvFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Nepodařilo se načíst CSV soubor'));
    reader.readAsText(file);
  });
}

/**
 * Parse categoryText into array of categories
 * "Oblečení > Pánské oblečení > Trička" -> ["Oblečení", "Pánské oblečení", "Trička"]
 */
export function parseCategoryText(categoryText: string | undefined): string[] {
  if (!categoryText) return [];
  return categoryText.split(' > ').map(cat => cat.trim()).filter(Boolean);
}

/**
 * Find matching brand URL for a phrase
 */
function findMatchingBrand(phrase: string, entries: BrandEntry[]): BrandEntry | undefined {
  if (!phrase) return undefined;

  const normalizedPhrase = removeDiacritics(phrase.toLowerCase());

  // Exact match
  const exactMatch = entries.find(e => e.nameNormalized === normalizedPhrase);
  if (exactMatch) return exactMatch;

  // Partial match (phrase is contained in entry or vice versa)
  const partialMatch = entries.find(e =>
    e.nameNormalized.includes(normalizedPhrase) ||
    normalizedPhrase.includes(e.nameNormalized)
  );

  return partialMatch;
}

/**
 * Find matching category URL for a phrase
 */
function findMatchingCategory(phrase: string, entries: CategoryEntry[]): CategoryEntry | undefined {
  if (!phrase) return undefined;

  const normalizedPhrase = removeDiacritics(phrase.toLowerCase().trim());
  console.log('[findMatchingCategory] Searching for:', { phrase, normalized: normalizedPhrase, entriesCount: entries.length });

  // Exact match
  const exactMatch = entries.find(e => e.titleNormalized === normalizedPhrase);
  if (exactMatch) {
    console.log('[findMatchingCategory] EXACT MATCH found:', exactMatch.title);
    return exactMatch;
  }

  // Partial match (phrase is contained in entry or vice versa)
  const partialMatch = entries.find(e =>
    e.titleNormalized.includes(normalizedPhrase) ||
    normalizedPhrase.includes(e.titleNormalized)
  );

  if (partialMatch) {
    console.log('[findMatchingCategory] PARTIAL MATCH found:', partialMatch.title);
  } else {
    // Show some entries for comparison
    console.log('[findMatchingCategory] NO MATCH. Sample entries:', entries.slice(0, 10).map(e => e.titleNormalized));
  }

  return partialMatch;
}

/**
 * Get links to insert for a product based on CSV data and settings
 */
export function getLinksForProduct(
  product: Product,
  brandEntries: BrandEntry[],
  categoryEntries: CategoryEntry[],
  options: {
    linkManufacturer: boolean;
    linkMainCategory: boolean;
    linkLowestCategory: boolean;
  }
): LinkToInsert[] {
  const links: LinkToInsert[] = [];
  const usedPhrases = new Set<string>();

  // Debug logging
  console.log('[AutoLink] Processing product:', {
    name: product.name,
    manufacturer: product.manufacturer,
    categoryText: product.categoryText,
    brandEntriesCount: brandEntries.length,
    categoryEntriesCount: categoryEntries.length,
    options,
  });

  // Link manufacturer (brand)
  if (options.linkManufacturer && product.manufacturer && brandEntries.length > 0) {
    const manufacturerTrimmed = product.manufacturer.trim();
    console.log('[AutoLink] Looking for manufacturer:', manufacturerTrimmed);

    const match = findMatchingBrand(manufacturerTrimmed, brandEntries);
    console.log('[AutoLink] Manufacturer match result:', match ? { name: match.name, url: match.url } : 'NOT FOUND');

    if (match && !usedPhrases.has(match.nameNormalized)) {
      links.push({ phrase: manufacturerTrimmed, url: match.url });
      usedPhrases.add(match.nameNormalized);
    }
  } else {
    console.log('[AutoLink] Skipping manufacturer link:', {
      linkManufacturer: options.linkManufacturer,
      hasManufacturer: !!product.manufacturer,
      brandEntriesCount: brandEntries.length,
    });
  }

  // Parse categories
  const categories = parseCategoryText(product.categoryText);
  console.log('[AutoLink] Parsed categoryText:', {
    raw: product.categoryText,
    parsed: categories,
    mainCategory: categories[0] || 'NONE',
    lowestCategory: categories[categories.length - 1] || 'NONE',
  });

  // Link main category (first)
  if (options.linkMainCategory && categories.length > 0 && categoryEntries.length > 0) {
    const mainCategory = categories[0].trim();
    const normalizedMain = removeDiacritics(mainCategory.toLowerCase());
    console.log('[AutoLink] Looking for main category:', { original: mainCategory, normalized: normalizedMain });

    const match = findMatchingCategory(mainCategory, categoryEntries);
    console.log('[AutoLink] Main category match result:', match ? { title: match.title, url: match.url, normalized: match.titleNormalized } : 'NOT FOUND');

    if (match && !usedPhrases.has(match.titleNormalized)) {
      links.push({ phrase: mainCategory, url: match.url });
      usedPhrases.add(match.titleNormalized);
    }
  } else {
    console.log('[AutoLink] Skipping main category link:', {
      linkMainCategory: options.linkMainCategory,
      categoriesCount: categories.length,
      categoryEntriesCount: categoryEntries.length,
    });
  }

  // Link lowest category (last)
  if (options.linkLowestCategory && categories.length > 0 && categoryEntries.length > 0) {
    const lowestCategory = categories[categories.length - 1].trim();
    const normalizedLowest = removeDiacritics(lowestCategory.toLowerCase());
    console.log('[AutoLink] Looking for lowest category:', { original: lowestCategory, normalized: normalizedLowest });

    // Skip if it's the same as main category
    if (categories.length > 1 || !options.linkMainCategory) {
      const match = findMatchingCategory(lowestCategory, categoryEntries);
      console.log('[AutoLink] Lowest category match result:', match ? { title: match.title, url: match.url, normalized: match.titleNormalized } : 'NOT FOUND');

      if (match && !usedPhrases.has(match.titleNormalized)) {
        links.push({ phrase: lowestCategory, url: match.url });
        usedPhrases.add(match.titleNormalized);
      }
    } else {
      console.log('[AutoLink] Skipping lowest category (same as main or linkMainCategory is false)');
    }
  } else {
    console.log('[AutoLink] Skipping lowest category link:', {
      linkLowestCategory: options.linkLowestCategory,
      categoriesCount: categories.length,
      categoryEntriesCount: categoryEntries.length,
    });
  }

  console.log('[AutoLink] Final links for product:', links);
  return links;
}
