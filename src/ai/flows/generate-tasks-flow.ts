
'use server';
/**
 * @fileOverview An AI flow to break down a user's task/goal description into smaller, actionable sub-tasks,
 * potentially using multimodal input and personalized context.
 *
 * - generateTasks - A function that handles the task generation process.
 * - GenerateTasksInput - The input type for the generateTasks function.
 * - GenerateTasksOutput - The return type for the generateTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateTasksInput, GenerateTasksOutput, GeneratedTask } from '@/lib/types'; // Ensure types match the updated schema

const GenerateTasksInputSchema = z.object({
  description: z.string().describe("The user's textual description of a large task or goal, or a transcript from voice input."),
  imageDataUris: z.array(z.string().url()).optional().describe("Optional array of Data URIs of images provided by the user. Each string must be a valid data URI, e.g., 'data:image/jpeg;base64,'. This can be empty."),
  historicalContext: z.array(z.string()).optional().describe("Optional titles of recently completed tasks by the user. This can be empty."),
  profileContext: z.object({
    role: z.string().optional().describe("User's self-described role, e.g., 'Software Developer', 'Student'."),
    currentProject: z.string().optional().describe("User's current project focus, e.g., 'Q3 Marketing Campaign'."),
  }).optional().describe("Optional user's profile context. Can be empty."),
  pomodoroDuration: z.number().int().positive().describe("The duration of a single Pomodoro session in minutes (e.g., 25). This helps contextualize task breakdown."),
});

const GeneratedTaskSchema = z.object({
  taskText: z.string().describe("A concise, actionable sub-task that can be completed in one or a few Pomodoro sessions."),
  estimatedPomodoros: z.number().int().min(1).describe("Estimated number of Pomodoro sessions (each of 'pomodoroDuration' minutes) to complete this sub-task. Must be at least 1.")
});

const GenerateTasksOutputSchema = z.object({
  suggestedTasks: z.array(GeneratedTaskSchema).describe("A list of simplified and actionable sub-tasks derived from the user's input, suitable for Pomodoro-style work.")
});


export async function generateTasks(input: GenerateTasksInput): Promise<GenerateTasksOutput> {
  // Validate imageDataUris if present
  if (input.imageDataUris) {
    for (const uri of input.imageDataUris) {
      if (!uri.startsWith('data:image/')) {
        // Consider throwing an error or handling it gracefully, e.g., by removing the invalid URI.
        // For now, we'll log a warning and let it pass to the AI, which might ignore it or error.
        console.warn(`Invalid image data URI provided: ${uri.substring(0, 100)}...`);
      }
    }
  }
  return generateTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTasksPrompt',
  input: {schema: GenerateTasksInputSchema},
  output: {schema: GenerateTasksOutputSchema},
  prompt: `You are a sophisticated AI Task Assistant specializing in breaking down large tasks or goals into smaller, manageable sub-tasks suitable for the Pomodoro Technique.
The user will provide a description of what they want to achieve, possibly accompanied by images and contextual information about their work.
A standard Pomodoro session for this user is {{pomodoroDuration}} minutes.

User's main input:
"{{description}}"

{{#if imageDataUris}}
The user has also provided the following image(s) for context. Analyze them to better understand the task:
{{#each imageDataUris}}
- Image: {{media url=this}}
{{/each}}
{{/if}}

{{#if profileContext}}
Consider the user's profile for personalization:
{{#if profileContext.role}}
- User's Role: {{profileContext.role}}
{{/if}}
{{#if profileContext.currentProject}}
- User's Current Project/Focus: {{profileContext.currentProject}}
{{/if}}
{{/if}}

{{#if historicalContext}}
Also consider these recently completed tasks by the user for patterns or related work:
{{#each historicalContext}}
- {{this}}
{{/each}}
{{/if}}

Your goal is to:
1.  Understand the user's main objective from their textual description AND any provided images.
2.  Use the profile context (role, current project) and historical tasks to tailor the sub-tasks if relevant.
3.  Break this objective down into a list of concise, actionable sub-tasks.
4.  Each sub-task should ideally be completable within 1 to 4 Pomodoro sessions ({{pomodoroDuration}} minutes each). Aim for tasks that are not too granular (less than 1 Pomodoro) nor too large (more than 4 Pomodoros). Ensure estimatedPomodoros is at least 1.
5.  For each sub-task, provide:
    - taskText: The clear, reworded sub-task. Make it actionable, starting with a verb.
    - estimatedPomodoros: An integer representing the estimated number of {{pomodoroDuration}}-minute Pomodoro sessions required. Must be at least 1.

Return the response as a structured list of suggested tasks according to the output schema.
For example, if the user says "Write a blog post about time management", and a Pomodoro is 25 minutes, you might suggest:
- taskText: "Outline blog post structure", estimatedPomodoros: 1
- taskText: "Research key time management techniques", estimatedPomodoros: 2
- taskText: "Draft introduction section", estimatedPomodoros: 1
- taskText: "Draft main body paragraphs", estimatedPomodoros: 3
- taskText: "Draft conclusion", estimatedPomodoros: 1
- taskText: "Review and edit entire post", estimatedPomodoros: 2

Provide the output in the specified JSON format. Ensure 'suggestedTasks' is an array of objects, each with 'taskText' and 'estimatedPomodoros' (which must be an integer greater than or equal to 1).
If the input is too vague or doesn't seem like a task, try to ask for clarification or provide very generic first steps.
`,
});

const generateTasksFlow = ai.defineFlow(
  {
    name: 'generateTasksFlow',
    inputSchema: GenerateTasksInputSchema,
    outputSchema: GenerateTasksOutputSchema,
  },
  async (input: GenerateTasksInput) => {
    const {output} = await prompt(input);
    if (!output) {
        // Attempt to return a more informative default or error structure
        return { suggestedTasks: [{ taskText: "AI could not break down the task. Please try rephrasing or adding more detail.", estimatedPomodoros: 1 }] };
    }
    // Ensure all suggested tasks have at least 1 pomodoro
    const validatedTasks = output.suggestedTasks.map(task => ({
        ...task,
        estimatedPomodoros: Math.max(1, task.estimatedPomodoros)
    }));

    return { suggestedTasks: validatedTasks };
  }
);
