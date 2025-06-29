
"use client";

import React from 'react';
import type { User } from 'firebase/auth';
import type { PlannerTask } from '@/lib/types'; // Changed from LocalTask to PlannerTask
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label as UiLabel } from '@/components/ui/label'; // Renamed to avoid conflict with SelectLabel
import { Loader2, CalendarCheck, Inbox } from 'lucide-react';

interface TaskSelectorProps {
  user: User | null;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  todayTasks: PlannerTask[];
  inboxTasks: PlannerTask[];
  isLoadingTasks: boolean;
}

const TaskSelector: React.FC<TaskSelectorProps> = ({
  user,
  selectedTaskId,
  setSelectedTaskId,
  todayTasks,
  inboxTasks,
  isLoadingTasks,
}) => {
  if (!user) return null; // Selector is only relevant for logged-in users if tasks are from Firestore

  const hasTodayTasks = todayTasks.length > 0;
  const hasInboxTasks = inboxTasks.length > 0;
  const noTasksAvailable = !hasTodayTasks && !hasInboxTasks;

  return (
    <div className="w-full">
      <UiLabel htmlFor="task-select-pomodoro" className="text-sm text-muted-foreground mb-1 block">
        Link Pomodoro to a Task (Optional)
      </UiLabel>
      <Select
        value={selectedTaskId || ""}
        onValueChange={(value) => setSelectedTaskId(value === "none" ? null : value)}
        disabled={isLoadingTasks || (!isLoadingTasks && noTasksAvailable)}
      >
        <SelectTrigger id="task-select-pomodoro" className="w-full bg-input text-foreground">
          <SelectValue
            placeholder={
              isLoadingTasks
                ? "Loading tasks..."
                : noTasksAvailable
                ? "No tasks available"
                : "Select a task to focus on..."
            }
          />
        </SelectTrigger>
        <SelectContent className="bg-popover text-popover-foreground max-h-80">
          {isLoadingTasks ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading planner tasks...
            </div>
          ) : (
            <>
              <SelectItem value="none">-- No Specific Task (General Focus) --</SelectItem>
              
              {hasTodayTasks && (
                <SelectGroup>
                  <SelectLabel className="text-primary flex items-center">
                    <CalendarCheck className="mr-2 h-4 w-4" /> Today's Plan
                  </SelectLabel>
                  {todayTasks.map(task => (
                    <SelectItem key={task.id} value={task.id} className="hover:bg-accent/10 focus:bg-accent/20">
                      <span className="truncate block max-w-[250px] sm:max-w-[300px]" title={task.title}>
                        {task.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {hasInboxTasks && (
                <SelectGroup>
                  <SelectLabel className="text-primary flex items-center">
                    <Inbox className="mr-2 h-4 w-4" /> From Your Inbox
                  </SelectLabel>
                  {inboxTasks.map(task => (
                    <SelectItem key={task.id} value={task.id} className="hover:bg-accent/10 focus:bg-accent/20">
                     <span className="truncate block max-w-[250px] sm:max-w-[300px]" title={task.title}>
                        {task.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {!isLoadingTasks && noTasksAvailable && (
                <SelectItem value="no-tasks-placeholder" disabled>
                  No tasks in Today's Plan or Inbox.
                </SelectItem>
              )}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskSelector;
