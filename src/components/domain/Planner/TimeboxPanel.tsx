
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { PlannerTask, TaskLabel, PlannerTaskPanel, ExternalCalendarEvent, UserSettings, CalendarEventsApiResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CalendarClock, Edit3, Expand, Minimize, RefreshCw, WifiOff } from 'lucide-react';
import { cn, formatMinutesToHoursAndMinutes } from '@/lib/utils';
import { format, setHours, parseISO, differenceInMinutes } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext'; 
import { useToast } from '@/hooks/use-toast';

interface TimeboxPanelProps {
  selectedDayObject: { date: Date; name: string; dateString: string } | null;
  timeSlots: string[];
  timeboxedTasksForSelectedDay: PlannerTask[];
  TIME_SLOT_HEIGHT_PER_HOUR: number;
  MIN_TASK_HEIGHT: number;
  onDropTaskOnTimeSlot: (event: React.DragEvent<HTMLDivElement>, timeSlot: string) => void;
  onDragOverTimeSlot: (event: React.DragEvent<HTMLDivElement>) => void;
  onEditTask: (task: PlannerTask) => void;
  onDragStartTimeboxedTask: (event: React.DragEvent<HTMLDivElement>, task: PlannerTask, originalPanel: PlannerTaskPanel) => void;
  isExpanded?: boolean;
  onExpandRequest?: () => void;
  onCollapse?: () => void;
}

