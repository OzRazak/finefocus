
"use client";

import React, { useRef, useEffect } from 'react';
import type { PlannerTask, TaskLabel, PlannerTaskPanel } from '@/lib/types';
import { Loader2, Expand, Minimize } from 'lucide-react';
import { cn, formatMinutesToHoursAndMinutes } from '@/lib/utils';
import { format } from 'date-fns';
import PlannerTaskItem from './PlannerTaskItem';
import { Button } from '@/components/ui/button';

interface KanbanDay {
  date: Date;
  name: string;
  dateString: string;
}

interface DailyPlannerPanelProps {
  kanbanDays: KanbanDay[];
  tasksByDay: Record<string, PlannerTask[]>;
  isLoadingTasksByDay: Record<string, boolean>;
  selectedDayDateString: string | null;
  allLabels: TaskLabel[];
  onSelectDay: (dateString: string) => void;
  onDropTaskOnDay: (event: React.DragEvent<HTMLDivElement>, targetPanelId: PlannerTaskPanel) => void;
  onDragOverDay: (event: React.DragEvent<HTMLDivElement>) => void;
  onEditTask: (task: PlannerTask) => void;
  onDeleteTask: (taskId: string, panelId: PlannerTaskPanel) => void;
  onDragStartTask: (event: React.DragEvent<HTMLDivElement>, task: PlannerTask, originalPanel: PlannerTaskPanel) => void;
  onToggleCompleteTask: (taskId: string, currentStatus: boolean, panelId: PlannerTaskPanel) => void;
  isExpanded?: boolean;
  onExpandRequest?: () => void;
  onCollapse?: () => void;
}

const DailyPlannerPanel: React.FC<DailyPlannerPanelProps> = ({
  kanbanDays,
  tasksByDay,
  isLoadingTasksByDay,
  selectedDayDateString,
  allLabels,
  onSelectDay,
  onDropTaskOnDay,
  onDragOverDay,
  onEditTask,
  onDeleteTask,
  onDragStartTask,
  onToggleCompleteTask,
  isExpanded,
  onExpandRequest,
  onCollapse,
}) => {
  const calculateTotalEstimatedTime = (tasks: PlannerTask[]): number => {
    return tasks.reduce((total, task) => total + (task.estimatedTime || 0), 0);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current && selectedDayDateString && kanbanDays.length > 0) {
        const todayString = format(new Date(), 'yyyy-MM-dd');
        if (selectedDayDateString === todayString) {
            const todayElement = scrollContainerRef.current.querySelector(`[data-day-id="${todayString}"]`);
            if (todayElement) {
                todayElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                });
            }
        }
    }
  }, [selectedDayDateString, kanbanDays]);


  return (
    <div className={cn(
        "bg-card p-4 rounded-lg shadow-md border border-border flex flex-col h-full overflow-hidden",
        isExpanded && "fixed inset-0 z-50 m-0 rounded-none border-0"
      )}>
      <div className={cn("flex justify-between items-center mb-3", !isExpanded && "widget-drag-handle cursor-move")}>
        <h2 className="text-xl font-semibold text-foreground">Daily Planner</h2>
        <Button variant="ghost" size="icon" onClick={isExpanded ? onCollapse : onExpandRequest} aria-label={isExpanded ? "Collapse Daily Planner" : "Expand Daily Planner"}>
            {isExpanded ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </Button>
      </div>
      <div ref={scrollContainerRef} className="flex-grow flex gap-3 overflow-x-auto pb-2">
        {kanbanDays.map(day => {
          const dayTasks = tasksByDay[day.dateString] || [];
          return (
            <div
              key={day.dateString}
              data-day-id={day.dateString}
              className={cn(
                "bg-background/40 p-3 rounded-lg shadow-sm flex flex-col min-w-[240px] sm:min-w-[260px] md:min-w-[280px] h-full flex-shrink-0 border-2 planner-drop-zone",
                selectedDayDateString === day.dateString ? "border-primary" : "border-border/20 hover:border-primary/40",
                "cursor-pointer transition-all"
              )}
              onDrop={(e) => !isExpanded && onDropTaskOnDay(e, day.dateString as PlannerTaskPanel)}
              onDragOver={!isExpanded ? onDragOverDay : undefined}
              onClick={() => !isExpanded && onSelectDay(day.dateString)}
              aria-label={`Select day ${day.name}, ${format(day.date, 'MMM d, yyyy')}`}
            >
              <div className="mb-2 flex justify-between items-center">
                <div>
                  <h3 className={cn("font-semibold text-md", selectedDayDateString === day.dateString ? "text-primary" : "text-foreground")}>
                    {day.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{format(day.date, 'MMM d, yyyy')}</p>
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                  {formatMinutesToHoursAndMinutes(calculateTotalEstimatedTime(dayTasks))}
                </span>
              </div>
              {isLoadingTasksByDay[day.dateString] ? (
                <div className="flex-grow flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-1" /> Loading...
                </div>
              ) : dayTasks.length === 0 ? (
                <div className="flex-grow border-2 border-dashed border-muted/30 rounded-md p-2 text-center text-xs flex items-center justify-center min-h-[80px] text-muted-foreground">
                  Drop tasks here or create new ones.
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto space-y-2 pr-1 min-h-[80px]">
                  {dayTasks.map(task => (
                    <PlannerTaskItem
                      key={task.id}
                      task={task}
                      panelId={day.dateString as PlannerTaskPanel}
                      allLabels={allLabels}
                      onEditTask={onEditTask}
                      onDeleteTask={onDeleteTask}
                      onDragStartTask={onDragStartTask}
                      onToggleComplete={(taskId, status) => onToggleCompleteTask(taskId, status, day.dateString as PlannerTaskPanel)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyPlannerPanel;

