import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// The Google AI plugin will automatically look for an API key 
// in environment variables like GOOGLE_API_KEY or GOOGLE_GENAI_API_KEY.
// For local development, set this in a .env.local file.
// For production, set this in your hosting environment's settings.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
