
"use client";

import React, { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  addPlannerTask,
  getActivePlannerInboxTasks,
  getCompletedPlannerTasks,
  getRecentCompletedPlannerTaskTitles,
  completePlannerTaskInDb,
  deletePlannerTask,
  restorePlannerTaskInDb, // New import
  updatePlannerTask,
  getPlannerLabels,
} from '@/lib/firebase/firestoreService';
import type { LocalTask, UserSettings, PlannerTask, GenerateTasksInput, TaskLabel } from '@/lib/types';
import { DEFAULT_SETTINGS, LOCAL_STORAGE_ACTIVE_TASKS_KEY, LOCAL_STORAGE_COMPLETED_TASKS_KEY } from '@/lib/constants';
import { generateTasks, type GeneratedTask } from '@/ai/flows/generate-tasks-flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Trash2, ListChecks, History, Loader2, Sparkles, AlertTriangle, TrendingUp, BarChartHorizontalBig, CalendarDays, Undo2, Info, Edit3 } from 'lucide-react';
import { format, parseISO, isSameDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingDots } from '@/components/ui/LoadingDots';
import Link from 'next/link';
import AITaskAssistantInput from './TaskManagement/AITaskAssistantInput';
import TaskDetailModal from '@/components/domain/Planner/TaskDetailModal';

const generateLocalId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2);

interface TaskCompletionStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

const mapLocalTaskToPlannerTaskForModal = (localTask: LocalTask, userId?: string | null): PlannerTask => {
  return {
    id: localTask.id,
    userId: userId || 'local-user',
    title: localTask.text,
    description: '', // Local tasks don't have descriptions by default
    estimatedTime: 0, // Local tasks don't have estimates by default
    scheduledDate: null,
    panel: 'brainDump', // Assume local tasks are like inbox items
    order: new Date(localTask.createdAt).getTime(),
    isCompleted: localTask.isCompleted,
    completedAt: localTask.completedAt || null,
    createdAt: localTask.createdAt,
    updatedAt: localTask.createdAt, // Or a more appropriate value
    labelIds: [], // Local tasks don't have labels by default
    subtasks: [], // Local tasks don't have subtasks by default
    subtaskStats: { total: 0, completed: 0 },
    recurrenceRule: null,
    timeboxedStartTime: null,
  };
};


