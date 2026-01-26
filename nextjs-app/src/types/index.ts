// Product types
export interface Product {
  code: string;
  name: string;
  description: string;
  shortDescription: string;
  image?: string;
  // Additional columns for auto-linking
  manufacturer?: string;
  categoryText?: string;
  // Combined images from all image columns (image, image2, image3...) for processing only
  _allImages?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _originalRow?: any[];
}

// Brand entry from CSV (značky)
export interface BrandEntry {
  name: string;           // Name column - brand name (e.g., "Fila")
  url: string;            // indexName column converted to URL (e.g., "/filatest/")
  nameNormalized: string; // lowercase without diacritics for matching
}

// Category entry from CSV (kategorie)
export interface CategoryEntry {
  title: string;          // Title column - category name (e.g., "Do obýváku")
  url: string;            // url column converted to URL (e.g., "/do-obyvaku/")
  titleNormalized: string; // lowercase without diacritics for matching
}

// Auto-linking settings
export interface AutoLinkingSettings {
  enabled: boolean;
  brandEntries: BrandEntry[];
  categoryEntries: CategoryEntry[];
  linkManufacturer: boolean;
  linkMainCategory: boolean;
  linkLowestCategory: boolean;
}

// Link to insert into description
export interface LinkToInsert {
  phrase: string;
  url: string;
}

// Statistics for short description mode
export interface ShortDescriptionStats {
  total: number;
  withDescription: number;
  processable: number;
  emptyDescription: number;
  shortDescription: number;
}

// Statistics for long description mode
export interface LongDescriptionStats {
  total: number;
  withShortDesc: number;
  withImage: number;
  processable: number;
}

// Processing results for short descriptions
export interface ShortDescriptionResults {
  success: number;
  skippedEmpty: number;
  skippedShort: number;
  errors: number;
}

// Processing results for long descriptions
export interface LongDescriptionResults {
  success: number;
  skipped: number;
  errors: number;
  avgLength: number;
  withImages: number;
}

// Preview item for short descriptions
export interface ShortPreviewItem {
  code: string;
  name: string;
  longDescription: string;
  shortDescription: string;
}

// Preview item for long descriptions
export interface LongPreviewItem {
  code: string;
  name: string;
  originalDescription: string;
  newDescription: string;
}

// Tone options
export type ToneOption = 'neutral' | 'professional' | 'funny' | 'custom';

// Image layout options
export type ImageLayoutOption = 1 | 2 | 3;

// Leftover images handling options
export type LeftoverImagesOption = 'skip' | 'spaced';

// Settings for short description generation
export interface ShortDescriptionSettings {
  justifyText: boolean;
  addBulletPoints: boolean;
  useLinkPhrases: boolean;
  linkPhrases: string;
  tone: ToneOption;
  customToneExample: string;
  // Auto-linking settings
  autoLinking: AutoLinkingSettings;
}

// Settings for long description generation
export interface LongDescriptionSettings {
  justifyText: boolean;
  addImages: boolean;
  imageLayout: ImageLayoutOption;
  leftoverImages: LeftoverImagesOption;
  tone: ToneOption;
  customToneExample: string;
  // Auto-linking settings
  autoLinking: AutoLinkingSettings;
}

// API response
export interface APIResponse {
  success: boolean;
  description?: string;
  error?: string;
}

// File read result
export interface FileReadResult {
  data: Product[];
  columns: string[];
  stats: ShortDescriptionStats | LongDescriptionStats;
}

// Application mode
export type AppMode = 'short' | 'long';

// Processing state
export type ProcessingState = 'idle' | 'processing' | 'completed' | 'error' | 'cancelled';
