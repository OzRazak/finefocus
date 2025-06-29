
'use server';
/**
 * @fileOverview An AI flow to estimate a suitable Pomodoro work duration for a given task title.
 *
 * - estimateTaskDuration - A function that estimates the task duration.
 * - EstimateTaskDurationInput - The input type for the estimateTaskDuration function.
 * - EstimateTaskDurationOutput - The return type for the estimateTaskDuration function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { EstimateTaskDurationInput, EstimateTaskDurationOutput, FocusDnaReport } from '@/lib/types'; // Assuming FocusDnaReport might be used later

// Define Zod Schemas
const EstimateTaskDurationInputSchema = z.object({
  taskTitle: z.string().describe("The title or description of the task."),
  // focusDnaReport: z.any().optional().describe("User's Focus DNA report, if available. (For future use)"), // Placeholder for future FocusDNA integration
});

const EstimateTaskDurationOutputSchema = z.object({
  estimatedDurationMinutes: z.number().int().min(15).max(90).describe("Suggested Pomodoro work session duration in minutes (e.g., 15, 25, 40, 50, 60). Must be between 15 and 90."),
});


export async function estimateTaskDuration(input: EstimateTaskDurationInput): Promise<EstimateTaskDurationOutput> {
  return estimateTaskDurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateTaskDurationPrompt',
  input: { schema: EstimateTaskDurationInputSchema },
  output: { schema: EstimateTaskDurationOutputSchema },
  prompt: `You are a productivity assistant. Based on the task title provided, suggest a suitable focused work session duration in minutes.
Consider the likely complexity and effort involved. Output only a single integer representing the number of minutes.
Common Pomodoro durations are 25, 40, or 50 minutes.
For very short or simple tasks (e.g., "Reply to one email", "Quick call with team lead"), suggest 15 minutes.
For tasks that seem moderately complex or require sustained focus (e.g., "Draft project outline", "Research topic X"), suggest 25 or 40 minutes.
For more complex or creative tasks that benefit from longer uninterrupted time (e.g., "Write chapter 1 of report", "Design new UI component", "Develop feature Y"), suggest 50 or 60 minutes.
Ensure the suggested duration is an integer between 15 and 90 minutes.

Task Title: "{{taskTitle}}"

Suggested duration (output only the number of minutes):
`,
});

const estimateTaskDurationFlow = ai.defineFlow(
  {
    name: 'estimateTaskDurationFlow',
    inputSchema: EstimateTaskDurationInputSchema,
    outputSchema: EstimateTaskDurationOutputSchema,
  },
  async (input: EstimateTaskDurationInput) => {
    const { output } = await prompt(input);
    if (!output || typeof output.estimatedDurationMinutes !== 'number') {
        console.warn("AI failed to provide a valid estimated duration. Defaulting to 25 minutes.", output);
        return { estimatedDurationMinutes: 25 }; // Fallback
    }
    // Ensure the output is within the desired range, clamp if necessary
    const clampedDuration = Math.max(15, Math.min(90, output.estimatedDurationMinutes));
    return { estimatedDurationMinutes: clampedDuration };
  }
);
