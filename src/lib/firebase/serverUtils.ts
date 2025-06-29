
// src/lib/firebase/serverUtils.ts
import type { DecodedIdToken } from 'firebase-admin/auth';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from './admin';
import type { UserSettings, FocusDnaReport, PlannerTask } from '@/lib/types';
import { DEFAULT_SETTINGS, DEFAULT_LIFE_ALLOCATIONS, DEFAULT_PLANNER_LAYOUTS, PLANNER_TASKS_COLLECTION } from '@/lib/constants';
import type { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { format, startOfDay, endOfDay } from 'date-fns';


interface ServerStoredUserSettings {
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  longBreakInterval?: number;
  dob?: string;
  expectedLifespan?: number;
  allocations?: UserSettings['allocations'];
  enableSoundNotifications?: boolean;
  notificationSoundFile?: string;
  soundVolume?: number;
  enableBrowserNotifications?: boolean;
  enableAddToCalendar?: boolean;
  enableAdaptiveTimer?: boolean;
  enableAnimatedBackground?: boolean;
  enableQuotes?: boolean;
  enableCalendarIntegration?: boolean;
  totalTasksCompleted?: number;
  completedTasksStreak?: number;
  lastCompletionDate?: string | null;
  backgroundType?: 'color' | 'image';
  backgroundValue?: string;
  goldCoins?: number;
  silverCoins?: number;
  displayName?: string | null;
  photoURL?: string | null;
  marketingOptIn?: boolean;
  theme?: UserSettings['theme'];
  timerAnimation?: UserSettings['timerAnimation'];
  timerAnimationSpeed?: number;
  role?: string;
  currentProject?: string;
  preferredVoice?: string;
  plannerLayouts?: UserSettings['plannerLayouts'];
  focusDnaReport?: FocusDnaReport | null;
  focusDnaReportGeneratedAt?: string | null;
  calendarEventsLastFetched?: string | null;
  googleAccessToken?: string | null;
  googleRefreshToken?: string | null;
  googleTokenExpiresAt?: number | null;
  googleCalendarLinked?: boolean;
  createdAt?: AdminTimestamp;
  updatedAt?: AdminTimestamp;
}


export async function getUserFromToken(idToken: string): Promise<DecodedIdToken | null> {
  if (!idToken) {
    console.warn("getUserFromToken called with no idToken.");
    return null;
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token in serverUtils:', error);
    return null;
  }
}

export async function loadUserSettingsForServer(userId: string): Promise<UserSettings | null> {
  if (!userId) return null;
  const USER_SETTINGS_COLLECTION = 'userSettings';
  const userSettingsRef = adminDb.collection(USER_SETTINGS_COLLECTION).doc(userId);

  try {
    const docSnap = await userSettingsRef.get();
    const data = docSnap.exists ? docSnap.data() as ServerStoredUserSettings : {} as ServerStoredUserSettings;
    const mergedSettings: UserSettings = { ...DEFAULT_SETTINGS };

      for (const key of Object.keys(DEFAULT_SETTINGS) as Array<keyof UserSettings>) {
         if (data.hasOwnProperty(key) && (data as any)[key] !== undefined) {
          (mergedSettings[key] as any) = (data as any)[key];
        }
      }
      
      mergedSettings.soundVolume = (typeof mergedSettings.soundVolume === 'number' && isFinite(mergedSettings.soundVolume))
        ? Math.max(0, Math.min(1, mergedSettings.soundVolume))
        : DEFAULT_SETTINGS.soundVolume;

      const nullableFields: (keyof UserSettings)[] = [
        'displayName', 'photoURL', 'lastCompletionDate', 'focusDnaReport',
        'focusDnaReportGeneratedAt', 'calendarEventsLastFetched',
        'googleAccessToken', 'googleRefreshToken', 'googleTokenExpiresAt'
      ];
      nullableFields.forEach(field => {
        if (mergedSettings[field] === undefined) {
          (mergedSettings[field] as any) = null;
        }
      });
    
      mergedSettings.role = mergedSettings.role ?? '';
      mergedSettings.currentProject = mergedSettings.currentProject ?? '';
      mergedSettings.allocations = mergedSettings.allocations ?? DEFAULT_LIFE_ALLOCATIONS;
      mergedSettings.plannerLayouts = mergedSettings.plannerLayouts ?? DEFAULT_PLANNER_LAYOUTS;
      mergedSettings.googleCalendarLinked = mergedSettings.googleCalendarLinked ?? false;

      return mergedSettings;
  } catch (error) {
    console.error("Error loading user settings from Firestore (serverUtils):", error);
    const errorFallbackSettings = { ...DEFAULT_SETTINGS };
    errorFallbackSettings.displayName = null;
    errorFallbackSettings.photoURL = null;
    errorFallbackSettings.lastCompletionDate = null;
    errorFallbackSettings.soundVolume = DEFAULT_SETTINGS.soundVolume; // Ensure default
    errorFallbackSettings.focusDnaReport = null;
    errorFallbackSettings.focusDnaReportGeneratedAt = null;
    errorFallbackSettings.calendarEventsLastFetched = null;
    errorFallbackSettings.role = '';
    errorFallbackSettings.currentProject = '';
    errorFallbackSettings.allocations = DEFAULT_LIFE_ALLOCATIONS;
    errorFallbackSettings.plannerLayouts = DEFAULT_PLANNER_LAYOUTS;
    errorFallbackSettings.googleAccessToken = null;
    errorFallbackSettings.googleRefreshToken = null;
    errorFallbackSettings.googleTokenExpiresAt = null;
    errorFallbackSettings.googleCalendarLinked = false;
    return errorFallbackSettings;
  }
}

interface GoogleTokenSaveData {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  googleCalendarLinked?: boolean;
  calendarEventsLastFetched?: string;
}

export async function saveGoogleTokensToSettings(userId: string, tokens: GoogleTokenSaveData): Promise<void> {
  if (!userId) throw new Error("User ID is required to save Google tokens.");

  const userSettingsRef = adminDb.collection('userSettings').doc(userId);
  const updateData: Partial<ServerStoredUserSettings> & { updatedAt: AdminTimestamp } = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp() as AdminTimestamp,
  };

  if (tokens.access_token) {
    updateData.googleAccessToken = tokens.access_token;
  }
  if (tokens.expires_in) {
    updateData.googleTokenExpiresAt = Date.now() + (tokens.expires_in * 1000);
  }
  if (tokens.refresh_token) {
    updateData.googleRefreshToken = tokens.refresh_token;
  }
  if (tokens.googleCalendarLinked !== undefined) {
    updateData.googleCalendarLinked = tokens.googleCalendarLinked;
    if (!tokens.googleCalendarLinked) { // If unlinking, clear tokens
        updateData.googleAccessToken = null;
        updateData.googleRefreshToken = null;
        updateData.googleTokenExpiresAt = null;
    }
  }
  if (tokens.calendarEventsLastFetched) {
    updateData.calendarEventsLastFetched = tokens.calendarEventsLastFetched;
  }


  await userSettingsRef.set(updateData, { merge: true });
}

