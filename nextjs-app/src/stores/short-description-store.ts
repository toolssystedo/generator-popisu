import { create } from 'zustand';
import type {
  Product,
  ShortDescriptionStats,
  ShortDescriptionResults,
  ShortPreviewItem,
  ShortDescriptionSettings,
  ProcessingState,
} from '@/types';
import {
  readFileForShortDescriptions,
  canProcessProductShort,
  downloadShortDescFile,
  cleanText,
} from '@/lib/excel';
import { generateShortDescription, REQUEST_DELAY } from '@/lib/api/short-description';
import { applyJustifyAlignment, sleep, validateApiKey } from '@/lib/api/anthropic';

interface ShortDescriptionState {
  // File data
  file: File | null;
  fileName: string;
  data: Product[];
  columns: string[];
  stats: ShortDescriptionStats | null;

  // Processing state
  processingState: ProcessingState;
  isCancelled: boolean;
  processedData: Product[];
  currentProduct: number;
  totalProducts: number;

  // Results
  results: ShortDescriptionResults;
  previewItems: ShortPreviewItem[];
  logEntries: Array<{ message: string; type: 'info' | 'success' | 'warning' | 'error' }>;

  // Error
  error: string | null;

  // Estimated time
  estimatedTimeRemaining: number | null;

  // Actions
  loadFile: (file: File) => Promise<void>;
  resetFile: () => void;
  startProcessing: (apiKey: string, settings: ShortDescriptionSettings) => Promise<void>;
  cancelProcessing: () => void;
  downloadFile: () => void;
  reset: () => void;
  addLogEntry: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const initialResults: ShortDescriptionResults = {
  success: 0,
  skippedEmpty: 0,
  skippedShort: 0,
  errors: 0,
};

export const useShortDescriptionStore = create<ShortDescriptionState>((set, get) => ({
  // Initial state
  file: null,
  fileName: '',
  data: [],
  columns: [],
  stats: null,
  processingState: 'idle',
  isCancelled: false,
  processedData: [],
  currentProduct: 0,
  totalProducts: 0,
  results: { ...initialResults },
  previewItems: [],
  logEntries: [],
  error: null,
  estimatedTimeRemaining: null,

  // Load file
  loadFile: async (file: File) => {
    try {
      set({ error: null });
      const result = await readFileForShortDescriptions(file);
      set({
        file,
        fileName: file.name,
        data: result.data,
        columns: result.columns,
        stats: result.stats as ShortDescriptionStats,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Reset file
  resetFile: () => {
    set({
      file: null,
      fileName: '',
      data: [],
      columns: [],
      stats: null,
      processingState: 'idle',
      error: null,
    });
  },

  // Start processing
  startProcessing: async (apiKey: string, settings: ShortDescriptionSettings) => {
    const state = get();

    // Validate API key
    if (!validateApiKey(apiKey)) {
      set({ error: 'Zadejte prosím platný Anthropic API klíč.' });
      return;
    }

    // Validate data
    if (!state.data || state.data.length === 0) {
      set({ error: 'Nejsou načtena žádná data k zpracování.' });
      return;
    }

    // Check if there are any processable products
    if (state.stats?.processable === 0) {
      set({ error: 'Žádné produkty nelze zpracovat. Všechny produkty mají prázdný nebo příliš krátký dlouhý popis.' });
      return;
    }

    // Initialize processing state
    const processedData = JSON.parse(JSON.stringify(state.data)) as Product[];
    set({
      processingState: 'processing',
      isCancelled: false,
      processedData,
      currentProduct: 0,
      totalProducts: state.data.length,
      results: { ...initialResults },
      previewItems: [],
      logEntries: [{ message: 'Připravuji zpracování...', type: 'info' }],
      error: null,
      estimatedTimeRemaining: null,
    });

    const products = processedData;
    const total = products.length;
    let processed = 0;
    const startTime = Date.now();
    const results = { ...initialResults };
    const previewItems: ShortPreviewItem[] = [];

    for (let i = 0; i < products.length; i++) {
      // Check if cancelled
      if (get().isCancelled) {
        get().addLogEntry('Zpracování zrušeno uživatelem.', 'warning');
        break;
      }

      const product = products[i];
      const productName = product.name || `Produkt ${i + 1}`;
      const productCode = product.code || '';

      // Update progress
      set({ currentProduct: i + 1 });
      get().addLogEntry(`Zpracovávám: ${productName}`, 'info');

      // Check if product can be processed
      const checkResult = canProcessProductShort(product);

      if (!checkResult.canProcess) {
        if (checkResult.reason === 'empty') {
          results.skippedEmpty++;
          get().addLogEntry(`Přeskočeno (prázdný popis): ${productCode} - ${productName}`, 'warning');
        } else if (checkResult.reason === 'short') {
          results.skippedShort++;
          get().addLogEntry(`Přeskočeno (krátký popis <100 znaků): ${productCode} - ${productName}`, 'warning');
        }
        processed++;
        set({ results: { ...results } });
        continue;
      }

      // Generate description via API
      const result = await generateShortDescription(
        productName,
        product.description,
        product.shortDescription || '',
        apiKey,
        settings,
        (waitSeconds, attempt, maxAttempts) => {
          get().addLogEntry(`Rate limit - čekám ${waitSeconds}s (pokus ${attempt}/${maxAttempts})...`, 'warning');
        }
      );

      if (result.success && result.description) {
        // Apply justify alignment if enabled
        let finalDescription = result.description;
        if (settings.justifyText) {
          finalDescription = applyJustifyAlignment(finalDescription);
        }

        // Clean the generated description
        finalDescription = cleanText(finalDescription);

        // Update product with new short description
        products[i].shortDescription = finalDescription;
        results.success++;
        get().addLogEntry(`Úspěšně zpracováno: ${productCode} - ${productName}`, 'success');

        // Add to preview (max 10 items)
        if (previewItems.length < 10) {
          previewItems.push({
            code: productCode,
            name: productName,
            longDescription: product.description,
            shortDescription: finalDescription,
          });
        }
      } else {
        results.errors++;
        get().addLogEntry(`Chyba: ${productCode} - ${productName}: ${result.error}`, 'error');

        // Check for authentication error - stop processing
        if (result.error?.includes('Neplatný API klíč')) {
          set({ error: result.error, processingState: 'error' });
          return;
        }
      }

      processed++;
      set({ results: { ...results }, previewItems: [...previewItems] });

      // Update estimated time
      const elapsed = Date.now() - startTime;
      const avgTime = elapsed / processed;
      const remaining = (total - processed) * avgTime / 1000;
      set({ estimatedTimeRemaining: remaining });

      // Add delay between requests
      if (i < products.length - 1 && !get().isCancelled) {
        await sleep(REQUEST_DELAY);
      }
    }

    // Processing complete
    set({
      processingState: get().isCancelled ? 'cancelled' : 'completed',
      processedData: products,
    });
  },

  // Cancel processing
  cancelProcessing: () => {
    set({ isCancelled: true });
    get().addLogEntry('Rušení zpracování...', 'warning');
  },

  // Download file
  downloadFile: () => {
    const state = get();
    if (!state.processedData || state.processedData.length === 0) {
      set({ error: 'Žádná data k stažení.' });
      return;
    }
    downloadShortDescFile(state.processedData, state.columns, state.fileName);
  },

  // Reset
  reset: () => {
    set({
      file: null,
      fileName: '',
      data: [],
      columns: [],
      stats: null,
      processingState: 'idle',
      isCancelled: false,
      processedData: [],
      currentProduct: 0,
      totalProducts: 0,
      results: { ...initialResults },
      previewItems: [],
      logEntries: [],
      error: null,
      estimatedTimeRemaining: null,
    });
  },

  // Add log entry
  addLogEntry: (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    set(state => {
      const entries = [...state.logEntries, { message, type }];
      // Keep only last 50 entries
      if (entries.length > 50) {
        entries.shift();
      }
      return { logEntries: entries };
    });
  },
}));
