
// src/app/api/start-my-day/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import {
  getUserFromToken,
  loadUserSettingsForServer,
  getTasksCompletedOnDateForServer,
  getTasksScheduledForDateForServer,
  getActivePlannerInboxTasksForServer
} from '@/lib/firebase/serverUtils';
import { generateDailyBriefing } from '@/ai/flows/generate-daily-briefing-flow';
import { convertTextToSpeech } from '@/ai/flows/text-to-speech-flow';
import type { DailyBriefingInput, PlannerTask, TextToSpeechInput, UserSettings, Quote } from '@/lib/types';
import { DEFAULT_SETTINGS, TTS_VOICE_OPTIONS } from '@/lib/constants';
import { format, subDays } from 'date-fns';
import quotesData from '@/data/quotes.json';

export async function POST(request: NextRequest) {
  let userIdFromInput: string | undefined;
  let preferredVoiceFromBody: string | undefined;
  
  try {
    const body = await request.json();
    userIdFromInput = body.userId; 
    preferredVoiceFromBody = body.preferredVoice;
  } catch (jsonError: any) {
    console.error('Error parsing JSON body for /start-my-day:', jsonError);
    return NextResponse.json({ error: "Invalid request body. Please provide valid JSON.", details: jsonError.message }, { status: 400 });
  }

  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  
  let actualUserId: string | undefined;
  let userDisplayName: string | null = null;
  let userSettings: UserSettings | null = null; 
  let preferredVoice = preferredVoiceFromBody || DEFAULT_SETTINGS.preferredVoice;

  try {
    if (idToken) {
      const decodedToken = await getUserFromToken(idToken); 
      if (decodedToken) {
        actualUserId = decodedToken.uid;
        userDisplayName = decodedToken.name || null; 
        userSettings = await loadUserSettingsForServer(actualUserId);
        if (userSettings?.displayName) userDisplayName = userSettings.displayName;
        if (userSettings?.preferredVoice) preferredVoice = userSettings.preferredVoice;
      } else {
        // Token invalid, but userIdFromInput might be present for anonymous/guest flow
        if (userIdFromInput) actualUserId = userIdFromInput;
      }
    } else if (userIdFromInput) { 
        actualUserId = userIdFromInput;
        if (actualUserId) { // Ensure actualUserId is not undefined before loading settings
          userSettings = await loadUserSettingsForServer(actualUserId);
          if (userSettings?.displayName) userDisplayName = userSettings.displayName;
          if (userSettings?.preferredVoice) preferredVoice = userSettings.preferredVoice;
        }
    }
    
    if (!userSettings && actualUserId) { // If settings are still null but we have an ID (e.g., new user)
        userSettings = DEFAULT_SETTINGS; // Use defaults
    } else if (!userSettings && !actualUserId) { // Truly anonymous or error state
        userSettings = { ...DEFAULT_SETTINGS, displayName: null, photoURL: null };
    }

    if (!userDisplayName && userSettings?.displayName) {
        userDisplayName = userSettings.displayName;
    }
    if (userSettings?.preferredVoice) {
        preferredVoice = userSettings.preferredVoice;
    }


    const today = new Date();
    const yesterday = subDays(today, 1);
    let previousDayTaskTitles: string[] = [];
    let todayTaskTitles: string[] = [];

    if (actualUserId) { 
      try {
        const [completedYesterday, scheduledToday] = await Promise.all([
          getTasksCompletedOnDateForServer(actualUserId, yesterday), 
          getTasksScheduledForDateForServer(actualUserId, today)   
        ]);
        previousDayTaskTitles = completedYesterday.slice(0, 2).map(task => task.title);
        todayTaskTitles = scheduledToday.slice(0, 2).map(task => task.title);
        
        if (todayTaskTitles.length === 0) {
            const inboxTasks = await getActivePlannerInboxTasksForServer(actualUserId);
            todayTaskTitles = inboxTasks.slice(0, 2).map(task => task.title);
        }
      } catch (taskError: any) {
        console.warn("Could not fetch tasks for briefing (server-side). Error:", taskError);
        // Continue with empty task lists if fetching fails
      }
    }

    const randomQuote: Quote = quotesData[Math.floor(Math.random() * quotesData.length)];

    const briefingInput: DailyBriefingInput = {
      userName: userDisplayName,
      currentDate: format(today, "eeee, MMMM do"), 
      weatherPlaceholder: "the weather is looking quite pleasant", 
      previousDayTaskTitles,
      todayTaskTitles,
      quote: randomQuote,
    };

    let briefingScript;
    try {
      briefingScript = await generateDailyBriefing(briefingInput);
    } catch (aiError: any) {
      console.error("Error generating daily briefing script:", aiError);
      return NextResponse.json({ error: "Failed to generate briefing script.", details: aiError.message }, { status: 500 });
    }

    const ttsInput: TextToSpeechInput = {
      text: briefingScript.fullBriefingText,
      voiceId: preferredVoice || DEFAULT_SETTINGS.preferredVoice || TTS_VOICE_OPTIONS[0].id,
    };

    let audioData;
    try {
      audioData = await convertTextToSpeech(ttsInput);
    } catch (ttsError: any) {
      console.error("Error converting text to speech:", ttsError);
      return NextResponse.json({ error: "Failed to generate audio for briefing.", details: ttsError.message }, { status: 500 });
    }

    return NextResponse.json({ briefingScript, audioData });

  } catch (error: any) {
    console.error('Critical Error in /api/start-my-day:', error);
    const errorMessage = error.message || 'Failed to process request for daily briefing.';
    if (error.message && error.message.includes("client function from the server")) {
        return NextResponse.json({ error: "Server configuration error processing the briefing request." }, { status: 500 });
    }
    return NextResponse.json({ error: errorMessage, details: error.toString() }, { status: 500 });
  }
}
