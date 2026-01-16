'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize with initial value (SSR safe)
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  // Setter function
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Return initial value during SSR, actual value after hydration
  return [isHydrated ? storedValue : initialValue, setValue];
}

// Hook for simple string values
export function useLocalStorageString(key: string, initialValue: string = ''): [string, (value: string) => void] {
  const [value, setValue] = useState<string>(initialValue);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      setValue(stored);
    }
  }, [key]);

  const setAndStore = useCallback((newValue: string) => {
    setValue(newValue);
    localStorage.setItem(key, newValue);
  }, [key]);

  return [value, setAndStore];
}

// Hook for boolean values
export function useLocalStorageBoolean(key: string, initialValue: boolean = false): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      setValue(stored === 'true');
    }
  }, [key]);

  const setAndStore = useCallback((newValue: boolean) => {
    setValue(newValue);
    localStorage.setItem(key, String(newValue));
  }, [key]);

  return [value, setAndStore];
}
