import { NextRequest, NextResponse } from 'next/server';

// API configuration
const API_BASE_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const MODEL = 'claude-sonnet-4-20250514';

interface GenerateRequest {
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API klíč není nakonfigurován na serveru.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body: GenerateRequest = await request.json();
    const { systemPrompt, userMessage, maxTokens } = body;

    if (!systemPrompt || !userMessage || !maxTokens) {
      return NextResponse.json(
        { success: false, error: 'Chybí povinné parametry.' },
        { status: 400 }
      );
    }

    // Call Anthropic API
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userMessage,
        }],
      }),
    });

    // Handle rate limiting
    if (response.status === 429) {
      return NextResponse.json(
        { success: false, error: 'rate_limit', retryAfter: 5 },
        { status: 429 }
      );
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP Error: ${response.status}`;

      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Neplatný API klíč nakonfigurovaný na serveru.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    let text = data.content?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Prázdná odpověď od API' },
        { status: 500 }
      );
    }

    // Check for [NELZE_ZPRACOVAT] marker
    if (text.includes('[NELZE_ZPRACOVAT]')) {
      return NextResponse.json({
        success: false,
        error: 'AI nemohla vygenerovat popis z poskytnutých informací',
      });
    }

    // Clean up the response - remove markdown code blocks if present
    text = text.trim();
    if (text.startsWith('```html')) {
      text = text.replace(/^```html\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return NextResponse.json({
      success: true,
      description: text.trim(),
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: `Chyba serveru: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
