
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UserSettings, ThemePreference, TimerAnimation } from '@/lib/types';
import { DEFAULT_SETTINGS, DEFAULT_BACKGROUND_TYPE, DEFAULT_BACKGROUND_VALUE, NOTIFICATION_SOUND_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle } from 'lucide-react';

import ProfileSettingsSection from './SettingsModalSections/ProfileSettingsSection';
import PomodoroSettingsSection from './SettingsModalSections/PomodoroSettingsSection';
import AppearanceSettingsSection from './SettingsModalSections/AppearanceSettingsSection';
import AnimationSettingsSection from './SettingsModalSections/AnimationSettingsSection';
import SoundSettingsSection from './SettingsModalSections/SoundSettingsSection';
import AudioBriefingSettingsSection from './SettingsModalSections/AudioBriefingSettingsSection';
import NotificationsAndIntegrationsSection from './SettingsModalSections/NotificationsAndIntegrationsSection';
import AIPersonalizationSettingsSection from './SettingsModalSections/AIPersonalizationSettingsSection';
import LifespanSettingsSection from './SettingsModalSections/LifespanSettingsSection';
import AdditionalFeaturesSettingsSection from './SettingsModalSections/AdditionalFeaturesSettingsSection';
import DataManagementSettingsSection from './SettingsModalSections/DataManagementSettingsSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: UserSettings;
  onSaveSettings: (newSettings: UserSettings, wasUserChange?: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSaveSettings }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const { user, updateUserProfile, signOutUser, loading: authLoading, authError } = useAuth();
  const { toast } = useToast();
  const { theme: currentNextTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const prevSettingsRef = useRef<UserSettings | undefined>();
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const userMadeChangesRef = useRef(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      audioPreviewRef.current = new Audio();
    }
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      userMadeChangesRef.current = false; // Reset on modal open
      setSettingsError(null); // Reset error on open
      const themeToApply = currentSettings.theme || currentNextTheme || DEFAULT_SETTINGS.theme;
      const newEffectiveSettings: UserSettings = {
        ...DEFAULT_SETTINGS,
        ...currentSettings,
        allocations: { ...DEFAULT_SETTINGS.allocations, ...(currentSettings.allocations || {}) },
        backgroundType: currentSettings.backgroundType || DEFAULT_BACKGROUND_TYPE,
        backgroundValue: currentSettings.backgroundValue || DEFAULT_BACKGROUND_VALUE,
        enableAddToCalendar: currentSettings.enableAddToCalendar ?? DEFAULT_SETTINGS.enableAddToCalendar,
        enableAdaptiveTimer: currentSettings.enableAdaptiveTimer ?? DEFAULT_SETTINGS.enableAdaptiveTimer,
        enableAnimatedBackground: currentSettings.enableAnimatedBackground ?? DEFAULT_SETTINGS.enableAnimatedBackground,
        enableQuotes: currentSettings.enableQuotes ?? DEFAULT_SETTINGS.enableQuotes,
        enableCalendarIntegration: currentSettings.enableCalendarIntegration ?? DEFAULT_SETTINGS.enableCalendarIntegration,
        notificationSoundFile: currentSettings.notificationSoundFile || DEFAULT_SETTINGS.notificationSoundFile,
        soundVolume: currentSettings.soundVolume ?? DEFAULT_SETTINGS.soundVolume,
        theme: themeToApply as ThemePreference,
        timerAnimation: currentSettings.timerAnimation || 'default',
        timerAnimationSpeed: currentSettings.timerAnimationSpeed || 1,
        role: currentSettings.role || DEFAULT_SETTINGS.role,
        currentProject: currentSettings.currentProject || DEFAULT_SETTINGS.currentProject,
        preferredVoice: currentSettings.preferredVoice || DEFAULT_SETTINGS.preferredVoice,
        plannerLayouts: currentSettings.plannerLayouts || DEFAULT_SETTINGS.plannerLayouts,
        focusDnaReport: currentSettings.focusDnaReport || null,
        focusDnaReportGeneratedAt: currentSettings.focusDnaReportGeneratedAt || null,
        calendarEventsLastFetched: currentSettings.calendarEventsLastFetched || null,
      };

      if (JSON.stringify(settings) !== JSON.stringify(newEffectiveSettings)) {
        setSettings(newEffectiveSettings);
      }
      prevSettingsRef.current = newEffectiveSettings;
    }
  }, [currentSettings, isOpen, currentNextTheme, settings, user]);


  useEffect(() => {
    if (!mounted || !isOpen || !prevSettingsRef.current) return;

    const hasMeaningfulChange = JSON.stringify(settings) !== JSON.stringify(prevSettingsRef.current);

    if (hasMeaningfulChange) {
      try {
        onSaveSettings(settings, userMadeChangesRef.current);
        prevSettingsRef.current = settings;
        if (userMadeChangesRef.current) {
            userMadeChangesRef.current = false;
        }
        setSettingsError(null);
      } catch (error: any) {
          console.error("Error saving settings from modal effect:", error);
          setSettingsError(`Failed to save settings: ${error.message}`);
          toast({ title: "Settings Error", description: `Failed to save settings: ${error.message}`, variant: "destructive" });
          // Optionally revert settings to prevSettingsRef.current here if desired
      }
    }
  }, [settings, mounted, isOpen, onSaveSettings, toast]);


  const createChangeHandler = <K extends keyof UserSettings>(
    setter: React.Dispatch<React.SetStateAction<UserSettings>>,
    processValue: (value: any) => UserSettings[K] = (value) => value
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    userMadeChangesRef.current = true;
    const { name, value } = e.target;
    const isNumberInput = (e.target as HTMLInputElement).type === 'number';
    
    setter(prev => {
      const newSettings = { ...prev };
      if (name.startsWith("allocations.")) {
        const allocationKey = name.split(".")[1] as keyof UserSettings['allocations'];
        newSettings.allocations = {
          ...prev.allocations,
          [allocationKey]: processValue(isNumberInput ? parseFloat(value) || 0 : value),
        };
      } else {
        (newSettings as any)[name] = processValue(isNumberInput ? parseFloat(value) || 0 : value);
      }
      return newSettings;
    });
  };
  const handleInputChange = createChangeHandler(setSettings);


  const createSwitchHandler = (
    setter: React.Dispatch<React.SetStateAction<UserSettings>>
  ) => (name: keyof Pick<UserSettings, 'enableSoundNotifications' | 'enableBrowserNotifications' | 'enableAddToCalendar' | 'enableAnimatedBackground' | 'enableQuotes' | 'enableAdaptiveTimer' | 'enableCalendarIntegration'>, checked: boolean) => {
    userMadeChangesRef.current = true;
    setter(prev => ({ ...prev, [name]: checked }));
  };
  const handleSwitchChange = createSwitchHandler(setSettings);


  const handleThemeRadioChange = useCallback((newThemeValue: string) => {
    userMadeChangesRef.current = true;
    setTheme(newThemeValue);
    setSettings(prev => ({...prev, theme: newThemeValue as ThemePreference }));
  }, [setTheme]);

  const handleBackgroundTypeChange = useCallback((value: 'color' | 'image') => {
    userMadeChangesRef.current = true;
    setSettings(prev => ({
      ...prev,
      backgroundType: value,
      backgroundValue: value === 'color'
        ? (prev.backgroundType === 'color' && prev.backgroundValue?.startsWith('#') ? prev.backgroundValue : DEFAULT_BACKGROUND_VALUE)
        : (prev.backgroundType === 'image' && prev.backgroundValue ? prev.backgroundValue : ''), 
    }));
  }, []);
  
  const handleBackgroundValueChange = useCallback((value: string) => {
    userMadeChangesRef.current = true;
    setSettings(prev => ({ ...prev, backgroundValue: value }));
  }, []);

  const handleImageSelect = useCallback((imageUrl: string) => {
    userMadeChangesRef.current = true;
    setSettings(prev => ({
      ...prev,
      backgroundType: 'image',
      backgroundValue: imageUrl,
    }));
  }, []);

  const handleTimerAnimationChange = useCallback((value: string) => {
    userMadeChangesRef.current = true;
    setSettings(prev => ({ ...prev, timerAnimation: value as TimerAnimation }));
  }, []);

  const handleTimerAnimationSliderChange = useCallback((value: number[]) => {
    userMadeChangesRef.current = true;
    setSettings(prev => ({ ...prev, timerAnimationSpeed: value[0] }));
  }, []);

  const handleNotificationSoundChange = useCallback((soundFile: string) => {
    userMadeChangesRef.current = true;
    setSettings(prev => ({ ...prev, notificationSoundFile: soundFile }));
    if (audioPreviewRef.current && settings.enableSoundNotifications) {
        try {
            if (!audioPreviewRef.current.paused) {
                audioPreviewRef.current.pause();
                audioPreviewRef.current.currentTime = 0;
            }
            audioPreviewRef.current.src = `/${soundFile}`;
            audioPreviewRef.current.volume = settings.soundVolume;
            audioPreviewRef.current.load();
            audioPreviewRef.current.play().catch(error => {
                console.warn("Audio preview play failed:", error);
                toast({
                  title: "Sound Preview Failed",
                  description: "Could not play sound. File might be missing or browser blocked it.",
                  variant: "destructive",
                  duration: 3000
                });
            });
        } catch (audioError) {
            console.error("Error handling audio preview:", audioError);
            toast({ title: "Audio Error", description: "Problem playing sound preview.", variant: "destructive" });
        }
    }
  }, [settings.enableSoundNotifications, settings.soundVolume, toast]);

  const handleSoundVolumeSliderChange = useCallback((value: number[]) => {
    userMadeChangesRef.current = true;
    const newVolume = value[0] / 100;
    setSettings(prev => ({ ...prev, soundVolume: newVolume }));
    if (audioPreviewRef.current && settings.enableSoundNotifications && settings.notificationSoundFile) {
        try {
            if (!audioPreviewRef.current.paused) {
                audioPreviewRef.current.pause();
                audioPreviewRef.current.currentTime = 0;
            }
            audioPreviewRef.current.src = `/${settings.notificationSoundFile}`;
            audioPreviewRef.current.volume = newVolume;
            audioPreviewRef.current.load();
            setTimeout(() => {
                audioPreviewRef.current?.play().catch(error => {
                    console.warn("Volume change preview play failed:", error);
                });
            }, 50);
        } catch (audioError) {
            console.error("Error handling volume change preview:", audioError);
        }
    }
  }, [settings.enableSoundNotifications, settings.notificationSoundFile]);

  const handlePreferredVoiceChange = useCallback((voiceId: string) => {
    userMadeChangesRef.current = true;
    setSettings(prev => ({ ...prev, preferredVoice: voiceId }));
    toast({ title: "Voice Preference Updated", description: `Briefing voice set.`, duration: 3000 });
  }, [toast]);

  const finalAuthError = authError || settingsError;


  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-primary font-headline">Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure your Pomodoro timer, lifespan visualization, and app appearance.
            {user ? " Settings are saved to your profile." : " Sign in to save settings to your profile."}
          </DialogDescription>
        </DialogHeader>
        {finalAuthError && (
            <div className="p-3 my-2 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                <p className="text-sm">{finalAuthError}</p>
            </div>
        )}
        <ScrollArea className="max-h-[70vh] p-1">
          <div className="space-y-6 p-4">
            {user && (
              <>
                <ProfileSettingsSection
                  initialDisplayName={user.displayName || ''}
                  initialPhotoURL={user.photoURL || ''}
                  onSaveProfile={updateUserProfile}
                  isLoading={authLoading}
                />
                <Separator className="my-6" />
              </>
            )}

            <PomodoroSettingsSection
              settings={settings}
              onInputChange={handleInputChange}
              onSwitchChange={(checked) => handleSwitchChange('enableAdaptiveTimer', checked)}
            />
            <Separator className="my-6" />

            <AppearanceSettingsSection
              theme={settings.theme || currentNextTheme || DEFAULT_SETTINGS.theme}
              backgroundType={settings.backgroundType || DEFAULT_BACKGROUND_TYPE}
              backgroundValue={settings.backgroundValue || DEFAULT_BACKGROUND_VALUE}
              enableAnimatedBackground={settings.enableAnimatedBackground ?? false}
              onThemeChange={handleThemeRadioChange}
              onBackgroundTypeChange={handleBackgroundTypeChange}
              onBackgroundValueChange={handleBackgroundValueChange}
              onImageSelect={handleImageSelect}
              onAnimatedBackgroundToggle={(checked) => handleSwitchChange('enableAnimatedBackground', checked)}
            />
            <Separator className="my-6" />
            
            <AnimationSettingsSection
              animationStyle={settings.timerAnimation || 'default'}
              animationSpeed={settings.timerAnimationSpeed || 1}
              onStyleChange={handleTimerAnimationChange}
              onSpeedChange={handleTimerAnimationSliderChange}
            />
            <Separator className="my-6" />

            <SoundSettingsSection
              enableSoundNotifications={settings.enableSoundNotifications}
              notificationSoundFile={settings.notificationSoundFile || NOTIFICATION_SOUND_OPTIONS[0].value}
              soundVolume={settings.soundVolume ?? DEFAULT_SETTINGS.soundVolume}
              onEnableToggle={(checked) => handleSwitchChange('enableSoundNotifications', checked)}
              onSoundFileChange={handleNotificationSoundChange}
              onVolumeChange={handleSoundVolumeSliderChange}
            />
            <Separator className="my-6" />

            <AudioBriefingSettingsSection
                preferredVoice={settings.preferredVoice || DEFAULT_SETTINGS.preferredVoice}
                onPreferredVoiceChange={handlePreferredVoiceChange}
            />
            <Separator className="my-6" />

            <NotificationsAndIntegrationsSection
              enableBrowserNotifications={settings.enableBrowserNotifications}
              enableAddToCalendar={settings.enableAddToCalendar ?? DEFAULT_SETTINGS.enableAddToCalendar}
              enableCalendarIntegration={settings.enableCalendarIntegration ?? DEFAULT_SETTINGS.enableCalendarIntegration}
              onBrowserNotificationsToggle={(checked) => handleSwitchChange('enableBrowserNotifications', checked)}
              onAddToCalendarToggle={(checked) => handleSwitchChange('enableAddToCalendar', checked)}
              onCalendarIntegrationToggle={(checked) => handleSwitchChange('enableCalendarIntegration', checked)}
            />
            <Separator className="my-6" />
            
            {user && (
              <>
                <AIPersonalizationSettingsSection
                  role={settings.role || ''}
                  currentProject={settings.currentProject || ''}
                  onInputChange={handleInputChange}
                />
                <Separator className="my-6" />
              </>
            )}
            
            <LifespanSettingsSection
                settings={settings}
                onInputChange={handleInputChange}
                onCloseModal={onClose}
            />
            <Separator className="my-6" />

            <AdditionalFeaturesSettingsSection
                enableQuotes={settings.enableQuotes ?? false}
                onQuotesToggle={(checked) => handleSwitchChange('enableQuotes', checked)}
            />
            <Separator className="my-6" />

            <DataManagementSettingsSection
              settings={settings}
              onImportSettings={(event) => {
                userMadeChangesRef.current = true; 
                const file = event.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e_reader) => {
                    try {
                      const imported = JSON.parse(e_reader.target?.result as string) as UserSettings;
                      if (imported.workDuration && imported.dob && imported.allocations) {
                        const themeToSet = imported.theme || currentNextTheme || DEFAULT_SETTINGS.theme;
                        const mergedWithDefaults = {
                          ...DEFAULT_SETTINGS, ...imported,
                          enableAddToCalendar: imported.enableAddToCalendar ?? DEFAULT_SETTINGS.enableAddToCalendar,
                          enableAdaptiveTimer: imported.enableAdaptiveTimer ?? DEFAULT_SETTINGS.enableAdaptiveTimer,
                          enableAnimatedBackground: imported.enableAnimatedBackground ?? DEFAULT_SETTINGS.enableAnimatedBackground,
                          enableQuotes: imported.enableQuotes ?? DEFAULT_SETTINGS.enableQuotes,
                          enableCalendarIntegration: imported.enableCalendarIntegration ?? DEFAULT_SETTINGS.enableCalendarIntegration,
                          notificationSoundFile: imported.notificationSoundFile || DEFAULT_SETTINGS.notificationSoundFile,
                          soundVolume: imported.soundVolume ?? DEFAULT_SETTINGS.soundVolume,
                          theme: themeToSet as ThemePreference,
                          role: imported.role || DEFAULT_SETTINGS.role,
                          currentProject: imported.currentProject || DEFAULT_SETTINGS.currentProject,
                          preferredVoice: imported.preferredVoice || DEFAULT_SETTINGS.preferredVoice,
                          plannerLayouts: imported.plannerLayouts || DEFAULT_SETTINGS.plannerLayouts,
                          focusDnaReport: imported.focusDnaReport || null,
                          focusDnaReportGeneratedAt: imported.focusDnaReportGeneratedAt || null,
                          calendarEventsLastFetched: imported.calendarEventsLastFetched || null,
                        };
                        setSettings(mergedWithDefaults);
                        if (themeToSet) setTheme(themeToSet);
                        toast({ title: "Settings Imported", description: "Your settings have been loaded." });
                      } else {
                        toast({ title: "Import Error", description: "Invalid settings file format.", variant: "destructive" });
                         userMadeChangesRef.current = false;
                      }
                    } catch (error: any) {
                      console.error("Error importing settings:", error);
                      toast({ title: "Import Error", description: `Error reading settings file: ${error.message}`, variant: "destructive" });
                       userMadeChangesRef.current = false; 
                    }
                  };
                  reader.readAsText(file);
                  event.target.value = ''; 
                } else {
                    userMadeChangesRef.current = false; 
                }
              }}
              user={user}
              onLogout={async () => {
                try {
                    await signOutUser();
                    toast({ title: "Signed Out", description: "You have been successfully signed out."});
                    onClose();
                } catch (error: any) {
                    toast({ title: "Sign Out Error", description: error.message, variant: "destructive"});
                }
              }}
              authLoading={authLoading}
            />
            
            <DialogFooter className="mt-8">
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
