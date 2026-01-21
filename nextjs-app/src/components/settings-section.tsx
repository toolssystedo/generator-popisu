'use client';

import { useEffect } from 'react';
import type { ShortDescriptionSettings, LongDescriptionSettings, AppMode, ToneOption, ImageLayoutOption } from '@/types';

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

export function SettingsSection(props: SettingsSectionProps) {
  const { mode, settings, onChange } = props;
  const isShortMode = mode === 'short';

  // Load settings from localStorage on mount
  useEffect(() => {
    const prefix = isShortMode ? '' : 'long_';
    const storedJustify = localStorage.getItem(`${prefix}justify_text`) === 'true';
    const storedTone = (localStorage.getItem(`${prefix}tone_selection`) || 'neutral') as ToneOption;
    const storedCustomTone = localStorage.getItem(`${prefix}custom_tone_example`) || '';
    const storedUseLinkPhrases = localStorage.getItem(`${prefix}use_link_phrases`) === 'true';
    const storedLinkPhrases = localStorage.getItem(`${prefix}link_phrases`) || '';

    if (isShortMode) {
      const storedBulletPoints = localStorage.getItem('add_bullet_points') === 'true';
      (onChange as (s: ShortDescriptionSettings) => void)({
        justifyText: storedJustify,
        addBulletPoints: storedBulletPoints,
        useLinkPhrases: storedUseLinkPhrases,
        linkPhrases: storedLinkPhrases,
        tone: storedTone,
        customToneExample: storedCustomTone,
      });
    } else {
      const storedAddImages = localStorage.getItem('long_add_images') === 'true';
      const storedImageLayout = parseInt(localStorage.getItem('long_image_layout') || '1', 10) as ImageLayoutOption;
      (onChange as (s: LongDescriptionSettings) => void)({
        justifyText: storedJustify,
        addImages: storedAddImages,
        imageLayout: storedImageLayout,
        useLinkPhrases: storedUseLinkPhrases,
        linkPhrases: storedLinkPhrases,
        tone: storedTone,
        customToneExample: storedCustomTone,
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
      : key === 'useLinkPhrases' ? `${prefix}use_link_phrases`
      : key === 'linkPhrases' ? `${prefix}link_phrases`
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

      {/* Link Phrases Section */}
      <div className="pt-4 border-t border-[var(--border-color)]">
        <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Prolinkovat fraze</h4>

        <label className="flex flex-wrap items-center gap-2 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg cursor-pointer transition-colors hover:border-[var(--brand-green-lighter)] hover:bg-[var(--brand-green-50)] dark:hover:bg-[#2d3d3c]">
          <input
            type="checkbox"
            checked={settings.useLinkPhrases}
            onChange={(e) => updateSetting('useLinkPhrases', e.target.checked)}
            className="accent-[var(--brand-green)]"
          />
          <span className="font-medium text-[var(--text-secondary)]">Pouzit fraze pro prolinkovani</span>
          <span className="text-sm text-[var(--text-muted)]">(AI zakomponuje fraze prirozene do textu)</span>
        </label>

        {settings.useLinkPhrases && (
          <div className="mt-3 p-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Fraze oddelene carkou:
            </label>
            <textarea
              value={settings.linkPhrases}
              onChange={(e) => updateSetting('linkPhrases', e.target.value)}
              placeholder="Teplaky, Mikiny, Tenisky..."
              className="w-full min-h-16 p-3 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] resize-y focus:outline-none focus:border-[var(--brand-green)] focus-brand"
            />
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              AI zakomponuje tyto fraze prirozene do textu, pokud souvisi s produktem.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
