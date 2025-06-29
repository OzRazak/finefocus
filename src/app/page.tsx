
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import HeaderComponent from '@/components/domain/HeaderComponent';
import SettingsModal from '@/components/domain/SettingsModal';
import PomodoroTimer from '@/components/domain/PomodoroTimer/index';
import TaskManagementComponent from '@/components/domain/TaskManagementComponent';
import LeaderboardComponent from '@/components/domain/LeaderboardComponent';
import NewUserTutorialPrompt from '@/components/domain/NewUserTutorialPrompt';
import AppTour from '@/components/domain/AppTour';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_SETTINGS, APP_NAME } from '@/lib/constants';
import type { UserSettings } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Timer, ListChecks, Trophy, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/ui/animations/PageTransition';

type View = 'timer' | 'tasks' | 'leaderboard';
const TOUR_COMPLETED_KEY = 'shepherdTourCompleted_v1';


export default function Home() {
  const [currentView, setCurrentView] = useState<View>('timer');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const { userSettings, setUserSettings, isLoadingSettings: isLoadingAuthSettings, loading: isLoadingAuth } = useAuth();
  const [localSettingsState, setLocalSettingsState] = useState<UserSettings>(DEFAULT_SETTINGS);

  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    setIsClient(true);
    document.title = `${APP_NAME} - AI Powered Pomodoro Timer for Deep Work`;
  }, []);

  useEffect(() => {
    if (userSettings) {
      setLocalSettingsState(prevLocalSettings => {
        if (JSON.stringify(prevLocalSettings) !== JSON.stringify(userSettings)) {
          return userSettings;
        }
        return prevLocalSettings;
      });
    } else if (!isLoadingAuthSettings && !isLoadingAuth) {
      setLocalSettingsState(prevLocalSettings => {
         if (JSON.stringify(prevLocalSettings) !== JSON.stringify(DEFAULT_SETTINGS)) {
          return DEFAULT_SETTINGS;
        }
        return prevLocalSettings;
      });
    }
  }, [userSettings, isLoadingAuthSettings, isLoadingAuth]);


  const handleSaveSettings = useCallback(async (newSettings: UserSettings, wasUserChange?: boolean) => {
    await setUserSettings(newSettings); // This is AuthContext's setUserSettings
    if (wasUserChange) {
      toast({
          title: "Settings Saved",
          description: "Your preferences have been updated.",
      });
    }
  }, [setUserSettings, toast]);

  const handleStartTour = useCallback(() => {
    setRunTour(true);
  }, []);

  const handleTourEnd = useCallback(() => {
    setRunTour(false);
    if (typeof window !== "undefined") {
        localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    }
  }, []);


  if (!isClient || isLoadingAuth || isLoadingAuthSettings) {
    return (
        <div className="flex flex-col min-h-screen">
            <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />
            <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-xl text-foreground font-headline">
                        {isLoadingAuth ? "Authenticating..." : isLoadingAuthSettings ? "Loading preferences..." : "Initializing..."}
                    </p>
                </div>
            </main>
        </div>
    );
  }

  return (
    <PageTransition>
      <AppTour run={runTour} onEndTour={handleTourEnd}>
        <div className="flex flex-col min-h-screen">
          <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />

          <main className="flex-grow container mx-auto px-2 sm:px-4 py-8">
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as View)} className="w-full">
              <TabsList data-testid="main-tabs-list" className="grid w-full grid-cols-3 max-w-md mx-auto mb-8 bg-card/80 border border-border">
                <TabsTrigger value="timer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Timer className="mr-2 h-5 w-5" /> Pomodoro
                </TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ListChecks className="mr-2 h-5 w-5" /> Tasks
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Trophy className="mr-2 h-5 w-5" /> Leaderboard
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timer">
                <PomodoroTimer settings={localSettingsState} onOpenSettings={() => setIsSettingsModalOpen(true)} />
              </TabsContent>
              <TabsContent value="tasks">
                <TaskManagementComponent />
              </TabsContent>
              <TabsContent value="leaderboard">
                <LeaderboardComponent />
              </TabsContent>
            </Tabs>
          </main>

          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            currentSettings={localSettingsState}
            onSaveSettings={handleSaveSettings}
          />
          <NewUserTutorialPrompt onStartTour={handleStartTour} />
        </div>
      </AppTour>
    </PageTransition>
  );
}
