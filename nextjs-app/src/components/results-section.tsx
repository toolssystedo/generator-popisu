'use client';

import type { ShortDescriptionResults, LongDescriptionResults, AppMode } from '@/types';

interface ResultsSectionProps {
  results: ShortDescriptionResults | LongDescriptionResults;
  mode: AppMode;
  onDownload: () => void;
  onPreview: () => void;
  onReset: () => void;
}

export function ResultsSection({
  results,
  mode,
  onDownload,
  onPreview,
  onReset,
}: ResultsSectionProps) {
  const isShortMode = mode === 'short';
  const shortResults = results as ShortDescriptionResults;
  const longResults = results as LongDescriptionResults;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">Zpracovani dokonceno</h3>
      </div>

      {/* Results grid */}
      <div className={`grid gap-4 mb-6 ${isShortMode ? 'grid-cols-3' : 'grid-cols-4'}`}>
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
          <span className="block text-2xl font-bold text-green-600 dark:text-green-400">
            {isShortMode ? shortResults.success + (shortResults.successFromShortOnly || 0) : results.success}
          </span>
          <span className="text-xs text-[var(--text-muted)]">Uspesne</span>
        </div>

        {isShortMode ? (
          <>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <span className="block text-2xl font-bold text-orange-600 dark:text-orange-400">
                {shortResults.skippedEmpty + shortResults.skippedShort + (shortResults.skippedNoInfo || 0)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">Preskoceno</span>
            </div>
          </>
        ) : (
          <>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <span className="block text-2xl font-bold text-orange-600 dark:text-orange-400">{longResults.skipped}</span>
              <span className="text-xs text-[var(--text-muted)]">Preskoceno</span>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <span className="block text-2xl font-bold text-purple-600 dark:text-purple-400">{longResults.withImages}</span>
              <span className="text-xs text-[var(--text-muted)]">S obrazky</span>
            </div>
          </>
        )}

        <div className={`text-center p-3 rounded-lg ${results.errors > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-green-50 dark:bg-green-950/30'}`}>
          <span className={`block text-2xl font-bold ${results.errors > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{results.errors}</span>
          <span className="text-xs text-[var(--text-muted)]">Chyby</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onDownload}
          className="flex-1 py-3 px-6 btn-process text-white rounded-xl text-base font-semibold flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Stahnout vysledek
        </button>
        <button
          onClick={onPreview}
          className="flex-1 py-3 px-6 border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-xl text-base font-semibold flex items-center justify-center gap-2 cursor-pointer hover:border-[var(--brand-green-lighter)] hover:bg-[var(--brand-green-50)] dark:hover:bg-[#2d3d3c] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Nahled zmen
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 px-6 border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-xl text-base font-semibold flex items-center justify-center gap-2 cursor-pointer hover:border-[var(--brand-green-lighter)] hover:bg-[var(--brand-green-50)] dark:hover:bg-[#2d3d3c] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Nove zpracovani
        </button>
      </div>
    </div>
  );
}
