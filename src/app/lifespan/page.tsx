
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import HeaderComponent from '@/components/domain/HeaderComponent';
import SettingsModal from '@/components/domain/SettingsModal';
import LifespanVisualizer from '@/components/domain/LifespanVisualizer';
import { DEFAULT_SETTINGS, APP_NAME } from '@/lib/constants';
import type { UserSettings } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/ui/animations/PageTransition';

export default function LifespanPage() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const { userSettings, setUserSettings, isLoadingSettings: isLoadingAuthSettings, loading: isLoadingAuth } = useAuth();
  const [settings, setLocalSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    document.title = `Lifespan Visualizer - See Your Time | ${APP_NAME}`;
    // Meta description for client components is ideally set via server-side rendering or a general one in RootLayout.
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (userSettings) {
      setLocalSettings(userSettings);
    } else if (!isLoadingAuthSettings && !isLoadingAuth) {
      setLocalSettings(DEFAULT_SETTINGS);
    }
  }, [userSettings, isLoadingAuthSettings, isLoadingAuth]);

  const handleSaveSettings = useCallback(async (newSettings: UserSettings, wasUserChange?: boolean) => {
    await setUserSettings(newSettings);
    if (wasUserChange) {
      toast({
          title: "Settings Saved",
          description: "Your preferences have been updated.",
      });
    }
  }, [setUserSettings, toast]);

  if (!isClient || isLoadingAuth || isLoadingAuthSettings) {
    return (
        // Removed bg-background from this div
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
    <div className="flex flex-col min-h-screen">
      <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />

      <main className="flex-grow container mx-auto px-2 sm:px-4 py-8">
        <LifespanVisualizer settings={settings} onOpenSettings={() => setIsSettingsModalOpen(true)} />
      </main>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSettings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
    </PageTransition>
  );
}
