import type { APIResponse } from '@/types';

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
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  onRateLimitWait?: (waitSeconds: number, attempt: number, maxAttempts: number) => void;
}

/**
 * Call server-side API route with retry logic
 */
export async function callAPI(
  options: CallAPIOptions,
  retryCount = 0
): Promise<APIResponse> {
  const { systemPrompt, userMessage, maxTokens, onRateLimitWait } = options;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt,
        userMessage,
        maxTokens,
      })
    });

    const data = await response.json();

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

    // Return the response from server
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP Error: ${response.status}`
      };
    }

    return data;

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
