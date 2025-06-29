
'use server';
/**
 * @fileOverview An AI flow to analyze user's focus session logs and generate a "Focus DNA" report.
 *
 * - analyzeFocusDna - A function that handles the Focus DNA analysis.
 * - AnalyzeFocusDnaInput - The input type for the analyzeFocusDna function.
 * - AnalyzeFocusDnaOutput - The return type for the analyzeFocusDna function (FocusDnaReport).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { AnalyzeFocusDnaInput, AnalyzeFocusDnaOutput, FocusSessionLog, PeakTimeInsight, SessionLengthInsight, TaskImpactInsight } from '@/lib/types';

// Define Zod Schemas for nested structures in the output
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

const AnalyzeFocusDnaInputSchema = z.object({
  focusSessions: z.array(
    z.object({
      id: z.string().optional(),
      userId: z.string(),
      timestamp: z.string().describe("ISO string for when the session ended and was rated"),
      focusLevel: z.number().min(1).max(5).describe("1 (low) to 5 (high)"),
      pomodoroDurationMinutes: z.number().int().positive(),
      taskId: z.string().optional().nullable(),
      taskTitle: z.string().optional().nullable(),
      timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night', 'unknown']),
    })
  ).describe("An array of the user's logged focus sessions."),
});


const AnalyzeFocusDnaOutputSchema = z.object({
  summary: z.string().optional().describe("A general overview or a message if more data is needed."),
  peakProductivityTimes: z.array(PeakTimeInsightSchema).optional().describe("Insights about when the user is most productive."),
  optimalSessionLengths: z.array(SessionLengthInsightSchema).optional().describe("Insights about optimal session lengths for focus."),
  taskImpacts: z.array(TaskImpactInsightSchema).optional().describe("Insights on how task linkage or type impacts focus. Optional if not enough data."),
  recommendations: z.array(z.string()).optional().describe("Actionable recommendations to improve focus."),
  dataSufficiencyMessage: z.string().optional().describe("A message about data sufficiency, e.g., 'More data needed for detailed task impact analysis.'"),
}).describe("The generated Focus DNA report with insights and recommendations.");


export async function analyzeFocusDna(input: AnalyzeFocusDnaInput): Promise<AnalyzeFocusDnaOutput> {
  return analyzeFocusDnaFlow(input);
}

const MIN_SESSIONS_FOR_ANALYSIS = 10; // Arbitrary minimum number of sessions for a meaningful analysis

const prompt = ai.definePrompt({
  name: 'analyzeFocusDnaPrompt',
  input: { schema: AnalyzeFocusDnaInputSchema },
  output: { schema: AnalyzeFocusDnaOutputSchema },
  prompt: `You are a productivity coach AI specializing in analyzing focus patterns from Pomodoro session logs.
The user has provided a list of their focus sessions. Each session includes a timestamp, duration, focus level (1-5, 5 is best), linked task (if any), and time of day.

Your goal is to generate a "Focus DNA" report with actionable insights.

Input Data:
Focus Sessions:
{{#each focusSessions}}
- Date: {{timestamp}}
- Duration: {{pomodoroDurationMinutes}} min
- Focus Level: {{focusLevel}}/5
- Task: {{#if taskTitle}}{{taskTitle}}{{else}}N/A{{/if}}
- Time of Day: {{timeOfDay}}
{{/each}}

Please analyze this data and provide insights for the following sections if the data is sufficient (at least ${MIN_SESSIONS_FOR_ANALYSIS} sessions recommended for good insights, fewer can still provide general observations):

1.  **Summary (Optional):**
    *   If less than ${MIN_SESSIONS_FOR_ANALYSIS} sessions, state that more data is needed for a comprehensive report and provide 1-2 very general focus tips.
    *   If enough data, provide a brief overview of key findings.

2.  **Peak Productivity Times (Optional):**
    *   Identify times of day (morning, afternoon, evening, night) or specific hour ranges where the user consistently reports higher focus levels.
    *   Format as: { period: "e.g., Mornings (9-11 AM)", description: "You tend to report higher focus..." }

3.  **Optimal Session Lengths (Optional):**
    *   Analyze if certain session durations correlate with higher focus. Consider if task titles provide context (e.g., "coding", "writing" vs "emails").
    *   Format as: { taskTypeContext: "e.g., For analytical tasks", optimalLength: "e.g., 45-60 minutes", reasoning: "Optional reasoning..." }
    *   If not enough data to differentiate by task type, provide general observations.

4.  **Task Impacts (Optional, requires task data):**
    *   If task titles are provided, analyze if there's a difference in focus when a specific task is linked vs. general focus sessions.
    *   Format as: { factor: "Linking specific tasks", impactDescription: "Correlates with a X% higher average focus." }
    *   Be cautious with claims if data is sparse.

5.  **Recommendations (Optional, 2-3 actionable tips):**
    *   Based on the analysis, provide 2-3 concise, actionable recommendations to help the user improve their focus.
    *   Examples: "Consider scheduling demanding tasks during your peak morning hours.", "Experiment with 45-minute focus blocks for coding.", "Try taking short walks during breaks after analytical work."

6.  **Data Sufficiency Message (Optional):**
    *   If some analyses are not possible due to insufficient data (e.g., fewer than 3-5 sessions with task titles for task impact), mention it here. E.g., "More data with linked tasks is needed to analyze task impact on focus."

**Output Structure:**
Ensure your response strictly adheres to the JSON schema for AnalyzeFocusDnaOutput.
If a section cannot be determined due to lack of data, omit the field or provide an empty array. The 'summary' or 'dataSufficiencyMessage' should explain why.
Be factual and data-driven. If the data is too sparse for a strong conclusion in a section, state that or offer very general advice.

Example for a recommendation: "Your focus seems highest in the morning. Try scheduling your most demanding tasks before noon."
Example for optimal session length: { taskTypeContext: "Generally", optimalLength: "around {{defaultPomodoroDuration}} minutes (your most common session length)", reasoning: "This duration appears to maintain consistent focus levels in your logs."} - you'll need to infer a common duration or use a placeholder if that's not directly available. Let's assume most sessions are around the user's typical Pomodoro length.
Prioritize insights that are clearly supported by the provided data. If an insight is speculative, phrase it cautiously (e.g., "It appears that...", "You might find...").
Focus on patterns rather than one-off instances.
`,
});

const analyzeFocusDnaFlow = ai.defineFlow(
  {
    name: 'analyzeFocusDnaFlow',
    inputSchema: AnalyzeFocusDnaInputSchema,
    outputSchema: AnalyzeFocusDnaOutputSchema,
  },
  async (input: AnalyzeFocusDnaInput) => {
    if (!input.focusSessions || input.focusSessions.length < 1) {
      return {
        summary: "No focus session data provided. Please log some sessions to generate your Focus DNA report.",
        dataSufficiencyMessage: "No data to analyze.",
        peakProductivityTimes: [],
        optimalSessionLengths: [],
        taskImpacts: [],
        recommendations: ["Log your focus after Pomodoro sessions to unlock personalized insights!"]
      };
    }
    
    // Add a simple check for minimum data for a more detailed report.
    if (input.focusSessions.length < MIN_SESSIONS_FOR_ANALYSIS / 2) { // e.g. less than 5 sessions
        // Try to generate a very basic report, or guide the user.
        const { output } = await prompt(input);
        if (!output) {
            return {
                summary: `You've logged ${input.focusSessions.length} session(s). Keep logging to unlock more detailed insights!`,
                dataSufficiencyMessage: `More data needed for a comprehensive report. Aim for at least ${MIN_SESSIONS_FOR_ANALYSIS} sessions.`,
                recommendations: ["Continue rating your focus after each session to build up your data.", "Try to link tasks to your Pomodoros for more specific insights."]
            };
        }
        // Even with few sessions, the LLM might provide some output based on the prompt.
        // We augment it if it's too sparse.
        if (!output.summary && (!output.peakProductivityTimes || output.peakProductivityTimes.length ===0)) {
            output.summary = output.summary || `You've logged ${input.focusSessions.length} session(s). More data will provide richer insights.`;
            output.dataSufficiencyMessage = output.dataSufficiencyMessage || `Keep logging to unlock your full Focus DNA! At least ${MIN_SESSIONS_FOR_ANALYSIS} sessions are recommended.`;
            output.recommendations = output.recommendations || ["Keep rating your focus to build your personalized report!"];
        }
        return output;
    }


    const { output } = await prompt(input);
    if (!output) {
      // This case should ideally be handled by Genkit/LLM if it can't produce valid JSON based on schema
      // or if the prompt itself fails.
      // However, providing a fallback.
      return {
        summary: "Could not generate a Focus DNA report at this time. The AI might be having trouble processing the data.",
        dataSufficiencyMessage: "Analysis failed. Please try again later.",
        recommendations: ["Ensure you have a stable internet connection and try generating the report again."]
      };
    }
    return output;
  }
);
