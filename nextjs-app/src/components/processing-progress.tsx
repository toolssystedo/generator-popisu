'use client';

import { useEffect, useRef } from 'react';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ProcessingProgressProps {
  current: number;
  total: number;
  estimatedTimeRemaining: number | null;
  logEntries: LogEntry[];
  onCancel: () => void;
}

export function ProcessingProgress({
  current,
  total,
  estimatedTimeRemaining,
  logEntries,
  onCancel,
}: ProcessingProgressProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `~${Math.ceil(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `~${minutes}m ${secs}s`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 border-2 border-[var(--brand-green)] border-t-transparent rounded-full animate-spin"></div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Zpracovani produktu</h3>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold text-[var(--text-primary)]">{percent}%</span>
          <span className="text-[var(--text-muted)]">
            {current} / {total} produktu
            {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
              <span className="ml-2">({formatTime(estimatedTimeRemaining)} zbyva)</span>
            )}
          </span>
        </div>
        <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <div
            className="h-full progress-gradient rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Log */}
      <div
        ref={logRef}
        className="h-48 overflow-y-auto rounded-xl bg-[var(--bg-secondary)] p-3 font-mono text-xs custom-scrollbar"
      >
        {logEntries.map((entry, index) => (
          <p
            key={index}
            className={`mb-1 ${
              entry.type === 'success'
                ? 'text-green-600 dark:text-green-400'
                : entry.type === 'warning'
                ? 'text-orange-600 dark:text-orange-400'
                : entry.type === 'error'
                ? 'text-red-600 dark:text-red-400'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {entry.message}
          </p>
        ))}
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="w-full mt-4 py-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl text-base font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
        Zrusit zpracovani
      </button>
    </div>
  );
}
