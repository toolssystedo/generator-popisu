'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { AppMode } from '@/types';

interface ModeSwitcherProps {
  onChange?: (mode: AppMode) => void;
}

export function ModeSwitcher({ onChange }: ModeSwitcherProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setModeState] = useState<AppMode>('short');

  // Initialize mode from URL or localStorage
  useEffect(() => {
    const urlMode = searchParams.get('mode') as AppMode | null;
    if (urlMode === 'short' || urlMode === 'long') {
      setModeState(urlMode);
    } else {
      const storedMode = localStorage.getItem('generator_mode') as AppMode | null;
      setModeState(storedMode || 'short');
    }
  }, [searchParams]);

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem('generator_mode', newMode);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', newMode);
    router.push(`${pathname}?${params.toString()}`);

    if (onChange) {
      onChange(newMode);
    }
  }, [searchParams, router, pathname, onChange]);

  return (
    <div className="flex justify-center gap-2 py-3 px-6 pb-4 max-w-[56rem] mx-auto">
      <button
        onClick={() => setMode('short')}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl text-[0.9375rem] font-medium cursor-pointer
          transition-all duration-200 ease-in-out border-2
          ${mode === 'short'
            ? 'border-[var(--brand-green)] bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-light)] hover:border-[var(--brand-green-light)]'
            : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[var(--brand-green-lighter)] hover:bg-[var(--brand-green-50)] hover:text-[var(--text-secondary)]'
          }
        `}
      >
        <span className="text-lg">📝</span>
        <span className="font-semibold">Krátké popisy</span>
      </button>
      <button
        onClick={() => setMode('long')}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl text-[0.9375rem] font-medium cursor-pointer
          transition-all duration-200 ease-in-out border-2
          ${mode === 'long'
            ? 'border-[var(--brand-green)] bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-light)] hover:border-[var(--brand-green-light)]'
            : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[var(--brand-green-lighter)] hover:bg-[var(--brand-green-50)] hover:text-[var(--text-secondary)]'
          }
        `}
      >
        <span className="text-lg">📄</span>
        <span className="font-semibold">Dlouhé popisy</span>
      </button>
    </div>
  );
}

// Hook to get current mode
export function useMode(): AppMode {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AppMode>('short');

  useEffect(() => {
    const urlMode = searchParams.get('mode') as AppMode | null;
    if (urlMode === 'short' || urlMode === 'long') {
      setMode(urlMode);
    } else {
      const storedMode = localStorage.getItem('generator_mode') as AppMode | null;
      setMode(storedMode || 'short');
    }
  }, [searchParams]);

  return mode;
}