const TimeboxPanel: React.FC<TimeboxPanelProps> = ({
  selectedDayObject,
  timeSlots,
  timeboxedTasksForSelectedDay,
  TIME_SLOT_HEIGHT_PER_HOUR,
  MIN_TASK_HEIGHT,
  onDropTaskOnTimeSlot,
  onDragOverTimeSlot,
  onEditTask,
  onDragStartTimeboxedTask,
  isExpanded,
  onExpandRequest,
  onCollapse,
}) => {
  const { userSettings, user } = useAuth(); 
  const { toast } = useToast();
  const [fetchedCalendarEvents, setFetchedCalendarEvents] = useState<ExternalCalendarEvent[]>([]);
  const [isLoadingCalendarEvents, setIsLoadingCalendarEvents] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const shouldFetchCalendarEvents = userSettings?.enableCalendarIntegration === true && userSettings?.googleCalendarLinked === true && !!user;

  const fetchCalendarEvents = useCallback(async (dateString: string) => {
    if (!shouldFetchCalendarEvents) { 
      setFetchedCalendarEvents([]);
      setCalendarError(null);
      return;
    }
    setIsLoadingCalendarEvents(true);
    setCalendarError(null);
    try {
      const idToken = await user!.getIdToken(); 
      const response = await fetch(`/api/calendar-events?date=${dateString}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch calendar events');
      }
      const data: CalendarEventsApiResponse = await response.json();
      setFetchedCalendarEvents(data.events || []);
    } catch (error: any) {
      console.error("Error fetching calendar events:", error);
      setCalendarError(error.message || "Could not load calendar events.");
      setFetchedCalendarEvents([]);
      toast({
        title: "Calendar Error",
        description: error.message || "Could not load calendar events.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCalendarEvents(false);
    }
  }, [shouldFetchCalendarEvents, user, toast]); 

  useEffect(() => {
    if (selectedDayObject && shouldFetchCalendarEvents) {
      fetchCalendarEvents(selectedDayObject.dateString);
    } else {
      setFetchedCalendarEvents([]);
      setCalendarError(null);
    }
  }, [selectedDayObject, fetchCalendarEvents, shouldFetchCalendarEvents]); 

  const getPositionAndHeight = (startTimeStr: string, endTimeStr: string, allDay?: boolean): { top: number; height: number } => {
    if (allDay) {
      return { top: 0, height: TIME_SLOT_HEIGHT_PER_HOUR * (22 - 7) }; 
    }
    try {
        const startTime = parseISO(startTimeStr);
        const endTime = parseISO(endTimeStr);

        const startHour = startTime.getHours();
        const startMinute = startTime.getMinutes();
        
        const durationMinutes = differenceInMinutes(endTime, startTime);

        const topOffset = ((startHour - 7) * TIME_SLOT_HEIGHT_PER_HOUR) + (startMinute / 60 * TIME_SLOT_HEIGHT_PER_HOUR);
        const taskHeight = Math.max(MIN_TASK_HEIGHT, (durationMinutes / 60) * TIME_SLOT_HEIGHT_PER_HOUR);
        return { top: topOffset, height: taskHeight };

    } catch (e) {
        const [sHour, sMinute] = startTimeStr.split(':').map(Number);
        const [eHour, eMinute] = endTimeStr.split(':').map(Number);
        const duration = (eHour + eMinute/60) - (sHour + sMinute/60);

        const top = ((sHour - 7) * TIME_SLOT_HEIGHT_PER_HOUR) + (sMinute / 60 * TIME_SLOT_HEIGHT_PER_HOUR);
        const height = Math.max(MIN_TASK_HEIGHT, duration * TIME_SLOT_HEIGHT_PER_HOUR);
        return {top, height};
    }
  };


  return (
    <div className={cn(
        "bg-card p-4 rounded-lg shadow-md border border-border flex flex-col h-full",
        isExpanded && "fixed inset-0 z-50 m-0 rounded-none border-0"
      )}>
      <div className={cn("flex items-center justify-between mb-3", !isExpanded && "widget-drag-handle cursor-move")}>
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <CalendarClock className="mr-2 h-5 w-5 text-primary" /> Timebox
        </h2>
        <div className="flex items-center gap-2">
            {selectedDayObject && (
            <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                {selectedDayObject.name}, {format(selectedDayObject.date, 'MMM d')}
            </span>
            )}
             {shouldFetchCalendarEvents && selectedDayObject && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchCalendarEvents(selectedDayObject.dateString)}
                disabled={isLoadingCalendarEvents}
                aria-label="Refresh calendar events"
              >
                <RefreshCw className={cn("h-4 w-4", isLoadingCalendarEvents && "animate-spin")} />
              </Button>
            )} 
            <Button variant="ghost" size="icon" onClick={isExpanded ? onCollapse : onExpandRequest} aria-label={isExpanded ? "Collapse Timebox" : "Expand Timebox"}>
                 {isExpanded ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
            </Button>
        </div>
      </div>

      {!selectedDayObject ? (
        <div className="flex-grow flex items-center justify-center text-muted-foreground text-center p-4 border-2 border-dashed border-muted/30 rounded-md">
          <p>Select a day from the Daily Planner to timebox its tasks.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto relative pr-1 border border-border/20 rounded-md bg-background/20 planner-drop-zone">
          
          {shouldFetchCalendarEvents && !isLoadingCalendarEvents && !calendarError && fetchedCalendarEvents.map(event => {
            const { top, height } = getPositionAndHeight(event.startTime, event.endTime, event.allDay);
            return (
              <div
                key={event.id}
                className="absolute left-[48px] right-0 p-1.5 bg-muted/60 border-l-4 border-muted rounded-sm shadow-sm overflow-hidden z-0 group"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: event.color ? `${event.color}99` : 'hsla(var(--muted), 0.6)', 
                  borderColor: event.color || 'hsl(var(--muted))',
                }}
                title={`${event.title} (Calendar Event: ${event.description || 'No description'})`}
              >
                <p className="text-xs font-medium text-muted-foreground truncate leading-tight">{event.title}</p>
                <p className="text-[10px] text-muted-foreground/80 truncate">
                    {event.allDay ? "All Day" : `${format(parseISO(event.startTime), 'HH:mm')} - ${format(parseISO(event.endTime), 'HH:mm')}`}
                </p>
              </div>
            );
          })}
           {isLoadingCalendarEvents && shouldFetchCalendarEvents && (
             <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
                <RefreshCw className="h-5 w-5 animate-spin text-primary mr-2"/> Loading calendar...
             </div>
           )}
           {calendarError && shouldFetchCalendarEvents && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive p-2 z-20 text-center">
                <WifiOff className="h-5 w-5 mb-1"/>
                <p className="text-xs">{calendarError}</p>
                <Button variant="link" size="sm" className="text-xs h-auto p-0 mt-1" onClick={() => selectedDayObject && fetchCalendarEvents(selectedDayObject.dateString)}>Try again</Button>
             </div>
           )}
          
          {timeSlots.map((slot) => (
            <div
              key={slot}
              className="h-[30px] border-b border-border/10 relative flex items-center pl-12 group"
              onDrop={(e) => !isExpanded && onDropTaskOnTimeSlot(e, slot)}
              onDragOver={!isExpanded ? onDragOverTimeSlot : undefined}
              aria-label={`Time slot ${slot}`}
            >
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70 w-10 text-right pr-2">
                {slot.endsWith(':00') ? format(setHours(new Date(), parseInt(slot.split(':')[0])), 'ha') : ''}
              </span>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          ))}
          {timeboxedTasksForSelectedDay.map(task => {
            if (!task.timeboxedStartTime || !selectedDayObject) return null;
            const [hour, minute] = task.timeboxedStartTime.split(':').map(Number);
            const topOffset = ((hour - 7) * TIME_SLOT_HEIGHT_PER_HOUR) + (minute / 60 * TIME_SLOT_HEIGHT_PER_HOUR);
            const taskHeight = Math.max(MIN_TASK_HEIGHT, ((task.estimatedTime || 30) / 60) * TIME_SLOT_HEIGHT_PER_HOUR); 

            return (
              <div
                key={task.id}
                draggable={!isExpanded}
                onDragStart={(e) => !isExpanded && onDragStartTimeboxedTask(e, task, selectedDayObject.dateString as PlannerTaskPanel)}
                className="absolute left-[48px] right-0 p-1.5 bg-accent/80 border-l-4 border-accent rounded-sm shadow-md overflow-hidden z-10 group"
                style={{
                  top: `${topOffset}px`,
                  height: `${taskHeight}px`,
                  cursor: isExpanded ? 'default' : 'grab',
                }}
                title={`${task.title} (${formatMinutesToHoursAndMinutes(task.estimatedTime || 0)}) at ${task.timeboxedStartTime}`}
              >
                <p className="text-xs font-medium text-accent-foreground truncate leading-tight">{task.title}</p>
                <p className="text-[10px] text-accent-foreground/80 truncate">{formatMinutesToHoursAndMinutes(task.estimatedTime || 30)}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                  className="absolute top-0.5 right-0.5 h-5 w-5 p-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 bg-accent/50 hover:bg-accent text-accent-foreground rounded-full draggable-cancel"
                  aria-label="Edit timeboxed task"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimeboxPanel;

