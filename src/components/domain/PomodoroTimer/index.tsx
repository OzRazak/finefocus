
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { UserSettings, TimerMode, PlannerTask, TimerAnimation, PomodoroTaskList, FocusSessionLog, EstimateTaskDurationInput, EstimateTaskDurationOutput, CompletedSessionDetails } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth'; // For user prop type
import { formatTime, sendNotification, requestNotificationPermission, formatGoogleCalendarDate } from '@/lib/utils';
import { DEFAULT_SETTINGS, MIN_GOLD_COINS_PER_POMODORO, MAX_GOLD_COINS_PER_POMODORO, SILVER_COINS_PER_POMODORO } from '@/lib/constants';
import { getTasksForPomodoroSelector, addPlannerTask, logFocusSession } from '@/lib/firebase/firestoreService';
import { suggestBreakActivity } from '@/ai/flows/suggest-break-flow';
import { estimateTaskDuration } from '@/ai/flows/estimate-task-duration-flow';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import QuoteCard from '@/components/domain/QuoteCard';
import FocusMusicPlayer from './FocusMusicPlayer';
import PomodoroCard from './PomodoroCard';
import { Loader2 } from 'lucide-react';
import { format, parseISO, isSameDay, subDays } from 'date-fns';


interface PomodoroTimerProps {
  settings: UserSettings; 
  onOpenSettings: () => void;
}


