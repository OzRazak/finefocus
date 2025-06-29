
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import type { PlannerTask } from '@/lib/types';
import { getActivePlannerInboxTasks, getCompletedPlannerTasks, getActivePlannerTodayTasks } from '@/lib/firebase/firestoreService';
import HeaderComponent from '@/components/domain/HeaderComponent';
import SettingsModal from '@/components/domain/SettingsModal';
import { DEFAULT_SETTINGS, APP_NAME } from '@/lib/constants';
import { Loader2, Telescope } from 'lucide-react';
import PageTransition from '@/components/ui/animations/PageTransition';
import { generateRandomColor, getCyclicColor } from '@/lib/colorUtils'; 

// Dynamically import the main canvas component
const FocusSanctuaryCanvas = dynamic(
  () => import('@/components/domain/FocusSanctuary/FocusSanctuaryCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-grow flex flex-col items-center justify-center text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Summoning the Sanctuary...</p>
      </div>
    ),
  }
);

interface SanctuaryTask {
  id: string;
  title: string;
  categoryColor: string;
  initialPosition: [number, number, number];
}

interface FocusData {
  baseColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
}

export default function FocusSanctuaryPage() {
  const { user, userSettings, setUserSettings, loading: authLoading, isLoadingSettings } = useAuth();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [sanctuaryTasks, setSanctuaryTasks] = useState<SanctuaryTask[]>([]);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [focusData, setFocusData] = useState<FocusData>({
    baseColor: '#6366f1', // indigo-500
    emissiveColor: '#818cf8', // indigo-400
    emissiveIntensity: 0.7,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  const currentEffectiveSettings = userSettings || DEFAULT_SETTINGS;

  useEffect(() => {
    document.title = `Focus Sanctuary | ${APP_NAME}`;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || authLoading || isLoadingSettings) {
        setIsLoadingData(false); 
        setSanctuaryTasks([]);
        setCompletedTasksCount(0);
        return;
      }
      setIsLoadingData(true);
      try {
        const [fetchedActiveInboxTasks, fetchedActiveTodayTasks, fetchedCompletedPlannerTasksArray] = await Promise.all([
          getActivePlannerInboxTasks(user.uid),
          getActivePlannerTodayTasks(user.uid),
          getCompletedPlannerTasks(user.uid),
        ]);
        
        const allActiveTasks = [...fetchedActiveInboxTasks, ...fetchedActiveTodayTasks];
        
        const uniqueActiveTasks = Array.from(new Map(allActiveTasks.map(task => [task.id, task])).values());


        const transformedTasks = uniqueActiveTasks.map((task, index) => {
          const angle = (index / Math.max(1, uniqueActiveTasks.length)) * Math.PI * 2; // Ensure divisor is at least 1
          const distance = 2.5 + Math.random() * 1.5; 
          return {
            id: task.id,
            title: task.title,
            categoryColor: getCyclicColor(index), 
            initialPosition: [
              Math.cos(angle) * distance,
              (Math.random() - 0.5) * 2, 
              Math.sin(angle) * distance,
            ] as [number, number, number],
          };
        });
        setSanctuaryTasks(transformedTasks);

        setCompletedTasksCount(fetchedCompletedPlannerTasksArray.length);

        // Mock Focus Data Update (replace with actual AI analysis later)
        if (uniqueActiveTasks.length > 5) {
          setFocusData({ baseColor: '#ef4444', emissiveColor: '#f87171', emissiveIntensity: 1 }); // red - high activity
        } else if (uniqueActiveTasks.length > 0) {
          setFocusData({ baseColor: '#f97316', emissiveColor: '#fb923c', emissiveIntensity: 0.8 }); // orange - medium
        } else {
          setFocusData({ baseColor: '#22c55e', emissiveColor: '#4ade80', emissiveIntensity: 0.6 }); // green - calm
        }

      } catch (error) {
        console.error("Error fetching data for Focus Sanctuary:", error);
        // Handle error (e.g., show a toast)
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user, authLoading, isLoadingSettings]);

  if (authLoading || isLoadingSettings) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
        <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />
        <div className="flex-grow flex flex-col items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-xl">Loading User Data...</p>
        </div>
      </div>
    );
  }


  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100"> {/* Dark background for the page */}
        <HeaderComponent onOpenSettings={() => setIsSettingsModalOpen(true)} />
        
        <main className="flex-grow flex flex-col relative">
          {isLoadingData && !authLoading && ( // Show loading specifically for sanctuary data if auth is done
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg">Loading Sanctuary Data...</p>
            </div>
          )}

          {!user && !authLoading && (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                <Telescope className="h-24 w-24 text-primary mb-6" />
                <h1 className="text-4xl font-bold text-primary mb-4">Enter the Focus Sanctuary</h1>
                <p className="text-lg text-slate-300 mb-8 max-w-md">
                    Sign in to visualize your tasks and achievements in an interactive 3D space.
                </p>
                {/* Add Sign In Button or prompt from HeaderComponent will be visible */}
            </div>
          )}

          {user && !isLoadingData && (
             <Suspense fallback={ // R3F Suspense for the canvas itself
                <div className="flex-grow flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg">Preparing 3D Scene...</p>
                </div>
              }>
                <FocusSanctuaryCanvas
                  tasks={sanctuaryTasks}
                  focusData={focusData}
                  completedTasksCount={completedTasksCount}
                />
            </Suspense>
          )}
        </main>

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentSettings={currentEffectiveSettings}
          onSaveSettings={setUserSettings}
        />
      </div>
    </PageTransition>
  );
}

