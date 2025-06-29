
// src/app/api/auth/google/callback/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromToken, saveGoogleTokensToSettings } from '@/lib/firebase/serverUtils';
import { adminDb } from '@/lib/firebase/admin'; 

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); 
  const errorParam = searchParams.get('error');

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  const redirectUiSuccessUrl = `${baseUrl}/planner?calendar_linked=true`; 
  const redirectUiErrorUrl = `${baseUrl}/planner?calendar_error=true`;

  if (errorParam) {
    console.error("Error received from Google OAuth:", errorParam);
    return NextResponse.redirect(`${redirectUiErrorUrl}&reason=${encodeURIComponent(errorParam)}`);
  }

  if (!googleClientId || !googleClientSecret || !baseUrl) {
    console.error("Google OAuth environment variables are not configured.");
    return NextResponse.redirect(redirectUiErrorUrl + "&reason=config_error");
  }
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!code) {
    console.error("No authorization code received from Google.");
    return NextResponse.redirect(redirectUiErrorUrl + "&reason=no_code");
  }
  
  let firebaseUserId: string | null = null;
  if (state) {
    try {
      const decodedFirebaseToken = await getUserFromToken(state);
      if (decodedFirebaseToken) {
        firebaseUserId = decodedFirebaseToken.uid;
      } else {
        console.error("Invalid Firebase ID token in state parameter.");
        return NextResponse.redirect(redirectUiErrorUrl + "&reason=invalid_state_token");
      }
    } catch (error) {
      console.error("Error verifying Firebase ID token from state:", error);
      return NextResponse.redirect(redirectUiErrorUrl + "&reason=state_verification_failed");
    }
  } else {
    console.error("No state parameter (Firebase ID token) received from Google callback.");
    return NextResponse.redirect(redirectUiErrorUrl + "&reason=no_state");
  }

  if (!firebaseUserId) {
      console.error("Could not determine Firebase User ID after state verification.");
      return NextResponse.redirect(redirectUiErrorUrl + "&reason=no_firebase_user");
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Google token exchange failed:', errorData);
      throw new Error(errorData.error_description || 'Failed to exchange code for tokens.');
    }

    const tokens = await tokenResponse.json();
    
    await saveGoogleTokensToSettings(firebaseUserId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, 
      expires_in: tokens.expires_in,
      googleCalendarLinked: true, // Explicitly set linked to true
    });
    
    return NextResponse.redirect(redirectUiSuccessUrl);

  } catch (error: any) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(redirectUiErrorUrl + `&reason=${encodeURIComponent(error.message || 'unknown_callback_error')}`);
  }
}
