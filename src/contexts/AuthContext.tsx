
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import {
  GoogleAuthProvider,
  OAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
import { loadUserSettings, saveUserSettings } from '@/lib/firebase/firestoreService';
import type { UserSettings, ThemePreference, FocusDnaReport, LifeAllocations, AuthContextType, UserProfile } from '@/lib/types';
import { DEFAULT_SETTINGS, LOCAL_STORAGE_SETTINGS_KEY, DEFAULT_PLANNER_LAYOUTS } from '@/lib/constants';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

const numericSettingKeys: (keyof UserSettings)[] = [
    'workDuration', 'shortBreakDuration', 'longBreakDuration', 'longBreakInterval',
    'expectedLifespan', 'soundVolume', 'totalTasksCompleted', 'completedTasksStreak',
    'goldCoins', 'silverCoins', 'timerAnimationSpeed'
];

const validateAndMergeSettings = (baseSettings: UserSettings, loadedSettings?: Partial<UserSettings> | null): UserSettings => {
    const merged = { ...baseSettings, ...(loadedSettings || {}) };

    numericSettingKeys.forEach(key => {
        const loadedValue = (loadedSettings as any)?.[key];
        let defaultValue = baseSettings[key];

        if (typeof loadedValue === 'number' && Number.isFinite(loadedValue)) {
            (merged[key] as any) = loadedValue;
        } else if (loadedValue !== undefined && typeof loadedValue === 'string' && loadedValue.trim() !== "" && !Number.isNaN(Number(loadedValue)) && Number.isFinite(Number(loadedValue))) {
            (merged[key] as any) = Number(loadedValue);
        } else {
            (merged[key] as any) = defaultValue;
        }
    });

    merged.soundVolume = Math.max(0, Math.min(1, Number.isFinite(merged.soundVolume) ? merged.soundVolume : DEFAULT_SETTINGS.soundVolume));
    merged.longBreakInterval = Math.max(1, Number.isFinite(merged.longBreakInterval) ? merged.longBreakInterval : DEFAULT_SETTINGS.longBreakInterval);
    merged.workDuration = Math.max(1, Number.isFinite(merged.workDuration) ? merged.workDuration : DEFAULT_SETTINGS.workDuration);
    merged.shortBreakDuration = Math.max(1, Number.isFinite(merged.shortBreakDuration) ? merged.shortBreakDuration : DEFAULT_SETTINGS.shortBreakDuration);
    merged.longBreakDuration = Math.max(1, Number.isFinite(merged.longBreakDuration) ? merged.longBreakDuration : DEFAULT_SETTINGS.longBreakDuration);
    merged.expectedLifespan = Math.max(1, Number.isFinite(merged.expectedLifespan) ? merged.expectedLifespan : DEFAULT_SETTINGS.expectedLifespan);
    merged.timerAnimationSpeed = Math.max(0.1, Number.isFinite(merged.timerAnimationSpeed) ? merged.timerAnimationSpeed : DEFAULT_SETTINGS.timerAnimationSpeed);


    merged.totalTasksCompleted = Math.max(0, Number.isFinite(merged.totalTasksCompleted) ? merged.totalTasksCompleted : DEFAULT_SETTINGS.totalTasksCompleted);
    merged.completedTasksStreak = Math.max(0, Number.isFinite(merged.completedTasksStreak) ? merged.completedTasksStreak : DEFAULT_SETTINGS.completedTasksStreak);
    merged.goldCoins = Math.max(0, Number.isFinite(merged.goldCoins) ? merged.goldCoins : DEFAULT_SETTINGS.goldCoins);
    merged.silverCoins = Math.max(0, Number.isFinite(merged.silverCoins) ? merged.silverCoins : DEFAULT_SETTINGS.silverCoins);


    merged.allocations = { ...baseSettings.allocations, ...(loadedSettings?.allocations || {}) };
    Object.keys(baseSettings.allocations).forEach(allocKey => {
        const key = allocKey as keyof LifeAllocations;
        const loadedAllocValue = loadedSettings?.allocations?.[key];
        let defaultAllocValue = baseSettings.allocations[key];

        if (typeof loadedAllocValue === 'number' && Number.isFinite(loadedAllocValue)) {
            merged.allocations[key] = Math.max(0, loadedAllocValue); 
        } else if (loadedAllocValue !== undefined && typeof loadedAllocValue === 'string' && loadedAllocValue.trim() !== "" && !Number.isNaN(Number(loadedAllocValue)) && Number.isFinite(Number(loadedAllocValue))) {
            merged.allocations[key] = Math.max(0, Number(loadedAllocValue)); 
        } else {
            merged.allocations[key] = defaultAllocValue;
        }
    });
    
    merged.enableCalendarIntegration = false; 
    merged.googleCalendarLinked = false;
    merged.googleAccessToken = null;
    merged.googleRefreshToken = null;
    merged.googleTokenExpiresAt = null;
    merged.calendarEventsLastFetched = null;

    return merged;
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userState, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSettingsState, setUserSettingsState] = useState<UserSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [focusDnaReport, setFocusDnaReportState] = useState<FocusDnaReport | null>(null); 
  const { setTheme, theme: currentNextTheme, resolvedTheme } = useTheme();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSetUserSettings = useCallback(async (newPartialSettings: Partial<UserSettings>) => {
    const currentEffectiveSettings = userSettingsState || DEFAULT_SETTINGS;
    const mergedSettingsInput = { ...currentEffectiveSettings, ...newPartialSettings };
    const themeToApply = mergedSettingsInput.theme || currentNextTheme as ThemePreference || DEFAULT_SETTINGS.theme;
    const settingsToSave: UserSettings = validateAndMergeSettings(DEFAULT_SETTINGS, {
        ...mergedSettingsInput, 
        theme: themeToApply,
    });
    
    setUserSettingsState(prevSettings => {
      if (prevSettings && JSON.stringify(prevSettings) === JSON.stringify(settingsToSave)) {
        return prevSettings;
      }
      return settingsToSave;
    });
    
    try {
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settingsToSave));
    } catch (storageError) {
        console.warn("Could not save settings to localStorage:", storageError);
        // Optionally inform the user if this is critical
    }


    if (userState) { 
      try {
        await saveUserSettings(userState.uid, settingsToSave);
      } catch (error) {
        console.error("Failed to save settings to Firestore (via AuthContext):", error);
        setAuthError(`Failed to sync settings: ${error instanceof Error ? error.message : String(error)}`);
        // Optionally, revert optimistic update if save fails, or notify user
      }
    }
  }, [userSettingsState, currentNextTheme, userState]);

  const handleSetFocusDnaReport = useCallback((report: FocusDnaReport | null) => {
    setFocusDnaReportState(prevReport => {
      if (JSON.stringify(prevReport) === JSON.stringify(report)) {
        return prevReport;
      }
      return report;
    });
  }, []);

  const setUser = useCallback((newProfile: UserProfile | null) => {
    setUserState(currentUser => {
      if (currentUser === null && newProfile === null) {
        return null;
      }
      if (currentUser && newProfile &&
          currentUser.uid === newProfile.uid &&
          currentUser.displayName === newProfile.displayName &&
          currentUser.email === newProfile.email &&
          currentUser.photoURL === newProfile.photoURL) {
        return currentUser; 
      }
      return newProfile; 
    });
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setIsLoadingSettings(true);
      setAuthError(null);
      let profile: UserProfile | null = null;

      try {
        if (firebaseUser) {
          profile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          };
          setUser(profile);

          let settingsFromDb = await loadUserSettings(firebaseUser.uid);
          if (settingsFromDb === null) { // Explicitly null means DB load failed or user has no settings
              console.warn("Failed to load user settings from DB, or user has no settings. Using defaults.");
              settingsFromDb = { ...DEFAULT_SETTINGS }; // Use a copy of defaults
          }
          let effectiveSettings = validateAndMergeSettings(DEFAULT_SETTINGS, settingsFromDb);
          
          effectiveSettings.displayName = profile.displayName || settingsFromDb?.displayName || null;
          effectiveSettings.photoURL = profile.photoURL || settingsFromDb?.photoURL || null;
          effectiveSettings.theme = settingsFromDb?.theme || (currentNextTheme as ThemePreference) || DEFAULT_SETTINGS.theme;
          
          const localSettingsStr = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
          let localSettingsSyncedViaDbMerge = false;
          if (localSettingsStr && settingsFromDb) {
              try {
                localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(effectiveSettings));
              } catch (storageError){ console.warn("Error writing to local storage during auth sync", storageError); }
              localSettingsSyncedViaDbMerge = true;
          } else if (!localSettingsStr && settingsFromDb) {
              try {
                localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(effectiveSettings));
              } catch (storageError){ console.warn("Error writing to local storage during auth sync", storageError); }
              localSettingsSyncedViaDbMerge = true;
          } else if (localSettingsStr && !settingsFromDb) { // No DB settings, but local exists
              try {
                  const localParsed = JSON.parse(localSettingsStr);
                  effectiveSettings = validateAndMergeSettings(DEFAULT_SETTINGS, localParsed);
                  effectiveSettings.displayName = profile.displayName || localParsed?.displayName || null;
                  effectiveSettings.photoURL = profile.photoURL || localParsed?.photoURL || null;
                  effectiveSettings.theme = localParsed?.theme || (currentNextTheme as ThemePreference) || DEFAULT_SETTINGS.theme;
                  await saveUserSettings(firebaseUser.uid, effectiveSettings); // Sync local to DB
                  try {
                     localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(effectiveSettings));
                  } catch (storageError){ console.warn("Error writing to local storage after DB save", storageError); }
                  localSettingsSyncedViaDbMerge = true;
              } catch (e) {
                   console.error("Error parsing local settings during auth merge (authenticated user):", e);
                   effectiveSettings = validateAndMergeSettings(DEFAULT_SETTINGS, settingsFromDb);
              }
          }

          if (!settingsFromDb && !localSettingsSyncedViaDbMerge) { 
              await saveUserSettings(firebaseUser.uid, effectiveSettings); // Save defaults if nothing found
          }
          
          setUserSettingsState(prevSettings => JSON.stringify(prevSettings) === JSON.stringify(effectiveSettings) ? prevSettings : effectiveSettings);
          setFocusDnaReportState(effectiveSettings.focusDnaReport || null);
          if (effectiveSettings.theme) setTheme(effectiveSettings.theme);

        } else { 
          setUser(null);
          let anonSettings: UserSettings;
          const localSettingsStr = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
          if (localSettingsStr) {
            try {
              anonSettings = validateAndMergeSettings(DEFAULT_SETTINGS, JSON.parse(localSettingsStr));
            } catch (e: any) { 
              console.error("Error parsing local settings for anonymous user:", e.message);
              anonSettings = validateAndMergeSettings(DEFAULT_SETTINGS, null);
            }
          } else {
            anonSettings = validateAndMergeSettings(DEFAULT_SETTINGS, null);
          }
          anonSettings.theme = (resolvedTheme as ThemePreference) || DEFAULT_SETTINGS.theme;

          setUserSettingsState(prevSettings => JSON.stringify(prevSettings) === JSON.stringify(anonSettings) ? prevSettings : anonSettings);
          setFocusDnaReportState(null);
        }
      } catch (error: any) {
        console.error("Error in AuthContext onAuthStateChanged callback:", error.message, error.code ? `(Code: ${error.code})` : '');
        setAuthError(`Authentication state change error: ${error.message}`);
        setUser(profile); 
        const fallbackSettings = validateAndMergeSettings(DEFAULT_SETTINGS, null);
        if (profile) { 
            fallbackSettings.displayName = profile.displayName;
            fallbackSettings.photoURL = profile.photoURL;
        }
        setUserSettingsState(prevSettings => JSON.stringify(prevSettings) === JSON.stringify(fallbackSettings) ? prevSettings : fallbackSettings);
        setFocusDnaReportState(null);
      } finally {
        setLoading(false);
        setIsLoadingSettings(false);
      }
    });

    return () => unsubscribe();
  }, [setTheme, currentNextTheme, resolvedTheme, setUser]);


  const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    setIsLoadingSettings(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setAuthError(`Google Sign-In failed: ${error.message || String(error)}`);
      setLoading(false);
      setIsLoadingSettings(false);
      throw error;
    }
  };

  const signInWithMicrosoft = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    setIsLoadingSettings(true);
    setAuthError(null);
    const provider = new OAuthProvider('microsoft.com');
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error('Error signing in with Microsoft:', error);
      setAuthError(`Microsoft Sign-In failed: ${error.message || String(error)}`);
      setLoading(false);
      setIsLoadingSettings(false);
      throw error;
    }
  };

  const signUpWithEmailPassword = async (email: string, password: string, displayName?: string, marketingOptIn?: boolean): Promise<FirebaseUser | null> => {
    setLoading(true);
    setIsLoadingSettings(true);
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      if (fbUser) {
        if (displayName) {
          await updateProfile(fbUser, { displayName });
        }
        // Initial settings for new user would be set by onAuthStateChanged
      }
      return fbUser;
    } catch (error: any) {
      console.error('Error signing up with email and password:', error);
      setAuthError(`Sign-Up failed: ${error.message || String(error)}`);
      setLoading(false);
      setIsLoadingSettings(false);
      throw error;
    }
  };

  const signInWithEmailPassword = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    setIsLoadingSettings(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Error signing in with email and password:', error);
      setAuthError(`Sign-In failed: ${error.message || String(error)}`);
      setLoading(false);
      setIsLoadingSettings(false);
      throw error;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    setIsLoadingSettings(true);
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle resetting userState and userSettingsState
    } catch (error: any) {
      console.error('Error signing out:', error);
      setAuthError(`Sign-Out failed: ${error.message || String(error)}`);
      // State should still be cleared by onAuthStateChanged, but loading might need manual reset
      setLoading(false);
      setIsLoadingSettings(false);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) {
      const noUserError = "User not authenticated to update profile.";
      setAuthError(noUserError);
      throw new Error(noUserError);
    }
    setAuthError(null);
    try {
      await updateProfile(auth.currentUser, updates);
      // Optimistically update local user profile state
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
      // Update settings with new profile info if relevant
      if (userSettingsState) { 
        const newSettings = { ...userSettingsState };
        if (updates.displayName !== undefined) newSettings.displayName = updates.displayName || null;
        if (updates.photoURL !== undefined) newSettings.photoURL = updates.photoURL || null;
        // This will also trigger a save to Firestore via handleSetUserSettings
        await handleSetUserSettings(newSettings); 
      }

    } catch (error: any) {
      console.error("Error updating user profile:", error);
      setAuthError(`Profile update failed: ${error.message || String(error)}`);
      throw error;
    }
  };


  return (
    <AuthContext.Provider value={{
        user: userState, 
        loading,
        authError, // Expose authError
        signInWithGoogle,
        signInWithMicrosoft,
        signUpWithEmailPassword,
        signInWithEmailPassword,
        signOutUser,
        updateUserProfile,
        userSettings: userSettingsState, 
        setUserSettings: handleSetUserSettings,
        isLoadingSettings,
        focusDnaReport, 
        setFocusDnaReport: handleSetFocusDnaReport, 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