// Helper to map Firestore admin docs to PlannerTask
async function mapAdminDocToPlannerTask(docSnap: admin.firestore.DocumentSnapshot): Promise<PlannerTask> {
    const data = docSnap.data()!; // Assume data exists
    const subtaskStats = data.subtaskStats || { total: 0, completed: 0 };

    return {
        id: docSnap.id,
        userId: data.userId,
        title: data.title,
        description: data.description || null,
        estimatedTime: data.estimatedTime || 0,
        panel: data.panel || 'brainDump',
        order: data.order || 0,
        isCompleted: data.isCompleted || false,
        completedAt: data.completedAt && data.completedAt.toDate ? data.completedAt.toDate().toISOString() : null,
        createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt && data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        labelIds: data.labelIds || [],
        subtasks: [], // Subtasks not fetched for briefing context
        subtaskStats: subtaskStats,
        recurrenceRule: data.recurrenceRule || null,
        timeboxedStartTime: data.timeboxedStartTime || null,
        scheduledDate: data.scheduledDate || null,
    };
}

export async function getTasksCompletedOnDateForServer(userId: string, targetDate: Date): Promise<PlannerTask[]> {
  if (!userId) return [];
  // Use admin.firestore.Timestamp for server-side operations
  const start = admin.firestore.Timestamp.fromDate(startOfDay(targetDate));
  const end = admin.firestore.Timestamp.fromDate(endOfDay(targetDate));

  const q = adminDb.collection(PLANNER_TASKS_COLLECTION)
    .where('userId', '==', userId)
    .where('isCompleted', '==', true)
    .where('completedAt', '>=', start)
    .where('completedAt', '<=', end)
    .orderBy('completedAt', 'desc');

  const querySnapshot = await q.get();
  return Promise.all(querySnapshot.docs.map(mapAdminDocToPlannerTask));
}

export async function getTasksScheduledForDateForServer(userId: string, targetDate: Date): Promise<PlannerTask[]> {
  if (!userId) return [];
  const dateString = format(targetDate, 'yyyy-MM-dd');
  const q = adminDb.collection(PLANNER_TASKS_COLLECTION)
    .where('userId', '==', userId)
    .where('isCompleted', '==', false)
    .where('panel', '==', dateString)
    .orderBy('timeboxedStartTime', 'asc')
    .orderBy('order', 'asc');

  const querySnapshot = await q.get();
  return Promise.all(querySnapshot.docs.map(mapAdminDocToPlannerTask));
}

export async function getActivePlannerInboxTasksForServer(userId: string): Promise<PlannerTask[]> {
  if (!userId) return [];
  const q = adminDb.collection(PLANNER_TASKS_COLLECTION)
    .where('userId', '==', userId)
    .where('isCompleted', '==', false)
    .where('panel', '==', 'brainDump')
    .orderBy('order', 'desc')
    .orderBy('createdAt', 'desc');
  const querySnapshot = await q.get();
  return Promise.all(querySnapshot.docs.map(mapAdminDocToPlannerTask));
}

