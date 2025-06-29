
'use server';
/**
 * @fileOverview An AI flow to suggest break activities.
 *
 * - suggestBreakActivity - A function that suggests a break activity based on the last task and session duration.
 * - BreakSuggestionInput - The input type for the suggestBreakActivity function.
 * - BreakSuggestionOutput - The return type for the suggestBreakActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { BreakSuggestionInput, BreakSuggestionOutput } from '@/lib/types';

const BreakSuggestionInputSchema = z.object({
  taskTitle: z.string().optional().nullable().describe("The title or description of the task just completed. Can be null if no specific task was linked."),
  pomodoroDurationMinutes: z.number().int().positive().describe("The duration of the focus session in minutes (e.g., 25)."),
});

const BreakSuggestionOutputSchema = z.object({
  suggestion: z.string().describe("A concise and actionable break suggestion tailored to the context if provided, otherwise a general restorative break idea. Should be suitable for a 5-15 minute break."),
});

export async function suggestBreakActivity(input: BreakSuggestionInput): Promise<BreakSuggestionOutput> {
  return suggestBreakFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBreakPrompt',
  input: {schema: BreakSuggestionInputSchema},
  output: {schema: BreakSuggestionOutputSchema},
  prompt: `You are a friendly productivity and well-being coach. A user just completed a focus session of {{pomodoroDurationMinutes}} minutes.
{{#if taskTitle}}
They were working on: "{{taskTitle}}".
Based on this, suggest a short (5-15 minute), restorative break activity. Consider the mental effort of the task if possible (e.g., analytical, creative, repetitive).
For example, after coding, suggest eye rest or stretching. After creative work, suggest something to maintain creative flow like music.
{{else}}
Suggest a general, short (5-15 minute), restorative break activity.
{{/if}}
Keep the suggestion concise, encouraging, and actionable. Aim for one clear suggestion.
Examples:
- "Stretch your body for 5 minutes to refresh your mind."
- "Step away and grab a glass of water. Hydration helps!"
- "Close your eyes for a couple of minutes and take some deep breaths."
- "Look out a window and focus on something distant for a minute to rest your eyes."
`,
});

const suggestBreakFlow = ai.defineFlow(
  {
    name: 'suggestBreakFlow',
    inputSchema: BreakSuggestionInputSchema,
    outputSchema: BreakSuggestionOutputSchema,
  },
  async (input: BreakSuggestionInput) => {
    const {output} = await prompt(input);
    if (!output) {
        // Provide a default suggestion if AI fails
        return { suggestion: "Time for a short break! Stand up, stretch, or grab a glass of water." };
    }
    // Ensure output adheres to the schema, especially if AI might return unexpected structure
    if (typeof output.suggestion === 'string') {
        return output;
    } else {
        console.warn("AI returned non-string suggestion, using default:", output);
        return { suggestion: "Time for a short break! Stand up, stretch, or grab a glass of water." };
    }
  }
);
