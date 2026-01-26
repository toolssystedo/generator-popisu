'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { AppMode } from '@/types';

interface InfoCardProps {
  mode: AppMode;
}

interface Step {
  title: string;
  descriptions: Array<{ text: string; link?: { text: string; image: string } }>;
}

const shortModeSteps: Step[] = [
  {
    title: 'Nahrajte XLSX export ze Shoptetu',
    descriptions: [
      { text: 'Povinne sloupce: code, name, description, shortDescription' },
      { text: 'Volitelne: manufacturer, categoryText (pro prolinkovani)' },
      {
        text: 'Pro zobrazeni sablony exportu kliknete',
        link: { text: 'zde', image: '/assets/sablona-exportu.jpg' }
      },
    ],
  },
  {
    title: 'Nahrajte CSV pro prolinkovani (volitelne)',
    descriptions: [
      {
        text: 'CSV se znackami (sloupce: Name, indexName) - cestu k exportu zobrazite',
        link: { text: 'zde', image: '/assets/export-znacky.png' }
      },
      {
        text: 'CSV s kategoriemi (sloupce: Title, url) - cestu k exportu zobrazite',
        link: { text: 'zde', image: '/assets/export-kategorie.png' }
      },
    ],
  },
  {
    title: 'Nastavte generovani',
    descriptions: [
      { text: 'Zarovnani textu, odrazky s benefity' },
      { text: 'Prolinkovani znacek a kategorii' },
      { text: 'Ton popisu (neutralni, profesionalni, vtipny)' },
    ],
  },
  {
    title: 'Spustte zpracovani',
    descriptions: [
      { text: 'AI vygeneruje kratke popisy z dlouhych popisu produktu' },
      { text: 'Odkazy na znacky a kategorie budou automaticky vlozeny' },
    ],
  },
  {
    title: 'Stahnete upraveny soubor',
    descriptions: [
      { text: 'Soubor obsahuje nove kratke popisy ve sloupci shortDescription' },
    ],
  },
  {
    title: 'Naimportujte do Shoptetu',
    descriptions: [
      { text: '1. V levem menu otevrete "Produkty" a "Import"' },
      {
        text: '2. V otevrenem importu v pripade potreby zmente nastaveni',
        link: { text: 'podle navodu', image: '/assets/import-produktu.jpg' }
      },
      { text: '3. Vyberte nove stazeny soubor a naimportujte' },
    ],
  },
];

const longModeSteps: Step[] = [
  {
    title: 'Nahrajte XLSX export ze Shoptetu',
    descriptions: [
      { text: 'Povinne sloupce: code, name, description, shortDescription' },
      { text: 'Volitelne: manufacturer, categoryText (pro prolinkovani)' },
      { text: 'Volitelne: image, image2, image3... (pro vkladani obrazku)' },
    ],
  },
  {
    title: 'Nahrajte CSV pro prolinkovani (volitelne)',
    descriptions: [
      {
        text: 'CSV se znackami (sloupce: Name, indexName) - cestu k exportu zobrazite',
        link: { text: 'zde', image: '/assets/export-znacky.png' }
      },
      {
        text: 'CSV s kategoriemi (sloupce: Title, url) - cestu k exportu zobrazite',
        link: { text: 'zde', image: '/assets/export-kategorie.png' }
      },
    ],
  },
  {
    title: 'Nastavte generovani',
    descriptions: [
      { text: 'Zarovnani textu, vkladani obrazku (1/2/3 na radek)' },
      { text: 'Prolinkovani znacek a kategorii' },
      { text: 'Ton popisu (neutralni, profesionalni, vtipny)' },
    ],
  },
  {
    title: 'Spustte zpracovani',
    descriptions: [
      { text: 'AI vygeneruje dlouhe popisy s obrazky a odkazy' },
      { text: 'Obrazky budou rovnomerne rozlozeny v textu' },
    ],
  },
  {
    title: 'Stahnete upraveny soubor',
    descriptions: [
      { text: 'Soubor obsahuje nove dlouhe popisy ve sloupci description' },
    ],
  },
  {
    title: 'Naimportujte do Shoptetu',
    descriptions: [
      { text: '1. V levem menu otevrete "Produkty" a "Import"' },
      {
        text: '2. V otevrenem importu v pripade potreby zmente nastaveni',
        link: { text: 'podle navodu', image: '/assets/import-produktu.jpg' }
      },
      { text: '3. Vyberte nove stazeny soubor a naimportujte' },
    ],
  },
];

export function InfoCard({ mode }: InfoCardProps) {
  const steps = mode === 'short' ? shortModeSteps : longModeSteps;
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  return (
    <>
      <div className="info-card-gradient border border-[var(--brand-green-100)] dark:border-[#3d4d4c] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Jak to funguje?
        </h3>

        <div className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-green)] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#374151] dark:text-[var(--text-secondary)]">
                  {step.title}
                </p>
                {step.descriptions.map((desc, descIndex) => (
                  <p key={descIndex} className="text-sm text-[#6a7282] dark:text-[var(--text-muted)]">
                    {desc.link ? (
                      <>
                        {desc.text}{' '}
                        <button
                          onClick={() => setLightboxImage(desc.link!.image)}
                          className="text-[var(--brand-green)] dark:text-[var(--brand-green-lighter)] font-medium underline hover:text-[var(--brand-green-light)]"
                        >
                          {desc.link.text}
                        </button>
                        .
                      </>
                    ) : (
                      desc.text
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute inset-0 bg-black/90" />
          <div className="relative max-w-[95vw] max-h-[95vh] z-10">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              src={lightboxImage}
              alt="Návod"
              width={1200}
              height={800}
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
