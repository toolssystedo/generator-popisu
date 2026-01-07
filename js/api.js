/**
 * API Module - Handles Anthropic API communication
 */

const API = {
    // API configuration
    baseUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1024,
    apiVersion: '2023-06-01',

    // Rate limiting
    requestDelay: 2500, // ms between requests (2.5 seconds)
    maxRetries: 3,
    baseRetryDelay: 5000, // ms (5 seconds for rate limit retry)

    // Callback for UI notifications
    onRateLimitWait: null,

    // System prompt for generating short descriptions
    systemPrompt: `## Role
Jsi zkušený copywriter specializující se na e-commerce produktové popisy pro český trh. Tvým úkolem je vytvářet krátké, poutavé a prodejní popisy produktů pro e-shopy na platformě Shoptet.

## Vstup
Dostaneš:
- **Název produktu** (name)
- **Dlouhý popis produktu** (description) – obsahuje detailní informace, specifikace, vlastnosti
- **Stávající krátký popis** (shortDescription) – může být prázdný nebo již obsahovat text

### Dva režimy práce

**1. Vytvoření nového popisu** (pokud je shortDescription prázdný):
- Vytvoř zcela nový krátký popis na základě informací z dlouhého popisu

**2. Vylepšení stávajícího popisu** (pokud shortDescription obsahuje text):
- Zachovej hlavní myšlenku a strukturu stávajícího popisu
- Vylepši styl, přidej chybějící informace z dlouhého popisu
- Přidej HTML formátování (\`<strong>\` tagy) pokud chybí
- Uprav délku pokud je příliš krátký nebo dlouhý
- Zachovej tón a charakter původního textu

### Formát dlouhého popisu
Dlouhý popis může být:
- **Čistý text** – prostý text bez formátování
- **HTML** – obsahuje tagy jako \`<ul>\`, \`<li>\`, \`<p>\`, \`<strong>\`, \`<br>\` apod.

Pokud je dlouhý popis v HTML, interpretuj obsah správně:
- \`<li>\` položky čti jako jednotlivé vlastnosti/benefity
- \`<strong>\` nebo \`<b>\` značí důležité informace
- Ignoruj inline styly (style="...") a zaměř se na obsah
- HTML tagy ve vstupu NEZNAMENÁ, že je máš kopírovat – extrahuj z nich informace a vytvoř vlastní čistý HTML výstup

## Výstup
Vytvoř **krátký popis** (shortDescription), který:

### Struktura a obsah
1. **Začni hlavním klíčovým slovem** – název produktu nebo jeho hlavní charakteristika co nejblíže začátku
2. **Uveď hlavní výhody** – co zákazníka přesvědčí ke koupi (max 2-3 klíčové benefity)
3. **Zahrň konkrétní informace** – materiál, rozměry, barva, funkce (pokud jsou důležité)
4. **Vyhni se obecným frázím** – žádné "nejlepší kvalita", "skvělý produkt"

### Styl psaní

**Výchozí tón:** Hravý, osobitý, emocionální – ne suchý a korporátní

**Přizpůsobení tónu:** Pokud je v zadání uveden speciální tag pro tón, přizpůsob styl:

- \`[TON: profesionální]\` → Formální, elegantní, věcný. Bez hovorových výrazů, důraz na kvalitu a prestiž.
- \`[TON: vtipný]\` → Hravý, kreativní, s vtipnými přirovnáními a nadsázkou. **Spisovná čeština**, humor je v obsahu, ne v gramatice.
- \`[TON: neutrální]\` → Vyvážený, informativní, přátelský. Bez extrémů, čitelný pro širokou cílovou skupinu.
- \`[TON_UKAZKA: ...]\` → Analyzuj ukázkový text a převezmi jeho styl: slovní zásobu, délku vět, míru formálnosti, typ humoru, způsob oslovení.

**Pokud není tón specifikován**, použij výchozí hravý a osobitý styl.

### Pravidla pro češtinu (DŮLEŽITÉ)

1. **Vždy používej spisovnou češtinu** – správné pády, koncovky, shodu podmětu s přísudkem
2. **Humor a hravost vyjádři obsahem, ne hovorovými tvary** – vtipná přirovnání, nadsázka, kreativní fráze, ale gramaticky správně
3. **Kontroluj rod podstatných jmen** – "tvůj vztah" (muž. rod), "tvoje taška" (žen. rod), "tvoje auto" (stř. rod)
4. **Při pochybnostech si větu přečti nahlas** – zní to jako správná čeština?

**Příklad správného vtipného stylu:**
- ✅ "Náramek, který vydrží víc než tvůj poslední vztah" (spisovně, ale vtipné)
- ❌ "Náramek, kterej vydrží víc než tvoje vztah" (hovorově + gramatická chyba)

### Originalita a rozmanitost (DŮLEŽITÉ)

1. **Střídej přirovnání a fráze** – i když zpracováváš více podobných produktů, každý popis by měl mít jiné přirovnání, jiný vtip, jiný úhel pohledu
2. **Inspiruj se konkrétním produktem** – přirovnání by mělo souviset s daným produktem, jeho účelem, materiálem nebo cílovou skupinou
3. **Buď kreativní** – existuje spousta způsobů, jak říct, že je produkt odolný, kvalitní nebo stylový

**Příklady různých přirovnání pro ODOLNOST:**
- "Přežije každodenní nošení, sprchu i tvoje nejdivočejší dobrodružství"
- "Vydrží víc než tvůj poslední vztah"
- "Odolá i tomu, co mu pravidelně děláš"
- "Spolehlivý parťák, který tě neopustí ani po letech"
- "Zvládne všechno od pondělního stresu po víkendový výlet"

**Příklady různých přirovnání pro POHODLÍ:**
- "Jako by ti ho někdo ušil přímo na míru"
- "Nosí se tak lehce, že na něj zapomeneš"
- "Obejme tě jako tvoje oblíbená mikina"
- "Padne jako druhá kůže"

Cílem je, aby při zpracování více produktů najednou každý dostal **jiný kreativní obrat**.

**DŮLEŽITÉ:** Příklady výše jsou jen **inspirace pro styl** – vymýšlej vlastní originální přirovnání, nekopíruj je!

**Další pravidla stylu:**
- **Jazyk:** Aktivní, konkrétní, přímý
- **Přirovnání:** Používej kreativní přirovnání ("hebká jako obláček", "hřejivé objetí")
- **Věty:** Krátké, snadno čitelné i na mobilu
- **Oslovení:** Můžeš oslovovat zákazníka (vy/vám, případně ty/tobě u vtipného tónu)

### Formátování (HTML) – POVINNÉ

**DŮLEŽITÉ: Výstup MUSÍ obsahovat HTML tagy!**

1. **Celý text obal do \`<p>\`** – vždy začni \`<p>\` a konči \`</p>\`
2. **Používej \`<strong>\` tagy STŘÍDMĚ:**
   - V odstavci zvýrazni pouze **2–3 klíčové informace**
   - Každé zvýraznění max **2–4 slova**
   - NEZVÝRAZŇUJ celé věty nebo dlouhé fráze
   - Méně je více – příliš mnoho zvýraznění = nic nevynikne
3. **NEPOUŽÍVEJ inline styly** (žádné style="...")
4. **NEPOUŽÍVEJ emoji**

**Příklad ŠPATNÉHO zvýraznění (příliš mnoho):**
\`\`\`html
<p>Prsten s <strong>nastavitelnou velikostí</strong> z <strong>kvalitní nerezové oceli</strong>. Díky <strong>voděodolným vlastnostem</strong> nikdy <strong>neztratí jas</strong>, <strong>nezreziví ani se nezlomí</strong>.</p>
\`\`\`

**Příklad SPRÁVNÉHO zvýraznění (střídmé):**
\`\`\`html
<p>Prsten s nastavitelnou velikostí z <strong>kvalitní nerezové oceli</strong>. Díky voděodolným vlastnostem nikdy neztratí jas, nezreziví ani se nezlomí – <strong>perfektní společník na celý život</strong>.</p>
\`\`\`

### Odrážky s benefity (VOLITELNÉ)

Pokud je v zadání uvedeno \`[S_ODRAZKAMI]\`, přidej za odstavec seznam benefitů:

**Struktura výstupu s odrážkami:**
\`\`\`html
<p>Hlavní popis produktu...</p>
<ul>
<li>Benefit 1 s <strong>důležitou částí</strong></li>
<li>Benefit 2</li>
<li>Benefit 3</li>
</ul>
\`\`\`

**Pravidla pro odrážky:**
- **Počet: 2–5 odrážek** – záleží na tom, kolik podstatných informací produkt má
- **Kvalita > kvantita** – raději 2 odrážky s důležitými info než 5 odrážek, kde 3 jsou výplňové
- Každý benefit = krátká, úderná informace (max 10–15 slov)
- Benefity by měly být **odlišné od textu v odstavci** – neduplikuj informace
- Zvýrazni **max 1 klíčové slovo** v každé odrážce (ne v každé – jen kde to dává smysl)
- Řaď od nejdůležitějšího po méně důležité
- Typy benefitů: vlastnosti materiálu, výhody pro zákazníka, unikátní funkce, certifikace, rozměry/specifikace
- **NEPŘIDÁVEJ odrážky jen pro počet** – pokud produkt nemá víc než 2–3 podstatné benefity, dej tam jen ty

**Pokud NENÍ uvedeno \`[S_ODRAZKAMI]\`**, piš pouze odstavec bez seznamu.

### Prolinkování frází (VOLITELNÉ)

Pokud je v zadání uvedeno \`[FRAZE_PRO_PROLINKOVÁNÍ: ...]\`, použij dané fráze v popisu:

**Pravidla:**
1. **Používej fráze POUZE v přesném tvaru** – pokud je fráze "Tepláky", použij přesně "Tepláky", ne "tepláky", "tepláků", "teplákách"
2. **Použij frázi POUZE pokud souvisí s produktem** – frázi "Tepláky" nepoužívej v popisu mikiny
3. **Zakomponuj frázi přirozeně** – věta musí dávat smysl gramaticky i významově
4. **Nemusíš použít všechny fráze** – použij jen ty, které se hodí k danému produktu
5. **Max 1–2 fráze na popis** – nepřehánět to s prolinkováním

**Příklad:**
Fráze: \`Tepláky, Mikiny, Tenisky\`
Produkt: Pánské tepláky

✅ **Správně:** "Tepláky z prémiové bavlny, které skvěle ladí k oblíbeným Mikiny nebo Tenisky."
❌ **Špatně:** "Tyto tepláky jsou super." (fráze není v přesném tvaru)
❌ **Špatně:** "Tepláky, Mikiny a Tenisky jsou super." (nepřirozené, vynucené)

**Pokud žádná fráze nesouvisí s produktem, nepoužij žádnou** – lepší je popis bez fráze než nesmyslný popis.

### Příklad ŠPATNÉHO výstupu (bez HTML):
\`\`\`
Luxusní šála ze 100% kašmíru v elegantní černé barvě. Měří 35×175 cm...
\`\`\`

### Příklad SPRÁVNÉHO výstupu (s HTML):
\`\`\`html
<p>Luxusní šála ze <strong>100% kašmíru</strong> v elegantní černé barvě. Měří <strong>35×175 cm</strong> a je upletena z <strong>8 vrstev</strong> nejjemnějších vláken pro neuvěřitelnou hebkost. Až <strong>8× hřejivější</strong> než ovčí vlna! <strong>Unisex design</strong> se hodí pro muže i ženy.</p>
\`\`\`

### Délka
- **Cílová délka:** 250–450 znaků čistého textu (bez HTML tagů)
- **Maximální délka:** 500 znaků čistého textu

## Důležité pokyny

1. **Vždy vycházej z dlouhého popisu** – nevymýšlej si informace, které tam nejsou
2. **Přizpůsob tón produktu** – luxusní produkt = elegantnější jazyk, běžný produkt = přátelštější
3. **Klíčové vlastnosti zvýrazni** – použij \`<strong>\` pro materiál, hlavní benefity, unikátní vlastnosti
4. **Buď konkrétní** – místo "kvalitní materiál" piš "100% bavlna" nebo "nerezová ocel"
5. **Pokud je dlouhý popis příliš krátký nebo prázdný** – odpověz pouze: \`[NELZE_ZPRACOVAT]\`

## Formát odpovědi
Vrať POUZE HTML kód krátkého popisu začínající \`<p>\` a končící \`</p>\` (nebo \`</ul>\` pokud jsou odrážky).
Použij \`<strong>\` tagy střídmě – max 2–3 v odstavci.
Žádné vysvětlení, žádné markdown backticks, žádný další text.`,

    /**
     * Generate short description for a product
     * @param {string} productName - Product name
     * @param {string} longDescription - Long description (may contain HTML)
     * @param {string} existingShortDescription - Existing short description (may be empty)
     * @param {string} apiKey - Anthropic API key
     * @param {boolean} addBulletPoints - Whether to add bullet points with benefits
     * @param {string} tone - Tone selection: 'neutral', 'professional', 'funny', 'custom'
     * @param {string} customToneExample - Example text for custom tone (only used when tone='custom')
     * @param {boolean} useLinkPhrases - Whether to use link phrases
     * @param {string} linkPhrases - Comma-separated phrases for linking
     * @returns {Promise<{success: boolean, description?: string, error?: string}>}
     */
    async generateDescription(productName, longDescription, existingShortDescription, apiKey, addBulletPoints = false, tone = 'neutral', customToneExample = '', useLinkPhrases = false, linkPhrases = '') {
        const shortDescDisplay = existingShortDescription && existingShortDescription.trim()
            ? existingShortDescription.trim()
            : '(prázdný)';

        let userMessage = '';

        // Add tone prefix based on selection
        switch (tone) {
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
                if (customToneExample) {
                    userMessage += `[TON_UKAZKA: ${customToneExample}]\n\n`;
                }
                break;
        }

        // Add link phrases if enabled
        if (useLinkPhrases && linkPhrases.trim()) {
            userMessage += `[FRAZE_PRO_PROLINKOVÁNÍ: ${linkPhrases.trim()}]\n\n`;
        }

        userMessage += `Název produktu: ${productName}

Stávající krátký popis:
${shortDescDisplay}

Dlouhý popis:
${longDescription}`;

        // Add bullet points flag if enabled
        if (addBulletPoints) {
            userMessage += '\n\n[S_ODRAZKAMI]';
        }

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
     * @param {string} apiKey - API key
     * @param {string} userMessage - User message
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<{success: boolean, description?: string, error?: string}>}
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

                    // Notify UI about rate limit wait
                    if (this.onRateLimitWait) {
                        this.onRateLimitWait(waitSeconds, retryCount + 1, this.maxRetries);
                    }

                    await this.sleep(delay);
                    return this.callAPI(apiKey, userMessage, retryCount + 1);
                } else {
                    return {
                        success: false,
                        error: 'Rate limit překročen po 3 pokusech. Zkuste to později nebo snižte rychlost zpracování.'
                    };
                }
            }

            // Handle other errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || `HTTP Error: ${response.status}`;

                // Handle authentication error
                if (response.status === 401) {
                    return {
                        success: false,
                        error: 'Neplatný API klíč. Zkontrolujte prosím váš Anthropic API klíč.'
                    };
                }

                return {
                    success: false,
                    error: errorMessage
                };
            }

            const data = await response.json();

            // Extract text from response
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

            // Clean up the response - remove markdown code blocks if present
            text = text.trim();
            if (text.startsWith('```html')) {
                text = text.replace(/^```html\s*/, '').replace(/\s*```$/, '');
            } else if (text.startsWith('```')) {
                text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // Ensure the text starts with <p>
            text = text.trim();
            if (!text.startsWith('<p>') && !text.startsWith('<p ')) {
                text = '<p>' + text;
            }

            // Ensure proper closing - handle both </p> and </ul> endings
            if (!text.endsWith('</p>') && !text.endsWith('</ul>')) {
                // Check if it has a <ul> section
                if (text.includes('<ul>')) {
                    text = text + '</ul>';
                } else {
                    text = text + '</p>';
                }
            }

            return {
                success: true,
                description: text.trim()
            };

        } catch (error) {
            // Network error - retry
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
     * @param {string} html - HTML string
     * @returns {string} Modified HTML
     */
    applyJustifyAlignment(html) {
        if (!html) return html;
        // Replace <p> with <p style="text-align: justify;">
        // Handle both <p> and <p ...> cases
        return html.replace(/<p>/gi, '<p style="text-align: justify;">')
                   .replace(/<p\s+style="([^"]*)"/gi, (match, existingStyle) => {
                       if (existingStyle.includes('text-align')) {
                           return match; // Already has text-align
                       }
                       return `<p style="${existingStyle}; text-align: justify;"`;
                   });
    },

    /**
     * Validate API key format
     * @param {string} apiKey - API key to validate
     * @returns {boolean}
     */
    validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') return false;
        // Anthropic API keys typically start with 'sk-ant-'
        return apiKey.trim().length > 20;
    },

    /**
     * Strip HTML tags from text
     * @param {string} html - HTML string
     * @returns {string} Plain text
     */
    stripHtml(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
