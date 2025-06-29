
'use client';

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  limit,
  deleteDoc,
  updateDoc,
  startAt,
  endAt,
  collectionGroup,
  arrayRemove,
  arrayUnion,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, firebaseApp } from './config';
import type { UserSettings, Task, LeaderboardItem, PublicProfile, ThemePreference, PlannerTask, TaskLabel, PomodoroTaskList, FocusSessionLog, TimeOfDay, PlannerSubtask, FocusDnaReport, Layout } from '@/lib/types';
import { DEFAULT_SETTINGS, PLANNER_TASKS_COLLECTION, PLANNER_LABELS_COLLECTION, TASKS_COLLECTION, SUBTASKS_COLLECTION, DEFAULT_PLANNER_LAYOUTS, DEFAULT_LIFE_ALLOCATIONS } from '@/lib/constants';
import { format, subDays, isSameDay, parseISO, getHours, startOfDay, endOfDay } from 'date-fns';

const USER_SETTINGS_COLLECTION = 'userSettings';
const PUBLIC_PROFILES_COLLECTION = 'publicProfiles';
const FOCUS_SESSIONS_COLLECTION = 'focusSessions';

const storage = getStorage(firebaseApp);


interface StoredUserSettings extends Omit<UserSettings, 'dob' | 'lastCompletionDate' | 'theme' | 'notificationSoundFile' | 'soundVolume' | 'enableAdaptiveTimer' | 'role' | 'currentProject' | 'preferredVoice' | 'plannerLayouts' | 'focusDnaReport' | 'focusDnaReportGeneratedAt' | 'enableCalendarIntegration' | 'calendarEventsLastFetched' | 'googleAccessToken' | 'googleRefreshToken' | 'googleTokenExpiresAt' | 'googleCalendarLinked'> {
  dob: string;
  lastCompletionDate: string | null;
  enableAddToCalendar?: boolean;
  enableAdaptiveTimer?: boolean;
  enableQuotes?: boolean;
  enableCalendarIntegration?: boolean;
  marketingOptIn?: boolean;
  theme?: ThemePreference;
  notificationSoundFile?: string;
  soundVolume?: number;
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
  createdAt?: Timestamp;
  updatedAt: Timestamp;
  displayName?: string | null;
  photoURL?: string | null;
}

