/**
 * Long Description API Module
 * Handles API communication for long description generation
 */

const LongDescriptionAPI = {
    // API configuration
    baseUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    apiVersion: '2023-06-01',

    // Rate limiting
    requestDelay: 3000, // ms between requests (3 seconds - longer due to more complex processing)
    maxRetries: 3,
    baseRetryDelay: 5000,

    // Callback for UI notifications
    onRateLimitWait: null,

    // System prompt for generating long descriptions
    systemPrompt: `## Role
Jsi zkušený copywriter specializující se na e-commerce produktové popisy pro český trh. Tvým úkolem je vytvářet podrobné, poutavé a prodejní dlouhé popisy produktů pro e-shopy na platformě Shoptet.

## Vstup
Dostaneš:
- **Název produktu** (name)
- **Krátký popis produktu** (shortDescription) – stručné shrnutí produktu
- **Stávající dlouhý popis** (description) – může obsahovat nějaké informace, které můžeš použít
- **URL obrázku** (image) – volitelně, pokud je k dispozici

## Výstup
Vytvoř **dlouhý popis** (description), který má následující strukturu:

### 1. HOOK (Úvodní věta)
- Silná úvodní věta, která zaujme pozornost
- Může obsahovat otázku, zajímavý fakt nebo emocionální apel
- Max 1-2 věty

### 2. ODRÁŽKY S BENEFITY
- 3-6 klíčových výhod produktu v odrážkách
- Každá odrážka = konkrétní benefit pro zákazníka
- Krátké, úderné formulace

### 3. PODROBNÝ TEXT
- Rozvinutí informací z krátkého popisu
- Detaily o materiálech, vlastnostech, použití
- 2-4 odstavce souvislého textu

### 4. SEKCE (Volitelné)
- Pokud produkt má více aspektů (péče, použití, specifikace), rozděl je do sekcí
- Každá sekce má nadpis (<h3>) a krátký text
- Max 2-3 sekce

### 5. ZÁVĚR
- Shrnutí hlavních benefitů
- Call-to-action (výzva k akci)
- Emocionální apel

## HTML Formátování

POVINNÉ elementy:
- \`<p>\` pro odstavce
- \`<strong>\` pro zvýraznění (střídmě, max 2-3 na odstavec)
- \`<ul>\` a \`<li>\` pro odrážky
- \`<h3>\` pro nadpisy sekcí (pokud jsou)

**Pravidla pro obrázky:**
Pokud je v zadání uvedeno \`[OBRAZEK: URL]\`, vlož obrázek do popisu takto:
\`\`\`html
<p style="text-align: center;"><img src="URL" alt="Název produktu" style="max-width: 100%;"></p>
\`\`\`
Umísti obrázky mezi sekce nebo za hook, NE na začátek nebo úplný konec.

**NEPOUŽÍVEJ:**
- Inline styly kromě obrázků a zarovnání textu
- Emoji
- Markdown

## Styl psaní

**Výchozí tón:** Přátelský, informativní, ale ne nudný

**Přizpůsobení tónu:**
- \`[TON: profesionální]\` → Formální, elegantní, věcný
- \`[TON: vtipný]\` → Hravý, kreativní, s humorem
- \`[TON: neutrální]\` → Vyvážený, informativní, přátelský
- \`[TON_UKAZKA: ...]\` → Převezmi styl z ukázky

**Pravidla pro češtinu:**
1. Vždy spisovná čeština
2. Správné pády a koncovky
3. Humor v obsahu, ne v gramatice

## Prolinkování frází (VOLITELNÉ)

Pokud je v zadání \`[FRAZE_PRO_PROLINKOVÁNÍ: ...]\`:
1. Použij fráze v PŘESNÉM tvaru
2. Zakomponuj přirozeně do textu
3. Použij pouze fráze související s produktem
4. Max 2-3 fráze na popis

## Délka
- **Cílová délka:** 800-1500 znaků čistého textu
- **Maximální délka:** 2000 znaků čistého textu

## Důležité pokyny

1. **Nevymýšlej si informace** - vycházej pouze z poskytnutých dat
2. **Buď konkrétní** - místo "kvalitní" piš konkrétní materiál nebo vlastnost
3. **Piš pro zákazníka** - zaměř se na benefity, ne jen vlastnosti
4. **Pokud chybí informace** - nevymýšlej je, pracuj s tím, co máš
5. **Pokud je krátký popis příliš krátký nebo prázdný** - odpověz pouze: \`[NELZE_ZPRACOVAT]\`

## Formát odpovědi
Vrať POUZE HTML kód dlouhého popisu.
Žádné vysvětlení, žádné markdown backticks, žádný další text.`,

    /**
     * Generate long description for a product
     */
    async generateDescription(product, settings, apiKey) {
        let userMessage = '';

        // Add tone prefix based on selection
        switch (settings.tone) {
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
                if (settings.customToneExample) {
                    userMessage += `[TON_UKAZKA: ${settings.customToneExample}]\n\n`;
                }
                break;
        }

        // Add link phrases if enabled
        if (settings.useLinkPhrases && settings.linkPhrases.trim()) {
            userMessage += `[FRAZE_PRO_PROLINKOVÁNÍ: ${settings.linkPhrases.trim()}]\n\n`;
        }

        // Add image if available and setting is enabled
        if (settings.addImages && product.image) {
            userMessage += `[OBRAZEK: ${product.image}]\n\n`;
        }

        userMessage += `Název produktu: ${product.name || 'Bez názvu'}

Krátký popis:
${product.shortDescription || '(prázdný)'}

Stávající dlouhý popis:
${product.description || '(prázdný)'}`;

        try {
            const response = await this.callAPI(apiKey, userMessage);
            return response;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Call Anthropic API with retry logic
     */
    async callAPI(apiKey, userMessage, retryCount = 0) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': this.apiVersion,
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: this.maxTokens,
                    system: this.systemPrompt,
                    messages: [{
                        role: 'user',
                        content: userMessage
                    }]
                })
            });

            // Handle rate limiting
            if (response.status === 429) {
                if (retryCount < this.maxRetries) {
                    const delay = this.baseRetryDelay * Math.pow(2, retryCount);
                    const waitSeconds = Math.ceil(delay / 1000);

                    if (this.onRateLimitWait) {
                        this.onRateLimitWait(waitSeconds, retryCount + 1, this.maxRetries);
                    }

                    await this.sleep(delay);
                    return this.callAPI(apiKey, userMessage, retryCount + 1);
                } else {
                    return {
                        success: false,
                        error: 'Rate limit překročen po 3 pokusech.'
                    };
                }
            }

            // Handle other errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || `HTTP Error: ${response.status}`;

                if (response.status === 401) {
                    return {
                        success: false,
                        error: 'Neplatný API klíč.'
                    };
                }

                return {
                    success: false,
                    error: errorMessage
                };
            }

            const data = await response.json();
            let text = data.content?.[0]?.text;

            if (!text) {
                return {
                    success: false,
                    error: 'Prázdná odpověď od API'
                };
            }

            // Check for [NELZE_ZPRACOVAT] marker
            if (text.includes('[NELZE_ZPRACOVAT]')) {
                return {
                    success: false,
                    error: 'AI nemohla vygenerovat popis z poskytnutých informací'
                };
            }

            // Clean up the response
            text = text.trim();
            if (text.startsWith('```html')) {
                text = text.replace(/^```html\s*/, '').replace(/\s*```$/, '');
            } else if (text.startsWith('```')) {
                text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            return {
                success: true,
                description: text.trim()
            };

        } catch (error) {
            if (error.name === 'TypeError' && retryCount < this.maxRetries) {
                const delay = this.baseRetryDelay * Math.pow(2, retryCount);
                await this.sleep(delay);
                return this.callAPI(apiKey, userMessage, retryCount + 1);
            }

            return {
                success: false,
                error: `Síťová chyba: ${error.message}`
            };
        }
    },

    /**
     * Apply text-align: justify to paragraph tags
     */
    applyJustifyAlignment(html) {
        if (!html) return html;
        return html.replace(/<p>/gi, '<p style="text-align: justify;">')
                   .replace(/<p\s+style="([^"]*)"/gi, (match, existingStyle) => {
                       if (existingStyle.includes('text-align')) {
                           return match;
                       }
                       return `<p style="${existingStyle}; text-align: justify;"`;
                   });
    },

    /**
     * Check if description contains image
     */
    hasImage(html) {
        return html && html.includes('<img');
    },

    /**
     * Strip HTML tags from text
     */
    stripHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
