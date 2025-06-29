
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Sparkles, RadioTower, Info } from 'lucide-react'; // Changed icons
import { useAuth } from '@/contexts/AuthContext';
import type { UserSettings } from '@/lib/types';
import { DEFAULT_SETTINGS, APP_NAME } from '@/lib/constants';
import PageTransition from '@/components/ui/animations/PageTransition';
import HeaderComponent from '@/components/domain/HeaderComponent';
import SettingsModal from '@/components/domain/SettingsModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function StartMyDayPage() {
  const { userSettings, setUserSettings } = useAuth();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    document.title = `Start My Day Briefing (Coming Soon) | ${APP_NAME}`;
  }, []);

  const currentEffectiveSettings = userSettings || DEFAULT_SETTINGS;

  const handleSaveSettings = (newSettings: UserSettings, wasUserChange?: boolean) => {
    setUserSettings(newSettings);
    // Toast for settings save is handled within SettingsModal if wasUserChange is true
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />
        <main className="flex-grow container mx-auto px-4 py-12 md:py-16 flex flex-col items-center justify-center">
          <Card className="w-full max-w-lg shadow-xl bg-card/80 backdrop-blur-md border-primary/30">
            <CardHeader className="text-center">
              <RadioTower className="mx-auto h-12 w-12 text-primary mb-3" />
              <CardTitle className="text-3xl font-headline text-foreground">Start Your Day Briefing</CardTitle>
              <CardDescription className="text-muted-foreground">
                Get a personalized audio summary to kickstart your productivity.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              <Alert variant="default" className="bg-yellow-100/80 dark:bg-yellow-700/30 border-yellow-500/50 text-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <AlertTitle className="font-semibold">Feature Coming Soon!</AlertTitle>
                <AlertDescription>
                  The "Start My Day" audio briefing is currently under development. We're working hard to bring you this exciting feature.
                  Stay tuned for updates! You can learn more about it on our <Link href="/features#start-my-day" className="font-medium underline hover:text-yellow-800 dark:hover:text-yellow-200">Features & Roadmap page</Link>.
                </AlertDescription>
              </Alert>

              <Button
                disabled
                variant="default"
                size="lg"
                className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow opacity-50 cursor-not-allowed"
              >
                <Sparkles className={`mr-3 h-6 w-6`} />
                Play My Daily Briefing (Soon)
              </Button>
            </CardContent>
          </Card>
        </main>
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentSettings={currentEffectiveSettings}
          onSaveSettings={handleSaveSettings}
        />
      </div>
    </PageTransition>
  );
}

    