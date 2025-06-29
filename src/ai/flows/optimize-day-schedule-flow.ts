
'use server';
/**
 * @fileOverview An AI flow to optimize a user's daily task schedule based on their Focus DNA.
 *
 * - optimizeDaySchedule - A function that handles the day schedule optimization.
 * - OptimizeDayScheduleInput - The input type for the optimizeDaySchedule function.
 * - OptimizeDayScheduleOutput - The return type for the optimizeDaySchedule function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { PlannerTask, FocusDnaReport, TaskForOptimization, OptimizeDayScheduleInput, OptimizedTaskSuggestion, OptimizeDayScheduleOutput, PeakTimeInsight, SessionLengthInsight, TaskImpactInsight } from '@/lib/types'; // Ensure all necessary types are imported


// Schemas for FocusDnaReport parts (if not already defined and exported from types.ts in a Zod-compatible way for flow input)
// Assuming FocusDnaReport structure from previous step is available and its sub-schemas are defined or can be inferred.
// If FocusDnaReport is complex, it might be better to pass only key insights to this flow.
// For this example, let's assume a simplified FocusDnaReport structure or that it's passed as a JSON string / less strictly typed object for simplicity in the AI prompt.
// However, for strong typing with Zod, you'd define Zod schemas for FocusDnaReport and its nested parts.

const TaskForOptimizationSchema = z.object({
  id: z.string(),
  title: z.string(),
  estimatedTime: z.number().int().positive().describe("Estimated time in minutes to complete the task."),
});

// Re-define FocusDNA schemas if they are not directly usable or if a simpler version is preferred for this flow
const PeakTimeInsightSchema = z.object({
  period: z.string().describe("e.g., 'Mornings (9-11 AM)', 'Late Afternoons'"),
  description: z.string().describe("A brief explanation of the insight."),
});

const SessionLengthInsightSchema = z.object({
  taskTypeContext: z.string().describe("e.g., 'For analytical tasks', 'For creative tasks', 'Generally'"),
  optimalLength: z.string().describe("e.g., '45-60 minutes', 'around 30 minutes'"),
  reasoning: z.string().optional().describe("Brief reasoning if available."),
});

const TaskImpactInsightSchema = z.object({
    factor: z.string().describe("e.g., 'Linking specific tasks', 'Working on unlinked tasks'"),
    impactDescription: z.string().describe("Description of the observed impact on focus."),
});

const FocusDnaReportSchema = z.object({
  summary: z.string().optional(),
  peakProductivityTimes: z.array(PeakTimeInsightSchema).optional(),
  optimalSessionLengths: z.array(SessionLengthInsightSchema).optional(),
  taskImpacts: z.array(TaskImpactInsightSchema).optional(),
  recommendations: z.array(z.string()).optional(),
  dataSufficiencyMessage: z.string().optional(),
}).nullable().describe("User's Focus DNA report. Can be null if not available.");


const OptimizeDayScheduleInputSchema = z.object({
  tasksForDay: z.array(TaskForOptimizationSchema).describe("List of tasks to be scheduled for the day."),
  focusDnaReport: FocusDnaReportSchema.optional().describe("The user's Focus DNA report, if available. This provides insights into their peak productivity times and other focus patterns."),
  dayStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).describe("Start time for the workday, e.g., '09:00'."),
  dayEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).describe("End time for the workday, e.g., '17:00'."),
  currentDate: z.string().describe("The current date for which the schedule is being optimized, in YYYY-MM-DD format."),
});

const OptimizedTaskSuggestionSchema = z.object({
  taskId: z.string().describe("The ID of the task."),
  suggestedStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).describe("Suggested start time for the task in HH:mm format."),
  notes: z.string().optional().describe("Optional notes from the AI about scheduling this specific task."),
});

const OptimizeDayScheduleOutputSchema = z.object({
  optimizedSchedule: z.array(OptimizedTaskSuggestionSchema).describe("The list of tasks with their suggested start times."),
  overallNotes: z.string().optional().describe("General notes from the AI about the generated schedule, e.g., if some tasks couldn't be scheduled."),
});


export async function optimizeDaySchedule(input: OptimizeDayScheduleInput): Promise<OptimizeDayScheduleOutput> {
  return optimizeDayScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeDaySchedulePrompt',
  input: { schema: OptimizeDayScheduleInputSchema },
  output: { schema: OptimizeDayScheduleOutputSchema },
  prompt: `You are an expert productivity coach and day scheduler. Your goal is to create an optimized timeboxed schedule for the user's tasks for the date: {{currentDate}}.

User's Workday: From {{dayStartTime}} to {{dayEndTime}}.

Tasks to Schedule:
{{#each tasksForDay}}
- Task ID: {{id}}, Title: "{{title}}", Estimated Duration: {{estimatedTime}} minutes.
{{/each}}

{{#if focusDnaReport}}
User's Focus DNA Insights (use these to inform scheduling):
  {{#if focusDnaReport.peakProductivityTimes}}
  Peak Productivity Times:
    {{#each focusDnaReport.peakProductivityTimes}}
    - {{period}}: {{description}}
    {{/each}}
  {{else}}
  No specific peak productivity times identified in the report.
  {{/if}}
  {{#if focusDnaReport.optimalSessionLengths}}
  Optimal Session Lengths:
    {{#each focusDnaReport.optimalSessionLengths}}
    - {{taskTypeContext}}: {{optimalLength}}{{#if reasoning}} (Reason: {{reasoning}}){{/if}}
    {{/each}}
  {{/if}}
  {{#if focusDnaReport.recommendations}}
  General Recommendations from DNA:
    {{#each focusDnaReport.recommendations}}
    - {{this}}
    {{/each}}
  {{/if}}
{{else}}
No specific Focus DNA report provided. Use general productivity best practices:
- Schedule more demanding tasks when people are typically more alert (e.g., mid-morning after settling in, or early afternoon for some).
- Avoid scheduling very long blocks of demanding work without breaks.
- Consider task variety.
{{/if}}

Instructions:
1.  Create a schedule for the provided tasks within the user's workday ({{dayStartTime}} - {{dayEndTime}}).
2.  Each task has an estimated duration in minutes. Ensure the scheduled time slot accommodates this duration.
3.  Tasks should not overlap.
4.  If a Focus DNA report is available, prioritize scheduling:
    *   High-concentration tasks (assume tasks with longer estimated times or containing keywords like 'develop', 'research', 'write', 'analyze' are more demanding) during identified peak productivity periods.
    *   Lighter tasks (e.g., 'emails', 'quick calls', 'review') or tasks that fit well with shorter focus bursts can be scheduled during other times or potential focus dips.
5.  If no Focus DNA is provided, apply general principles: e.g., tackle demanding tasks earlier or when energy is typically higher.
6.  It's okay if not all tasks can be scheduled. Prioritize based on the information you have.
7.  Output the schedule as an array of 'optimizedSchedule' objects, each containing 'taskId' and 'suggestedStartTime' (in HH:mm format).
8.  Provide 'overallNotes' if you have comments about the schedule, like tasks that couldn't fit or advice on breaks between scheduled tasks.

Important Considerations:
- Be realistic about fitting tasks. Do not schedule tasks past {{dayEndTime}}.
- Assume tasks are done sequentially without explicit break times scheduled by you, unless a task's estimated time is very long (e.g., > 90-120 min), then note a short break might be good after it.
- The 'suggestedStartTime' is the key output for each task.

Output strictly in the specified JSON format for OptimizeDayScheduleOutput.
Example for a task: { "taskId": "task123", "suggestedStartTime": "10:00" }
If a task cannot be scheduled, do not include it in the 'optimizedSchedule' array, and mention it in 'overallNotes'.
`,
});

const optimizeDayScheduleFlow = ai.defineFlow(
  {
    name: 'optimizeDayScheduleFlow',
    inputSchema: OptimizeDayScheduleInputSchema,
    outputSchema: OptimizeDayScheduleOutputSchema,
  },
  async (input: OptimizeDayScheduleInput) => {
    if (!input.tasksForDay || input.tasksForDay.length === 0) {
      return {
        optimizedSchedule: [],
        overallNotes: "No tasks provided to schedule for the day.",
      };
    }

    const { output } = await prompt(input);
    if (!output) {
      // This case should ideally be handled by Genkit/LLM if it can't produce valid JSON based on schema
      // or if the prompt itself fails.
      throw new Error("AI failed to generate an optimized schedule. Output was null or undefined.");
    }
    
    // Basic validation of start times (ensure they are within the day, though AI should handle this)
    // More complex validation (like overlap checks) could be added here if needed,
    // but the prompt instructs the AI to handle non-overlapping.
    output.optimizedSchedule.forEach(item => {
        if (item.suggestedStartTime < input.dayStartTime || item.suggestedStartTime >= input.dayEndTime) {
            console.warn(`AI suggested a start time ${item.suggestedStartTime} for task ${item.taskId} which is outside the workday ${input.dayStartTime}-${input.dayEndTime}. This might be an issue with the AI's scheduling logic or interpretation of durations.`);
            // Decide how to handle: remove it, adjust, or let it pass and note in UI.
            // For now, let it pass, relying on the prompt to guide the AI.
        }
    });

    return output;
  }
);
