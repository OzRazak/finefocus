
"use client";

import React, { useEffect, useState, useCallback, type FormEvent, useMemo, useRef } from 'react';
import RGL, { WidthProvider, type Layout, type Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { APP_NAME, DEFAULT_PLANNER_LAYOUTS, DEFAULT_SETTINGS } from '@/lib/constants';
import HeaderComponent from '@/components/domain/HeaderComponent';
import SettingsModal from '@/components/domain/SettingsModal';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/ui/animations/PageTransition';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Tag, Wand2, Expand, Minimize, RefreshCw, WifiOff, Loader2, ChevronsRight, EllipsisVertical, Settings2, Save, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { PlannerTask, TaskLabel, PlannerTaskPanel, FocusDnaReport, TaskForOptimization, UserSettings, PlannerSubtask, ExternalCalendarEvent, CalendarEventsApiResponse } from '@/lib/types';
import {
    addPlannerTask,
    getPlannerTasksForPanel,
    deletePlannerTask as deletePlannerTaskFromDb,
    getPlannerLabels,
    updatePlannerTask as updatePlannerTaskInDb,
    completePlannerTaskInDb,
    getSubtasks,
    restorePlannerTaskInDb,
} from '@/lib/firebase/firestoreService';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


import TaskInboxPanel from '@/components/domain/Planner/TaskInboxPanel';
import DailyPlannerPanel from '@/components/domain/Planner/DailyPlannerPanel';
import TimeboxPanel from '@/components/domain/Planner/TimeboxPanel';
import TaskDetailModal from '@/components/domain/Planner/TaskDetailModal';
import ManageLabelsModal from '@/components/domain/Planner/ManageLabelsModal';
import { cn } from '@/lib/utils';
import type { User } from 'firebase/auth';


const ResponsiveGridLayout = WidthProvider(RGL.Responsive);

const TIME_SLOT_HEIGHT_PER_HOUR = 60;
const MIN_TASK_HEIGHT = 20;
const LOCAL_STORAGE_PLANNER_LAYOUTS_KEY = 'plannerGridLayouts_v2';


interface KanbanDay {
  date: Date;
  name: string;
  dateString: string;
}

export default function AdvancedPlannerPage() {
  const { user, userSettings, setUserSettings, focusDnaReport: focusDnaReportFromAuth, isLoadingSettings, loading: isLoadingAuth } = useAuth();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [clientSideKanbanDays, setClientSideKanbanDays] = useState<KanbanDay[]>([]);
  const [clientSelectedKanbanDayDateString, setClientSelectedKanbanDayDateString] = useState<string | null>(null);

  const [brainDumpTasks, setBrainDumpTasks] = useState<PlannerTask[]>([]);
  const [kanbanDayTasks, setKanbanDayTasks] = useState<Record<string, PlannerTask[]>>({});
  const [newBrainDumpTaskText, setNewBrainDumpTaskText] = useState('');
  // isLoadingBrainDumpTasks and isLoadingKanbanTasks are managed by initialFetchStatus
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [taskLabels, setTaskLabels] = useState<TaskLabel[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(true);
  const [isManageLabelsModalOpen, setIsManageLabelsModalOpen] = useState(false);

  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [taskToDetail, setTaskToDetail] = useState<PlannerTask | null>(null);

  const [isOptimizingSchedule, setIsOptimizingSchedule] = useState(false);
  const [isProcessingCarryOver, setIsProcessingCarryOver] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [localGridLayouts, setLocalGridLayouts] = useState<Layouts>(DEFAULT_PLANNER_LAYOUTS);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg');
  const [expandedWidgetId, setExpandedWidgetId] = useState<'inbox' | 'daily' | 'timebox' | null>(null);
  const [layoutsInitialized, setLayoutsInitialized] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);


  const [initialFetchStatus, setInitialFetchStatus] = useState<{ inbox: boolean; daily: Record<string, boolean> }>({ inbox: false, daily: {} });

  const userSettingsRef = useRef(userSettings);
  useEffect(() => { userSettingsRef.current = userSettings; }, [userSettings]);

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => { document.title = `Modular Task Planner | ${APP_NAME}`; }, []);

  const handleOpenPlannerSettings = useCallback(() => {
    setIsSettingsModalOpen(true);
  }, []);

  // Effect for loading layouts
  useEffect(() => {
    if (isLoadingAuth || isLoadingSettings || layoutsInitialized || !isClient) {
      return;
    }

    let loadedLayouts: Layouts | null = null;
    if (user && userSettings?.plannerLayouts) {
      loadedLayouts = userSettings.plannerLayouts;
    } else if (!user) {
      const localLayoutsStr = localStorage.getItem(LOCAL_STORAGE_PLANNER_LAYOUTS_KEY);
      if (localLayoutsStr) {
        try {
          loadedLayouts = JSON.parse(localLayoutsStr);
        } catch (e) {
          console.error("Error parsing layouts from localStorage:", e);
          localStorage.removeItem(LOCAL_STORAGE_PLANNER_LAYOUTS_KEY);
        }
      }
    }
    setLocalGridLayouts(loadedLayouts || DEFAULT_PLANNER_LAYOUTS);
    setLayoutsInitialized(true);
  }, [user, userSettings?.plannerLayouts, isLoadingAuth, isLoadingSettings, layoutsInitialized, isClient]);


  useEffect(() => {
    if (isClient) {
      const today = new Date();
      const days = [];
      const daysBefore = 7;
      const daysAfter = 7;
      for (let i = daysBefore; i > 0; i--) {
        const pastDay = subDays(today, i);
        days.push({ date: pastDay, name: format(pastDay, 'EEE'), dateString: format(pastDay, 'yyyy-MM-dd') });
      }
      days.push({ date: today, name: "Today", dateString: format(today, 'yyyy-MM-dd') });
      for (let i = 1; i <= daysAfter; i++) {
        const nextDay = addDays(today, i);
        days.push({ date: nextDay, name: format(nextDay, 'EEE'), dateString: format(nextDay, 'yyyy-MM-dd') });
      }
      setClientSideKanbanDays(days);
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && clientSideKanbanDays.length > 0 && !clientSelectedKanbanDayDateString) {
        setClientSelectedKanbanDayDateString(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [isClient, clientSideKanbanDays, clientSelectedKanbanDayDateString]);

  const currentEffectiveSettings = useMemo(() => userSettings || DEFAULT_SETTINGS, [userSettings]);

  const fetchTaskWithSubtaskStats = useCallback(async (task: PlannerTask): Promise<PlannerTask> => {
    try {
      const subtasks = await getSubtasks(task.id);
      return {
        ...task,
        subtasks,
        subtaskStats: { total: subtasks.length, completed: subtasks.filter(st => st.isCompleted).length },
      };
    } catch (error) {
      console.error(`Error fetching subtasks for task ${task.id}:`, error);
      setPageError(prev => `${prev ? prev + '; ' : ''}Subtask load error for "${task.title.substring(0,20)}...": ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({ title: "Subtask Error", description: `Could not load subtasks for "${task.title}".`, variant: "destructive" });
      return { ...task, subtasks: [], subtaskStats: { total: 0, completed: 0 } };
    }
  }, [toast]);

  const clientSideKanbanDaysString = useMemo(() => clientSideKanbanDays.map(d => d.dateString).join(','), [clientSideKanbanDays]);

  // Main task fetching effect
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.uid) {
        setBrainDumpTasks([]);
        setKanbanDayTasks({});
        setInitialFetchStatus({ inbox: true, daily: {} }); // Mark as "attempted" for anonymous
        return;
      }

      // Fetch Inbox Tasks
      if (!initialFetchStatus.inbox) {
        try {
          const tasks = await getPlannerTasksForPanel(user.uid, 'brainDump');
          const tasksWithStats = await Promise.all(tasks.map(fetchTaskWithSubtaskStats));
          setBrainDumpTasks(tasksWithStats.sort((a, b) => a.order - b.order));
        } catch (error: any) {
          console.error("Error fetching Task Inbox tasks:", error);
          setPageError(prev => `${prev ? prev + '; ' : ''}Error loading Task Inbox: ${error.message}`);
          setBrainDumpTasks([]);
        } finally {
            setInitialFetchStatus(prev => ({ ...prev, inbox: true }));
        }
      }

      // Fetch Daily Tasks for visible days
      for (const day of clientSideKanbanDays) {
        if (!initialFetchStatus.daily[day.dateString]) {
          try {
            const tasks = await getPlannerTasksForPanel(user.uid, day.dateString);
            const tasksWithStats = await Promise.all(tasks.map(fetchTaskWithSubtaskStats));
            setKanbanDayTasks(prev => ({ ...prev, [day.dateString]: tasksWithStats.sort((a,b) => (a.timeboxedStartTime || "24:00").localeCompare(b.timeboxedStartTime || "24:00") || a.order - b.order) }));
          } catch (error: any) {
            console.error(`Error fetching tasks for ${day.dateString}:`, error);
            setPageError(prev => `${prev ? prev + '; ' : ''}Error loading tasks for ${format(parseISO(day.dateString), 'MMM d')}: ${error.message}`);
            setKanbanDayTasks(prev => ({ ...prev, [day.dateString]: [] }));
          } finally {
            setInitialFetchStatus(prev => ({ ...prev, daily: { ...prev.daily, [day.dateString]: true }}));
          }
        }
      }
    };

    if (!isLoadingAuth && !isLoadingSettings && clientSideKanbanDays.length > 0 && isClient) {
      fetchTasks();
    } else if (!user?.uid && isClient) { // Handle anonymous user after client check
        setBrainDumpTasks([]);
        setKanbanDayTasks({});
        setInitialFetchStatus({ inbox: true, daily: {} });
    }
  }, [user?.uid, clientSideKanbanDaysString, isLoadingAuth, isLoadingSettings, fetchTaskWithSubtaskStats, initialFetchStatus, clientSideKanbanDays, isClient]);


  const refreshTaskInPanel = useCallback(async (taskIdToFocus?: string, panelIdToRefresh?: PlannerTaskPanel) => {
     if (!user?.uid) return;
     if (panelIdToRefresh) {
         if (panelIdToRefresh === 'brainDump') {
            setInitialFetchStatus(prev => ({...prev, inbox: false}));
         } else {
            setInitialFetchStatus(prev => ({...prev, daily: {...prev.daily, [panelIdToRefresh]: false}}));
         }
     } else { // Refresh all
        setInitialFetchStatus({ inbox: false, daily: {} });
     }
     // The main useEffect for fetching tasks will pick this up.
  }, [user?.uid]);

  const fetchLabels = useCallback(async () => {
    if (!user?.uid) { setTaskLabels([]); setIsLoadingLabels(false); return; }
    setIsLoadingLabels(true);
    setPageError(null);
    try {
      const labelsFromDb = await getPlannerLabels(user.uid);
      setTaskLabels([...labelsFromDb]);
    } catch (error: any) {
      console.error("Error fetching labels:", error);
      setPageError(prev => `${prev ? prev + '; ' : ''}Error loading labels: ${error.message}`);
      toast({ title: "Error Loading Labels", description: error.message, variant: "destructive" });
    } finally { setIsLoadingLabels(false); }
  }, [user?.uid, toast]);

  useEffect(() => { fetchLabels(); }, [fetchLabels]);

  const handleAddBrainDumpTask = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!newBrainDumpTaskText.trim() || !user?.uid) {
      if (!user?.uid) toast({ title: "Sign In Required", description: "You must be signed in to add tasks.", variant: "destructive" });
      return;
    }
    setIsAddingTask(true);
    setPageError(null);
    try {
      const newTaskData: Pick<PlannerTask, 'title' | 'estimatedTime' | 'panel' | 'order' | 'labelIds' | 'subtasks' | 'recurrenceRule'> = {
        title: newBrainDumpTaskText, estimatedTime: 0, panel: 'brainDump', order: Date.now(), labelIds: [], subtasks: [], recurrenceRule: null,
      };
      const addedTask = await addPlannerTask(user.uid, newTaskData);
      const taskWithStats = await fetchTaskWithSubtaskStats(addedTask);
      setBrainDumpTasks(prevTasks => [taskWithStats, ...prevTasks].sort((a, b) => a.order - b.order));
      setNewBrainDumpTaskText('');
      toast({ title: "Task Added", description: `"${addedTask.title}" added to Inbox.` });
    } catch (error: any) {
      console.error("Error adding task:", error);
      setPageError(prev => `${prev ? prev + '; ' : ''}Error adding task: ${error.message}`);
      toast({ title: "Error Adding Task", description: error.message, variant: "destructive" });
    } finally { setIsAddingTask(false); }
  }, [user?.uid, newBrainDumpTaskText, fetchTaskWithSubtaskStats, toast]);

  const handleDeleteTask = useCallback(async (taskId: string, panelId: PlannerTaskPanel) => {
    if (!user?.uid) return;
    setPageError(null);
    let taskToDelete: PlannerTask | undefined;
    if (panelId === 'brainDump') taskToDelete = brainDumpTasks.find(t => t.id === taskId);
    else taskToDelete = (kanbanDayTasks[panelId] || []).find(t => t.id === taskId);

    if (!taskToDelete) { toast({ title: "Error", description: "Task not found for deletion.", variant: "destructive" }); return; }

    // Optimistic UI update
    if (panelId === 'brainDump') setBrainDumpTasks(prev => prev.filter(t => t.id !== taskId));
    else setKanbanDayTasks(prev => ({ ...prev, [panelId]: (prev[panelId] || []).filter(t => t.id !== taskId) }));

    try {
      await deletePlannerTaskFromDb(taskId);
      toast({ title: "Task Deleted", description: `"${taskToDelete.title}" removed.` });
    } catch (error: any) {
      console.error("Error deleting task from DB:", error);
      setPageError(prev => `${prev ? prev + '; ' : ''}Error deleting task: ${error.message}`);
      toast({ title: "Error Deleting Task", description: error.message, variant: "destructive" });
      await refreshTaskInPanel(taskId, panelId);
    }
  }, [user?.uid, brainDumpTasks, kanbanDayTasks, refreshTaskInPanel, toast]);

  const handleToggleCompleteTask = useCallback(async (taskId: string, currentStatus: boolean, panelId: PlannerTaskPanel) => {
    if (!user?.uid) { toast({ title: "Sign In Required", description: "Sign in to update tasks.", variant: "destructive" }); return; }
    setPageError(null);
    let taskRefToUpdate: PlannerTask | undefined;
    if (panelId === 'brainDump') taskRefToUpdate = brainDumpTasks.find(t => t.id === taskId);
    else taskRefToUpdate = (kanbanDayTasks[panelId] || []).find(t => t.id === taskId);
    if (!taskRefToUpdate) { toast({ title: "Error", description: "Task not found for update.", variant: "destructive" }); return; }

    const newCompletedStatus = !currentStatus;
    const updateFn = (tasks: PlannerTask[]) => tasks.map(t => t.id === taskId ? { ...t, isCompleted: newCompletedStatus, completedAt: newCompletedStatus ? new Date().toISOString() : null } : t);
    
    if (panelId === 'brainDump') setBrainDumpTasks(updateFn);
    else setKanbanDayTasks(prev => ({ ...prev, [panelId]: updateFn(prev[panelId] || []) }));

    try {
      const effectiveSettings = userSettingsRef.current || DEFAULT_SETTINGS;
      let updatedSettings;
      if (newCompletedStatus) {
        updatedSettings = await completePlannerTaskInDb(user.uid, taskId, effectiveSettings);
      } else {
        updatedSettings = await restorePlannerTaskInDb(user.uid, taskId, effectiveSettings);
      }
      setUserSettings(updatedSettings);
      toast({ title: newCompletedStatus ? "Task Completed!" : "Task Marked Active" });
      await refreshTaskInPanel(taskId, panelId);
    } catch (error: any) {
      console.error("Error updating task status in DB:", error);
      setPageError(prev => `${prev ? prev + '; ' : ''}Error updating task status: ${error.message}`);
      toast({ title: "Error", description: `Could not update task status: ${error.message}`, variant: "destructive" });
      const revertFn = (tasks: PlannerTask[]) => tasks.map(t => t.id === taskId ? { ...t, isCompleted: currentStatus, completedAt: taskRefToUpdate?.completedAt } : t);
      if (panelId === 'brainDump') setBrainDumpTasks(revertFn);
      else setKanbanDayTasks(prev => ({ ...prev, [panelId]: revertFn(prev[panelId] || []) }));
    }
  }, [user?.uid, brainDumpTasks, kanbanDayTasks, setUserSettings, toast, refreshTaskInPanel]);

  const handleToggleCompleteBrainDumpTask = useCallback(
    (taskId: string, currentStatus: boolean) => handleToggleCompleteTask(taskId, currentStatus, 'brainDump'),
    [handleToggleCompleteTask]
  );

  const handleToggleCompleteDailyTask = useCallback(
    (taskId: string, currentStatus: boolean, panelIdFromItem: PlannerTaskPanel) => {
      return handleToggleCompleteTask(taskId, currentStatus, panelIdFromItem);
    },
    [handleToggleCompleteTask]
  );

  const handleDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, task: PlannerTask, originalPanel: PlannerTaskPanel) => {
    if (event.dataTransfer) {
        try {
            event.dataTransfer.setData("application/json", JSON.stringify({ taskId: task.id, originalPanelId: originalPanel, taskTitle: task.title }));
            event.dataTransfer.effectAllowed = "move";
        } catch(e) { console.error("Error setting drag data:", e); }
    }
  }, []);

  const handleDropOnPanel = useCallback(async (event: React.DragEvent<HTMLDivElement>, targetPanelId: PlannerTaskPanel) => {
    event.preventDefault();
    setPageError(null);
    let draggedDataString;
    try { draggedDataString = event.dataTransfer.getData("application/json"); }
    catch (e) { console.error("Error getting dataTransfer data:", e); return; }
    if (!draggedDataString) return;
    let parsedData: { taskId: string; originalPanelId: PlannerTaskPanel; taskTitle: string };
    try { parsedData = JSON.parse(draggedDataString); }
    catch (e) { console.error("Error parsing dragged data:", e); return; }

    const { taskId, originalPanelId, taskTitle } = parsedData;
    if (!user?.uid) { toast({ title: "Sign In Required", description:"Sign in to move tasks.", variant: "destructive" }); return; }
    if (originalPanelId === targetPanelId) return;

    let draggedTask: PlannerTask | undefined;
    if (originalPanelId === 'brainDump') draggedTask = brainDumpTasks.find(t => t.id === taskId);
    else draggedTask = (kanbanDayTasks[originalPanelId] || []).find(t => t.id === taskId);
    if (!draggedTask) return;

    const updates: Partial<PlannerTask> = {
      panel: targetPanelId, order: Date.now(),
      scheduledDate: targetPanelId === 'brainDump' ? null : targetPanelId,
      timeboxedStartTime: targetPanelId === 'brainDump' ? null : draggedTask.timeboxedStartTime,
    };

    if (originalPanelId === 'brainDump') setBrainDumpTasks(prev => prev.filter(t => t.id !== taskId));
    else setKanbanDayTasks(prev => ({ ...prev, [originalPanelId]: (prev[originalPanelId] || []).filter(t => t.id !== taskId)}));

    if (targetPanelId === 'brainDump') setBrainDumpTasks(prev => [...prev, { ...draggedTask!, ...updates }].sort((a,b) => a.order - b.order));
    else setKanbanDayTasks(prev => ({ ...prev, [targetPanelId]: [...(prev[targetPanelId] || []), { ...draggedTask!, ...updates }].sort((a,b) => (a.timeboxedStartTime || "24:00").localeCompare(b.timeboxedStartTime || "24:00") || a.order - b.order)}));

    try {
      await updatePlannerTaskInDb(taskId, updates);
      const targetName = targetPanelId === 'brainDump' ? 'Task Inbox' : format(parseISO(targetPanelId), 'MMM d');
      toast({ title: "Task Moved", description: `"${taskTitle}" to ${targetName}.` });
    } catch (error: any) {
      console.error("[Drop] Error updating task in DB:", error);
      setPageError(prev => `${prev ? prev + '; ' : ''}Error moving task: ${error.message}`);
      toast({ title: "Error Moving Task", description: error.message, variant: "destructive" });
      await refreshTaskInPanel(taskId, originalPanelId);
      if (originalPanelId !== targetPanelId) await refreshTaskInPanel(taskId, targetPanelId);
    }
  }, [user?.uid, brainDumpTasks, kanbanDayTasks, refreshTaskInPanel, toast]);

  const handleDropOnTimeSlot = useCallback(async (event: React.DragEvent<HTMLDivElement>, timeSlot: string) => {
    event.preventDefault();
    setPageError(null);
    let draggedDataString;
    try { draggedDataString = event.dataTransfer.getData("application/json"); } catch (e) { return; }
    if (!draggedDataString) return;
    let parsedData: { taskId: string; originalPanelId: PlannerTaskPanel; taskTitle: string };
    try { parsedData = JSON.parse(draggedDataString); } catch (e) { return; }

    const { taskId, originalPanelId, taskTitle } = parsedData;
    const currentCSKDS = clientSelectedKanbanDayDateString;
    if (!user?.uid || !currentCSKDS) return;

    let taskToTimebox: PlannerTask | undefined;
    if (originalPanelId === 'brainDump') taskToTimebox = brainDumpTasks.find(t => t.id === taskId);
    else taskToTimebox = (kanbanDayTasks[originalPanelId] || []).find(t => t.id === taskId);
    if (!taskToTimebox) return;

    const updates: Partial<PlannerTask> = {
      timeboxedStartTime: timeSlot, panel: currentCSKDS, order: Date.now(), scheduledDate: currentCSKDS,
    };

    if (originalPanelId === 'brainDump') setBrainDumpTasks(prev => prev.filter(t => t.id !== taskId));
    else if (originalPanelId !== currentCSKDS) setKanbanDayTasks(prev => ({ ...prev, [originalPanelId]: (prev[originalPanelId] || []).filter(t => t.id !== taskId)}));

    setKanbanDayTasks(prev => {
        const dayTasks = (prev[currentCSKDS] || []).filter(t => t.id !== taskId);
        return { ...prev, [currentCSKDS]: [...dayTasks, {...taskToTimebox!, ...updates}].sort((a,b) => (a.timeboxedStartTime || "24:00").localeCompare(b.timeboxedStartTime || "24:00") || a.order - b.order) };
    });

    try {
      await updatePlannerTaskInDb(taskId, updates);
      toast({ title: "Task Timeboxed", description: `"${taskTitle}" for ${timeSlot} on ${format(parseISO(currentCSKDS), 'MMM d')}.` });
    } catch (error: any) {
      console.error("Error timeboxing task in DB:", error);
      setPageError(prev => `${prev ? prev + '; ' : ''}Error timeboxing task: ${error.message}`);
      toast({ title: "Error Timeboxing Task", description: error.message, variant: "destructive" });
      await refreshTaskInPanel(taskId, originalPanelId);
      if (originalPanelId !== currentCSKDS) await refreshTaskInPanel(taskId, currentCSKDS);
    }
  }, [user?.uid, clientSelectedKanbanDayDateString, brainDumpTasks, kanbanDayTasks, refreshTaskInPanel, toast]);

  const selectedDayObject = useMemo(() => {
    if (!clientSelectedKanbanDayDateString || clientSideKanbanDays.length === 0) return null;
    return clientSideKanbanDays.find(d => d.dateString === clientSelectedKanbanDayDateString) || null;
  }, [clientSideKanbanDays, clientSelectedKanbanDayDateString]);

  const handleDragStartTimeboxedTaskForPanel = useCallback(
    (event: React.DragEvent<HTMLDivElement>, task: PlannerTask) => {
        const currentSelectedDateString = selectedDayObject?.dateString;
        if (currentSelectedDateString) {
            handleDragStart(event, task, currentSelectedDateString as PlannerTaskPanel);
        }
    }, [handleDragStart, selectedDayObject?.dateString]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }, []);

  const openTaskDetailModal = useCallback((task: PlannerTask) => { setTaskToDetail(task); setIsTaskDetailModalOpen(true); }, []);

  const handleSaveParentTaskDetails = useCallback(async (updatedTaskData: Partial<PlannerTask> & { id: string }) => {
    const currentTaskToDetail = taskToDetail;
    setPageError(null);
    if (!user?.uid || !currentTaskToDetail) return;
    const originalTask = currentTaskToDetail;
    const updatesToSave = { ...updatedTaskData }; delete updatesToSave.id;
    if (updatesToSave.hasOwnProperty('timeboxedStartTime') && typeof updatesToSave.timeboxedStartTime !== 'string') {
        updatesToSave.timeboxedStartTime = null;
    }

    try {
      await updatePlannerTaskInDb(originalTask.id, updatesToSave);
      toast({ title: "Task Updated", description: `"${updatedTaskData.title || originalTask.title}" saved.` });
      await refreshTaskInPanel(originalTask.id, originalTask.panel);
    } catch (error: any) {
      console.error("Error updating parent task in DB:", error);
      setPageError(prev => `${prev ? prev + '; ' : ''}Error updating task details: ${error.message}`);
      toast({ title: "Error Updating Task", description: error.message, variant: "destructive" });
      await refreshTaskInPanel(originalTask.id, originalTask.panel);
    }
    setIsTaskDetailModalOpen(false);
    setTaskToDetail(null);
  }, [user?.uid, taskToDetail, refreshTaskInPanel, toast]);

  const handleSelectKanbanDay = useCallback((dateString: string) => setClientSelectedKanbanDayDateString(dateString), []);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 7; hour < 22; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const timeboxedTasksForSelectedDay = useMemo(() => {
    return clientSelectedKanbanDayDateString ? (kanbanDayTasks[clientSelectedKanbanDayDateString] || []) : [];
  }, [kanbanDayTasks, clientSelectedKanbanDayDateString]);

  const handleOptimizeDaySchedule = useCallback(async () => {
    if (!user?.uid || !clientSelectedKanbanDayDateString) {
        toast({ title: "Cannot Optimize", description: "User or selected day not available.", variant: "destructive" }); return;
    }
    const tasksToOptimizeSource = kanbanDayTasks[clientSelectedKanbanDayDateString] || [];
    if (tasksToOptimizeSource.length === 0) {
        toast({ title: "No Tasks", description: "No tasks for selected day to optimize.", variant: "default" }); return;
    }
    const tasksForOptimization: TaskForOptimization[] = tasksToOptimizeSource.map(task => ({
        id: task.id, title: task.title, estimatedTime: task.estimatedTime || 30,
    }));
    setIsOptimizingSchedule(true);
    setPageError(null);
    try {
        const reportToUse = focusDnaReportFromAuth || null;
        const { optimizeDaySchedule } = await import('@/ai/flows/optimize-day-schedule-flow');
        const result = await optimizeDaySchedule({
            tasksForDay: tasksForOptimization, focusDnaReport: reportToUse,
            dayStartTime: "09:00", dayEndTime: "17:00", currentDate: clientSelectedKanbanDayDateString,
        });
        if (result.optimizedSchedule && result.optimizedSchedule.length > 0) {
            for (const optimizedTask of result.optimizedSchedule) {
                await updatePlannerTaskInDb(optimizedTask.taskId, { timeboxedStartTime: optimizedTask.suggestedStartTime, panel: clientSelectedKanbanDayDateString });
            }
            toast({ title: "Day Optimized!", description: result.overallNotes || "Schedule updated based on AI suggestions.", duration: 6000 });
            await refreshTaskInPanel(result.optimizedSchedule[0].taskId, clientSelectedKanbanDayDateString);
        } else {
            toast({ title: "Optimization Result", description: result.overallNotes || "AI could not generate an optimized schedule at this time.", variant: "default", duration: 6000 });
        }
    } catch (error: any) {
        console.error("Error optimizing schedule with AI:", error);
        setPageError(prev => `${prev ? prev + '; ' : ''}Error optimizing schedule: ${error.message}`);
        toast({ title: "Optimization Failed", description: `An error occurred: ${error.message}`, variant: "destructive" });
    } finally { setIsOptimizingSchedule(false); }
  }, [user?.uid, clientSelectedKanbanDayDateString, kanbanDayTasks, focusDnaReportFromAuth, toast, refreshTaskInPanel]);

  const handleRglLayoutChange = useCallback(async (_currentLayout: Layout[], allLayouts: Layouts) => {
    if (!layoutsInitialized || !isClient) return;
    setLocalGridLayouts(allLayouts);
    setIsSavingLayout(true);
    setPageError(null);
    try {
      if (user && setUserSettings) {
        if (JSON.stringify(userSettingsRef.current?.plannerLayouts) !== JSON.stringify(allLayouts)) {
          await setUserSettings({ plannerLayouts: allLayouts });
          toast({ title: "Layout Auto-Saved", description: "Planner layout updated in your profile.", duration: 2000 });
        }
      } else if (!user) {
        if (localStorage.getItem(LOCAL_STORAGE_PLANNER_LAYOUTS_KEY) !== JSON.stringify(allLayouts)) {
            localStorage.setItem(LOCAL_STORAGE_PLANNER_LAYOUTS_KEY, JSON.stringify(allLayouts));
            toast({ title: "Layout Auto-Saved", description: "Planner layout saved locally.", duration: 2000 });
        }
      }
    } catch (error: any) {
      console.error("Error auto-saving layout:", error);
      setPageError(prev => `${prev ? prev + '; ' : ''}Error auto-saving layout: ${error.message}`);
      toast({ title: "Layout Save Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingLayout(false);
    }
  }, [layoutsInitialized, isClient, user, setUserSettings, toast, userSettingsRef]);


  const handleManualSaveLayout = useCallback(async () => {
    if (!layoutsInitialized) {
      toast({ title: "Cannot Save", description: "Layouts not fully initialized yet.", variant: "default" });
      return;
    }
    setIsSavingLayout(true);
    setPageError(null);
    try {
      if (user && setUserSettings) {
        await setUserSettings({ plannerLayouts: localGridLayouts });
        toast({ title: "Layout Manually Saved", description: "Layout saved to your profile." });
      } else if (!user && isClient) {
        localStorage.setItem(LOCAL_STORAGE_PLANNER_LAYOUTS_KEY, JSON.stringify(localGridLayouts));
        toast({ title: "Layout Manually Saved", description: "Layout saved locally." });
      }
    } catch (error: any) {
      setPageError(prev => `${prev ? prev + '; ' : ''}Error manually saving layout: ${error.message}`);
      toast({ title: "Error Saving Layout", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingLayout(false);
    }
  }, [layoutsInitialized, isClient, user, setUserSettings, localGridLayouts, toast]);


  const handleBreakpointChange = useCallback((newBreakpoint: string) => setCurrentBreakpoint(newBreakpoint), []);

  const handleExpandWidget = useCallback((widgetId: 'inbox' | 'daily' | 'timebox' | null) => {
    setExpandedWidgetId(prev => (prev === widgetId ? null : widgetId));
  }, []);

  const handleExpandInbox = useCallback(() => handleExpandWidget('inbox'), [handleExpandWidget]);
  const handleExpandDaily = useCallback(() => handleExpandWidget('daily'), [handleExpandWidget]);
  const handleExpandTimebox = useCallback(() => handleExpandWidget('timebox'), [handleExpandWidget]);
  const handleCollapseWidget = useCallback(() => handleExpandWidget(null), [handleExpandWidget]);

  const handleCarryOverTasks = useCallback(async () => {
    if (!user?.uid) { toast({ title: "Sign In Required", description: "Sign in to carry over tasks.", variant: "destructive" }); return; }
    const yesterdayString = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const tasksFromYesterday = kanbanDayTasks[yesterdayString] || [];
    const uncompletedYesterday = tasksFromYesterday.filter(task => !task.isCompleted);
    if (uncompletedYesterday.length === 0) {
        toast({ title: "No Tasks to Carry Over", description: "No uncompleted tasks from yesterday." }); return;
    }
    setIsProcessingCarryOver(true);
    setPageError(null);
    try {
        for (const task of uncompletedYesterday) {
            await updatePlannerTaskInDb(task.id, {
                panel: todayString, scheduledDate: todayString, timeboxedStartTime: null, order: Date.now() + Math.random(),
            });
        }
        toast({ title: "Tasks Carried Over", description: `${uncompletedYesterday.length} task(s) moved to today.` });
        await refreshTaskInPanel("", yesterdayString);
        await refreshTaskInPanel("", todayString);
    } catch (error: any) {
        setPageError(prev => `${prev ? prev + '; ' : ''}Error carrying over tasks: ${error.message}`);
        toast({ title: "Carry Over Failed", description: error.message, variant: "destructive" });
    } finally { setIsProcessingCarryOver(false); }
  }, [user?.uid, kanbanDayTasks, refreshTaskInPanel, toast]);

  const isOptimizeButtonDisabled = !user?.uid || !clientSelectedKanbanDayDateString || isOptimizingSchedule;
  const optimizeButtonTooltipContent = !focusDnaReportFromAuth
    ? "Generate Focus DNA report for smarter optimization."
    : !clientSelectedKanbanDayDateString ? "Select a day to optimize." : "Optimise day using Focus DNA.";

  if (isLoadingAuth || isLoadingSettings) {
     return (
        <PageTransition>
            <div className="flex flex-col min-h-screen bg-background text-foreground">
                <HeaderComponent onOpenSettings={handleOpenPlannerSettings} />
                <main className="flex-grow flex flex-col p-4 md:p-6 items-center justify-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-muted-foreground mt-2">Initializing Planner...</p>
                </main>
                 <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} currentSettings={currentEffectiveSettings}
                    onSaveSettings={async (newSettings: UserSettings, wasUserChange?: boolean) => {
                        if (user) { await setUserSettings(newSettings); if (wasUserChange) toast({ title: "Settings Saved" }); }
                        else if (isClient) {
                            localStorage.setItem(LOCAL_STORAGE_PLANNER_LAYOUTS_KEY, JSON.stringify(newSettings.plannerLayouts || DEFAULT_PLANNER_LAYOUTS));
                            toast({ title: "Settings Saved Locally" });
                        } else {
                            toast({ title: "Cannot Save Settings", description: "User not identified.", variant: "destructive" });
                        }
                    }}
                />
            </div>
        </PageTransition>
    );
  }

  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

  const renderExpandedWidget = () => {
    const commonProps = {
      allLabels: taskLabels, onEditTask: openTaskDetailModal,
      isExpanded: true, onCollapse: handleCollapseWidget,
    };
    switch (expandedWidgetId) {
      case 'inbox':
        return <TaskInboxPanel
                    tasks={brainDumpTasks} isLoading={initialFetchStatus.inbox === false} isAdding={isAddingTask}
                    newTaskText={newBrainDumpTaskText} setNewTaskText={setNewBrainDumpTaskText} onAddTask={handleAddBrainDumpTask}
                    user={user} onDropOnPanel={handleDropOnPanel} onDragOverPanel={handleDragOver}
                    onToggleCompleteTask={(taskId, status) => handleToggleCompleteBrainDumpTask(taskId, status)}
                    onDragStartTask={handleDragStart}
                    onDeleteTask={(taskId) => handleDeleteTask(taskId, 'brainDump')}
                    onExpandRequest={handleExpandInbox}
                    {...commonProps}
                />;
      case 'daily':
        return <DailyPlannerPanel
                    kanbanDays={clientSideKanbanDays} tasksByDay={kanbanDayTasks} isLoadingTasksByDay={initialFetchStatus.daily}
                    selectedDayDateString={clientSelectedKanbanDayDateString}
                    onSelectDay={handleSelectKanbanDay} onDropTaskOnDay={handleDropOnPanel} onDragOverDay={handleDragOver}
                    onToggleCompleteTask={(taskId, status, panelId) => handleToggleCompleteDailyTask(taskId, status, panelId as PlannerTaskPanel)}
                    onDragStartTask={handleDragStart}
                    onDeleteTask={(taskId, panelId) => handleDeleteTask(taskId, panelId as PlannerTaskPanel)}
                    onExpandRequest={handleExpandDaily}
                    {...commonProps}
                />;
      case 'timebox':
        return <TimeboxPanel
                    selectedDayObject={selectedDayObject} timeSlots={timeSlots}
                    timeboxedTasksForSelectedDay={timeboxedTasksForSelectedDay}
                    TIME_SLOT_HEIGHT_PER_HOUR={TIME_SLOT_HEIGHT_PER_HOUR} MIN_TASK_HEIGHT={MIN_TASK_HEIGHT}
                    onDropTaskOnTimeSlot={handleDropOnTimeSlot} onDragOverTimeSlot={handleDragOver}
                    onDragStartTimeboxedTask={handleDragStartTimeboxedTaskForPanel}
                    onExpandRequest={handleExpandTimebox}
                     onEditTask={openTaskDetailModal}
                    {...commonProps}
                />;
      default: return null;
    }
  };

  return (
    <PageTransition>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          <HeaderComponent onOpenSettings={handleOpenPlannerSettings} />
          <main className="flex-grow flex flex-col p-2 md:p-4 space-y-3">
            {pageError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start mb-4">
                    <AlertTriangle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                    <p className="text-sm">{pageError}</p>
                </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-2xl md:text-3xl font-headline text-primary">Modular Task Planner</h1>
              <div className="flex items-center gap-2 flex-wrap">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="text-xs sm:text-sm">
                      <EllipsisVertical className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> More Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                    <DropdownMenuItem onClick={handleManualSaveLayout} disabled={isSavingLayout} className="cursor-pointer">
                      {isSavingLayout? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Manual Save Layout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCarryOverTasks} disabled={isProcessingCarryOver || !user} className="cursor-pointer">
                      {isProcessingCarryOver ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronsRight className="mr-2 h-4 w-4" />} Carry Over Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOptimizeDaySchedule} disabled={isOptimizeButtonDisabled} className="cursor-pointer">
                                <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center w-full">
                                        {isOptimizingSchedule ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} Optimise Day
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="bg-popover text-popover-foreground">
                                        <p>{optimizeButtonTooltipContent}</p>
                                    </TooltipContent>
                                </Tooltip>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsManageLabelsModalOpen(true)} className="cursor-pointer">
                      <Tag className="mr-2 h-4 w-4" /> Manage Labels
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" asChild className="text-xs sm:text-sm">
                  <Link href="/"><ArrowLeft className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> Pomodoro</Link>
                </Button>
              </div>
            </div>

          {expandedWidgetId ? (<div className="flex-grow">{renderExpandedWidget()}</div>) : (
              layoutsInitialized && isClient && (
                <ResponsiveGridLayout
                    className="flex-grow" layouts={localGridLayouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={cols}
                    rowHeight={30} draggableHandle=".widget-drag-handle"
                    draggableCancel=".non-draggable, .planner-drop-zone, input, button, textarea, select, .task-checkbox-area, .task-actions-area"
                    onLayoutChange={handleRglLayoutChange}
                    onBreakpointChange={handleBreakpointChange}
                    isDraggable={true} isResizable={true} compactType="vertical" margin={[10, 10]}
                    containerPadding={[10,10]} preventCollision={false}
                >
                    <div key="inbox" className="bg-card p-4 rounded-lg shadow-md border border-border flex flex-col h-full overflow-hidden planner-drop-zone">
                        <TaskInboxPanel
                            tasks={brainDumpTasks} isLoading={initialFetchStatus.inbox === false} isAdding={isAddingTask}
                            newTaskText={newBrainDumpTaskText} setNewTaskText={setNewBrainDumpTaskText} onAddTask={handleAddBrainDumpTask}
                            allLabels={taskLabels} onEditTask={openTaskDetailModal}
                            onDeleteTask={(taskId) => handleDeleteTask(taskId, 'brainDump')}
                            onDragStartTask={handleDragStart} onDropOnPanel={handleDropOnPanel} onDragOverPanel={handleDragOver}
                            onToggleCompleteTask={(taskId, status) => handleToggleCompleteBrainDumpTask(taskId, status)}
                            user={user} onExpandRequest={handleExpandInbox}
                        />
                    </div>
                    <div key="daily" className="bg-card p-4 rounded-lg shadow-md border border-border flex flex-col h-full overflow-hidden">
                        <DailyPlannerPanel
                            kanbanDays={clientSideKanbanDays} tasksByDay={kanbanDayTasks}
                            isLoadingTasksByDay={initialFetchStatus.daily}
                            selectedDayDateString={clientSelectedKanbanDayDateString} allLabels={taskLabels}
                            onSelectDay={handleSelectKanbanDay} onDropTaskOnDay={handleDropOnPanel} onDragOverDay={handleDragOver}
                            onEditTask={openTaskDetailModal}
                            onDeleteTask={(taskId, panelId) => handleDeleteTask(taskId, panelId as PlannerTaskPanel)}
                            onDragStartTask={handleDragStart}
                            onToggleCompleteTask={(taskId, status, panelId) => handleToggleCompleteDailyTask(taskId, status, panelId as PlannerTaskPanel)}
                            onExpandRequest={handleExpandDaily}
                        />
                    </div>
                    <div key="timebox" className="bg-card p-4 rounded-lg shadow-md border border-border flex flex-col h-full">
                        <TimeboxPanel
                            selectedDayObject={selectedDayObject} timeSlots={timeSlots}
                            timeboxedTasksForSelectedDay={timeboxedTasksForSelectedDay}
                            TIME_SLOT_HEIGHT_PER_HOUR={TIME_SLOT_HEIGHT_PER_HOUR} MIN_TASK_HEIGHT={MIN_TASK_HEIGHT}
                            onDropTaskOnTimeSlot={handleDropOnTimeSlot} onDragOverTimeSlot={handleDragOver}
                            onEditTask={openTaskDetailModal}
                            onDragStartTimeboxedTask={handleDragStartTimeboxedTaskForPanel}
                            onExpandRequest={handleExpandTimebox}
                        />
                    </div>
                </ResponsiveGridLayout>
              )
          )}
          </main>

          <TaskDetailModal
              isOpen={isTaskDetailModalOpen} onClose={() => { setIsTaskDetailModalOpen(false); setTaskToDetail(null); }}
              task={taskToDetail} onSaveParentTask={handleSaveParentTaskDetails} allLabels={taskLabels}
              onTaskUpdated={async (taskId) => {
                  const task = brainDumpTasks.find(t => t.id === taskId) || Object.values(kanbanDayTasks).flat().find(t => t.id === taskId);
                  if (task && user) await refreshTaskInPanel(taskId, task.panel);
              }}
          />
          <ManageLabelsModal
              isOpen={isManageLabelsModalOpen} onClose={() => setIsManageLabelsModalOpen(false)}
              userId={user?.uid} existingLabels={taskLabels} onLabelsUpdated={fetchLabels}
          />
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            currentSettings={currentEffectiveSettings}
            onSaveSettings={async (newSettings: UserSettings, wasUserChange?: boolean) => {
              if (user && setUserSettings) {
                await setUserSettings(newSettings);
                if (wasUserChange) toast({ title: "Settings Saved" });
              } else if (isClient) {
                 localStorage.setItem(LOCAL_STORAGE_PLANNER_LAYOUTS_KEY, JSON.stringify(newSettings.plannerLayouts || DEFAULT_PLANNER_LAYOUTS));
                 toast({ title: "Settings Saved Locally" });
              } else {
                 toast({ title: "Cannot Save Settings", description: "User not identified.", variant: "destructive" });
              }
            }}
          />
        </div>
      </TooltipProvider>
    </PageTransition>
  );
}
