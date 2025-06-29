
"use client";

import React, { useState, useEffect, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PlannerTask, PlannerSubtask, TaskLabel } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Tag, PlusCircle, Trash2, ListChecks, Clock, CheckIcon } from 'lucide-react';
import { getSubtasks as fetchSubtasks, addSubtask as addSubtaskToDb, updateSubtask as updateSubtaskInDb, deleteSubtask as deleteSubtaskFromDb, updatePlannerTask as updateParentTaskInDb } from '@/lib/firebase/firestoreService';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: PlannerTask | null;
  onSaveParentTask: (updatedTask: Partial<PlannerTask> & { id: string }) => Promise<void>; 
  allLabels: TaskLabel[];
  onTaskUpdated: (taskId: string) => void; 
}

const PREDEFINED_DURATIONS = [15, 30, 45, 60, 90];

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task, onSaveParentTask, allLabels, onTaskUpdated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<PlannerSubtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const [currentEstimatedTime, setCurrentEstimatedTime] = useState<number>(0);
  const [timeSelectionMode, setTimeSelectionMode] = useState<'predefined' | 'custom'>('predefined');
  const [customTimeInput, setCustomTimeInput] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setSelectedLabelIds(task.labelIds || []);
      
      const estTime = task.estimatedTime || 0;
      setCurrentEstimatedTime(estTime);
      if (PREDEFINED_DURATIONS.includes(estTime)) {
          setTimeSelectionMode('predefined');
          setCustomTimeInput(''); 
      } else if (estTime > 0) {
          setTimeSelectionMode('custom');
          setCustomTimeInput(String(estTime));
      } else {
          setTimeSelectionMode('predefined'); 
          setCustomTimeInput('');
      }
      
      setIsLoadingSubtasks(true);
      fetchSubtasks(task.id)
        .then(fetchedSubtasks => {
          setSubtasks(fetchedSubtasks.sort((a,b) => (a.order ?? 0) - (b.order ?? 0)));
        })
        .catch(err => {
          console.error("Error fetching subtasks:", err);
          toast({ title: "Error", description: "Could not load subtasks.", variant: "destructive" });
        })
        .finally(() => setIsLoadingSubtasks(false));
    } else if (!isOpen) {
      setTitle('');
      setDescription('');
      setSelectedLabelIds([]);
      setSubtasks([]);
      setNewSubtaskText('');
      setCurrentEstimatedTime(0);
      setTimeSelectionMode('predefined');
      setCustomTimeInput('');
    }
  }, [task, isOpen, toast]);

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabelIds(prev =>
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  };

  const handlePredefinedTimeSelect = (duration: number) => {
    setTimeSelectionMode('predefined');
    setCurrentEstimatedTime(duration);
    setCustomTimeInput('');
  };
  
  const handleCustomTimeRadioSelect = () => {
    setTimeSelectionMode('custom');
    // If customTimeInput is empty or 0, and a predefined time was previously selected,
    // don't automatically change currentEstimatedTime until user types in custom input.
    // If customTimeInput already has a value, ensure currentEstimatedTime reflects that.
    if (customTimeInput && parseInt(customTimeInput, 10) > 0) {
      setCurrentEstimatedTime(parseInt(customTimeInput, 10));
    } else if (currentEstimatedTime > 0 && !PREDEFINED_DURATIONS.includes(currentEstimatedTime)) {
      // currentEstimatedTime is already custom, keep it.
    } else {
      // If switching to custom and input is empty, maybe default to 0 or a small custom placeholder.
      // For now, it will use what's in customTimeInput, which might be '' -> 0.
      setCurrentEstimatedTime(parseInt(customTimeInput, 10) || 0);
    }
  };

  const handleCustomTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTimeInput(val);
    setCurrentEstimatedTime(parseInt(val, 10) || 0); 
  };


  const handleSaveParentTaskDetails = async () => {
    if (!task) return;
    if (!title.trim()) {
      toast({ title: "Validation Error", description: "Task title cannot be empty.", variant: "destructive" });
      return;
    }
    if (currentEstimatedTime < 0) {
      toast({ title: "Validation Error", description: "Estimated time cannot be negative.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const updates: Partial<PlannerTask> & { id: string } = {
        id: task.id,
        title: title.trim(),
        description: description.trim(),
        labelIds: selectedLabelIds,
        estimatedTime: currentEstimatedTime,
      };
      await onSaveParentTask(updates); 
      onTaskUpdated(task.id); 
    } catch (error) {
      console.error("Error saving task details:", error);
      toast({ title: "Save Error", description: "Could not save task changes.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddSubtask = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!task || !newSubtaskText.trim()) return;

    setIsAddingSubtask(true);
    try {
        const addedSubtask = await addSubtaskToDb(task.id, { text: newSubtaskText.trim(), isCompleted: false, order: subtasks.length });
        setSubtasks(prev => [...prev, addedSubtask].sort((a,b) => (a.order ?? 0) - (b.order ?? 0)));
        setNewSubtaskText('');
        onTaskUpdated(task.id);
    } catch (error) {
        console.error("Error adding subtask:", error);
        toast({ title: "Error", description: "Could not add subtask.", variant: "destructive" });
    } finally {
        setIsAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentStatus: boolean) => {
    if (!task) return;
    const updatedSubtasks = subtasks.map(st => st.id === subtaskId ? { ...st, isCompleted: !currentStatus } : st);
    setSubtasks(updatedSubtasks); 

    try {
        await updateSubtaskInDb(task.id, subtaskId, { isCompleted: !currentStatus });
        onTaskUpdated(task.id);
    } catch (error) {
        console.error("Error updating subtask:", error);
        toast({ title: "Error", description: "Could not update subtask status.", variant: "destructive" });
        setSubtasks(subtasks); 
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return;
    const originalSubtasks = [...subtasks];
    setSubtasks(prev => prev.filter(st => st.id !== subtaskId)); 

    try {
        await deleteSubtaskFromDb(task.id, subtaskId);
        onTaskUpdated(task.id);
    } catch (error) {
        console.error("Error deleting subtask:", error);
        toast({ title: "Error", description: "Could not delete subtask.", variant: "destructive" });
        setSubtasks(originalSubtasks); 
    }
  };

  if (!task) return null;
  
  const completedSubtasksCount = subtasks.filter(st => st.isCompleted).length;
  const totalSubtasksCount = subtasks.length;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-primary font-headline">Task Details</DialogTitle>
          <DialogDescription>
            Manage task information and subtasks.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-3">
          <div className="space-y-4 py-3">
            <div>
              <Label htmlFor="detail-task-title" className="text-foreground">Title</Label>
              <Input
                id="detail-task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 bg-input text-input-foreground"
                placeholder="Task title"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-foreground flex items-center mb-1"><Clock className="mr-2 h-4 w-4" /> Estimated Time</Label>
              <RadioGroup 
                value={timeSelectionMode} 
                onValueChange={(value) => {
                  if (value === 'custom') {
                    handleCustomTimeRadioSelect();
                  } else {
                    // This case shouldn't happen if direct value setters are used for predefined buttons
                    setTimeSelectionMode(value as 'predefined' | 'custom');
                  }
                }}
                className="grid grid-cols-3 gap-2 mb-2"
              >
                {PREDEFINED_DURATIONS.map(duration => (
                  <Label 
                    key={duration}
                    htmlFor={`time-${duration}`}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md border p-2 hover:bg-accent/50 cursor-pointer text-xs",
                      timeSelectionMode === 'predefined' && currentEstimatedTime === duration && "bg-primary text-primary-foreground ring-2 ring-primary-foreground ring-offset-1 ring-offset-primary",
                      timeSelectionMode === 'custom' && "border-muted text-muted-foreground"
                    )}
                    onClick={() => handlePredefinedTimeSelect(duration)}
                  >
                    <RadioGroupItem value="predefined" id={`time-${duration}`} checked={timeSelectionMode === 'predefined' && currentEstimatedTime === duration} className="sr-only"/>
                     {timeSelectionMode === 'predefined' && currentEstimatedTime === duration && <CheckIcon className="h-3 w-3" />}
                    {duration} min
                  </Label>
                ))}
                 <Label 
                    htmlFor="time-custom"
                    className={cn(
                      "col-span-3 sm:col-span-1 flex items-center justify-center gap-2 rounded-md border p-2 hover:bg-accent/50 cursor-pointer text-xs",
                      timeSelectionMode === 'custom' && "bg-primary text-primary-foreground ring-2 ring-primary-foreground ring-offset-1 ring-offset-primary"
                    )}
                    onClick={handleCustomTimeRadioSelect}
                  >
                    <RadioGroupItem value="custom" id="time-custom" checked={timeSelectionMode === 'custom'} className="sr-only"/>
                     {timeSelectionMode === 'custom' && <CheckIcon className="h-3 w-3" />}
                    Custom
                  </Label>
              </RadioGroup>
              {timeSelectionMode === 'custom' && (
                <Input
                  id="detail-task-custom-estimatedTime"
                  type="number"
                  value={customTimeInput}
                  onChange={handleCustomTimeInputChange}
                  min="0"
                  step="1"
                  className="mt-1 bg-input text-input-foreground"
                  placeholder="e.g., 20 (minutes)"
                  disabled={isSaving}
                />
              )}
            </div>

            <div>
              <Label htmlFor="detail-task-description" className="text-foreground">Description</Label>
              <Textarea
                id="detail-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 bg-input text-input-foreground min-h-[80px]"
                placeholder="Add more details..."
                disabled={isSaving}
                rows={3}
              />
            </div>
            <div>
              <Label className="text-foreground mb-2 block flex items-center"><Tag className="mr-2 h-4 w-4" /> Labels</Label>
              {allLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2 border border-dashed border-border rounded-md">No labels available.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-input/30">
                  {allLabels.map(label => (
                    <div key={label.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`detail-label-${label.id}-${task.id}`}
                        checked={selectedLabelIds.includes(label.id)}
                        onCheckedChange={() => handleLabelToggle(label.id)}
                        disabled={isSaving}
                      />
                      <Label htmlFor={`detail-label-${label.id}-${task.id}`} className="flex items-center text-sm font-normal text-foreground cursor-pointer">
                        <span className="mr-2 h-3 w-3 rounded-full inline-block border border-border/50" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
                <Label className="text-foreground mb-2 block flex items-center"><ListChecks className="mr-2 h-4 w-4" /> Subtasks ({completedSubtasksCount}/{totalSubtasksCount})</Label>
                <form onSubmit={handleAddSubtask} className="flex gap-2 mb-3">
                    <Input 
                        value={newSubtaskText} 
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        placeholder="Add a new subtask..."
                        className="flex-grow bg-input text-input-foreground"
                        disabled={isAddingSubtask || isLoadingSubtasks}
                    />
                    <Button type="submit" size="icon" variant="outline" disabled={!newSubtaskText.trim() || isAddingSubtask || isLoadingSubtasks}>
                        {isAddingSubtask ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 text-primary" />}
                    </Button>
                </form>
                {isLoadingSubtasks ? (
                     <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> <span className="ml-2 text-muted-foreground">Loading subtasks...</span></div>
                ) : subtasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3 border border-dashed border-border rounded-md">No subtasks yet. Add one above!</p>
                ) : (
                    <ul className="space-y-1.5 max-h-48 overflow-y-auto p-1 border rounded-md bg-input/20">
                        {subtasks.map(st => (
                            <li key={st.id} className="flex items-center justify-between p-1.5 rounded hover:bg-muted/30">
                                <div className="flex items-center flex-grow">
                                    <Checkbox 
                                        id={`subtask-${st.id}`} 
                                        checked={st.isCompleted} 
                                        onCheckedChange={() => handleToggleSubtask(st.id, st.isCompleted)}
                                        className="mr-2"
                                    />
                                    <Label htmlFor={`subtask-${st.id}`} className={cn("text-sm cursor-pointer", st.isCompleted && "line-through text-muted-foreground")}>
                                        {st.text}
                                    </Label>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteSubtask(st.id)} className="h-6 w-6 text-destructive/70 hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSaveParentTaskDetails} disabled={isSaving || !title.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Task Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;

