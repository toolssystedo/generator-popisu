'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ShortDescriptionSettings, LongDescriptionSettings, ToneOption, ImageLayoutOption, LeftoverImagesOption, BrandEntry, CategoryEntry } from '@/types';
import { parseBrandsCsv, parseCategoriesCsv, readCsvFile } from '@/lib/sitemap';

interface ShortSettingsProps {
  mode: 'short';
  settings: ShortDescriptionSettings;
  onChange: (settings: ShortDescriptionSettings) => void;
}

interface LongSettingsProps {
  mode: 'long';
  settings: LongDescriptionSettings;
  onChange: (settings: LongDescriptionSettings) => void;
}

type SettingsSectionProps = ShortSettingsProps | LongSettingsProps;

const toneOptions: { value: ToneOption; label: string; description: string }[] = [
  { value: 'neutral', label: 'Neutrální', description: 'Vyvážený, informativní styl' },
  { value: 'professional', label: 'Profesionální', description: 'Formální, odborný tón' },
  { value: 'funny', label: 'Vtipný', description: 'Lehký, zábavný přístup' },
  { value: 'custom', label: 'Vlastní', description: 'Převzít styl z ukázky' },
];

const imageLayoutOptions: { value: ImageLayoutOption; label: string; description: string }[] = [
  { value: 1, label: '1 obrázek na řádek', description: 'šířka 100%' },
  { value: 2, label: '2 obrázky na řádek', description: 'šířka 50%' },
  { value: 3, label: '3 obrázky na řádek', description: 'šířka 33%' },
];

const leftoverImagesOptions: { value: LeftoverImagesOption; label: string }[] = [
  { value: 'skip', label: 'Nevkládat přebytečné obrázky' },
  { value: 'spaced', label: 'Vložit přebytečné obrázky s rozestupem' },
];

