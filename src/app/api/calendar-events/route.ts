
// src/app/api/calendar-events/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromToken, loadUserSettingsForServer, saveGoogleTokensToSettings } from '@/lib/firebase/serverUtils';
import type { ExternalCalendarEvent, CalendarEventsApiResponse, UserSettings } from '@/lib/types';
import { format, parseISO, startOfDay, endOfDay, isValid } from 'date-fns'; // Added isValid

interface GoogleCalendarEvent {
  id: string;
  summary?: string; // Title
  description?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
  colorId?: string; 
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
  id_token?: string; 
}

const GOOGLE_CALENDAR_COLORS: Record<string, string> = {
  '1': 'hsl(var(--chart-1))', '2': 'hsl(var(--chart-2))', '3': 'hsl(var(--chart-3))',
  '4': 'hsl(var(--chart-4))', '5': 'hsl(var(--chart-5))', '6': 'hsl(var(--primary))',
  '7': 'hsl(var(--accent))', '8': 'hsl(var(--muted-foreground))', '9': 'hsl(var(--destructive))',
  '10': 'hsl(var(--secondary-foreground))', '11': 'hsl(var(--foreground))',
};


async function refreshAccessToken(refreshToken: string, userId: string): Promise<string | null> {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    console.error("Google OAuth client ID or secret not configured for token refresh.");
    // Consider marking calendar as unlinked or throwing an error that the client can interpret
    await saveGoogleTokensToSettings(userId, { googleCalendarLinked: false } as any);
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google token refresh failed:', errorData);
      if (errorData.error === 'invalid_grant' || errorData.error === 'unauthorized_client') {
         await saveGoogleTokensToSettings(userId, { googleCalendarLinked: false } as any); 
      }
      return null;
    }

    const tokens: GoogleTokenResponse = await response.json();
    await saveGoogleTokensToSettings(userId, {
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
    });
    return tokens.access_token;
  } catch (error: any) {
    console.error('Exception during token refresh:', error);
    // Mark as unlinked on unexpected error during refresh too
    await saveGoogleTokensToSettings(userId, { googleCalendarLinked: false } as any).catch(e => console.error("Failed to mark calendar unlinked after refresh exception:", e));
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date'); 

  if (!dateParam) {
    return NextResponse.json({ error: 'Date parameter is required.', events: [] }, { status: 400 });
  }

  let selectedDate: Date;
  try {
    selectedDate = parseISO(dateParam);
    if (!isValid(selectedDate)) { // Check if the parsed date is valid
        throw new Error('Invalid date value');
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.', events: [] }, { status: 400 });
  }

  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized. No token provided.', events: [] }, { status: 401 });
  }

  let userSettings: UserSettings | null = null;
  let userId: string | undefined;

  try {
    const decodedToken = await getUserFromToken(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized. Invalid token.', events: [] }, { status: 401 });
    }
    userId = decodedToken.uid;
    userSettings = await loadUserSettingsForServer(userId);

    if (!userSettings) {
        // This case implies an issue with loading settings, even if the user is valid.
        console.error(`Could not load settings for user ${userId}, though token was valid.`);
        return NextResponse.json({ error: 'Failed to load user settings.', events: [] }, { status: 500 });
    }

  } catch (authError: any) {
    console.error("Auth token verification or settings load failed for calendar events:", authError);
    return NextResponse.json({ error: `Authentication or settings load failed: ${authError.message}`, events: [] }, { status: 500 });
  }

  if (!userSettings.enableCalendarIntegration || !userSettings.googleCalendarLinked) {
    return NextResponse.json({ events: [] }); // Correctly return empty events, not an error status
  }

  let accessToken = userSettings.googleAccessToken;
  if (!accessToken || (userSettings.googleTokenExpiresAt && Date.now() >= userSettings.googleTokenExpiresAt)) {
    if (userSettings.googleRefreshToken && userId) { // Ensure userId is defined
      accessToken = await refreshAccessToken(userSettings.googleRefreshToken, userId);
      if (!accessToken) {
        return NextResponse.json({ error: 'Failed to refresh access token. Please re-link your calendar.', events: [] }, { status: 401 });
      }
    } else {
      if (userId) await saveGoogleTokensToSettings(userId, { googleCalendarLinked: false } as any);
      return NextResponse.json({ error: 'Access token expired and no refresh token. Please re-link your calendar.', events: [] }, { status: 401 });
    }
  }
  
  if (!accessToken) { // Double check after potential refresh
     return NextResponse.json({ error: 'No valid access token available. Please link your Google Calendar.', events: [] }, { status: 401 });
  }

  try {
    const timeMin = startOfDay(selectedDate).toISOString();
    const timeMax = endOfDay(selectedDate).toISOString();

    const calendarApiUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    calendarApiUrl.searchParams.append('timeMin', timeMin);
    calendarApiUrl.searchParams.append('timeMax', timeMax);
    calendarApiUrl.searchParams.append('singleEvents', 'true');
    calendarApiUrl.searchParams.append('orderBy', 'startTime');
    calendarApiUrl.searchParams.append('maxResults', '50');

    const calendarResponse = await fetch(calendarApiUrl.toString(), {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      console.error('Google Calendar API error:', errorData?.error);
      let friendlyMessage = `Google Calendar API error: ${errorData?.error?.message || 'Unknown error'}`;
      if (errorData?.error?.code === 401 || errorData?.error?.code === 403) { 
          friendlyMessage = "Calendar access unauthorized or forbidden. Please try re-linking your Google Calendar.";
          if (userId) await saveGoogleTokensToSettings(userId, { googleCalendarLinked: false } as any);
      }
      return NextResponse.json({ error: friendlyMessage, events: [] }, { status: calendarResponse.status });
    }

    const googleData = await calendarResponse.json();
    const fetchedEvents: ExternalCalendarEvent[] = (googleData.items || []).map((event: GoogleCalendarEvent) => ({
      id: event.id,
      title: event.summary || '(No Title)',
      startTime: event.start?.dateTime || event.start?.date || '', 
      endTime: event.end?.dateTime || event.end?.date || '',
      allDay: !!event.start?.date && !event.start?.dateTime, 
      description: event.description,
      color: event.colorId ? GOOGLE_CALENDAR_COLORS[event.colorId] || 'hsl(var(--muted))' : 'hsl(var(--muted))',
    }));
    
    if (userId) {
        saveGoogleTokensToSettings(userId, { calendarEventsLastFetched: new Date().toISOString() } as any).catch(err => {
            console.warn("Failed to update calendarEventsLastFetched timestamp:", err);
        });
    }

    return NextResponse.json({ events: fetchedEvents });

  } catch (error: any) {
    console.error('Error fetching or processing Google Calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events. ' + error.message, events: [] }, { status: 500 });
  }
}