export const saveUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
  if (!userId) throw new Error("User ID is required to save settings.");

  const userSettingsRef = doc(db, USER_SETTINGS_COLLECTION, userId);
  const publicProfileRef = doc(db, PUBLIC_PROFILES_COLLECTION, userId);
  const batch = writeBatch(db);

  try {
    const userSettingsDocSnap = await getDoc(userSettingsRef);
    const existingSettingsData = userSettingsDocSnap.exists() ? userSettingsDocSnap.data() as StoredUserSettings : {};

    const firestoreData: Record<string, any> = {};

    for (const key of Object.keys(DEFAULT_SETTINGS) as Array<keyof UserSettings>) {
      let valueToPersist: any;
      if (settings.hasOwnProperty(key) && typeof settings[key] !== 'undefined') {
        valueToPersist = settings[key];
      } else if (existingSettingsData.hasOwnProperty(key) && typeof (existingSettingsData as any)[key] !== 'undefined') {
        valueToPersist = (existingSettingsData as any)[key];
      } else {
        valueToPersist = DEFAULT_SETTINGS[key];
      }
      firestoreData[key] = valueToPersist === undefined ? null : valueToPersist;
    }

    if (firestoreData.displayName === null || firestoreData.displayName === '') {
      firestoreData.displayName = `User${userId.substring(0,4)}`;
    }

    firestoreData.soundVolume = (typeof firestoreData.soundVolume === 'number' && isFinite(firestoreData.soundVolume))
      ? Math.max(0, Math.min(1, firestoreData.soundVolume))
      : DEFAULT_SETTINGS.soundVolume;

    if (firestoreData.plannerLayouts && typeof firestoreData.plannerLayouts === 'object') {
      const layouts = firestoreData.plannerLayouts as { [key: string]: Layout[] };
      Object.keys(layouts).forEach(breakpoint => {
        if (Array.isArray(layouts[breakpoint])) {
          layouts[breakpoint] = layouts[breakpoint].map((item: any) => {
            const sanitizedItem: { [key: string]: any } = {
              i: item.i,
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
              static: !!item.static,
              isDraggable: item.isDraggable === undefined ? true : !!item.isDraggable,
              isResizable: item.isResizable === undefined ? true : !!item.isResizable,
            };
            if (item.minW !== undefined && typeof item.minW === 'number') sanitizedItem.minW = item.minW;
            if (item.maxW !== undefined && typeof item.maxW === 'number') sanitizedItem.maxW = item.maxW;
            if (item.minH !== undefined && typeof item.minH === 'number') sanitizedItem.minH = item.minH;
            if (item.maxH !== undefined && typeof item.maxH === 'number') sanitizedItem.maxH = item.maxH;
            if (item.isBounded !== undefined) sanitizedItem.isBounded = !!item.isBounded;
            return sanitizedItem as Layout;
          });
        }
      });
      firestoreData.plannerLayouts = layouts;
    }


    firestoreData.updatedAt = serverTimestamp();
    if (!userSettingsDocSnap.exists() || !existingSettingsData.createdAt) {
      firestoreData.createdAt = serverTimestamp();
    } else {
      firestoreData.createdAt = existingSettingsData.createdAt;
    }

    batch.set(userSettingsRef, firestoreData);

    const publicProfileData: Partial<PublicProfile> & { updatedAt?: any, createdAt?: any } = {};
    
    publicProfileData.displayName = firestoreData.displayName;
    if (firestoreData.photoURL !== undefined) publicProfileData.photoURL = firestoreData.photoURL;
    publicProfileData.goldCoins = Number.isFinite(firestoreData.goldCoins) ? Number(firestoreData.goldCoins) : 0;
    publicProfileData.silverCoins = Number.isFinite(firestoreData.silverCoins) ? Number(firestoreData.silverCoins) : 0;


    const publicProfileDocSnap = await getDoc(publicProfileRef);
    if (publicProfileDocSnap.exists()) {
      publicProfileData.updatedAt = serverTimestamp();
      batch.set(publicProfileRef, publicProfileData, { merge: true });
    } else {
      const newPublicProfile: PublicProfile = {
        userId: userId,
        displayName: publicProfileData.displayName!,
        photoURL: publicProfileData.photoURL ?? DEFAULT_SETTINGS.photoURL,
        goldCoins: publicProfileData.goldCoins,
        silverCoins: publicProfileData.silverCoins,
        createdAt: serverTimestamp() as Timestamp, 
        updatedAt: serverTimestamp() as Timestamp,
      };
      batch.set(publicProfileRef, newPublicProfile);
    }
    await batch.commit();
  } catch (error) {
    console.error("Error in saveUserSettings:", error);
    throw new Error(`Failed to save user settings: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const loadUserSettings = async (userId: string): Promise<UserSettings | null> => {
  if (!userId) return null;
  const userSettingsRef = doc(db, USER_SETTINGS_COLLECTION, userId);
  try {
    const docSnap = await getDoc(userSettingsRef);
    const data = docSnap.exists() ? docSnap.data() as StoredUserSettings : {} as StoredUserSettings;
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

      if (mergedSettings.displayName === null || mergedSettings.displayName === '') {
        mergedSettings.displayName = `User${userId.substring(0,4)}`;
      }

      return mergedSettings;
  } catch (error) {
    console.error("Error loading user settings from Firestore:", error);
    const errorFallbackSettings = { ...DEFAULT_SETTINGS };
    errorFallbackSettings.displayName = `User${userId.substring(0,4)}`;;
    errorFallbackSettings.photoURL = null;
    errorFallbackSettings.lastCompletionDate = null;
    errorFallbackSettings.soundVolume = DEFAULT_SETTINGS.soundVolume;
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
};

const mapDocToPlannerTask = async (docSnap: any): Promise<PlannerTask> => {
    const data = docSnap.data();
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
        completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate().toISOString() : (data.completedAt || null),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
        labelIds: data.labelIds || [],
        subtasks: [],
        subtaskStats: subtaskStats,
        recurrenceRule: data.recurrenceRule || null,
        timeboxedStartTime: data.timeboxedStartTime || null,
        scheduledDate: data.scheduledDate || null,
    } as PlannerTask;
};

// Index: plannerTasks: userId (ASC), isCompleted (ASC), panel (ASC), order (DESC), createdAt (DESC)
// This index is PRESENT in the provided image.
export const getActivePlannerInboxTasks = async (userId: string): Promise<PlannerTask[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, PLANNER_TASKS_COLLECTION),
    where('userId', '==', userId),
    where('isCompleted', '==', false),
    where('panel', '==', 'brainDump'),
    orderBy('order', 'desc'),
    orderBy('createdAt', 'desc')
  );
  try {
    const querySnapshot = await getDocs(q);
    return Promise.all(querySnapshot.docs.map(mapDocToPlannerTask));
  } catch (error) {
    console.error("Error fetching active inbox tasks:", error);
    throw new Error(`Failed to fetch inbox tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Index: plannerTasks: userId (ASC), isCompleted (ASC), panel (ASC), timeboxedStartTime (ASC), order (ASC)
// This index is PRESENT in the provided image (as part of a more comprehensive one).
export const getActivePlannerTodayTasks = async (userId: string): Promise<PlannerTask[]> => {
  if (!userId) return [];
  const todayDateString = format(new Date(), 'yyyy-MM-dd');
  const q = query(
    collection(db, PLANNER_TASKS_COLLECTION),
    where('userId', '==', userId),
    where('isCompleted', '==', false),
    where('panel', '==', todayDateString),
    orderBy('timeboxedStartTime', 'asc'),
    orderBy('order', 'asc')
  );
  try {
    const querySnapshot = await getDocs(q);
    return Promise.all(querySnapshot.docs.map(mapDocToPlannerTask));
  } catch (error) {
    console.error("Error fetching active today's planner tasks:", error);
    throw new Error(`Failed to fetch today's tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// POTENTIALLY MISSING Index for plannerTasks: userId (ASC), isCompleted (ASC), completedAt (DESC)
// Please verify if an equivalent index exists or create one if query errors occur.
export const getCompletedPlannerTasks = async (userId: string): Promise<PlannerTask[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, PLANNER_TASKS_COLLECTION),
    where('userId', '==', userId),
    where('isCompleted', '==', true),
    orderBy('completedAt', 'desc')
  );
  try {
    const querySnapshot = await getDocs(q);
    return Promise.all(querySnapshot.docs.map(mapDocToPlannerTask));
  } catch (error) {
    console.error("Error fetching completed tasks:", error);
    throw new Error(`Failed to fetch completed tasks: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Uses the same index as getCompletedPlannerTasks.
export const getRecentCompletedPlannerTaskTitles = async (userId: string, limitCount: number = 20): Promise<string[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, PLANNER_TASKS_COLLECTION),
    where('userId', '==', userId),
    where('isCompleted', '==', true),
    orderBy('completedAt', 'desc'),
    limit(limitCount)
  );
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => (doc.data() as PlannerTask).title);
  } catch (error) {
    console.error("Error fetching recent completed task titles:", error);
    return [];
  }
};

export const completePlannerTaskInDb = async (userId: string, taskId: string, currentSettings: UserSettings): Promise<UserSettings> => {
  if (!userId || !taskId) throw new Error("User ID and Task ID are required.");
  const taskRef = doc(db, PLANNER_TASKS_COLLECTION, taskId);
  const batch = writeBatch(db);
  const completionTimestamp = serverTimestamp();
  try {
    batch.update(taskRef, {
      isCompleted: true,
      completedAt: completionTimestamp,
      updatedAt: completionTimestamp,
    });
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let newStreak = currentSettings.completedTasksStreak || 0;
    if (currentSettings.lastCompletionDate) {
      try {
          const lastCompletion = parseISO(currentSettings.lastCompletionDate);
          if (!isSameDay(lastCompletion, new Date())) {
              if (isSameDay(lastCompletion, subDays(new Date(), 1))) {
                  newStreak += 1;
              } else {
                  newStreak = 1;
              }
          }
      } catch (e) {
          console.warn("Could not parse lastCompletionDate for streak calculation", currentSettings.lastCompletionDate);
          newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
    const newTotalTasksCompleted = (currentSettings.totalTasksCompleted || 0) + 1;
    await batch.commit();
    return {
        ...currentSettings,
        totalTasksCompleted: newTotalTasksCompleted,
        completedTasksStreak: newStreak,
        lastCompletionDate: todayStr,
    };
  } catch (error) {
    console.error("Error completing task in DB:", error);
    throw new Error(`Failed to complete task: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const restorePlannerTaskInDb = async (userId: string, taskId: string, currentSettings: UserSettings): Promise<UserSettings> => {
  if (!userId || !taskId) throw new Error("User ID and Task ID are required for restoring.");
  const taskRef = doc(db, PLANNER_TASKS_COLLECTION, taskId);
  try {
    await updateDoc(taskRef, {
      isCompleted: false,
      completedAt: null,
      panel: 'brainDump', 
      timeboxedStartTime: null,
      scheduledDate: null,
      updatedAt: serverTimestamp(),
    });
    const newTotalTasksCompleted = Math.max(0, (currentSettings.totalTasksCompleted || 0) - 1);
    return {
        ...currentSettings,
        totalTasksCompleted: newTotalTasksCompleted,
    };
  } catch (error) {
    console.error("Error restoring task in DB:", error);
    throw new Error(`Failed to restore task: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Index: publicProfiles: goldCoins (DESC), silverCoins (DESC)
// This index is PRESENT in the provided image.
export const getLeaderboardData = async (count: number = 20): Promise<LeaderboardItem[]> => {
  const publicProfilesQuery = query(
    collection(db, PUBLIC_PROFILES_COLLECTION),
    where('goldCoins', '>', 0),
    orderBy('goldCoins', 'desc'),
    orderBy('silverCoins', 'desc'),
    limit(count)
  );
  try {
    const querySnapshot = await getDocs(publicProfilesQuery);
    const leaderboard: LeaderboardItem[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as PublicProfile;
      leaderboard.push({
        id: docSnap.id,
        displayName: data.displayName,
        photoURL: data.photoURL,
        goldCoins: data.goldCoins,
        silverCoins: data.silverCoins,
      });
    });
    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard data from publicProfiles:", error);
    throw new Error(`Failed to fetch leaderboard: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const addPlannerTask = async (
  userId: string,
  taskData: Partial<Omit<PlannerTask, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt' | 'subtasks' | 'subtaskStats'>> & { title: string }
): Promise<PlannerTask> => {
  if (!userId) throw new Error("User ID is required to add a planner task.");
  if (!taskData.title.trim()) throw new Error("Task title cannot be empty.");
  const now = serverTimestamp();
  const newTaskDataForDb = {
    userId,
    title: taskData.title.trim(),
    description: taskData.description?.trim() || null,
    estimatedTime: taskData.estimatedTime || 0,
    panel: taskData.panel || 'brainDump',
    order: taskData.order || Date.now(),
    labelIds: taskData.labelIds || [],
    recurrenceRule: taskData.recurrenceRule || null,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
    scheduledDate: taskData.panel === 'brainDump' || !taskData.panel ? null : taskData.panel,
    timeboxedStartTime: taskData.timeboxedStartTime || null,
    completedAt: null,
    subtaskStats: { total: 0, completed: 0 },
  };
  try {
    const docRef = await addDoc(collection(db, PLANNER_TASKS_COLLECTION), newTaskDataForDb);
    const nowISO = new Date().toISOString();
    return {
      id: docRef.id,
      userId,
      title: newTaskDataForDb.title,
      description: newTaskDataForDb.description,
      estimatedTime: newTaskDataForDb.estimatedTime,
      panel: newTaskDataForDb.panel,
      order: newTaskDataForDb.order,
      labelIds: newTaskDataForDb.labelIds,
      subtasks: [],
      subtaskStats: newTaskDataForDb.subtaskStats,
      recurrenceRule: newTaskDataForDb.recurrenceRule,
      isCompleted: newTaskDataForDb.isCompleted,
      createdAt: nowISO,
      updatedAt: nowISO,
      scheduledDate: newTaskDataForDb.scheduledDate,
      completedAt: null,
      timeboxedStartTime: newTaskDataForDb.timeboxedStartTime,
    };
  } catch (error) {
    console.error("Error adding planner task to DB:", error);
    throw new Error(`Failed to add planner task: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Index: plannerTasks: userId (ASC), panel (ASC), isCompleted (ASC), timeboxedStartTime (ASC), order (ASC), createdAt (ASC)
// This index is PRESENT in the provided image.
export const getPlannerTasksForPanel = async (userId: string, panelId: string): Promise<PlannerTask[]> => {
  if (!userId) return [];
  const q = query(
    collection(db, PLANNER_TASKS_COLLECTION),
    where('userId', '==', userId),
    where('panel', '==', panelId),
    where('isCompleted', '==', false),
    orderBy('timeboxedStartTime', 'asc'),
    orderBy('order', 'asc'),
    orderBy('createdAt', 'asc')
  );
  try {
    const querySnapshot = await getDocs(q);
    return Promise.all(querySnapshot.docs.map(mapDocToPlannerTask));
  } catch (error) {
    console.error(`Error fetching planner tasks for panel ${panelId}:`, error);
    throw new Error(`Failed to fetch tasks for panel ${panelId}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const updatePlannerTask = async (
  taskId: string,
  updates: Partial<Omit<PlannerTask, 'id' | 'userId' | 'createdAt' | 'subtasks'>>
): Promise<void> => {
  if (!taskId) throw new Error("Task ID is required for updates.");
  const taskRef = doc(db, PLANNER_TASKS_COLLECTION, taskId);
  const dataToUpdate: Record<string, any> = { ...updates, updatedAt: serverTimestamp() };
  Object.keys(dataToUpdate).forEach(key => {
    if (dataToUpdate[key] === undefined) {
      dataToUpdate[key] = null;
    }
  });
  if ('panel' in updates && updates.panel !== 'brainDump') {
    dataToUpdate.scheduledDate = updates.panel;
  } else if ('panel' in updates && updates.panel === 'brainDump') {
    dataToUpdate.scheduledDate = null;
    dataToUpdate.timeboxedStartTime = null;
  }
  try {
    await updateDoc(taskRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating planner task in DB:", error);
    throw new Error(`Failed to update planner task: ${error instanceof Error ? error.message : String(error)}`);
  }
};


export const deletePlannerTask = async (taskId: string): Promise<void> => {
  if (!taskId) throw new Error("Task ID is required for deletion.");
  const taskRef = doc(db, PLANNER_TASKS_COLLECTION, taskId);
  const subtasksColRef = collection(db, PLANNER_TASKS_COLLECTION, taskId, SUBTASKS_COLLECTION);
  try {
    const subtasksSnapshot = await getDocs(subtasksColRef);
    const batch = writeBatch(db);
    subtasksSnapshot.forEach(subDoc => batch.delete(subDoc.ref));
    batch.delete(taskRef);
    await batch.commit();
  } catch (error) {
    console.error("Error deleting planner task and its subtasks from DB:", error);
    throw new Error(`Failed to delete planner task: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Suggested Subcollection Index for 'subtasks': order (ASC), createdAt (ASC)
// Create this index on the 'subtasks' subcollection if you encounter issues.
export const getSubtasks = async (taskId: string): Promise<PlannerSubtask[]> => {
  if (!taskId) return [];
  const q = query(collection(db, PLANNER_TASKS_COLLECTION, taskId, SUBTASKS_COLLECTION), orderBy('order', 'asc'), orderBy('createdAt', 'asc'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        text: data.text,
        isCompleted: data.isCompleted || false,
        order: data.order ?? Date.now(),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      } as PlannerSubtask;
    });
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    throw new Error(`Failed to fetch subtasks: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const addSubtask = async (taskId: string, subtaskData: Pick<PlannerSubtask, 'text' | 'isCompleted' | 'order'>): Promise<PlannerSubtask> => {
  if (!taskId) throw new Error("Parent Task ID is required.");
  const now = serverTimestamp();
  try {
    const docRef = await addDoc(collection(db, PLANNER_TASKS_COLLECTION, taskId, SUBTASKS_COLLECTION), {
      text: subtaskData.text.trim(),
      isCompleted: subtaskData.isCompleted,
      order: subtaskData.order ?? Date.now(),
      createdAt: now,
      updatedAt: now,
    });
    const parentTaskRef = doc(db, PLANNER_TASKS_COLLECTION, taskId);
    const parentTaskSnap = await getDoc(parentTaskRef);
    if (parentTaskSnap.exists()) {
        const currentStats = parentTaskSnap.data()?.subtaskStats || { total: 0, completed: 0 };
        await updateDoc(parentTaskRef, {
            'subtaskStats.total': currentStats.total + 1,
            updatedAt: serverTimestamp()
        });
    }
    return { id: docRef.id, ...subtaskData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Error adding subtask:", error);
    throw new Error(`Failed to add subtask: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const updateSubtask = async (taskId: string, subtaskId: string, updates: Partial<Omit<PlannerSubtask, 'id' | 'createdAt'>>): Promise<void> => {
  if (!taskId || !subtaskId) throw new Error("Task ID and Subtask ID are required.");
  const subtaskRef = doc(db, PLANNER_TASKS_COLLECTION, taskId, SUBTASKS_COLLECTION, subtaskId);
  try {
    await updateDoc(subtaskRef, { ...updates, updatedAt: serverTimestamp() });
    if (updates.hasOwnProperty('isCompleted')) {
        const parentTaskRef = doc(db, PLANNER_TASKS_COLLECTION, taskId);
        const parentTaskSnap = await getDoc(parentTaskRef);
        if (parentTaskSnap.exists()) {
            const currentStats = parentTaskSnap.data()?.subtaskStats || { total: 0, completed: 0 };
            const newCompletedCount = updates.isCompleted ? currentStats.completed + 1 : Math.max(0, currentStats.completed -1);
            await updateDoc(parentTaskRef, {
                'subtaskStats.completed': newCompletedCount,
                updatedAt: serverTimestamp()
            });
        }
    }
  } catch (error) {
    console.error("Error updating subtask:", error);
    throw new Error(`Failed to update subtask: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deleteSubtask = async (taskId: string, subtaskId: string): Promise<void> => {
  if (!taskId || !subtaskId) throw new Error("Task ID and Subtask ID are required.");
  const subtaskRef = doc(db, PLANNER_TASKS_COLLECTION, taskId, SUBTASKS_COLLECTION, subtaskId);
  try {
    const subtaskToDeleteSnap = await getDoc(subtaskRef);
    const wasCompleted = subtaskToDeleteSnap.exists() && subtaskToDeleteSnap.data()?.isCompleted;
    await deleteDoc(subtaskRef);
    const parentTaskRef = doc(db, PLANNER_TASKS_COLLECTION, taskId);
    const parentTaskSnap = await getDoc(parentTaskRef);
    if (parentTaskSnap.exists()) {
        const currentStats = parentTaskSnap.data()?.subtaskStats || { total: 0, completed: 0 };
        await updateDoc(parentTaskRef, {
            'subtaskStats.total': Math.max(0, currentStats.total - 1),
            'subtaskStats.completed': wasCompleted ? Math.max(0, currentStats.completed -1) : currentStats.completed,
            updatedAt: serverTimestamp()
        });
    }
  } catch (error) {
    console.error("Error deleting subtask:", error);
    throw new Error(`Failed to delete subtask: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Index: plannerLabels: userId (ASC), name (ASC)
// This index is PRESENT in the provided image.
export const addPlannerLabel = async (userId: string, labelData: Pick<TaskLabel, 'name' | 'color'>): Promise<TaskLabel> => {
  if (!userId) throw new Error("User ID is required.");
  const now = serverTimestamp();
  try {
    const docRef = await addDoc(collection(db, PLANNER_LABELS_COLLECTION), {
      userId,
      name: labelData.name.trim(),
      color: labelData.color,
      createdAt: now,
      updatedAt: now,
    });
    return {
      id: docRef.id,
      userId,
      name: labelData.name,
      color: labelData.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error adding planner label:", error);
    throw new Error(`Failed to add label: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getPlannerLabels = async (userId: string): Promise<TaskLabel[]> => {
  if (!userId) return [];
  const q = query(collection(db, PLANNER_LABELS_COLLECTION), where('userId', '==', userId), orderBy('name', 'asc'));
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        name: data.name,
        color: data.color,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as TaskLabel;
    });
  } catch (error) {
    console.error("Error fetching planner labels:", error);
    throw new Error(`Failed to fetch labels: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const updatePlannerLabel = async (labelId: string, updates: Partial<TaskLabel>): Promise<void> => {
  if (!labelId) throw new Error("Label ID is required for updates.");
  const labelRef = doc(db, PLANNER_LABELS_COLLECTION, labelId);
  try {
    await setDoc(labelRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error updating planner label:", error);
    throw new Error(`Failed to update label: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deletePlannerLabel = async (userId: string, labelId: string): Promise<void> => {
  if (!userId || !labelId) throw new Error("User ID and Label ID are required.");
  const labelRef = doc(db, PLANNER_LABELS_COLLECTION, labelId);
  try {
    const labelDoc = await getDoc(labelRef);
    if (!labelDoc.exists() || labelDoc.data()?.userId !== userId) {
      throw new Error("Label not found or permission denied to delete.");
    }
    await deleteDoc(labelRef);
  } catch (error) {
    console.error("Error deleting planner label:", error);
    throw new Error(`Failed to delete label: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Uses indexes that are PRESENT in the provided image.
export const getTasksForPomodoroSelector = async (userId: string): Promise<PomodoroTaskList> => {
  if (!userId) return { todayTasks: [], inboxTasks: [] };
  const todayDateString = format(new Date(), 'yyyy-MM-dd');
  const todayTasksQuery = query(
    collection(db, PLANNER_TASKS_COLLECTION),
    where('userId', '==', userId),
    where('isCompleted', '==', false),
    where('panel', '==', todayDateString),
    orderBy('timeboxedStartTime', 'asc'),
    orderBy('order', 'asc')
  );
  const inboxTasksQuery = query(
    collection(db, PLANNER_TASKS_COLLECTION),
    where('userId', '==', userId),
    where('isCompleted', '==', false),
    where('panel', '==', 'brainDump'),
    orderBy('order', 'desc'),
    orderBy('createdAt', 'desc')
  );
  try {
    const [todaySnapshot, inboxSnapshot] = await Promise.all([
      getDocs(todayTasksQuery),
      getDocs(inboxTasksQuery),
    ]);
    const todayTasks = await Promise.all(todaySnapshot.docs.map(mapDocToPlannerTask));
    const inboxTasks = await Promise.all(inboxSnapshot.docs.map(mapDocToPlannerTask));
    return { todayTasks, inboxTasks };
  } catch (error) {
    console.error("Error fetching tasks for Pomodoro selector:", error);
    throw new Error(`Failed to fetch tasks for selector: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const determineTimeOfDay = (date: Date): TimeOfDay => {
    const hour = getHours(date);
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 || hour < 5) return 'night';
    return 'unknown';
};

// Index: focusSessions: userId (ASC), timestamp (DESC)
// This index is PRESENT in the provided image.
export const logFocusSession = async (userId: string, data: Omit<FocusSessionLog, 'id' | 'userId' | 'timeOfDay'>): Promise<void> => {
  if (!userId) throw new Error("User ID is required to log focus session.");
  let sessionTimestamp: Date;
  try {
    sessionTimestamp = data.timestamp ? parseISO(data.timestamp) : new Date();
  } catch (e) {
    console.warn("Invalid timestamp provided for focus session, using current time:", data.timestamp, e);
    sessionTimestamp = new Date();
  }
  const timeOfDay = determineTimeOfDay(sessionTimestamp);
  try {
    await addDoc(collection(db, FOCUS_SESSIONS_COLLECTION), {
      userId,
      ...data,
      timestamp: sessionTimestamp.toISOString(),
      timeOfDay,
    });
  } catch (error) {
    console.error("Error logging focus session to Firestore:", error);
    throw new Error(`Failed to log focus session: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getFocusSessions = async (userId: string): Promise<FocusSessionLog[]> => {
    if (!userId) return [];
    const q = query(
        collection(db, FOCUS_SESSIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
    );
    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                userId: data.userId,
                timestamp: data.timestamp,
                focusLevel: data.focusLevel,
                pomodoroDurationMinutes: data.pomodoroDurationMinutes,
                taskId: data.taskId || null,
                taskTitle: data.taskTitle || null,
                timeOfDay: data.timeOfDay || 'unknown',
            } as FocusSessionLog;
        });
    } catch (error) {
        console.error("Error fetching focus sessions:", error);
        throw new Error(`Failed to fetch focus sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
};

// Uses the same index as getCompletedPlannerTasks.
// POTENTIALLY MISSING Index for plannerTasks: userId (ASC), isCompleted (ASC), completedAt (DESC)
export const getTasksCompletedOnDate = async (userId: string, targetDate: Date): Promise<PlannerTask[]> => {
  if (!userId) return [];
  const start = Timestamp.fromDate(startOfDay(targetDate));
  const end = Timestamp.fromDate(endOfDay(targetDate));
  const q = query(
    collection(db, PLANNER_TASKS_COLLECTION),
    where('userId', '==', userId),
    where('isCompleted', '==', true),
    where('completedAt', '>=', start),
    where('completedAt', '<=', end),
    orderBy('completedAt', 'desc')
  );
  try {
    const querySnapshot = await getDocs(q);
    return Promise.all(querySnapshot.docs.map(mapDocToPlannerTask));
  } catch (error) {
    console.error("Error fetching tasks completed on date:", error);
    throw new Error(`Failed to fetch tasks completed on ${format(targetDate, 'yyyy-MM-dd')}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Uses indexes that are PRESENT in the provided image.
export const getTasksScheduledForDate = async (userId: string, targetDate: Date): Promise<PlannerTask[]> => {
  if (!userId) return [];
  const dateString = format(targetDate, 'yyyy-MM-dd');
  const q = query(
    collection(db, PLANNER_TASKS_COLLECTION),
    where('userId', '==', userId),
    where('isCompleted', '==', false),
    where('panel', '==', dateString),
    orderBy('timeboxedStartTime', 'asc'),
    orderBy('order', 'asc')
  );
  try {
    const querySnapshot = await getDocs(q);
    return Promise.all(querySnapshot.docs.map(mapDocToPlannerTask));
  } catch (error) {
    console.error("Error fetching tasks scheduled for date:", error);
    throw new Error(`Failed to fetch tasks for ${dateString}: ${error instanceof Error ? error.message : String(error)}`);
  }
};


export const addTask = async (userId: string, taskText: string): Promise<Task> => {
  if (!userId) throw new Error("User ID is required to add a task.");
  if (!taskText.trim()) throw new Error("Task text cannot be empty.");
  try {
    const newTaskRef = await addDoc(collection(db, TASKS_COLLECTION), {
      userId,
      text: taskText,
      isCompleted: false,
      createdAt: serverTimestamp(),
      completedAt: null,
    });
    return {
      id: newTaskRef.id,
      userId,
      text: taskText,
      isCompleted: false,
      createdAt: Timestamp.now(), 
      completedAt: null,
    };
  } catch (error) {
    console.error("Error adding simple task:", error);
    throw new Error(`Failed to add task: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const completeTask = async (userId: string, taskId: string, currentSettings: UserSettings): Promise<UserSettings> => {
  if (!userId || !taskId) throw new Error("User ID and Task ID are required.");
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  const batch = writeBatch(db);
  try {
    batch.update(taskRef, {
      isCompleted: true,
      completedAt: serverTimestamp(),
    });
    await batch.commit();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let newStreak = currentSettings.completedTasksStreak || 0;
    if (currentSettings.lastCompletionDate) {
      try {
          const lastCompletion = parseISO(currentSettings.lastCompletionDate);
          if (!isSameDay(lastCompletion, new Date())) {
              if (isSameDay(lastCompletion, subDays(new Date(), 1))) {
                  newStreak += 1;
              } else {
                  newStreak = 1;
              }
          }
      } catch(e){
          console.warn("Could not parse lastCompletionDate for streak calculation (simple tasks)", currentSettings.lastCompletionDate);
          newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
    const newTotalCompleted = (currentSettings.totalTasksCompleted || 0) + 1;
    return {
        ...currentSettings,
        totalTasksCompleted: newTotalCompleted,
        completedTasksStreak: newStreak,
        lastCompletionDate: todayStr,
    };
  } catch (error) {
    console.error("Error completing simple task:", error);
    throw new Error(`Failed to complete task: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  if (!taskId) throw new Error("Task ID is required.");
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  try {
    await deleteDoc(taskRef);
  } catch (error) {
    console.error("Error deleting simple task:", error);
    throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const uploadProfileImageAndGetUrl = async (userId: string, file: File): Promise<string> => {
  if (!userId) throw new Error("User ID is required for image upload.");
  if (!file) throw new Error("File is required for image upload.");
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
  }
  const maxSizeMB = 1;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
  }
  const imageRef = storageRef(storage, `profileImages/${userId}/${Date.now()}_${file.name}`);
  try {
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image to Firebase Storage:", error);
    throw new Error("Failed to upload image. Please try again.");
  }
};
    

    
