'use client';

import { Suspense } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ModeSwitcher, useMode } from '@/components/mode-switcher';
import { InfoCard } from '@/components/info-card';
import { ShortDescriptionGenerator } from '@/components/short-description-generator';
import { LongDescriptionGenerator } from '@/components/long-description-generator';

function GeneratorContent() {
  const mode = useMode();

  return (
    <div className="flex flex-col gap-6">
      {/* Info Card */}
      <InfoCard mode={mode} />

      {/* Generator Card */}
      <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--card-border)] p-6">
        {mode === 'short' ? (
          <ShortDescriptionGenerator />
        ) : (
          <LongDescriptionGenerator />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <Suspense fallback={<div className="h-14" />}>
          <ModeSwitcher />
        </Suspense>
      </Header>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-[56rem] mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-green)]"></div>
            </div>
          }>
            <GeneratorContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
