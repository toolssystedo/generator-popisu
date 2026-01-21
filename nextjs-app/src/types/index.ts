// Product types
export interface Product {
  code: string;
  name: string;
  description: string;
  shortDescription: string;
  image?: string;
  // Combined images from all image columns (image, image2, image3...) for processing only
  _allImages?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _originalRow?: any[];
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

// Settings for short description generation
export interface ShortDescriptionSettings {
  justifyText: boolean;
  addBulletPoints: boolean;
  useLinkPhrases: boolean;
  linkPhrases: string;
  tone: ToneOption;
  customToneExample: string;
}

// Settings for long description generation
export interface LongDescriptionSettings {
  justifyText: boolean;
  addImages: boolean;
  imageLayout: ImageLayoutOption;
  useLinkPhrases: boolean;
  linkPhrases: string;
  tone: ToneOption;
  customToneExample: string;
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
