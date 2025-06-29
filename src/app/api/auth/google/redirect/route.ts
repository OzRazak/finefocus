
// src/app/api/auth/google/redirect/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/firebase/serverUtils';

export async function GET(request: NextRequest) {
  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!idToken) {
    // For client-side initiated redirects, it's better if the client passes its ID token.
    // If this route is hit directly without a session/token, we can't associate it with a user yet.
    // A common pattern is for the client to hit this, then this API route redirects to Google.
    // If the user is *not* logged into your app, you might redirect to your app's login page first,
    // or proceed with Google login and attempt to link accounts later.
    // For this example, we'll assume client passes the ID token to this route if logged in.
    // Or, if not passed, we proceed but won't have user context immediately.
    // A more robust solution uses a server-side session.

    // If called directly by a client button *after* Firebase login, the client should send its ID token.
    // This example will proceed assuming the ID token might be passed in the state or fetched by a client-side component.
    // For a simple redirect, let's assume the user is initiating this.
    // A more secure method involves the client requesting this, which then provides the URL or redirects.
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!googleClientId || !baseUrl) {
    console.error("Google Client ID or Base URL is not configured in environment variables.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events.readonly',
    'https://www.googleapis.com/auth/userinfo.email', // Optional: to verify user
    'https://www.googleapis.com/auth/userinfo.profile' // Optional: for display
  ];

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', googleClientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('access_type', 'offline'); // To get a refresh token
  authUrl.searchParams.append('prompt', 'consent'); // Important to get refresh_token on subsequent authorizations
  
  // Pass Firebase ID token in state to associate Google account with Firebase user on callback
  // Ensure this ID token is short-lived or use a CSRF token for better security.
  // For this example, we'll use the ID token directly if provided.
  if (idToken) {
    authUrl.searchParams.append('state', idToken);
  }


  return NextResponse.redirect(authUrl.toString());
}
