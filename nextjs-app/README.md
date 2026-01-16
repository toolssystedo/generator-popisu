# Generátor popisů pro Shoptet

Automatické generování produktových popisů pomocí AI (Claude) pro Shoptet e-shopy.

## Funkce

- **Generování krátkých popisů** - Vytváří krátké, poutavé popisy z dlouhých popisů produktů
- **Generování dlouhých popisů** - Vytváří strukturované dlouhé popisy z krátkých popisů
- **Nastavitelný tón** - Neutrální, profesionální, vtipný nebo vlastní styl
- **HTML formátování** - Výstup připravený pro import do Shoptetu
- **Odrážky s benefity** - Automatické vytvoření seznamu výhod produktu
- **Prolinkování frází** - Přidání interních odkazů do popisů
- **Dark mode** - Podpora tmavého režimu

## Požadavky

- Node.js 18+
- npm nebo yarn
- Anthropic API klíč (pro přístup k Claude AI)

## Instalace

```bash
# Naklonování repozitáře
git clone https://github.com/toolssystedo/generator-popisu.git
cd generator-popisu/nextjs-app

# Instalace závislostí
npm install

# Spuštění vývojového serveru
npm run dev
```

Aplikace poběží na [http://localhost:3000](http://localhost:3000).

## Použití

1. **Připravte Excel soubor** s exportem produktů ze Shoptetu
   - Povinné sloupce: `code`, `name`, `description`, `shortDescription`
   - Volitelný sloupec: `image` (pro dlouhé popisy)

2. **Získejte Anthropic API klíč** na [console.anthropic.com](https://console.anthropic.com/settings/keys)

3. **Nahrajte soubor** přetažením nebo kliknutím na upload zónu

4. **Zadejte API klíč** a nastavte parametry generování

5. **Spusťte generování** a počkejte na zpracování

6. **Stáhněte výsledek** - upravený Excel soubor připravený k importu

## Struktura Excel souboru

| Sloupec | Popis | Povinný |
|---------|-------|---------|
| code | Kód produktu | Ano |
| name | Název produktu | Ano |
| description | Dlouhý popis produktu | Ano |
| shortDescription | Krátký popis produktu | Ano |
| image | URL obrázku produktu | Ne |

## Deploy na Vercel

Nejjednodušší způsob nasazení je přes Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/toolssystedo/generator-popisu/tree/main/nextjs-app)

### Ruční deploy

1. Nainstalujte Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Přihlaste se do Vercel:
   ```bash
   vercel login
   ```

3. Nasaďte aplikaci:
   ```bash
   cd nextjs-app
   vercel
   ```

4. Pro produkční deploy:
   ```bash
   vercel --prod
   ```

## Technologie

- [Next.js 14+](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Typový systém
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Shadcn/ui](https://ui.shadcn.com/) - UI komponenty
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [SheetJS](https://sheetjs.com/) - Excel zpracování
- [Anthropic Claude](https://www.anthropic.com/) - AI model

## Vývoj

```bash
# Vývojový server
npm run dev

# Build pro produkci
npm run build

# Spuštění produkčního buildu
npm start

# Lint
npm run lint
```

## Struktura projektu

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css         # Globální styly + Tailwind
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Hlavní stránka
│   └── providers.tsx       # Theme provider
├── components/             # React komponenty
│   ├── ui/                 # Shadcn/ui komponenty
│   ├── header.tsx          # Header s dark mode
│   ├── mode-switcher.tsx   # Přepínač módů
│   ├── file-upload.tsx     # Upload zóna
│   ├── api-key-input.tsx   # Input pro API klíč
│   ├── settings-section.tsx # Nastavení generování
│   ├── processing-progress.tsx # Progress bar
│   ├── results-section.tsx # Výsledky
│   └── preview-modal.tsx   # Náhled změn
├── lib/                    # Utility funkce
│   ├── api/                # API komunikace
│   │   ├── anthropic.ts    # Anthropic API client
│   │   ├── short-description.ts # Krátké popisy
│   │   └── long-description.ts  # Dlouhé popisy
│   ├── excel.ts            # Excel zpracování
│   └── utils.ts            # Pomocné funkce
├── stores/                 # Zustand stores
│   ├── short-description-store.ts
│   └── long-description-store.ts
├── types/                  # TypeScript typy
│   └── index.ts
└── hooks/                  # React hooks
    └── use-local-storage.ts
```

## Licence

MIT
