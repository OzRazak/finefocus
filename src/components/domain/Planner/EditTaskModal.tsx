
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PlannerTask, TaskLabel } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: PlannerTask | null;
  onSave: (updatedTask: Partial<PlannerTask> & { id: string }) => Promise<void>;
  allLabels: TaskLabel[];
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task, onSave, allLabels }) => {
  const [title, setTitle] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setEstimatedTime(task.estimatedTime || 0);
      setDescription(task.description || '');
      setSelectedLabelIds(task.labelIds || []);
    } else {
      setTitle('');
      setEstimatedTime(0);
      setDescription('');
      setSelectedLabelIds([]);
    }
  }, [task, isOpen]);

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabelIds(prev =>
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  };

  const handleSave = async () => {
    if (!task) return;
    if (!title.trim()) {
      toast({ title: "Validation Error", description: "Task title cannot be empty.", variant: "destructive" });
      return;
    }
    if (estimatedTime < 0) {
      toast({ title: "Validation Error", description: "Estimated time cannot be negative.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<PlannerTask> & { id: string } = {
        id: task.id,
        title: title.trim(),
        estimatedTime: estimatedTime,
        description: description.trim(),
        labelIds: selectedLabelIds,
      };
      await onSave(updates);
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({ title: "Save Error", description: "Could not save task changes. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-primary font-headline">Edit Task</DialogTitle>
          <DialogDescription>
            Update the details for your task. Press Esc or click outside to close.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4 py-3">
            <div>
              <Label htmlFor="edit-task-title" className="text-foreground">Title</Label>
              <Input
                id="edit-task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 bg-input text-input-foreground"
                placeholder="Task title"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="edit-task-estimatedTime" className="text-foreground">Estimated Time (minutes)</Label>
              <Input
                id="edit-task-estimatedTime"
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(parseInt(e.target.value, 10) || 0)}
                min="0"
                step="5"
                className="mt-1 bg-input text-input-foreground"
                placeholder="e.g., 30"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="edit-task-description" className="text-foreground">Description (Optional)</Label>
              <Textarea
                id="edit-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 bg-input text-input-foreground min-h-[80px]"
                placeholder="Add more details about the task..."
                disabled={isSaving}
                rows={3}
              />
            </div>
            <div>
              <Label className="text-foreground mb-2 block flex items-center">
                <Tag className="mr-2 h-4 w-4" /> Labels
              </Label>
              {allLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2 border border-dashed border-border rounded-md">
                  No labels created yet. Use the "Manage Labels" button on the planner page to create some.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-input/30">
                  {allLabels.map(label => (
                    <div key={label.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`label-${label.id}-${task.id}`} // Ensure unique ID for checkbox if modal is reused
                        checked={selectedLabelIds.includes(label.id)}
                        onCheckedChange={() => handleLabelToggle(label.id)}
                        disabled={isSaving}
                      />
                      <Label
                        htmlFor={`label-${label.id}-${task.id}`}
                        className="flex items-center text-sm font-normal text-foreground cursor-pointer"
                      >
                        <span
                          className="mr-2 h-3 w-3 rounded-full inline-block border border-border/50"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isSaving || !title.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;

    