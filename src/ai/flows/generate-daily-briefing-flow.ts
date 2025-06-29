
'use server';
/**
 * @fileOverview An AI flow to generate a personalized daily briefing script.
 *
 * - generateDailyBriefing - A function that handles the script generation.
 * - DailyBriefingInput - The input type for the function.
 * - DailyBriefingOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { DailyBriefingInput, DailyBriefingOutput, Quote } from '@/lib/types';

const QuoteSchema = z.object({
  text: z.string(),
  author: z.string().optional(),
});

const DailyBriefingInputSchema = z.object({
  userName: z.string().nullable().describe("User's first name, or null if not available."),
  currentDate: z.string().describe("Formatted current date, e.g., 'Monday, July 29th'."),
  weatherPlaceholder: z.string().describe("A placeholder for weather conditions, e.g., 'currently pleasant'."),
  previousDayTaskTitles: z.array(z.string()).describe("Titles of 1-2 important tasks completed on the previous day. Can be empty."),
  todayTaskTitles: z.array(z.string()).describe("Titles of 1-2 high-priority tasks scheduled for today. Can be empty."),
  quote: QuoteSchema.describe("An inspirational or productivity quote for the day."),
});

const DailyBriefingOutputSchema = z.object({
  greeting: z.string().describe("A personalized greeting."),
  dateWeatherInfo: z.string().describe("Information about the current date and a placeholder for weather."),
  accomplishments: z.string().describe("A summary of previous day's accomplishments. Can be a gentle note if no tasks."),
  todayFocus: z.string().describe("A highlight of today's key tasks. Can be a general encouragement if no tasks."),
  motivationalQuote: z.string().describe("The provided quote, perhaps slightly rephrased for flow."),
  interactiveQuestion: z.string().optional().describe("An optional question to engage the user, e.g., 'Shall I set your focus on [First Task]?'"),
  fullBriefingText: z.string().describe("The complete briefing text, all parts concatenated for TTS."),
});

export async function generateDailyBriefing(input: DailyBriefingInput): Promise<DailyBriefingOutput> {
  return generateDailyBriefingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyBriefingPrompt',
  input: { schema: DailyBriefingInputSchema },
  output: { schema: DailyBriefingOutputSchema },
  prompt: `You are a friendly and encouraging personal assistant AI. Your task is to generate a concise and uplifting "Start My Day" audio briefing script for the user.
The script should be around 30-45 seconds when read aloud.

User's Name: {{#if userName}}{{userName}}{{else}}there{{/if}}
Current Date: {{currentDate}}
Weather (Placeholder): {{weatherPlaceholder}}

Previous Day's Completed Tasks (titles, pick 1 or 2 if many, or note if none):
{{#if previousDayTaskTitles.length}}
{{#each previousDayTaskTitles}}
- {{this}}
{{/each}}
{{else}}
No specific tasks logged as completed yesterday.
{{/if}}

Today's Key Tasks (titles, pick 1 or 2 if many, or note if none):
{{#if todayTaskTitles.length}}
{{#each todayTaskTitles}}
- {{this}}
{{/each}}
{{else}}
No specific tasks scheduled for today yet.
{{/if}}

Motivational Quote for the Day:
"{{quote.text}}"{{#if quote.author}} - {{quote.author}}{{/if}}

Based on this information, generate the script components as defined in the DailyBriefingOutput schema:
1.  greeting: Start with a warm "Good morning, [User's Name (or 'there')]."
2.  dateWeatherInfo: Mention the date and the placeholder weather. E.g., "It's {{currentDate}}, and it looks like it's {{weatherPlaceholder}} outside."
3.  accomplishments: Briefly mention 1-2 key tasks completed yesterday. If none, say something like "Hope you had a restful previous day." or "Yesterday was a fresh start!".
4.  todayFocus: Highlight 1-2 main tasks for today. If none, offer general encouragement like "Let's make today productive!" or "What will you conquer today?".
5.  motivationalQuote: Present the quote. E.g., "To get you started, here's a thought: '{{quote.text}}' {{#if quote.author}}from {{quote.author}}{{/if}}."
6.  interactiveQuestion (Optional): If there's a first task for today, ask an engaging question like, "To kick things off, shall I set your focus on your first task for the day: '{{todayTaskTitles.[0]}}'?" If no tasks, this can be omitted or a more general question.
7.  fullBriefingText: Concatenate all the above parts into a single string, suitable for Text-to-Speech. Ensure smooth transitions between parts.

Keep the tone positive, concise, and motivating.

Example for 'accomplishments' if tasks exist: "Yesterday, you made great progress, completing tasks like '{{previousDayTaskTitles.[0]}}'. Well done!"
Example for 'todayFocus' if tasks exist: "Looking ahead, your main focus today could be on '{{todayTaskTitles.[0]}}'."

Make sure the fullBriefingText flows naturally as if spoken.
`,
});

const generateDailyBriefingFlow = ai.defineFlow(
  {
    name: 'generateDailyBriefingFlow',
    inputSchema: DailyBriefingInputSchema,
    outputSchema: DailyBriefingOutputSchema,
  },
  async (input: DailyBriefingInput) => {
    const { output } = await prompt(input);
    if (!output) {
      // Fallback if AI fails to generate the structured output
      const fallbackText = `Good morning, ${input.userName || 'there'}. It's ${input.currentDate}. Have a great day! Here's a quote: "${input.quote.text}" ${input.quote.author ? `- ${input.quote.author}` : ''}.`;
      return {
        greeting: `Good morning, ${input.userName || 'there'}.`,
        dateWeatherInfo: `It's ${input.currentDate}, and it's ${input.weatherPlaceholder} outside.`,
        accomplishments: "Let's make today amazing!",
        todayFocus: "What will you achieve?",
        motivationalQuote: `Here's a thought for you: "${input.quote.text}" ${input.quote.author ? `- ${input.quote.author}` : ''}.`,
        fullBriefingText: fallbackText,
      };
    }
    return output;
  }
);