export function SettingsSection(props: SettingsSectionProps) {
  const { mode, settings, onChange } = props;
  const isShortMode = mode === 'short';

  // State for CSV loading
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const prefix = isShortMode ? '' : 'long_';
    const storedJustify = localStorage.getItem(`${prefix}justify_text`) === 'true';
    const storedTone = (localStorage.getItem(`${prefix}tone_selection`) || 'neutral') as ToneOption;
    const storedCustomTone = localStorage.getItem(`${prefix}custom_tone_example`) || '';
    if (isShortMode) {
      const storedBulletPoints = localStorage.getItem('add_bullet_points') === 'true';
      const storedLinkManufacturer = localStorage.getItem('short_link_manufacturer') !== 'false';
      const storedLinkMainCategory = localStorage.getItem('short_link_main_category') !== 'false';
      const storedLinkLowestCategory = localStorage.getItem('short_link_lowest_category') !== 'false';
      (onChange as (s: ShortDescriptionSettings) => void)({
        justifyText: storedJustify,
        addBulletPoints: storedBulletPoints,
        tone: storedTone,
        customToneExample: storedCustomTone,
        autoLinking: {
          enabled: false,
          brandEntries: [],
          categoryEntries: [],
          linkManufacturer: storedLinkManufacturer,
          linkMainCategory: storedLinkMainCategory,
          linkLowestCategory: storedLinkLowestCategory,
        },
      });
    } else {
      const storedAddImages = localStorage.getItem('long_add_images') === 'true';
      const storedImageLayout = parseInt(localStorage.getItem('long_image_layout') || '1', 10) as ImageLayoutOption;
      const storedLeftoverImages = (localStorage.getItem('long_leftover_images') || 'spaced') as LeftoverImagesOption;
      const storedLinkManufacturer = localStorage.getItem('long_link_manufacturer') !== 'false';
      const storedLinkMainCategory = localStorage.getItem('long_link_main_category') !== 'false';
      const storedLinkLowestCategory = localStorage.getItem('long_link_lowest_category') !== 'false';
      (onChange as (s: LongDescriptionSettings) => void)({
        justifyText: storedJustify,
        addImages: storedAddImages,
        imageLayout: storedImageLayout,
        leftoverImages: storedLeftoverImages,
        tone: storedTone,
        customToneExample: storedCustomTone,
        autoLinking: {
          enabled: false,
          brandEntries: [],
          categoryEntries: [],
          linkManufacturer: storedLinkManufacturer,
          linkMainCategory: storedLinkMainCategory,
          linkLowestCategory: storedLinkLowestCategory,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Save to localStorage on change
  const updateSetting = <K extends keyof ShortDescriptionSettings | keyof LongDescriptionSettings>(
    key: K,
    value: (ShortDescriptionSettings & LongDescriptionSettings)[K]
  ) => {
    const prefix = isShortMode ? '' : 'long_';
    const storageKey = key === 'addBulletPoints' ? 'add_bullet_points'
      : key === 'addImages' ? 'long_add_images'
      : key === 'imageLayout' ? 'long_image_layout'
      : key === 'leftoverImages' ? 'long_leftover_images'
      : key === 'tone' ? `${prefix}tone_selection`
      : key === 'customToneExample' ? `${prefix}custom_tone_example`
      : `${prefix}justify_text`;

    localStorage.setItem(storageKey, String(value));

    if (isShortMode) {
      (onChange as (s: ShortDescriptionSettings) => void)({
        ...(settings as ShortDescriptionSettings),
        [key]: value,
      });
    } else {
      (onChange as (s: LongDescriptionSettings) => void)({
        ...(settings as LongDescriptionSettings),
        [key]: value,
      });
    }
  };

  // Update auto-linking settings (both modes)
  const updateAutoLinking = useCallback((updates: Partial<ShortDescriptionSettings['autoLinking']>) => {
    const prefix = isShortMode ? 'short_' : 'long_';
    const currentSettings = settings as (ShortDescriptionSettings | LongDescriptionSettings);
    const newAutoLinking = { ...currentSettings.autoLinking, ...updates };

    // Save checkbox states to localStorage
    if ('linkManufacturer' in updates) {
      localStorage.setItem(`${prefix}link_manufacturer`, String(updates.linkManufacturer));
    }
    if ('linkMainCategory' in updates) {
      localStorage.setItem(`${prefix}link_main_category`, String(updates.linkMainCategory));
    }
    if ('linkLowestCategory' in updates) {
      localStorage.setItem(`${prefix}link_lowest_category`, String(updates.linkLowestCategory));
    }

    if (isShortMode) {
      (onChange as (s: ShortDescriptionSettings) => void)({
        ...(currentSettings as ShortDescriptionSettings),
        autoLinking: newAutoLinking,
      });
    } else {
      (onChange as (s: LongDescriptionSettings) => void)({
        ...(currentSettings as LongDescriptionSettings),
        autoLinking: newAutoLinking,
      });
    }
  }, [isShortMode, settings, onChange]);

  // Handle brands CSV file upload
  const handleBrandsFile = useCallback(async (file: File) => {
    setBrandsLoading(true);
    setBrandsError(null);
    try {
      const content = await readCsvFile(file);
      const entries = parseBrandsCsv(content);
      if (entries.length === 0) {
        setBrandsError('CSV neobsahuje žádné platné značky.');
      } else {
        updateAutoLinking({
          enabled: true,
          brandEntries: entries,
          // Keep linkManufacturer enabled when brands are loaded
          linkManufacturer: true,
        });
      }
    } catch (err) {
      setBrandsError((err as Error).message);
    } finally {
      setBrandsLoading(false);
    }
  }, [updateAutoLinking]);

  // Handle categories CSV file upload
  const handleCategoriesFile = useCallback(async (file: File) => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const content = await readCsvFile(file);
      const entries = parseCategoriesCsv(content);
      if (entries.length === 0) {
        setCategoriesError('CSV neobsahuje žádné platné kategorie.');
      } else {
        updateAutoLinking({
          enabled: true,
          categoryEntries: entries,
          // Keep category linking enabled when categories are loaded
          linkMainCategory: true,
          linkLowestCategory: true,
        });
      }
    } catch (err) {
      setCategoriesError((err as Error).message);
    } finally {
      setCategoriesLoading(false);
    }
  }, [updateAutoLinking]);

  // Clear brands CSV
  const clearBrands = useCallback(() => {
    const currentSettings = settings as (ShortDescriptionSettings | LongDescriptionSettings);
    const hasCategories = (currentSettings.autoLinking?.categoryEntries?.length || 0) > 0;
    updateAutoLinking({
      brandEntries: [],
      linkManufacturer: false,
      enabled: hasCategories, // Keep enabled if categories still loaded
    });
    setBrandsError(null);
  }, [updateAutoLinking, settings]);

  // Clear categories CSV
  const clearCategories = useCallback(() => {
    const currentSettings = settings as (ShortDescriptionSettings | LongDescriptionSettings);
    const hasBrands = (currentSettings.autoLinking?.brandEntries?.length || 0) > 0;
    updateAutoLinking({
      categoryEntries: [],
      linkMainCategory: false,
      linkLowestCategory: false,
      enabled: hasBrands, // Keep enabled if brands still loaded
    });
    setCategoriesError(null);
  }, [updateAutoLinking, settings]);

  return (
    <div className="space-y-4">
      {/* Formatting Settings */}
      <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] mb-3">
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Nastavení formátování
        </h4>

        <div className="flex flex-col gap-2">
          {/* Justify Text */}
          <label className="flex flex-wrap items-center gap-2 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg cursor-pointer transition-colors hover:border-[var(--brand-green-lighter)] hover:bg-[var(--brand-green-50)] dark:hover:bg-[#2d3d3c]">
            <input
              type="checkbox"
              checked={settings.justifyText}
              onChange={(e) => updateSetting('justifyText', e.target.checked)}
              className="accent-[var(--brand-green)]"
            />
            <span className="font-medium text-[var(--text-secondary)]">Zarovnat text do bloku</span>
            <span className="text-sm text-[var(--text-muted)]">(justify)</span>
          </label>

          {/* Mode-specific option */}
          {isShortMode ? (
            <label className="flex flex-wrap items-center gap-2 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg cursor-pointer transition-colors hover:border-[var(--brand-green-lighter)] hover:bg-[var(--brand-green-50)] dark:hover:bg-[#2d3d3c]">
              <input
                type="checkbox"
                checked={(settings as ShortDescriptionSettings).addBulletPoints}
                onChange={(e) => updateSetting('addBulletPoints', e.target.checked)}
                className="accent-[var(--brand-green)]"
              />
              <span className="font-medium text-[var(--text-secondary)]">Pridat odrazky s benefity</span>
              <span className="text-sm text-[var(--text-muted)]">(3-4 body)</span>
            </label>
          ) : (
            <>
              <label className="flex flex-wrap items-center gap-2 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg cursor-pointer transition-colors hover:border-[var(--brand-green-lighter)] hover:bg-[var(--brand-green-50)] dark:hover:bg-[#2d3d3c]">
                <input
                  type="checkbox"
                  checked={(settings as LongDescriptionSettings).addImages}
                  onChange={(e) => updateSetting('addImages', e.target.checked)}
                  className="accent-[var(--brand-green)]"
                />
                <span className="font-medium text-[var(--text-secondary)]">Vlozit obrazky produktu</span>
                <span className="text-sm text-[var(--text-muted)]">(pokud jsou dostupne)</span>
              </label>

              {/* Image Layout Options - only visible when addImages is checked */}
              {(settings as LongDescriptionSettings).addImages && (
                <div className="ml-6 mt-2 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Rozložení obrázků:</p>
                  <div className="flex flex-col gap-2">
                    {imageLayoutOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer text-sm"
                      >
                        <input
                          type="radio"
                          name="imageLayout"
                          value={option.value}
                          checked={(settings as LongDescriptionSettings).imageLayout === option.value}
                          onChange={() => updateSetting('imageLayout', option.value)}
                          className="accent-[var(--brand-green)]"
                        />
                        <span className="text-[var(--text-secondary)]">{option.label}</span>
                        <span className="text-[var(--text-muted)]">({option.description})</span>
                      </label>
                    ))}
                  </div>

                  {/* Leftover Images Options - only when layout is 2 or 3 */}
                  {(settings as LongDescriptionSettings).imageLayout > 1 && (
                    <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
                      <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Co dělat s neúplnými řádky obrázků?</p>
                      <div className="flex flex-col gap-2">
                        {leftoverImagesOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 cursor-pointer text-sm"
                          >
                            <input
                              type="radio"
                              name="leftoverImages"
                              value={option.value}
                              checked={(settings as LongDescriptionSettings).leftoverImages === option.value}
                              onChange={() => updateSetting('leftoverImages', option.value)}
                              className="accent-[var(--brand-green)]"
                            />
                            <span className="text-[var(--text-secondary)]">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tone Section */}
      <div className="pt-4 border-t border-[var(--border-color)]">
        <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Ton popisu</h4>
        <div className="flex flex-col gap-2">
          {toneOptions.map((option) => (
            <label
              key={option.value}
              className="flex flex-wrap items-center gap-2 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg cursor-pointer transition-colors hover:border-[var(--brand-green-lighter)] hover:bg-[var(--brand-green-50)] dark:hover:bg-[#2d3d3c]"
            >
              <input
                type="radio"
                name="tone"
                value={option.value}
                checked={settings.tone === option.value}
                onChange={(e) => updateSetting('tone', e.target.value as ToneOption)}
                className="accent-[var(--brand-green)]"
              />
              <span className="font-medium text-[var(--text-secondary)]">{option.label}</span>
              <span className="text-sm text-[var(--text-muted)]">{option.description}</span>
            </label>
          ))}
        </div>

        {/* Custom Tone Textarea */}
        {settings.tone === 'custom' && (
          <div className="mt-3 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Ukazkovy text pro prevzeti stylu:
            </label>
            <textarea
              value={settings.customToneExample}
              onChange={(e) => updateSetting('customToneExample', e.target.value)}
              placeholder="Vlozte ukazkovy text, jehoz styl ma AI prevzit..."
              className="w-full min-h-24 p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] resize-y focus:outline-none focus:border-[var(--brand-green)] focus-brand"
            />
          </div>
        )}
      </div>

      {/* Auto-Linking Section */}
      <div className="pt-4 border-t border-[var(--border-color)]">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] mb-3">
          <svg className="w-5 h-5 text-[var(--brand-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Automaticke prolinkovani (CSV)
        </h4>

        <div className="space-y-4">
          {/* Brands CSV Upload */}
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">CSV se znackami (volitelne)</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">Nahrajte CSV export znacek ze Shoptetu</p>

            {(settings.autoLinking?.brandEntries?.length || 0) === 0 ? (
              <>
                <div
                  className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-4 text-center cursor-pointer hover:border-[var(--brand-green)] transition-colors"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    if (file && file.name.endsWith('.csv')) {
                      handleBrandsFile(file);
                    } else {
                      setBrandsError('Nahrajte prosim CSV soubor');
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleBrandsFile(file);
                    };
                    input.click();
                  }}
                >
                  <svg className="w-6 h-6 mx-auto mb-2 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {brandsLoading ? 'Nacitam...' : 'Pretahni CSV nebo klikni'}
                  </p>
                </div>
                {brandsError && (
                  <p className="mt-2 text-sm text-red-500">{brandsError}</p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--brand-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Nacteno {settings.autoLinking?.brandEntries?.length || 0} znacek
                  </span>
                </div>
                <button
                  onClick={clearBrands}
                  className="text-sm text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  Odebrat
                </button>
              </div>
            )}
          </div>

          {/* Categories CSV Upload */}
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">CSV s kategoriemi (volitelne)</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">Nahrajte CSV export kategorii ze Shoptetu</p>

            {(settings.autoLinking?.categoryEntries?.length || 0) === 0 ? (
              <>
                <div
                  className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-4 text-center cursor-pointer hover:border-[var(--brand-green)] transition-colors"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    if (file && file.name.endsWith('.csv')) {
                      handleCategoriesFile(file);
                    } else {
                      setCategoriesError('Nahrajte prosim CSV soubor');
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleCategoriesFile(file);
                    };
                    input.click();
                  }}
                >
                  <svg className="w-6 h-6 mx-auto mb-2 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {categoriesLoading ? 'Nacitam...' : 'Pretahni CSV nebo klikni'}
                  </p>
                </div>
                {categoriesError && (
                  <p className="mt-2 text-sm text-red-500">{categoriesError}</p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--brand-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Nacteno {settings.autoLinking?.categoryEntries?.length || 0} kategorii
                  </span>
                </div>
                <button
                  onClick={clearCategories}
                  className="text-sm text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  Odebrat
                </button>
              </div>
            )}
          </div>

          {/* Linking Options */}
          <div className="p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-3">Co linkovat:</p>

            <div className="space-y-2">
              <label className={`flex items-center gap-2 ${(settings.autoLinking?.brandEntries?.length || 0) === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={settings.autoLinking?.linkManufacturer ?? false}
                  onChange={(e) => updateAutoLinking({ linkManufacturer: e.target.checked })}
                  disabled={(settings.autoLinking?.brandEntries?.length || 0) === 0}
                  className="accent-[var(--brand-green)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">Linkovat znacku</span>
                <span className="text-xs text-[var(--text-muted)]">(sloupec manufacturer)</span>
              </label>

              <label className={`flex items-center gap-2 ${(settings.autoLinking?.categoryEntries?.length || 0) === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={settings.autoLinking?.linkMainCategory ?? false}
                  onChange={(e) => updateAutoLinking({ linkMainCategory: e.target.checked })}
                  disabled={(settings.autoLinking?.categoryEntries?.length || 0) === 0}
                  className="accent-[var(--brand-green)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">Linkovat hlavni kategorii</span>
                <span className="text-xs text-[var(--text-muted)]">(prvni polozka z categoryText)</span>
              </label>

              <label className={`flex items-center gap-2 ${(settings.autoLinking?.categoryEntries?.length || 0) === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={settings.autoLinking?.linkLowestCategory ?? false}
                  onChange={(e) => updateAutoLinking({ linkLowestCategory: e.target.checked })}
                  disabled={(settings.autoLinking?.categoryEntries?.length || 0) === 0}
                  className="accent-[var(--brand-green)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">Linkovat nejnizsi podkategorii</span>
                <span className="text-xs text-[var(--text-muted)]">(posledni polozka z categoryText)</span>
              </label>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Odkazy budou automaticky vlozeny do popisu na zaklade dat z produktu a CSV souboru.
        </p>
      </div>
    </div>
  );
}
