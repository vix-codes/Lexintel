// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY!,
    }),
  ],
  // No default model; prompts pass model dynamically.
});

// Try primary model, then backup, otherwise return quota sentinel.
export async function chooseModel(): Promise<string> {
  const primary = 'googleai/gemini-2.5-flash';
  const backup = 'googleai/gemini-2.5-flash-lite';

  try {
    await ai.generate({ model: primary, prompt: 'ping' });
    return primary;
  } catch (err) {
    console.warn('Primary unavailable:', err);
  }

  try {
    await ai.generate({ model: backup, prompt: 'ping' });
    return backup;
  } catch (err) {
    console.warn('Backup unavailable:', err);
  }

  return 'QUOTA_OVER';
}
