'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, ReactNode } from 'react';

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="bg-[var(--card-bg)] shadow-[var(--shadow-sm)] border-b border-[var(--border-color)]">
      <div className="max-w-[56rem] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left side - Logo and text */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 logo-gradient rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Shoptet Description Generator
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Automatické generování produktových popisů pomocí AI
            </p>
          </div>
        </div>

        {/* Right side - Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-xl leading-none transition-colors"
          title="Přepnout režim"
        >
          {mounted && (theme === 'dark' ? (
            <span>🌙</span>
          ) : (
            <span>☀️</span>
          ))}
        </button>
      </div>

      {/* Mode Switcher inside header */}
      {children}
    </header>
  );
}
