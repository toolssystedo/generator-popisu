'use client';

import { useState, useCallback } from 'react';
import { useShortDescriptionStore } from '@/stores/short-description-store';
import { FileUpload } from '@/components/file-upload';
import { FileInfo } from '@/components/file-info';
import { SettingsSection } from '@/components/settings-section';
import { ProcessingProgress } from '@/components/processing-progress';
import { ResultsSection } from '@/components/results-section';
import { PreviewModal } from '@/components/preview-modal';
import { ErrorSection } from '@/components/error-section';
import type { ShortDescriptionSettings } from '@/types';

export function ShortDescriptionGenerator() {
  const [settings, setSettings] = useState<ShortDescriptionSettings>({
    justifyText: false,
    addBulletPoints: false,
    useLinkPhrases: false,
    linkPhrases: '',
    tone: 'neutral',
    customToneExample: '',
    autoLinking: {
      enabled: false,
      brandEntries: [],
      categoryEntries: [],
      linkManufacturer: false,
      linkMainCategory: false,
      linkLowestCategory: false,
    },
  });
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    file,
    fileName,
    stats,
    processingState,
    currentProduct,
    totalProducts,
    estimatedTimeRemaining,
    logEntries,
    results,
    previewItems,
    error,
    loadFile,
    resetFile,
    startProcessing,
    cancelProcessing,
    downloadFile,
    reset,
  } = useShortDescriptionStore();

  const handleFileSelect = useCallback((selectedFile: File) => {
    loadFile(selectedFile);
  }, [loadFile]);

  const handleStartProcessing = useCallback(() => {
    startProcessing(settings);
  }, [settings, startProcessing]);

  const handlePreview = useCallback(() => {
    setPreviewOpen(true);
  }, []);

  // Error state
  if (error && processingState !== 'processing') {
    return (
      <ErrorSection message={error} onReset={reset} />
    );
  }

  // Processing state
  if (processingState === 'processing') {
    return (
      <ProcessingProgress
        current={currentProduct}
        total={totalProducts}
        estimatedTimeRemaining={estimatedTimeRemaining}
        logEntries={logEntries}
        onCancel={cancelProcessing}
      />
    );
  }

  // Results state
  if (processingState === 'completed' || processingState === 'cancelled') {
    return (
      <>
        <ResultsSection
          results={results}
          mode="short"
          onDownload={downloadFile}
          onPreview={handlePreview}
          onReset={reset}
        />
        <PreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          items={previewItems}
          mode="short"
        />
      </>
    );
  }

  // Idle state - no file
  if (!file) {
    return (
      <FileUpload onFileSelect={handleFileSelect} />
    );
  }

  // Idle state - file loaded
  return (
    <>
      {stats && (
        <FileInfo
          fileName={fileName}
          stats={stats}
          mode="short"
          onRemove={resetFile}
        />
      )}

      <SettingsSection
        mode="short"
        settings={settings}
        onChange={setSettings}
      />

      {/* Process Button */}
      <button
        onClick={handleStartProcessing}
        disabled={!stats?.processable}
        className="w-full mt-4 py-4 px-6 btn-process text-white rounded-xl text-base font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Spustit generovani ({stats?.processable || 0} produktu)
      </button>
    </>
  );
}
