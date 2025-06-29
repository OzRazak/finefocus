
"use client";

import React from 'react';
import type { PlannerTask, TaskLabel, PlannerTaskPanel } from '@/lib/types';
import type { User } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Expand, Minimize } from 'lucide-react';
import PlannerTaskItem from './PlannerTaskItem';
import { cn } from '@/lib/utils';

interface TaskInboxPanelProps {
  tasks: PlannerTask[];
  isLoading: boolean;
  isAdding: boolean;
  newTaskText: string;
  setNewTaskText: (text: string) => void;
  onAddTask: (e: React.FormEvent) => Promise<void>;
  allLabels: TaskLabel[];
  onEditTask: (task: PlannerTask) => void;
  onDeleteTask: (taskId: string, panelId: PlannerTaskPanel) => void;
  onDragStartTask: (event: React.DragEvent<HTMLDivElement>, task: PlannerTask, originalPanel: PlannerTaskPanel) => void;
  onDropOnPanel: (event: React.DragEvent<HTMLDivElement>, targetPanelId: PlannerTaskPanel) => void;
  onDragOverPanel: (event: React.DragEvent<HTMLDivElement>) => void;
  onToggleCompleteTask: (taskId: string, currentStatus: boolean, panelId: PlannerTaskPanel) => void;
  user: User | null;
  isExpanded?: boolean;
  onExpandRequest?: () => void;
  onCollapse?: () => void;
}

const TaskInboxPanel: React.FC<TaskInboxPanelProps> = ({
  tasks,
  isLoading,
  isAdding,
  newTaskText,
  setNewTaskText,
  onAddTask,
  allLabels,
  onEditTask,
  onDeleteTask,
  onDragStartTask,
  onDropOnPanel,
  onDragOverPanel,
  onToggleCompleteTask,
  user,
  isExpanded,
  onExpandRequest,
  onCollapse,
}) => {
  return (
    <div
      className={cn(
        "bg-card p-4 rounded-lg shadow-md border border-border flex flex-col h-full overflow-hidden planner-drop-zone",
        isExpanded && "fixed inset-0 z-50 m-0 rounded-none border-0"
      )}
      onDrop={(e) => !isExpanded && onDropOnPanel(e, 'brainDump')}
      onDragOver={!isExpanded ? onDragOverPanel : undefined}
    >
      <div className={cn("flex justify-between items-center mb-3", !isExpanded && "widget-drag-handle cursor-move")}>
        <h2 className="text-xl font-semibold text-foreground">Task Inbox</h2>
        <Button variant="ghost" size="icon" onClick={isExpanded ? onCollapse : onExpandRequest} aria-label={isExpanded ? "Collapse Task Inbox" : "Expand Task Inbox"}>
            {isExpanded ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </Button>
      </div>
      <form onSubmit={onAddTask} className="flex gap-2 mb-4">
        <Input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a quick task..."
          className="flex-grow bg-input text-foreground draggable-cancel"
          disabled={isAdding || !user}
          aria-label="New task for inbox"
        />
        <Button type="submit" size="icon" disabled={!newTaskText.trim() || isAdding || !user} aria-label="Add task to inbox" className="draggable-cancel">
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        </Button>
      </form>
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-muted-foreground text-center p-4 border-2 border-dashed border-muted/30 rounded-md min-h-[100px]">
          <p>{user ? "Task Inbox is empty." : "Sign in to manage tasks."}</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto space-y-2 pr-1">
          {tasks.map(task => (
            <PlannerTaskItem
              key={task.id}
              task={task}
              panelId="brainDump"
              allLabels={allLabels}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onDragStartTask={onDragStartTask}
              onToggleComplete={(taskId, status) => onToggleCompleteTask(taskId, status, "brainDump")}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskInboxPanel;

