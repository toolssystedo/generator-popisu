import type { APIResponse } from '@/types';

// API configuration
const API_BASE_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-20250514';

// Rate limiting
export const REQUEST_DELAY = 2500; // ms between requests
export const REQUEST_DELAY_LONG = 3000; // ms for long descriptions
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 5000; // ms

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false;
  return apiKey.trim().length > 20;
}

/**
 * Strip HTML tags from text
 */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Apply text-align: justify to paragraph tags
 */
export function applyJustifyAlignment(html: string): string {
  if (!html) return html;
  return html
    .replace(/<p>/gi, '<p style="text-align: justify;">')
    .replace(/<p\s+style="([^"]*)"/gi, (match, existingStyle) => {
      if (existingStyle.includes('text-align')) {
        return match;
      }
      return `<p style="${existingStyle}; text-align: justify;"`;
    });
}

/**
 * Check if HTML contains image tag
 */
export function hasImage(html: string): boolean {
  return html?.includes('<img') ?? false;
}

interface CallAPIOptions {
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  onRateLimitWait?: (waitSeconds: number, attempt: number, maxAttempts: number) => void;
}

/**
 * Call Anthropic API with retry logic
 */
export async function callAPI(
  options: CallAPIOptions,
  retryCount = 0
): Promise<APIResponse> {
  const { apiKey, systemPrompt, userMessage, maxTokens, onRateLimitWait } = options;

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage
        }]
      })
    });

    // Handle rate limiting
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
        const waitSeconds = Math.ceil(delay / 1000);

        if (onRateLimitWait) {
          onRateLimitWait(waitSeconds, retryCount + 1, MAX_RETRIES);
        }

        await sleep(delay);
        return callAPI(options, retryCount + 1);
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

    return {
      success: true,
      description: text.trim()
    };

  } catch (error) {
    // Network error - retry
    if ((error as Error).name === 'TypeError' && retryCount < MAX_RETRIES) {
      const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
      await sleep(delay);
      return callAPI(options, retryCount + 1);
    }

    return {
      success: false,
      error: `Síťová chyba: ${(error as Error).message}`
    };
  }
}