const TaskManagementComponent: React.FC = () => {
  const { user, userSettings, setUserSettings, isLoadingSettings: isLoadingAuthSettings, loading: isLoadingAuth } = useAuth();
  const [activeTasks, setActiveTasks] = useState<LocalTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<LocalTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const [isGeneratingAiTasks, setIsGeneratingAiTasks] = useState(false);
  const [aiSuggestedTasks, setAiSuggestedTasks] = useState<GeneratedTask[]>([]);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);

  const [taskCompletionStats, setTaskCompletionStats] = useState<TaskCompletionStats>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [taskToView, setTaskToView] = useState<PlannerTask | null>(null);
  const [allPlannerLabels, setAllPlannerLabels] = useState<TaskLabel[]>([]);


  const { toast } = useToast();
  const currentEffectiveSettings = userSettings || DEFAULT_SETTINGS;

  useEffect(() => {
    if (!completedTasks || completedTasks.length === 0) {
      setTaskCompletionStats({ today: 0, thisWeek: 0, thisMonth: 0 });
      return;
    }
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    completedTasks.forEach(task => {
      if (task.completedAt) {
        try {
            const completedDate = parseISO(task.completedAt);
            if (isToday(completedDate)) todayCount++;
            if (isThisWeek(completedDate, { weekStartsOn: 1 })) weekCount++;
            if (isThisMonth(completedDate)) monthCount++;
        } catch (error) {
            console.warn("Error parsing task completedAt date:", task.completedAt, error);
        }
      }
    });
    setTaskCompletionStats({ today: todayCount, thisWeek: weekCount, thisMonth: monthCount });
  }, [completedTasks]);

  const loadLocalTasks = useCallback(() => {
    const localActive = localStorage.getItem(LOCAL_STORAGE_ACTIVE_TASKS_KEY);
    const localCompleted = localStorage.getItem(LOCAL_STORAGE_COMPLETED_TASKS_KEY);
    setActiveTasks(localActive ? JSON.parse(localActive) : []);
    setCompletedTasks(localCompleted ? JSON.parse(localCompleted) : []);
    setIsLoadingTasks(false);
  }, []);

  const mapPlannerTaskToLocalTask = (plannerTask: PlannerTask): LocalTask => ({
    id: plannerTask.id,
    text: plannerTask.title,
    isCompleted: plannerTask.isCompleted,
    createdAt: plannerTask.createdAt || new Date().toISOString(),
    completedAt: plannerTask.completedAt || null,
  });

  const loadFirestorePlannerTasks = useCallback(async (userId: string) => {
    setIsLoadingTasks(true);
    try {
      const [activeDb, completedDb, labelsDb] = await Promise.all([
        getActivePlannerInboxTasks(userId),
        getCompletedPlannerTasks(userId),
        getPlannerLabels(userId),
      ]);
      setActiveTasks(activeDb.map(mapPlannerTaskToLocalTask));
      setCompletedTasks(completedDb.map(mapPlannerTaskToLocalTask).sort((a, b) => (
        b.completedAt && a.completedAt ? new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime() : 0
      )));
      setAllPlannerLabels(labelsDb);
    } catch (error) {
      console.error("Error loading Planner tasks/labels for TaskManagementComponent:", error);
      toast({ title: "Error Loading Tasks", description: "Could not load tasks from cloud.", variant: "destructive" });
    } finally {
      setIsLoadingTasks(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isLoadingAuth || isLoadingAuthSettings) return;
    if (user?.uid) {
      loadFirestorePlannerTasks(user.uid);
    } else {
      loadLocalTasks();
      setAllPlannerLabels([]);
    }
  }, [user, isLoadingAuth, isLoadingAuthSettings, loadFirestorePlannerTasks, loadLocalTasks]);

  const handleAddTaskToPlannerInbox = async (taskTextToAdd: string): Promise<PlannerTask | null> => {
    if (!user?.uid) {
      const newLocalTask: LocalTask = {
        id: generateLocalId(),
        text: taskTextToAdd,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      const updatedActiveTasks = [newLocalTask, ...activeTasks];
      setActiveTasks(updatedActiveTasks);
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_TASKS_KEY, JSON.stringify(updatedActiveTasks));
      toast({ title: "Task Added Locally" });
      return null;
    }
    try {
      const newTaskPayload: Partial<Omit<PlannerTask, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'completedAt' | 'subtasks' | 'subtaskStats'>> & { title: string } = {
        title: taskTextToAdd, panel: 'brainDump', order: Date.now(), estimatedTime: 0,
      };
      const addedPlannerTask = await addPlannerTask(user.uid, newTaskPayload);
      setActiveTasks(prev => [mapPlannerTaskToLocalTask(addedPlannerTask), ...prev]);
      toast({ title: "Task Added to Planner Inbox", description: `"${addedPlannerTask.title}"` });
      return addedPlannerTask;
    } catch (error) {
      console.error("Error adding task to Planner Inbox:", error);
      toast({ title: "Error Adding Task", variant: "destructive" });
      return null;
    }
  };

  const handleManualAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    await handleAddTaskToPlannerInbox(newTaskText);
    setNewTaskText('');
  };

  const handleAddSuggestedTask = async (suggestedTask: GeneratedTask) => {
    const taskTextWithEstimate = `${suggestedTask.taskText} (${suggestedTask.estimatedPomodoros} Pomodoro${suggestedTask.estimatedPomodoros > 1 ? 's' : ''})`;
    await handleAddTaskToPlannerInbox(taskTextWithEstimate);
    setAiSuggestedTasks(prev => prev.filter(t => t.taskText !== suggestedTask.taskText || t.estimatedPomodoros !== suggestedTask.estimatedPomodoros));
  };

  const handleCompleteTask = async (taskId: string) => {
    let taskToMove: LocalTask | undefined = activeTasks.find(t => t.id === taskId);
    if (!taskToMove) return;
    const completionTime = new Date().toISOString();
    const completedTask: LocalTask = { ...taskToMove, isCompleted: true, completedAt: completionTime };

    if (user?.uid && userSettings) {
      try {
        const firestoreUpdatedSettings = await completePlannerTaskInDb(user.uid, taskId, currentEffectiveSettings);
        setUserSettings(firestoreUpdatedSettings);
        toast({ title: "Task Completed!", description: "Marked complete in Planner.", variant: "default" });
      } catch (error) {
        console.error("Error completing planner task in DB:", error);
        toast({ title: "Error", description: "Could not sync task completion to Planner.", variant: "destructive" });
        return;
      }
    } else {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        let newStreak = currentEffectiveSettings.completedTasksStreak || 0;
        if (currentEffectiveSettings.lastCompletionDate) {
            const lastCompletion = parseISO(currentEffectiveSettings.lastCompletionDate);
            if (!isSameDay(lastCompletion, new Date())) {
                if (isSameDay(lastCompletion, subDays(new Date(), 1))) newStreak += 1;
                else newStreak = 1;
            }
        } else newStreak = 1;
        setUserSettings({
            ...currentEffectiveSettings,
            totalTasksCompleted: (currentEffectiveSettings.totalTasksCompleted || 0) + 1,
            completedTasksStreak: newStreak,
            lastCompletionDate: todayStr,
        });
        toast({ title: "Task Completed Locally!", variant: "default" });
    }
    if (currentEffectiveSettings.enableSoundNotifications && typeof window !== 'undefined') {
      const audio = new Audio('/task-complete.mp3');
      audio.volume = currentEffectiveSettings.soundVolume;
      audio.play().catch(e => console.warn("Task completion sound play error:", e));
    }
    const updatedActiveTasks = activeTasks.filter(t => t.id !== taskId);
    const updatedCompletedTasks = [completedTask, ...completedTasks].sort((a, b) => (
        b.completedAt && a.completedAt ? new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime() : 0
    ));
    setActiveTasks(updatedActiveTasks);
    setCompletedTasks(updatedCompletedTasks);
    if (!user?.uid) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_TASKS_KEY, JSON.stringify(updatedActiveTasks));
      localStorage.setItem(LOCAL_STORAGE_COMPLETED_TASKS_KEY, JSON.stringify(updatedCompletedTasks));
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    let taskToRestore = completedTasks.find(t => t.id === taskId);
    if (!taskToRestore) return;

    const restoredTask: LocalTask = { ...taskToRestore, isCompleted: false, completedAt: null };

    if (user?.uid && userSettings) {
      try {
        const updatedSettings = await restorePlannerTaskInDb(user.uid, taskId, currentEffectiveSettings);
        setUserSettings(updatedSettings);
        toast({ title: "Task Restored", description: "Task moved back to active in Planner.", variant: "default" });
      } catch (error) {
        console.error("Error restoring planner task in DB:", error);
        toast({ title: "Error", description: "Could not sync task restoration to Planner.", variant: "destructive" });
        return;
      }
    } else {
      setUserSettings({
          ...currentEffectiveSettings,
          totalTasksCompleted: Math.max(0, (currentEffectiveSettings.totalTasksCompleted || 0) - 1),
      });
      toast({ title: "Task Restored Locally", variant: "default" });
    }

    const updatedCompletedTasks = completedTasks.filter(t => t.id !== taskId);
    const updatedActiveTasks = [restoredTask, ...activeTasks].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setCompletedTasks(updatedCompletedTasks);
    setActiveTasks(updatedActiveTasks);

    if (!user?.uid) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_TASKS_KEY, JSON.stringify(updatedActiveTasks));
      localStorage.setItem(LOCAL_STORAGE_COMPLETED_TASKS_KEY, JSON.stringify(updatedCompletedTasks));
    }
  };

  const handleDeleteTask = async (taskId: string, listType: 'active' | 'completed') => {
    const taskText = (listType === 'active' ? activeTasks : completedTasks).find(t => t.id === taskId)?.text || "Task";
    if (user?.uid) {
      try {
        await deletePlannerTask(taskId);
        toast({ title: "Task Deleted", description: `"${taskText}" removed from Planner.` });
      } catch (error) {
        console.error("Error deleting planner task from DB:", error);
        toast({ title: "Error", description: "Could not delete task from Planner.", variant: "destructive" });
        return;
      }
    } else {
      toast({ title: "Task Deleted Locally" });
    }
    if (listType === 'active') {
      const updatedActive = activeTasks.filter(t => t.id !== taskId);
      setActiveTasks(updatedActive);
      if (!user?.uid) localStorage.setItem(LOCAL_STORAGE_ACTIVE_TASKS_KEY, JSON.stringify(updatedActive));
    } else {
      const updatedCompleted = completedTasks.filter(t => t.id !== taskId);
      setCompletedTasks(updatedCompleted);
      if (!user?.uid) localStorage.setItem(LOCAL_STORAGE_COMPLETED_TASKS_KEY, JSON.stringify(updatedCompleted));
    }
  };

  const handleAIAssistantSubmit = async (description: string, imageDataUris?: string[]) => {
    if (!description.trim() && (!imageDataUris || imageDataUris.length === 0)) {
      setAiGenerationError("Please provide a description or upload an image."); return;
    }
    if (!userSettings) {
      setAiGenerationError("User settings not loaded."); return;
    }
    setIsGeneratingAiTasks(true);
    setAiSuggestedTasks([]);
    setAiGenerationError(null);
    let historicalContext: string[] | undefined, profileContext: { role?: string; currentProject?: string } | undefined;
    if (user?.uid) {
      try {
        historicalContext = await getRecentCompletedPlannerTaskTitles(user.uid, 20);
        profileContext = { role: userSettings.role, currentProject: userSettings.currentProject };
      } catch (error) { console.warn("Could not fetch context for AI:", error); }
    }
    const aiInput: GenerateTasksInput = {
      description: description.trim(), imageDataUris, historicalContext, profileContext,
      pomodoroDuration: userSettings.workDuration,
    };
    try {
      const result = await generateTasks(aiInput);
      if (result && result.suggestedTasks) {
        setAiSuggestedTasks(result.suggestedTasks);
        if (result.suggestedTasks.length === 0) toast({ title: "AI Task Assistant", description: "No specific sub-tasks found.", variant: "default" });
        else toast({ title: "AI Tasks Generated!", description: "Review suggestions below.", variant: "default" });
      } else throw new Error("AI response was empty.");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error.";
      setAiGenerationError(`Failed: ${errMsg}`);
      toast({ title: "AI Error", description: `Failed: ${errMsg}`, variant: "destructive" });
    } finally {
      setIsGeneratingAiTasks(false);
    }
  };

  const handleOpenTaskDetails = (task: LocalTask) => {
    const plannerTaskEquivalent = mapLocalTaskToPlannerTaskForModal(task, user?.uid);
    setTaskToView(plannerTaskEquivalent);
    setIsTaskDetailModalOpen(true);
  };

  const handleSaveTaskDetailsFromPomodoroPage = async (updatedTaskData: Partial<PlannerTask> & { id: string }) => {
    if (!taskToView) return;
    const originalTaskId = taskToView.id;

    if (user?.uid) {
      const { id, title, description, labelIds, estimatedTime } = updatedTaskData;
      const updatesForDb: Partial<PlannerTask> = { title, description, labelIds, estimatedTime };
      try {
        await updatePlannerTask(id, updatesForDb);
        toast({ title: "Task Updated", description: `"${title}" saved in Planner.` });
        await loadFirestorePlannerTasks(user.uid);
      } catch (error) {
        console.error("Error updating planner task:", error);
        toast({ title: "Error Updating Task", variant: "destructive" });
      }
    } else {
      const updatedActiveTasks = activeTasks.map(t =>
        t.id === originalTaskId ? { ...t, text: updatedTaskData.title || t.text } : t
      );
      setActiveTasks(updatedActiveTasks);
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_TASKS_KEY, JSON.stringify(updatedActiveTasks));
      toast({ title: "Task Updated Locally" });
    }
    setIsTaskDetailModalOpen(false);
    setTaskToView(null);
  };

  const chartData = useMemo(() => [
    { period: "Today", tasks: taskCompletionStats.today, fill: "hsl(var(--chart-1))" },
    { period: "This Week", tasks: taskCompletionStats.thisWeek, fill: "hsl(var(--chart-2))" },
    { period: "This Month", tasks: taskCompletionStats.thisMonth, fill: "hsl(var(--chart-3))" },
  ], [taskCompletionStats]);

  const chartConfig = {
    tasks: { label: "Tasks Completed", color: "hsl(var(--chart-1))" },
  } satisfies Record<string, any>;

  if (isLoadingAuth || isLoadingAuthSettings || isLoadingTasks) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="ml-4 text-xl text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  const showInsightsCard = currentEffectiveSettings.totalTasksCompleted > 0 ||
                           currentEffectiveSettings.completedTasksStreak > 0 ||
                           completedTasks.length > 0 ||
                           taskCompletionStats.today > 0 ||
                           taskCompletionStats.thisWeek > 0 ||
                           taskCompletionStats.thisMonth > 0;

  return (
    <div className="space-y-8 p-0 md:p-2">
      <Card className="shadow-xl bg-card/80 backdrop-blur-md border-primary/20">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle className="text-2xl font-headline text-primary flex items-center">
               <ListChecks className="mr-3 h-7 w-7" /> Task Focus List
            </CardTitle>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                <Link href="/planner">
                    <CalendarDays className="mr-2 h-4 w-4" /> Advanced Planner
                </Link>
                </Button>
            </div>
          </div>
          <CardDescription className="text-muted-foreground pt-2">
            Add tasks manually or use the AI Assistant. {user ? "Tasks added here go to your Planner's Inbox." : "Tasks are saved locally."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualAddTask} className="flex gap-2 mb-6">
            <Input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Enter a new task manually..."
              className="flex-grow bg-input text-foreground"
              aria-label="New manual task input"
            />
            <Button type="submit" variant="default" disabled={!newTaskText.trim()}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add Task
            </Button>
          </form>

          {activeTasks.length === 0 && aiSuggestedTasks.length === 0 && !isGeneratingAiTasks && (
            <p className="text-center text-muted-foreground py-4">
              {user ? "Your Planner Inbox is empty." : "No active local tasks."} Add some or use the AI Assistant!
            </p>
          )}

          <ul className="space-y-3">
            <AnimatePresence>
              {activeTasks.map(task => (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                  className="flex items-center gap-3 p-3 bg-background/50 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.isCompleted}
                    onCheckedChange={() => handleCompleteTask(task.id)}
                    aria-label={`Mark task "${task.text}" as complete`}
                  />
                  <div
                    className="flex-grow text-foreground cursor-pointer text-sm"
                    onClick={() => handleOpenTaskDetails(task)}
                    title={`Click to view/edit details for: ${task.text}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenTaskDetails(task);}}
                  >
                    {task.text}
                  </div>
                   <Button variant="ghost" size="icon" onClick={() => handleOpenTaskDetails(task)} aria-label={`Edit task "${task.text}"`}>
                    <Edit3 className="h-4 w-4 text-muted-foreground hover:text-accent" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id, 'active')} aria-label={`Delete task "${task.text}"`}>
                    <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                  </Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-card/70 backdrop-blur-sm border-primary/30">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Sparkles className="mr-3 h-6 w-6" /> AI Task Assistant
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Describe a goal or upload an image. AI will suggest sub-tasks (added to Planner Inbox).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AITaskAssistantInput onSubmit={handleAIAssistantSubmit} isLoading={isGeneratingAiTasks} />
          {isGeneratingAiTasks && (
            <div className="flex items-center text-muted-foreground">
              <LoadingDots />
              <span className="ml-2">Generating suggestions...</span>
            </div>
          )}
          {aiGenerationError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
              <p className="text-sm">{aiGenerationError}</p>
            </div>
          )}
          {aiSuggestedTasks.length > 0 && (
            <div className="space-y-3 pt-4">
              <h4 className="text-md font-semibold text-foreground">AI Suggested Tasks:</h4>
              <ul className="space-y-2 max-h-60 overflow-y-auto p-1">
                <AnimatePresence>
                  {aiSuggestedTasks.map((task, index) => (
                    <motion.li
                      key={`${task.taskText}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}
                      exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                      layout
                      className="flex items-center justify-between gap-2 p-2.5 bg-background/40 rounded-md shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="text-foreground text-sm">
                        {task.taskText} <span className="text-xs text-muted-foreground">({task.estimatedPomodoros} Pomodoro{task.estimatedPomodoros > 1 ? 's' : ''})</span>
                      </span>
                      <Button onClick={() => handleAddSuggestedTask(task)} size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                        <PlusCircle className="mr-1.5 h-4 w-4" /> Add
                      </Button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-card/70 backdrop-blur-sm border-primary/30">
        <CardHeader>
              <CardTitle className="text-xl font-headline text-primary flex items-center">
                <TrendingUp className="mr-3 h-6 w-6" /> Task Completion Insights
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your productivity at a glance. Based on tasks completed from the Planner.
              </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {!showInsightsCard ? (
                 <p className="text-center text-muted-foreground py-4">Complete some tasks to see your stats here!</p>
            ) : (
            <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6 text-center">
                    <div className="p-3 bg-background/30 rounded-md shadow-sm">
                        <p className="text-3xl font-bold text-primary">{taskCompletionStats.today}</p>
                        <p className="text-sm text-muted-foreground">Tasks Today</p>
                    </div>
                    <div className="p-3 bg-background/30 rounded-md shadow-sm">
                        <p className="text-3xl font-bold text-primary">{taskCompletionStats.thisWeek}</p>
                        <p className="text-sm text-muted-foreground">Tasks This Week</p>
                    </div>
                    <div className="p-3 bg-background/30 rounded-md shadow-sm">
                        <p className="text-3xl font-bold text-primary">{taskCompletionStats.thisMonth}</p>
                        <p className="text-sm text-muted-foreground">Tasks This Month</p>
                    </div>
                    <div className="p-3 bg-background/30 rounded-md shadow-sm">
                        <p className="text-3xl font-bold text-primary">{currentEffectiveSettings.totalTasksCompleted}</p>
                        <p className="text-sm text-muted-foreground">All-Time Tasks</p>
                    </div>
                    <div className="p-3 bg-background/30 rounded-md shadow-sm col-span-2 sm:col-span-1">
                        <p className="text-3xl font-bold text-primary">{currentEffectiveSettings.completedTasksStreak}</p>
                        <p className="text-sm text-muted-foreground">Day Completion Streak</p>
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                        <BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary" />
                        Completions Overview
                    </h4>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="horizontal" accessibilityLayer>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <ChartTooltip cursor={{ fill: 'hsl(var(--background) / 0.5)'}} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="tasks" radius={5} />
                        </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </>
            )}
        </CardContent>
    </Card>

      {completedTasks.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="completed-tasks" className="border-border/50 bg-card/70 backdrop-blur-sm shadow-lg rounded-lg">
            <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-primary hover:no-underline">
                <div className="flex items-center">
                    <History className="mr-2 h-5 w-5" /> Completed Tasks ({completedTasks.length})
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 pt-0">
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {completedTasks.map(task => (
                  <li key={task.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md group">
                    <span className="text-muted-foreground line-through text-sm">{task.text}</span>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {task.completedAt ? format(parseISO(task.completedAt), 'MMM d, yy HH:mm') : 'Recently'}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => handleRestoreTask(task.id)} aria-label={`Restore task "${task.text}"`} title="Restore Task">
                            <Undo2 className="h-4 w-4 text-primary/70 hover:text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id, 'completed')} aria-label={`Delete completed task "${task.text}"`}>
                            <Trash2 className="h-4 w-4 text-destructive/50 hover:text-destructive" />
                        </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        task={taskToView}
        onSaveParentTask={handleSaveTaskDetailsFromPomodoroPage}
        allLabels={allPlannerLabels}
        onTaskUpdated={(taskId) => {
            if (user?.uid) {
                loadFirestorePlannerTasks(user.uid);
            } else {
                loadLocalTasks();
            }
        }}
      />
    </div>
  );
};

export default TaskManagementComponent;

    