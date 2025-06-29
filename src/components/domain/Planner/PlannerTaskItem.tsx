
"use client";

import React, { useMemo } from 'react'; // Removed useState, useEffect
import type { PlannerTask, TaskLabel, PlannerTaskPanel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, CheckSquare, Square } from 'lucide-react'; // Removed Circle, ChevronDown, ChevronRight
import { cn, formatMinutesToHoursAndMinutes } from '@/lib/utils';
// Removed getSubtasks import as subtaskStats is now directly on the task prop
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PlannerTaskItemProps {
  task: PlannerTask;
  panelId: PlannerTaskPanel;
  allLabels: TaskLabel[];
  onEditTask: (task: PlannerTask) => void;
  onDeleteTask: (taskId: string, panelId: PlannerTaskPanel) => void;
  onDragStartTask: (event: React.DragEvent<HTMLDivElement>, task: PlannerTask, originalPanel: PlannerTaskPanel) => void;
  onToggleComplete: (taskId: string, currentStatus: boolean) => void;
}

// Wrapped with React.memo
const PlannerTaskItem: React.FC<PlannerTaskItemProps> = React.memo(({
  task,
  panelId,
  allLabels,
  onEditTask,
  onDeleteTask,
  onDragStartTask,
  onToggleComplete,
}) => {
  const taskLabelsForThisTask = task.labelIds?.map(labelId => allLabels.find(l => l.id === labelId)).filter(Boolean) as TaskLabel[];
  
  const subtaskProgress = useMemo(() => {
    if (task.subtaskStats) {
      return `${task.subtaskStats.completed}/${task.subtaskStats.total}`;
    }
    return null;
  }, [task.subtaskStats]);


  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.task-checkbox-area') || (e.target as HTMLElement).closest('.task-actions-area')) {
      return;
    }
    onEditTask(task);
  };

  return (
    <div
      className={cn(
        "p-3 bg-card/60 rounded-lg shadow-sm flex items-start group border border-border/30 hover:shadow-md transition-shadow",
        task.isCompleted && "opacity-60"
      )}
      draggable={true}
      onDragStart={(e) => onDragStartTask(e, task, panelId)}
      onClick={handleCardClick}
    >
      <div className="flex items-center mr-3 mt-1 task-checkbox-area cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id, task.isCompleted); }}>
        {task.isCompleted ? (
          <CheckSquare className="h-5 w-5 text-primary cursor-pointer transition-colors" />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground/50 hover:text-primary cursor-pointer transition-colors" />
        )}
      </div>
      <div className="flex-grow min-w-0 cursor-pointer"> {/* min-w-0 is crucial for truncate to work in flex items */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <p className={cn(
              "text-sm font-medium text-foreground truncate pr-1", // Changed to truncate
              task.isCompleted && "line-through"
            )} title={task.title}> {/* HTML title for accessibility / native fallback */}
              {task.title}
            </p>
          </TooltipTrigger>
          <TooltipContent side="top" align="start" className="bg-popover text-popover-foreground shadow-lg max-w-xs">
            <p className="break-words">{task.title}</p> {/* break-words in tooltip content for very long titles */}
          </TooltipContent>
        </Tooltip>

        {taskLabelsForThisTask.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
            {taskLabelsForThisTask.map(label => (
              <span key={label.id} className="flex items-center text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full mr-1" style={{ backgroundColor: label.color }} />
                {label.name}
              </span>
            ))}
          </div>
        )}
        {subtaskProgress && (
           <p className="text-xs text-muted-foreground mt-1">Subtasks: {subtaskProgress}</p>
        )}
      </div>
      <div className="flex flex-col items-end flex-shrink-0 pl-2 space-y-1 task-actions-area">
        {task.estimatedTime > 0 && (
          <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
            {formatMinutesToHoursAndMinutes(task.estimatedTime)}
          </span>
        )}
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
            className="h-6 w-6 opacity-60 group-hover:opacity-100 focus:opacity-100"
            aria-label="Edit task"
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-accent" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id, panelId); }}
            className="h-6 w-6 opacity-60 group-hover:opacity-100 focus:opacity-100"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
});
PlannerTaskItem.displayName = 'PlannerTaskItem'; // Add display name for memoized component

export default PlannerTaskItem;
