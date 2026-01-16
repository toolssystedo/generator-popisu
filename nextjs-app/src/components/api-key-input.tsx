'use client';

import { useState, useEffect } from 'react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [saveKey, setSaveKey] = useState(false);

  // Load saved key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('anthropic_api_key');
    if (savedKey) {
      onChange(savedKey);
      setSaveKey(true);
    }
  }, [onChange]);

  // Handle save checkbox change
  const handleSaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSaveKey(checked);
    if (checked && value) {
      localStorage.setItem('anthropic_api_key', value);
    } else if (!checked) {
      localStorage.removeItem('anthropic_api_key');
    }
  };

  // Handle key input change
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (saveKey && newValue) {
      localStorage.setItem('anthropic_api_key', newValue);
    }
  };

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="flex items-center gap-2 font-medium text-[var(--text-secondary)] mb-2">
        <svg
          className="w-5 h-5 text-[var(--brand-green)] dark:text-[var(--brand-green-lighter)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        Anthropic API klíč
      </label>

      {/* Input Wrapper */}
      <div className="relative mb-2">
        <input
          type={showKey ? 'text' : 'password'}
          placeholder="sk-ant-..."
          value={value}
          onChange={handleKeyChange}
          className="w-full px-4 py-3 pr-12 border border-[var(--border-color)] rounded-xl text-base bg-[var(--bg-secondary)] text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--brand-green)] focus-brand"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          {showKey ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Options */}
      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={saveKey}
            onChange={handleSaveChange}
            className="accent-[var(--brand-green)]"
          />
          Zapamatovat klíč v prohlížeči
        </label>

        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--brand-green)] dark:text-[var(--brand-green-lighter)] no-underline hover:underline"
        >
          Získat API klíč
        </a>
      </div>
    </div>
  );
}
