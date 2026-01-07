# Zadání pro Claude Code: Shoptet Product Description Generator

## Kontext
Vytvoř webovou aplikaci pro generování krátkých produktových popisů pro e-shopy na platformě Shoptet. Aplikace bude používat Anthropic API (Claude) pro AI generování textů.

## Vizuální styl
**DŮLEŽITÉ:** Převezmi vizuální styl z existujícího projektu:
`D:\Systedo\Interní tool\shoptet-xlsx-processor`

Zkopíruj z něj:
- Barevné schéma (zelená barva, gradienty)
- Fonty a typografii
- Styl karet, tlačítek, upload zóny
- Layout a rozmístění prvků
- Header s logem a názvem aplikace
- Dark mode přepínač (pokud existuje)

## Funkcionalita aplikace

### Hlavní flow
1. Uživatel nahraje Excel soubor (export ze Shoptetu)
2. Aplikace načte a zobrazí počet produktů
3. Po kliknutí na "Zpracovat" aplikace:
   - Pro každý produkt vezme dlouhý popis (sloupec `description`)
   - Zavolá Anthropic API s promptem
   - Vygeneruje krátký popis (sloupec `shortDescription`)
4. Uživatel stáhne upravený Excel

### Struktura Excel souboru (vstup)
Očekávané sloupce:
- `code` – kód produktu
- `pairCode` – párový kód (volitelné)
- `name` – název produktu
- `guid` – GUID (volitelné)
- `shortDescription` – krátký popis (bude přepsán/doplněn)
- `description` – dlouhý popis (zdroj pro generování)

### Pravidla zpracování
1. **Prázdný dlouhý popis:** Přeskočit produkt, označit jako "Nelze zpracovat – chybí dlouhý popis"
2. **Příliš krátký dlouhý popis (<100 znaků čistého textu bez HTML):** Přeskočit, označit jako "Nelze zpracovat – nedostatek informací"
3. **Existující krátký popis:** Přepsat novým vygenerovaným
4. **API vrátí [NELZE_ZPRACOVAT]:** Označit produkt, nepřepisovat

### UI prvky

#### Header
- Logo/ikona aplikace
- Název: "Shoptet Description Generator"
- Podtitulek: "Automatické generování produktových popisů pomocí AI"
- Dark mode přepínač

#### Sekce "Jak to funguje?"
Kroky:
1. Nahrajte XLSX export ze Shoptetu
2. Zadejte API klíč (Anthropic)
3. Spusťte automatické zpracování
4. Stáhněte upravený soubor a naimportujte zpět

#### Upload zóna
- Drag & drop nebo kliknutí
- Podporované formáty: .xlsx, .xls
- Po nahrání zobrazit: název souboru, počet produktů, počet s dlouhým popisem

#### API klíč
- Input pole pro Anthropic API klíč
- Klíč ukládat do localStorage (volitelně)
- Validace před zpracováním

#### Nastavení generování
- **Checkbox: "Zarovnat popisy do bloku"** – pokud zaškrtnuto, výstup bude obsahovat `<p style="text-align: justify;">` místo prostého `<p>`
- **Checkbox: "Přidat odrážky s benefity"** – pokud zaškrtnuto, AI vygeneruje i seznam 3–6 klíčových benefitů jako `<ul><li>` za hlavním odstavcem

**Volba tónu popisu (radio buttons):**
- ○ Neutrální (výchozí) – vyvážený, informativní styl
- ○ Profesionální – formální, elegantní, věcný
- ○ Přátelský / Vtipný – neformální, hravý, uvolněný
- ○ Vlastní styl – zobrazí textarea pro ukázkový popis

**Textarea pro vlastní styl (zobrazí se jen při volbě "Vlastní styl"):**
- Placeholder: "Vložte ukázkový popis, jehož styl chcete napodobit..."
- AI analyzuje ukázkový text a převezme jeho styl

**Checkbox: "Prolinkování frází (Slovník pojmů)"**
- Po zaškrtnutí se zobrazí textarea pro zadání frází
- Placeholder: "Zadejte fráze oddělené čárkou, např.: Tepláky, Tenisky, Trička, Mikiny"
- Nápověda pod polem: "Fráze budou použity v přesném tvaru pro automatické prolinkování doplňkem Slovník pojmů"

**Implementace zarovnání:** AI vždy vrací `<p>...</p>`. Pokud je checkbox zaškrtnutý, aplikace před uložením nahradí `<p>` za `<p style="text-align: justify;">`. Toto se řeší v kódu, ne v promptu.

