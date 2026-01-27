'use client';

import type { ShortDescriptionStats, LongDescriptionStats, AppMode } from '@/types';

interface FileInfoProps {
  fileName: string;
  stats: ShortDescriptionStats | LongDescriptionStats;
  mode: AppMode;
  onRemove: () => void;
}

export function FileInfo({ fileName, stats, mode, onRemove }: FileInfoProps) {
  const isShortMode = mode === 'short';
  const shortStats = stats as ShortDescriptionStats;
  const longStats = stats as LongDescriptionStats;

  return (
    <div className="border border-[var(--border-color)] rounded-2xl p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {/* File Icon */}
        <div className="w-10 h-10 rounded-lg bg-[var(--brand-green-50)] dark:bg-[#2d3d3c] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[var(--brand-green)] dark:text-[var(--brand-green-lighter)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* File Details */}
        <div className="flex-1">
          <div className="font-semibold text-[var(--text-primary)]">{fileName}</div>
          <div className="text-sm text-[var(--text-muted)]">{stats.total} produktů celkem</div>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer transition-colors hover:bg-red-100 dark:hover:bg-red-950 group"
          title="Odstranit soubor"
        >
          <svg
            className="w-4 h-4 text-[var(--text-muted)] group-hover:text-red-600 dark:group-hover:text-red-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-4 ${isShortMode ? 'grid-cols-4' : 'grid-cols-4'}`}>
        <StatItem label="Celkem" value={stats.total} />

        {isShortMode ? (
          <>
            <StatItem label="S dlouhým popisem" value={shortStats.processable} />
            <StatItem label="Jen s krátkým" value={shortStats.processableFromShort || 0} />
            <StatItem
              label="Ke zpracování"
              value={shortStats.processable + (shortStats.processableFromShort || 0)}
              highlight
            />
          </>
        ) : (
          <>
            <StatItem label="S krátkým popisem" value={longStats.withShortDesc} />
            <StatItem label="S obrázkem" value={longStats.withImage} />
            <StatItem label="Ke zpracování" value={longStats.processable} highlight />
          </>
        )}
      </div>

      {/* Warning for short mode when some products only have short description */}
      {isShortMode && (shortStats.processableFromShort || 0) > 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mt-3">
          {shortStats.processableFromShort} produkt(ů) nemá dlouhý popis - krátký popis bude vylepšen pouze na základě stávajících informací.
        </p>
      )}

      {/* Error when no products can be processed */}
      {isShortMode && shortStats.processable + (shortStats.processableFromShort || 0) === 0 && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-3">
          Žádné produkty nelze zpracovat. Produkty musí mít buď dlouhý popis (100+ znaků) nebo alespoň krátký popis (30+ znaků).
        </p>
      )}

      {!isShortMode && longStats.processable === 0 && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-3">
          Žádné produkty nelze zpracovat. Produkty musí mít název a krátký popis (min. 20 znaků).
        </p>
      )}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  highlight?: boolean;
}

function StatItem({ label, value, highlight }: StatItemProps) {
  return (
    <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
      <span className={`block text-2xl font-bold ${highlight ? 'text-[var(--brand-green)] dark:text-[var(--brand-green-lighter)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </span>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </div>
  );
}
