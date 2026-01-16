'use client';

import { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return validExtensions.includes(fileExtension);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      } else {
        alert('Neplatný formát souboru. Nahrajte prosím soubor ve formátu .xlsx nebo .xls');
      }
    }
  }, [disabled, onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        onFileSelect(file);
      } else {
        alert('Neplatný formát souboru. Nahrajte prosím soubor ve formátu .xlsx nebo .xls');
      }
    }
  }, [onFileSelect]);

  const handleClick = () => {
    if (!disabled) {
      document.getElementById('file-input')?.click();
    }
  };

  return (
    <div
      className={`
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-300 ease-in-out
        ${isDragging
          ? 'border-[var(--brand-green)] bg-[var(--brand-green-50)] dark:bg-[#2d3d3c] scale-[1.02]'
          : 'border-[var(--border-color)] hover:border-[var(--brand-green-lighter)] hover:bg-[var(--bg-secondary)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Icon */}
      <div className="w-20 h-20 mx-auto mb-4 rounded-full upload-icon-gradient flex items-center justify-center">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-[var(--text-secondary)] mb-1">
        {isDragging ? 'Pusťte soubor zde' : 'Přetáhněte sem Excel soubor'}
      </h3>

      {/* Subtitle */}
      <p className="text-[var(--text-muted)]">
        nebo{' '}
        <span className="text-[var(--brand-green)] dark:text-[var(--brand-green-lighter)] font-medium cursor-pointer hover:underline">
          klikněte pro výběr
        </span>
      </p>

      {/* Formats */}
      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[var(--text-muted)]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>Podporované formáty: .xlsx, .xls</span>
      </div>
    </div>
  );
}
