'use client';

interface ErrorSectionProps {
  message: string;
  onReset: () => void;
}

export function ErrorSection({ message, onReset }: ErrorSectionProps) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="font-semibold text-red-600 dark:text-red-400">Chyba</h3>
      </div>
      <p className="text-sm text-red-600 dark:text-red-400 mb-4">{message}</p>
      <button
        onClick={onReset}
        className="py-2 px-4 border-2 border-red-200 dark:border-red-800 bg-white dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Zkusit znovu
      </button>
    </div>
  );
}
