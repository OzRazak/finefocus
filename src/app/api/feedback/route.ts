
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config'; // Client-side Firestore instance
import { adminDb } from '@/lib/firebase/admin'; // Server-side Firestore instance
import { collection, addDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import type { FeedbackEntry } from '@/lib/types'; 
import { z } from 'zod';

// Schema for server-side validation
const feedbackSchema = z.object({
  name: z.string().max(100).optional(), // Added max length
  email: z.string().email({ message: "Please enter a valid email." }).max(100).optional().or(z.literal('')),
  subject: z.enum(["bug", "feature", "question", "general"], { required_error: "Please select a subject." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters long." }).max(5000, { message: "Message must be less than 5000 characters." }),
});

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userNameFromToken: string | null = null;

  try {
    // Attempt to get user from token (optional)
    const authorizationHeader = request.headers.get('Authorization');
    if (authorizationHeader?.startsWith('Bearer ')) {
        const idToken = authorizationHeader.split('Bearer ')[1];
        try {
            // Use admin SDK to verify token securely on the server
            const { getUserFromToken } = await import('@/lib/firebase/serverUtils'); // Lazy import
            const decodedToken = await getUserFromToken(idToken);
            if (decodedToken) {
                userId = decodedToken.uid;
                userEmail = decodedToken.email || null;
                userNameFromToken = decodedToken.name || null;
            }
        } catch (error) {
            console.warn("Error verifying Firebase ID token for feedback (optional):", error);
            // Don't block feedback if token verification fails, proceed as potentially anonymous
        }
    }

    const body = await request.json();

    // Validate input against schema
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input.', details: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, subject, message } = validationResult.data;

    // Construct feedback data, prioritizing token info if available for logged-in users
    const feedbackData: Omit<FeedbackEntry, 'id' | 'createdAt'> & { createdAt: FieldValue, userId?: string | null } = {
      name: name || userNameFromToken || null,
      email: email || userEmail || null, // Use provided email, fallback to token email
      subject,
      message,
      createdAt: admin.firestore.FieldValue.serverTimestamp() as FieldValue, // Use admin serverTimestamp
      status: 'new',
    };

    if (userId) {
      feedbackData.userId = userId;
    }

    // Use adminDb for server-side writes
    await adminDb.collection('feedback').add(feedbackData);

    return NextResponse.json({ message: 'Feedback submitted successfully!' }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    if (error instanceof z.ZodError) { // Should be caught by safeParse now
        return NextResponse.json({ error: 'Validation failed', details: error.flatten().fieldErrors }, { status: 400 });
    }
    if (error.type === 'entity.parse.failed' && error.message.includes('Unexpected end of JSON input')) {
        return NextResponse.json({ error: 'Invalid request body: Empty or malformed JSON.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
