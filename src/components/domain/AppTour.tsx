
'use client';

import React, { useContext, useEffect } from 'react';
import { ShepherdTour, ShepherdTourContext, type Tour } from 'react-shepherd';
import 'shepherd.js/dist/css/shepherd.css'; // Import base Shepherd CSS
import { APP_NAME } from '@/lib/constants';
import { useTheme } from 'next-themes';

const TOUR_COMPLETED_KEY = 'shepherdTourCompleted_v1';

interface AppTourWrapperProps {
  children: React.ReactNode;
  run: boolean;
  onEndTour: () => void;
}

const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true,
      label: 'Close tour',
    },
    scrollTo: { behavior: 'smooth', block: 'center' } as ScrollIntoViewOptions,
  },
  useModalOverlay: true,
  theme: 'default', // Explicitly tell Shepherd to use the default theme classes
};


const TourController: React.FC<{ run: boolean; onEndTour: () => void; steps: any[] }> = ({ run, onEndTour, steps }) => {
  const tour = useContext(ShepherdTourContext) as Tour | undefined; // Cast to Tour | undefined
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (run && tour && steps.length > 0) {
      // Add custom class for styling based on theme
      const themeClass = resolvedTheme === 'dark' ? 'shepherd-dark' : 'shepherd-light';
      document.body.classList.add(themeClass);
      
      tour.start();
      
      const handleComplete = () => {
        onEndTour();
        localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
        document.body.classList.remove(themeClass);
      };
      const handleCancel = () => {
        onEndTour();
        localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
        document.body.classList.remove(themeClass);
      };

      tour.on('complete', handleComplete);
      tour.on('cancel', handleCancel);

      return () => {
        tour.off('complete', handleComplete);
        tour.off('cancel', handleCancel);
        // Ensure theme class is removed if tour is exited prematurely
        document.body.classList.remove(themeClass);
      };
    }
  }, [run, tour, onEndTour, steps, resolvedTheme]);

  return null; // This component does not render anything itself
};


const AppTour: React.FC<AppTourWrapperProps> = ({ children, run, onEndTour }) => {
    const tourSteps = [
    {
      id: 'welcome',
      attachTo: { element: '[data-testid="app-name-header"]', on: 'bottom' as const },
      title: `Welcome to ${APP_NAME}!`,
      text: `${APP_NAME} is an AI-Powered Smart Pomodoro timer. This is the first version, with many exciting updates planned! Let's take a quick look around.`,
      buttons: [
        {
          action() { return this.cancel(); },
          classes: 'shepherd-button-secondary',
          text: 'Exit',
        },
        {
          action() { return this.next(); },
          text: 'Next',
        },
      ],
    },
    {
      id: 'tabs-navigation',
      attachTo: { element: '[data-testid="main-tabs-list"]', on: 'bottom' as const },
      title: 'Main Sections',
      text: 'Switch between the Pomodoro timer, your Task List, and the Leaderboard using these tabs.',
      buttons: [
        { action() { return this.back(); }, classes: 'shepherd-button-secondary', text: 'Back' },
        { action() { return this.next(); }, text: 'Next' },
      ],
    },
    {
      id: 'timer-controls',
      attachTo: { element: '[data-testid="timer-controls-group"]', on: 'bottom' as const },
      title: 'Timer Controls',
      text: 'Start, pause, reset your current session, or skip to the next session using these buttons.',
      buttons: [
        { action() { return this.back(); }, classes: 'shepherd-button-secondary', text: 'Back' },
        { action() { return this.next(); }, text: 'Next' },
      ],
    },
    {
      id: 'sign-in-prompt',
      attachTo: { element: '[data-testid="signin-button"]', on: 'bottom' as const },
      title: 'Sign In for Full Features',
      text: 'Create an account or sign in to save your progress, track stats, and compete on the leaderboard!',
      canClickTarget: false, 
      buttons: [
        { action() { return this.back(); }, classes: 'shepherd-button-secondary', text: 'Back' },
        { action() { return this.next(); }, text: 'Next' },
      ],
    },
    {
      id: 'settings-button',
      attachTo: { element: '[data-testid="settings-button"]', on: 'bottom' as const },
      title: 'Customize Your Experience',
      text: 'Access settings to personalize timer durations, appearance, notifications, and more.',
      buttons: [
        { action() { return this.back(); }, classes: 'shepherd-button-secondary', text: 'Back' },
        { action() { return this.next(); }, text: 'Next' },
      ],
    },
    {
      id: 'share-and-support',
      attachTo: { element: '[data-testid="share-button-trigger"]', on: 'bottom' as const },
      title: 'Share & Support',
      text: `Enjoying ${APP_NAME}? Share it with friends! You can also support the development via the "Buy Me a Coffee" link in the header.`,
      buttons: [
        { action() { return this.back(); }, classes: 'shepherd-button-secondary', text: 'Back' },
        { action() { return this.complete(); }, text: 'Finish Tour' },
      ],
    },
  ];

  return (
    <ShepherdTour steps={tourSteps} tourOptions={tourOptions}>
      <TourController run={run} onEndTour={onEndTour} steps={tourSteps} />
      {children}
    </ShepherdTour>
  );
};

export default AppTour;