const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ settings: initialSettings, onOpenSettings }) => {
  const { user, userSettings, setUserSettings } = useAuth();
  
  const safeSettings = useMemo(() => {
    const base = userSettings || initialSettings || DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS, 
      ...base,             
      workDuration: (Number.isFinite(base?.workDuration) && base.workDuration > 0) ? base.workDuration : DEFAULT_SETTINGS.workDuration,
      shortBreakDuration: (Number.isFinite(base?.shortBreakDuration) && base.shortBreakDuration > 0) ? base.shortBreakDuration : DEFAULT_SETTINGS.shortBreakDuration,
      longBreakDuration: (Number.isFinite(base?.longBreakDuration) && base.longBreakDuration > 0) ? base.longBreakDuration : DEFAULT_SETTINGS.longBreakDuration,
      longBreakInterval: (Number.isFinite(base?.longBreakInterval) && base.longBreakInterval > 0) ? base.longBreakInterval : DEFAULT_SETTINGS.longBreakInterval,
      totalTasksCompleted: Number.isFinite(base?.totalTasksCompleted) ? base.totalTasksCompleted : DEFAULT_SETTINGS.totalTasksCompleted,
      goldCoins: Number.isFinite(base?.goldCoins) ? base.goldCoins : DEFAULT_SETTINGS.goldCoins,
      silverCoins: Number.isFinite(base?.silverCoins) ? base.silverCoins : DEFAULT_SETTINGS.silverCoins,
      soundVolume: (typeof base?.soundVolume === 'number' && isFinite(base.soundVolume)) ? Math.max(0, Math.min(1, base.soundVolume)) : DEFAULT_SETTINGS.soundVolume,
      timerAnimationSpeed: (Number.isFinite(base?.timerAnimationSpeed) && base.timerAnimationSpeed > 0) ? base.timerAnimationSpeed : DEFAULT_SETTINGS.timerAnimationSpeed,
    };
  }, [userSettings, initialSettings]);


  const [mode, setMode] = useState<TimerMode>('work');
  const [timeRemaining, setTimeRemaining] = useState(safeSettings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodorosInCycle, setCompletedPomodorosInCycle] = useState(0);

  const [totalCompletedPomodoros, setTotalCompletedPomodoros] = useState(safeSettings.totalTasksCompleted);

  const [pomodoroTasks, setPomodoroTasks] = useState<PomodoroTaskList>({ todayTasks: [], inboxTasks: [] });
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskIdState] = useState<string | null>(null);
  const [newQuickTaskText, setNewQuickTaskText] = useState('');
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);

  const [showAddToCalendarButton, setShowAddToCalendarButton] = useState(false);
  const [lastFocusSessionDetails, setLastFocusSessionDetails] = useState<{ title: string, startTime: Date, endTime: Date } | null>(null);

  const [showFocusRatingPrompt, setShowFocusRatingPrompt] = useState(false);
  const [completedSessionInfo, setCompletedSessionInfo] = useState<CompletedSessionDetails | null>(null);
  const [currentBreakSuggestion, setCurrentBreakSuggestion] = useState<string | null>(null);
  const [isSuggestingBreak, setIsSuggestingBreak] = useState(false);
  const [isEstimatingDuration, setIsEstimatingDuration] = useState(false);

  const [currentAdaptiveWorkDuration, setCurrentAdaptiveWorkDuration] = useState<number | null>(null);
  const [pendingSettingsUpdate, setPendingSettingsUpdate] = useState<Partial<UserSettings> | null>(null);


  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioNotificationRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setTotalCompletedPomodoros(safeSettings.totalTasksCompleted);
  }, [safeSettings.totalTasksCompleted]);

  const fetchPomodoroTasks = useCallback(async () => {
    if (user?.uid) {
        setIsLoadingTasks(true);
        try {
            const tasks = await getTasksForPomodoroSelector(user.uid);
            setPomodoroTasks(tasks);
        } catch (err: any) {
            console.error("Error fetching tasks for Pomodoro selector:", err);
            toast({
                title: "Task Loading Issue",
                description: "Could not load tasks for Pomodoro. Check connection or permissions.",
                variant: "destructive",
                duration: 7000,
            });
            setPomodoroTasks({ todayTasks: [], inboxTasks: [] });
        } finally {
            setIsLoadingTasks(false);
        }
    } else {
        setPomodoroTasks({ todayTasks: [], inboxTasks: [] });
        setIsLoadingTasks(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPomodoroTasks();
  }, [fetchPomodoroTasks]);

  const getDuration = useCallback((currentMode: TimerMode) => {
    if (currentMode === 'work') {
        if (safeSettings.enableAdaptiveTimer && currentAdaptiveWorkDuration !== null) {
            return currentAdaptiveWorkDuration * 60;
        }
        return safeSettings.workDuration * 60;
    }
    switch (currentMode) {
      case 'shortBreak':
        return safeSettings.shortBreakDuration * 60;
      case 'longBreak':
        return safeSettings.longBreakDuration * 60;
      default: 
        return safeSettings.workDuration * 60;
    }
  }, [safeSettings, currentAdaptiveWorkDuration]);

  const selectedTaskObject = useMemo(() => {
    if (!selectedTaskId) return null;
    return [...pomodoroTasks.todayTasks, ...pomodoroTasks.inboxTasks].find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, pomodoroTasks.todayTasks, pomodoroTasks.inboxTasks]);

  const dynamicModeText = mode === 'work'
    ? (selectedTaskObject ? selectedTaskObject.title : 'Focus Session')
    : mode === 'shortBreak' ? 'Short Break' : 'Long Break';

  const longBreakInterval = safeSettings.longBreakInterval > 0 ? safeSettings.longBreakInterval : DEFAULT_SETTINGS.longBreakInterval;
  const currentCycleText = `Cycle ${Math.floor(totalCompletedPomodoros / longBreakInterval) + 1}`;
  const currentSessionInCycle = (mode === 'longBreak' && completedPomodorosInCycle === 0 && totalCompletedPomodoros > 0 && totalCompletedPomodoros % longBreakInterval === 0) 
                                ? longBreakInterval 
                                : (completedPomodorosInCycle % longBreakInterval) + 1;
  const cycleText = `${currentCycleText} - Session ${currentSessionInCycle > longBreakInterval ? longBreakInterval : currentSessionInCycle}`;

  useEffect(() => {
    if (pendingSettingsUpdate) {
      setUserSettings(pendingSettingsUpdate); // AuthContext will merge with its current state
      setPendingSettingsUpdate(null);
    }
  }, [pendingSettingsUpdate, setUserSettings]);

  const proceedToNextMode = useCallback(async (previousMode: TimerMode, wasSkipped: boolean = false) => {
    const message = previousMode === 'work' ? "Work session complete! Time for a break." : "Break over! Ready to focus?";
    const volume = safeSettings.soundVolume;

    if (safeSettings.enableSoundNotifications && audioNotificationRef.current && !wasSkipped && typeof window !== 'undefined') {
        audioNotificationRef.current.volume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : DEFAULT_SETTINGS.soundVolume;
        audioNotificationRef.current.play().catch(e => console.warn("Audio play error:", e));
    }
    if (safeSettings.enableBrowserNotifications && !wasSkipped) sendNotification("AuxoFocus Timer", { body: message });

    let nextMode: TimerMode = 'work';
    let settingsUpdatePayload: Partial<UserSettings> = {};
    let newTotalCompletedPomodoros = totalCompletedPomodoros;

    if (previousMode === 'work') {
        const newCompletedInCycle = completedPomodorosInCycle + 1;
        if (!wasSkipped) {
          setCompletedPomodorosInCycle(newCompletedInCycle);
          newTotalCompletedPomodoros = totalCompletedPomodoros + 1;
          setTotalCompletedPomodoros(newTotalCompletedPomodoros); // Local state update

          const todayStr = format(new Date(), 'yyyy-MM-dd');
          let newStreak = safeSettings.completedTasksStreak || 0;
          if (safeSettings.lastCompletionDate) {
            try {
              const lastCompletion = parseISO(safeSettings.lastCompletionDate);
              if (!isSameDay(lastCompletion, new Date())) {
                if (isSameDay(lastCompletion, subDays(new Date(), 1))) newStreak += 1;
                else newStreak = 1;
              }
            } catch(e) { newStreak = 1; }
          } else {
            newStreak = 1;
          }

          if (user) {
              const awardedGold = Math.floor(Math.random() * (MAX_GOLD_COINS_PER_POMODORO - MIN_GOLD_COINS_PER_POMODORO + 1)) + MIN_GOLD_COINS_PER_POMODORO;
              const awardedSilver = SILVER_COINS_PER_POMODORO;
              settingsUpdatePayload = {
                  totalTasksCompleted: newTotalCompletedPomodoros,
                  goldCoins: (safeSettings.goldCoins || 0) + awardedGold,
                  silverCoins: (safeSettings.silverCoins || 0) + awardedSilver,
                  lastCompletionDate: todayStr,
                  completedTasksStreak: newStreak,
              };
              toast({ title: "Session Complete!", description: `You earned ${awardedGold} Gold & ${awardedSilver} Silver! ${message}`, variant: "default", duration: 6000 });
          } else { 
              settingsUpdatePayload = {
                  totalTasksCompleted: newTotalCompletedPomodoros,
                  lastCompletionDate: todayStr,
                  completedTasksStreak: newStreak,
              };
              toast({ title: "Session Complete!", description: message, variant: "default" });
          }
          setPendingSettingsUpdate(settingsUpdatePayload); // Queue update for AuthContext
        }

        if (newCompletedInCycle >= safeSettings.longBreakInterval) {
            nextMode = 'longBreak';
            if (!wasSkipped) setCompletedPomodorosInCycle(0);
        } else {
            nextMode = 'shortBreak';
        }
    } else { 
        nextMode = 'work';
        setCurrentBreakSuggestion(null);
        if(!wasSkipped) {
            toast({ title: "Timer Update", description: message, variant: "default" });
        }
    }

    if (wasSkipped) {
       if (previousMode === 'work' && (completedPomodorosInCycle + 1) >= safeSettings.longBreakInterval) {
         nextMode = 'longBreak';
         setCompletedPomodorosInCycle(0); 
       } else if (previousMode === 'work') {
         nextMode = 'shortBreak';
       } else { 
         nextMode = 'work';
         setCurrentBreakSuggestion(null);
       }
       toast({ title: "Session Skipped", description: `Moving to ${nextMode === 'work' ? 'Focus' : (nextMode === 'shortBreak' ? 'Short Break' : 'Long Break')}.`, variant: "default" });
    }

    setCurrentAdaptiveWorkDuration(null); 
    setMode(nextMode);
    setIsRunning(false);
    setTimeRemaining(getDuration(nextMode)); 

    if (user && (safeSettings.enableAddToCalendar ?? DEFAULT_SETTINGS.enableAddToCalendar) && previousMode === 'work' && !wasSkipped && completedSessionInfo) {
        const sessionEndTime = new Date();
        const sessionStartTime = new Date(sessionEndTime.getTime() - completedSessionInfo.durationMinutes * 60000);
        setLastFocusSessionDetails({
            title: `AuxoFocus: ${completedSessionInfo.taskTitle || 'Focus Session'}`,
            startTime: sessionStartTime,
            endTime: sessionEndTime,
        });
        setShowAddToCalendarButton(true);
    }

  }, [completedPomodorosInCycle, safeSettings, toast, user, getDuration, completedSessionInfo, totalCompletedPomodoros]);


  const handleReset = useCallback(() => {
    setIsRunning(false);
    if(timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    let newWorkDurationSeconds = safeSettings.workDuration * 60;
    if (mode === 'work' && safeSettings.enableAdaptiveTimer && currentAdaptiveWorkDuration !== null) {
        newWorkDurationSeconds = currentAdaptiveWorkDuration * 60;
    } else if (mode === 'work' && safeSettings.enableAdaptiveTimer && selectedTaskObject?.estimatedTime && selectedTaskObject.estimatedTime > 0) {
        newWorkDurationSeconds = selectedTaskObject.estimatedTime * 60;
    }
    setTimeRemaining(mode === 'work' ? newWorkDurationSeconds : getDuration(mode));

    setShowAddToCalendarButton(false);
    setLastFocusSessionDetails(null);
    setShowFocusRatingPrompt(false);
    setCurrentBreakSuggestion(null);
  }, [mode, getDuration, safeSettings.workDuration, safeSettings.enableAdaptiveTimer, currentAdaptiveWorkDuration, selectedTaskObject]);

  const setAdaptiveTimeForTask = async (task: PlannerTask | { title: string; estimatedTime?: number }) => {
    if (task.estimatedTime && task.estimatedTime > 0) {
      setCurrentAdaptiveWorkDuration(task.estimatedTime);
      setTimeRemaining(task.estimatedTime * 60);
      setIsRunning(false); 
    } else {
      setIsEstimatingDuration(true);
      try {
        const aiInput: EstimateTaskDurationInput = { taskTitle: task.title };
        const result: EstimateTaskDurationOutput = await estimateTaskDuration(aiInput);
        setCurrentAdaptiveWorkDuration(result.estimatedDurationMinutes);
        setTimeRemaining(result.estimatedDurationMinutes * 60);
        toast({ title: "Adaptive Timer", description: `Work session set to ${result.estimatedDurationMinutes} minutes for "${task.title}".`});
      } catch (error) {
        console.error("Error estimating task duration:", error);
        toast({ title: "AI Error", description: "Could not estimate duration. Using default.", variant: "destructive" });
        setCurrentAdaptiveWorkDuration(safeSettings.workDuration); 
        setTimeRemaining(safeSettings.workDuration * 60);
      } finally {
        setIsEstimatingDuration(false);
        setIsRunning(false); 
      }
    }
  };

  const handleSetSelectedTaskId = (id: string | null) => {
    setSelectedTaskIdState(id); 

    if (safeSettings.enableAdaptiveTimer && mode === 'work') { 
        if (id) { 
            const task = [...pomodoroTasks.todayTasks, ...pomodoroTasks.inboxTasks].find(t => t.id === id);
            if (task) {
                setAdaptiveTimeForTask(task); 
            } else { 
                setCurrentAdaptiveWorkDuration(null);
                setTimeRemaining(safeSettings.workDuration * 60);
                setIsRunning(false);
            }
        } else { 
            setCurrentAdaptiveWorkDuration(null);
            setTimeRemaining(safeSettings.workDuration * 60);
            setIsRunning(false);
        }
    } else if (!safeSettings.enableAdaptiveTimer && mode === 'work') { 
        setCurrentAdaptiveWorkDuration(null); 
        setTimeRemaining(safeSettings.workDuration * 60);
        setIsRunning(false);
    }
  };


  const handleFocusRatingSubmit = async (rating: 1 | 2 | 3 | 4 | 5) => {
    setShowFocusRatingPrompt(false);
    if (user && completedSessionInfo) {
      const focusLogData: Omit<FocusSessionLog, 'id' | 'userId'> = {
        timestamp: new Date().toISOString(),
        focusLevel: rating,
        pomodoroDurationMinutes: completedSessionInfo.durationMinutes,
        taskId: completedSessionInfo.taskId,
        taskTitle: completedSessionInfo.taskTitle,
      };
      try {
        await logFocusSession(user.uid, focusLogData);
        toast({ title: "Focus Rated", description: "Your focus level has been logged.", duration: 3000 });
      } catch (error) {
        console.error("Error logging focus session:", error);
        toast({ title: "Logging Error", description: "Could not save focus rating.", variant: "destructive" });
      }
    }

    if (completedSessionInfo) {
      setIsSuggestingBreak(true);
      try {
        const breakInput = {
          taskTitle: completedSessionInfo.taskTitle,
          pomodoroDurationMinutes: completedSessionInfo.durationMinutes,
        };
        const suggestionOutput = await suggestBreakActivity(breakInput);
        setCurrentBreakSuggestion(suggestionOutput.suggestion);
      } catch (error) {
        console.error("Error getting break suggestion:", error);
        setCurrentBreakSuggestion("Time for a quick break! Stand up, stretch, or grab a glass of water.");
        toast({ title: "AI Error", description: "Could not get smart break suggestion.", variant: "destructive" });
      } finally {
        setIsSuggestingBreak(false);
      }
    }

    proceedToNextMode('work', false);
    setCompletedSessionInfo(null);
  };

  const handleTimerEnd = useCallback(async () => {
    let sessionDurationMinutes = getDuration(mode) / 60; 
    if (mode === 'work') {
        if (safeSettings.enableAdaptiveTimer && currentAdaptiveWorkDuration !== null) {
            sessionDurationMinutes = currentAdaptiveWorkDuration;
        } else {
            sessionDurationMinutes = safeSettings.workDuration;
        }
    }

    if (mode === 'work') {
      setIsRunning(false); 
      if(timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;

      if (user) { 
        setCompletedSessionInfo({ 
          durationMinutes: sessionDurationMinutes,
          taskId: selectedTaskId,
          taskTitle: selectedTaskObject?.title,
        });
        setShowFocusRatingPrompt(true); 
      } else { 
        setIsSuggestingBreak(true);
        try {
          const breakInput = { taskTitle: null, pomodoroDurationMinutes: sessionDurationMinutes };
          const suggestionOutput = await suggestBreakActivity(breakInput);
          setCurrentBreakSuggestion(suggestionOutput.suggestion);
        } catch (error) {
          console.error("Error getting break suggestion for anon user:", error);
          setCurrentBreakSuggestion("Time for a quick break! Stand up, stretch, or grab a glass of water.");
        } finally {
          setIsSuggestingBreak(false);
        }
        proceedToNextMode('work', false); 
      }
    } else { 
      proceedToNextMode(mode, false);
    }
  }, [mode, getDuration, selectedTaskId, selectedTaskObject, proceedToNextMode, user, safeSettings.enableAdaptiveTimer, safeSettings.workDuration, currentAdaptiveWorkDuration]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    const currentModeSkipped = mode;
    setShowFocusRatingPrompt(false); 
    setCurrentBreakSuggestion(null);
    proceedToNextMode(currentModeSkipped, true);
  }, [mode, proceedToNextMode]);

  useEffect(() => {
    setTimeRemaining(getDuration(mode));
    setIsRunning(false); 
  }, [mode, getDuration, safeSettings.workDuration, safeSettings.shortBreakDuration, safeSettings.longBreakDuration, safeSettings.enableAdaptiveTimer, currentAdaptiveWorkDuration]); 


  useEffect(() => {
    if (isRunning && timeRemaining > 0 && !showFocusRatingPrompt && !isEstimatingDuration) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    } else if (isRunning && timeRemaining <= 0 && !showFocusRatingPrompt && !isEstimatingDuration) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      handleTimerEnd();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, timeRemaining, handleTimerEnd, showFocusRatingPrompt, isEstimatingDuration]);

  const handleStartPause = () => {
    if (showFocusRatingPrompt || isEstimatingDuration) return;
    setIsRunning(prev => {
      const newIsRunning = !prev;
      if (safeSettings.enableSoundNotifications && typeof window !== 'undefined') {
        const audio = new Audio('/ui-click.mp3');
        const volumeToSet = safeSettings.soundVolume;
        audio.volume = Number.isFinite(volumeToSet) ? Math.max(0, Math.min(1, volumeToSet)) : DEFAULT_SETTINGS.soundVolume;
        audio.play().catch(e => console.warn("UI click sound play error:", e));
      }
      return newIsRunning;
    });
    if (isRunning) { 
        if(timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
    } else { 
        setShowAddToCalendarButton(false); 
        setLastFocusSessionDetails(null);
        if (mode === 'work') setCurrentBreakSuggestion(null); 
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input, textarea, [contenteditable=true], select')) {
        return; 
      }
      if (event.code === 'Space' && !showFocusRatingPrompt && !isEstimatingDuration) {
        event.preventDefault();
        handleStartPause();
      } else if (event.key.toLowerCase() === 'r' && !showFocusRatingPrompt && !isEstimatingDuration) {
        event.preventDefault();
        handleReset();
      } else if (event.key.toLowerCase() === 's' && !showFocusRatingPrompt && !isEstimatingDuration) {
        event.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, handleSkip, handleStartPause, showFocusRatingPrompt, isEstimatingDuration]); 

  useEffect(() => {
    if (safeSettings.enableBrowserNotifications) {
      requestNotificationPermission().then(permission => {
        if (permission !== 'granted') {
           if (Notification.permission === 'denied') { 
             toast({ title: "Notifications Blocked", description: "Browser notifications are blocked. Please check your browser settings.", variant: "destructive", duration: 7000});
           }
        }
      });
    }
  }, [safeSettings.enableBrowserNotifications, toast]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (audioNotificationRef.current) {
        audioNotificationRef.current.pause();
        audioNotificationRef.current.src = ''; 
      }
      audioNotificationRef.current = new Audio(); 
      if (safeSettings.notificationSoundFile && safeSettings.notificationSoundFile !== "none") {
         audioNotificationRef.current.src = `/${safeSettings.notificationSoundFile}`;
         const volumeToSet = safeSettings.soundVolume;
         audioNotificationRef.current.volume = Number.isFinite(volumeToSet) ? Math.max(0, Math.min(1, volumeToSet)) : DEFAULT_SETTINGS.soundVolume;
         audioNotificationRef.current.load(); 
      }
    }
  }, [safeSettings.notificationSoundFile, safeSettings.soundVolume]);

  const currentDuration = getDuration(mode);
  const rawProgressPercentage = currentDuration > 0 ? ((currentDuration - timeRemaining) / currentDuration) * 100 : 0;
  const progressPercentage = Math.min(100, Math.max(0, rawProgressPercentage));

  const { timerAnimation, timerAnimationSpeed, enableQuotes } = safeSettings;

  const pomodoroDotsElements = Array(longBreakInterval).fill(0).map((_, i) => (
    <span key={i} className={`inline-block w-3 h-3 rounded-full mx-0.5 ${i < completedPomodorosInCycle ? 'bg-accent' : 'bg-muted/70'}`}></span>
  ));

  const handleAddToCalendar = () => {
    if (!lastFocusSessionDetails) return;
    const { title, startTime, endTime } = lastFocusSessionDetails;
    const googleStartTime = formatGoogleCalendarDate(startTime);
    const googleEndTime = formatGoogleCalendarDate(endTime);
    const currentModeDuration = getDuration(mode); 
    const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${googleStartTime}/${googleEndTime}&details=${encodeURIComponent(`Session logged via AuxoFocus. Session duration: ${formatTime(completedSessionInfo?.durationMinutes ? completedSessionInfo.durationMinutes * 60 : currentModeDuration)}`)}`;
    window.open(calendarUrl, '_blank');
    setShowAddToCalendarButton(false); 
    setLastFocusSessionDetails(null);
  };

  const handleQuickAddTaskAndFocus = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!newQuickTaskText.trim() || !user || !userSettings) { 
      toast({ title: "Cannot Add Task", description: "Task title is empty or user/settings not available.", variant: "destructive" });
      return;
    }
    setIsAddingQuickTask(true);
    const tempQuickTaskTitle = newQuickTaskText.trim();
    setNewQuickTaskText(''); 

    try {
      const newTaskPayload: Partial<Omit<PlannerTask, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt' | 'subtasks' | 'subtaskStats'>> & { title: string } = {
        title: tempQuickTaskTitle,
        panel: 'brainDump', 
        order: Date.now(), 
        estimatedTime: 0, 
      };
      const addedTask = await addPlannerTask(user.uid, newTaskPayload);

      setPomodoroTasks(prev => ({
        ...prev,
        inboxTasks: [addedTask, ...prev.inboxTasks].sort((a,b) => a.order - b.order)
      }));
      setSelectedTaskIdState(addedTask.id); 

      setShowAddToCalendarButton(false);
      setLastFocusSessionDetails(null);
      setShowFocusRatingPrompt(false);
      setCurrentBreakSuggestion(null);
      setMode('work'); 
      toast({ title: "Task Added & Focused!", description: `Now focusing on "${addedTask.title}".` });
    } catch (error) {
      console.error("Error adding quick task:", error);
      toast({ title: "Quick Add Error", description: "Could not add task. Please try again.", variant: "destructive" });
      setNewQuickTaskText(tempQuickTaskTitle); 
    } finally {
      setIsAddingQuickTask(false);
    }
  };

  const handleQuickDurationChange = (newDuration: number) => {
    // Optimistically update local state for UI responsiveness
    if (mode === 'work' && !isRunning) {
        setTimeRemaining(newDuration * 60);
    }
    if (safeSettings.enableAdaptiveTimer) {
        setCurrentAdaptiveWorkDuration(newDuration);
    }
    
    // Queue update for AuthContext
    setPendingSettingsUpdate({ workDuration: newDuration });
    
    toast({ title: "Timer Duration Updated", description: `Work session set to ${newDuration} minutes.` });
  };


  if (isEstimatingDuration) {
    return (
        <div className="flex flex-col items-center justify-center p-10 bg-card/80 backdrop-blur-md rounded-lg shadow-xl border border-primary/30">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-foreground">AI is estimating task duration...</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <PomodoroCard
        user={user as FirebaseUser | null}
        dynamicModeText={dynamicModeText}
        cycleText={cycleText}
        showTaskSelection={mode === 'work' && !!user && !showFocusRatingPrompt}
        selectedTaskId={selectedTaskId}
        setSelectedTaskId={handleSetSelectedTaskId}
        pomodoroTasks={pomodoroTasks}
        isLoadingTasks={isLoadingTasks}
        newQuickTaskText={newQuickTaskText}
        setNewQuickTaskText={setNewQuickTaskText}
        isAddingQuickTask={isAddingQuickTask}
        handleQuickAddTaskAndFocus={handleQuickAddTaskAndFocus}
        showFocusRatingPrompt={showFocusRatingPrompt}
        handleFocusRatingSubmit={handleFocusRatingSubmit}
        isSuggestingBreak={isSuggestingBreak}
        showTimerDisplay={!showFocusRatingPrompt}
        timeRemaining={timeRemaining}
        mode={mode}
        progressPercentage={progressPercentage}
        timerAnimation={timerAnimation as TimerAnimation}
        animationSpeed={timerAnimationSpeed || 1}
        isRunning={isRunning}
        timerColor={mode === 'work' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}
        handleStartPause={handleStartPause}
        handleReset={handleReset}
        handleSkip={handleSkip}
        pomodoroDotsElements={pomodoroDotsElements}
        totalCompletedPomodoros={totalCompletedPomodoros}
        goldCoins={safeSettings.goldCoins || 0}
        silverCoins={safeSettings.silverCoins || 0}
        showBreakSuggestion={!!currentBreakSuggestion && (mode === 'shortBreak' || mode === 'longBreak') && !showFocusRatingPrompt}
        currentBreakSuggestion={currentBreakSuggestion}
        showAddToCalendarButton={showAddToCalendarButton && !!user && (safeSettings.enableAddToCalendar ?? DEFAULT_SETTINGS.enableAddToCalendar) && !showFocusRatingPrompt}
        handleAddToCalendar={handleAddToCalendar}
        onOpenSettings={onOpenSettings}
        onQuickDurationChange={handleQuickDurationChange}
        currentWorkDuration={safeSettings.workDuration} 
        enableAddToCalendarConfig={safeSettings.enableAddToCalendar ?? DEFAULT_SETTINGS.enableAddToCalendar}
      />

      {(enableQuotes ?? DEFAULT_SETTINGS.enableQuotes) && !showFocusRatingPrompt && (
        <div className="mt-6 w-full max-w-md mx-auto">
          <QuoteCard />
        </div>
      )}

      <FocusMusicPlayer />
    </div>
  );
};

export default PomodoroTimer;

