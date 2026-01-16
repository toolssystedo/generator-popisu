'use client';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--card-bg)] py-6">
      <div className="max-w-[56rem] mx-auto px-4 text-center text-sm text-[var(--text-muted)]">
        <p>
          Generator popisu pro Shoptet e-shopy | Powered by{' '}
          <a
            href="https://www.anthropic.com/claude"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand-green)] dark:text-[var(--brand-green-lighter)] hover:underline"
          >
            Claude AI
          </a>
        </p>
      </div>
    </footer>
  );
}