**Implementace odrážek:** Pokud je checkbox "Přidat odrážky s benefity" zaškrtnutý, aplikace přidá na konec uživatelské zprávy text `[S_ODRAZKAMI]`. Prompt obsahuje instrukce, jak v tomto případě generovat seznam benefitů.

**Implementace tónu:** Podle zvolené možnosti aplikace přidá na začátek uživatelské zprávy:
- Neutrální: `[TON: neutrální]`
- Profesionální: `[TON: profesionální]`
- Vtipný: `[TON: vtipný]`
- Vlastní: `[TON_UKAZKA: {text z textarea}]`

**Implementace prolinkování frází:** Pokud je checkbox zaškrtnutý a uživatel zadal fráze, aplikace přidá do zprávy:
`[FRAZE_PRO_PROLINKOVÁNÍ: Tepláky, Tenisky, Trička, Mikiny]`
AI pak tyto fráze použije v přesném tvaru tam, kde to dává smysl.

#### Progress/Zpracování
- Progress bar s počtem zpracovaných produktů
- Odhad zbývajícího času
- Možnost zrušit zpracování
- Log/výpis: "Zpracovávám: [název produktu]..."

#### Výsledky
Statistiky:
- Celkem produktů
- Úspěšně zpracováno
- Přeskočeno (prázdný popis)
- Přeskočeno (krátký popis)
- Chyby

Tlačítko: "Stáhnout upravený XLSX"

#### Volitelně: Náhled
- Tabulka s náhledem několika produktů (před/po)
- Možnost prokliknout a vidět detail

## Technické požadavky

### Frontend
- Vanilla JS nebo React (podle existujícího projektu)
- Responzivní design
- České texty v UI

### Knihovny
- **XLSX parsing:** SheetJS (xlsx)
- **HTTP requesty:** fetch API
- **Styling:** podle existujícího projektu (Tailwind/CSS)

### Anthropic API volání
```javascript
// Sestavení zprávy
let userMessage = '';

// Přidat tón na začátek
switch (selectedTone) {
  case 'professional':
    userMessage += '[TON: profesionální]\n\n';
    break;
  case 'funny':
    userMessage += '[TON: vtipný]\n\n';
    break;
  case 'neutral':
    userMessage += '[TON: neutrální]\n\n';
    break;
  case 'custom':
    userMessage += `[TON_UKAZKA: ${customToneExample}]\n\n`;
    break;
}

// Přidat fráze pro prolinkování, pokud jsou zadané
if (useLinkPhrases && linkPhrases.trim()) {
  userMessage += `[FRAZE_PRO_PROLINKOVÁNÍ: ${linkPhrases.trim()}]\n\n`;
}

userMessage += `Název produktu: ${productName}\n\nStávající krátký popis:\n${shortDescription || '(prázdný)'}\n\nDlouhý popis:\n${longDescription}`;

// Přidat flag pro odrážky, pokud je checkbox zaškrtnutý
if (addBulletPoints) {
  userMessage += '\n\n[S_ODRAZKAMI]';
}

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: userMessage
    }]
  })
});

// Po získání odpovědi - aplikovat zarovnání do bloku
let result = response.content[0].text;
if (justifyText) {
  result = result.replace(/<p>/g, '<p style="text-align: justify;">');
}
```

### Rate limiting
- Přidat delay mezi requesty (např. 500ms)
- Zpracovávat sekvenčně, ne paralelně
- Ošetřit 429 (rate limit) – retry s exponential backoff

### Error handling
- Chyba API → logovat, pokračovat s dalším produktem
- Nevalidní soubor → zobrazit chybu
- Chybějící sloupce → zobrazit které chybí

## Struktura souborů
```
shoptet-description-generator/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js          # Hlavní logika
│   ├── excel.js        # XLSX zpracování
│   ├── api.js          # Anthropic API volání
│   └── ui.js           # UI aktualizace
├── assets/
│   └── logo.svg
└── SYSTEM_PROMPT.md    # Prompt pro AI (reference)
```

## Systémový prompt
Použij prompt ze souboru `SYSTEM_PROMPT.md` v tomto projektu. Prompt obsahuje:
- Instrukce pro styl psaní
- Pravidla formátování (HTML)
- Příklady vstupů a výstupů
- Délku výstupu (250-450 znaků)

## Deployment
Připrav pro nasazení na Netlify (static hosting):
- Vše client-side
- Žádný backend potřeba
- API klíč zadává uživatel

---

## Poznámky pro vývoj
1. Začni analýzou existujícího projektu pro převzetí stylů
2. Vytvoř základní strukturu a UI
3. Implementuj Excel parsing
4. Přidej API integraci
5. Testuj na ukázkovém souboru
